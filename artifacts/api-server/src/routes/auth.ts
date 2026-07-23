import { Router, type IRouter } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "cellhub-dev-secret-key-change-in-production";
const ADMIN_REGISTRATION_SECRET = process.env.ADMIN_REGISTRATION_SECRET || "cellhub-admin-2024";
const GOOGLE_CLIENT_ID = "428603962922-41krvu4298aonse55mh0b42546re2bfs.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const APP_URL = process.env.APP_URL || "http://localhost:5173";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mohamadsharafeddine1@gmail.com",
    pass: "jintggjnlqvdvidi",
  },
});

async function sendVerificationEmail(to: string, username: string, token: string) {
  const link = `${APP_URL}/verify?token=${token}`;
  await transporter.sendMail({
    from: '"CellHub" <mohamadsharafeddine1@gmail.com>',
    to,
    subject: "Verify your CellHub account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to CellHub, ${username}!</h2>
        <p>Please confirm your email address to activate your account.</p>
        <p style="margin: 24px 0;">
          <a href="${link}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Verify Email
          </a>
        </p>
        <p>Or copy this link into your browser:</p>
        <p style="word-break: break-all; color: #555;">${link}</p>
      </div>
    `,
  });
}

async function sendResetEmail(to: string, username: string, token: string) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: '"CellHub" <mohamadsharafeddine1@gmail.com>',
    to,
    subject: "Reset your CellHub password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hi ${username},</h2>
        <p>We received a request to reset your CellHub password. This link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="${link}" style="background:#111827;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Reset Password
          </a>
        </p>
        <p>Or copy this link into your browser:</p>
        <p style="word-break: break-all; color: #555;">${link}</p>
        <p style="color:#888; font-size:13px; margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/auth/register", async (req, res): Promise<void> => {
  const { username, email, password, role, adminSecret } = req.body ?? {};

  if (typeof username !== "string" || username.length < 3 || username.length > 50) {
    res.status(400).json({ error: "Username must be between 3 and 50 characters." });
    return;
  }
  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ error: "A valid email address is required." });
    return;
  }
  if (typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  const wantsAdmin = role === "admin";
  if (wantsAdmin) {
    if (typeof adminSecret !== "string" || !adminSecret) {
      res.status(400).json({ error: "Admin registration code is required." });
      return;
    }
    if (adminSecret !== ADMIN_REGISTRATION_SECRET) {
      res.status(403).json({ error: "Invalid admin registration code." });
      return;
    }
  }

  const [existingUsername] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existingUsername) {
    res.status(409).json({ error: "Username already taken." });
    return;
  }
  const [existingEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingEmail) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcryptjs.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const [user] = await db
    .insert(usersTable)
    .values({
      username,
      email,
      passwordHash,
      role: wantsAdmin ? "admin" : "user",
      emailVerified: false,
      verificationToken,
    })
    .returning();

  try {
    await sendVerificationEmail(email, username, verificationToken);
  } catch (err) {
    res.status(500).json({ error: "Account created, but the verification email failed to send. Please contact support." });
    return;
  }

  res.status(201).json({ message: "Account created! Please check your email to verify your account before logging in." });
});

router.get("/auth/verify", async (req, res): Promise<void> => {
  const token = typeof req.query.token === "string" ? req.query.token : undefined;
  if (!token) {
    res.status(400).json({ error: "Missing verification token." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.verificationToken, token));
  if (!user) {
    res.status(400).json({ error: "Invalid or expired verification link." });
    return;
  }

  await db
    .update(usersTable)
    .set({ emailVerified: true, verificationToken: null })
    .where(eq(usersTable.id, user.id));

  res.json({ message: "Email verified! You can now log in." });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || !username || typeof password !== "string" || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }
  const valid = await bcryptjs.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }
  if (!user.emailVerified) {
    res.status(403).json({ error: "Please verify your email before logging in. Check your inbox." });
    return;
  }
  const token = jwt.sign(
    { userId: user.id, username: user.username, isAdmin: user.role === "admin" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({ token, user: { id: user.id, username: user.username, isAdmin: user.role === "admin" } });
});

router.post("/auth/google", async (req, res): Promise<void> => {
  const { credential, adminSecret } = req.body ?? {};
  if (typeof credential !== "string" || !credential) {
    res.status(400).json({ error: "Missing Google credential." });
    return;
  }
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    res.status(401).json({ error: "Invalid Google credential." });
    return;
  }
  if (!payload?.sub || !payload.email) {
    res.status(401).json({ error: "Google account did not return required info." });
    return;
  }
  const googleId = payload.sub;
  const email = payload.email;
  const baseUsername = (payload.name || email.split("@")[0]).replace(/[^a-zA-Z0-9_]/g, "").slice(0, 40) || "googleuser";

  let [user] = await db.select().from(usersTable).where(eq(usersTable.googleId, googleId));
  if (!user) {
    const [byEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (byEmail) {
      const [updated] = await db
        .update(usersTable)
        .set({ googleId, emailVerified: true })
        .where(eq(usersTable.id, byEmail.id))
        .returning();
      user = updated;
    } else {
      let username = baseUsername;
      let attempt = 0;
      while (true) {
        const [taken] = await db.select().from(usersTable).where(eq(usersTable.username, username));
        if (!taken) break;
        attempt += 1;
        username = `${baseUsername}${attempt}`;
      }
      const wantsAdmin = typeof adminSecret === "string" && adminSecret === ADMIN_REGISTRATION_SECRET;
      const [inserted] = await db
        .insert(usersTable)
        .values({
          username,
          email,
          googleId,
          role: wantsAdmin ? "admin" : "user",
          emailVerified: true,
        })
        .returning();
      user = inserted;
    }
  }

  const token = jwt.sign(
    { userId: user!.id, username: user!.username, isAdmin: user!.role === "admin" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({ token, user: { id: user!.id, username: user!.username, isAdmin: user!.role === "admin" } });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided." });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; username: string; isAdmin: boolean };
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
    if (!user) {
      res.status(401).json({ error: "User not found." });
      return;
    }
    res.json({ id: user.id, username: user.username, email: user.email, isAdmin: user.role === "admin" });
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
});

router.post("/auth/change-password", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "You must be logged in." });
    return;
  }
  let userId: number;
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: number };
    userId = payload.userId;
  } catch {
    res.status(401).json({ error: "Invalid or expired session." });
    return;
  }

  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  if (user.passwordHash) {
    if (typeof currentPassword !== "string" || !currentPassword) {
      res.status(400).json({ error: "Current password is required." });
      return;
    }
    const valid = await bcryptjs.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect." });
      return;
    }
  }

  const newHash = await bcryptjs.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, userId));

  res.json({ message: "Password updated successfully." });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body ?? {};
  if (typeof email !== "string" || !email) {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  // Always respond the same way whether the email exists or not (avoid leaking account existence)
  if (user && user.passwordHash) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await db
      .update(usersTable)
      .set({ resetToken, resetTokenExpires })
      .where(eq(usersTable.id, user.id));
    try {
      await sendResetEmail(user.email, user.username, resetToken);
    } catch {
      // swallow send errors so we don't reveal anything to the client either way
    }
  }

  res.json({ message: "If an account with that email exists, a password reset link has been sent." });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, newPassword } = req.body ?? {};
  if (typeof token !== "string" || !token) {
    res.status(400).json({ error: "Missing reset token." });
    return;
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.resetToken, token));
  if (!user || !user.resetTokenExpires || user.resetTokenExpires.getTime() < Date.now()) {
    res.status(400).json({ error: "Invalid or expired reset link." });
    return;
  }

  const newHash = await bcryptjs.hash(newPassword, 10);
  await db
    .update(usersTable)
    .set({ passwordHash: newHash, resetToken: null, resetTokenExpires: null })
    .where(eq(usersTable.id, user.id));

  res.json({ message: "Password reset successfully. You can now log in." });
});

export default router;



