import { Router, type IRouter } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "cellhub-dev-secret-key-change-in-production";
const ADMIN_REGISTRATION_SECRET = process.env.ADMIN_REGISTRATION_SECRET || "cellhub-admin-2024";

router.post("/auth/register", async (req, res): Promise<void> => {
  const { username, password, role, adminSecret } = req.body ?? {};

  if (typeof username !== "string" || username.length < 3 || username.length > 50) {
    res.status(400).json({ error: "Username must be between 3 and 50 characters." });
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

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) {
    res.status(409).json({ error: "Username already taken." });
    return;
  }

  const passwordHash = await bcryptjs.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ username, passwordHash, isAdmin: wantsAdmin })
    .returning();

  const token = jwt.sign(
    { userId: user.id, username: user.username, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(201).json({ token, user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body ?? {};

  if (typeof username !== "string" || !username || typeof password !== "string" || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  const valid = await bcryptjs.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
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
    res.json({ id: user.id, username: user.username, isAdmin: user.isAdmin });
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
});

export default router;
