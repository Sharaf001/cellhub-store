import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import { eq, desc } from "drizzle-orm";
import { db, cartItemsTable, productsTable, ordersTable, orderItemsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "cellhub-dev-secret-key-change-in-production";
const ADMIN_EMAIL = process.env.GMAIL_USER || "";

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY || "",
    },
    body: JSON.stringify({
      sender: { name: "CellHub", email: process.env.GMAIL_USER },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Email send failed: ${res.status} ${errText}`);
  }
}

async function sendAdminOrderNotification(order: any, items: any[]) {
  const itemsHtml = items
    .map((i) => `<li>${i.product.name} x${i.quantity} &mdash; $${(i.product.price * i.quantity).toFixed(2)}</li>`)
    .join("");
  await sendEmail(
    ADMIN_EMAIL,
    `New order #${order.id} needs confirmation`,
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>New Order #${order.id}</h2>
        <p><strong>Customer:</strong> ${order.customerName}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <ul>${itemsHtml}</ul>
        <p><strong>Total:</strong> $${order.total.toFixed(2)} (Cash on Delivery)</p>
        <p>Please review and confirm this order in the Admin Panel.</p>
      </div>
    `
  );
}

async function sendCustomerConfirmationEmail(to: string, customerName: string, orderId: number) {
  await sendEmail(
    to,
    `Your CellHub order #${orderId} is confirmed`,
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hi ${customerName},</h2>
        <p>Your order <strong>#${orderId}</strong> has been confirmed and is being prepared for delivery.</p>
        <p>You'll pay by cash on delivery when it arrives.</p>
        <p>Thanks for shopping with CellHub!</p>
      </div>
    `
  );
}

function getUserId(req: any, res: any): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "You must be logged in." });
    return null;
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: number };
    return payload.userId;
  } catch {
    res.status(401).json({ error: "Invalid or expired session." });
    return null;
  }
}

function getAdminUserId(req: any, res: any): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "You must be logged in." });
    return null;
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: number; isAdmin: boolean };
    if (!payload.isAdmin) {
      res.status(403).json({ error: "Admin access required." });
      return null;
    }
    return payload.userId;
  } catch {
    res.status(401).json({ error: "Invalid or expired session." });
    return null;
  }
}

router.post("/orders", async (req, res): Promise<void> => {
  const userId = getUserId(req, res);
  if (userId === null) return;

  const { customerName, address, phone } = req.body ?? {};

  if (typeof customerName !== "string" || !customerName.trim()) {
    res.status(400).json({ error: "Name is required." });
    return;
  }
  if (typeof address !== "string" || !address.trim()) {
    res.status(400).json({ error: "Address is required." });
    return;
  }
  if (typeof phone !== "string" || !phone.trim()) {
    res.status(400).json({ error: "Phone number is required." });
    return;
  }

  const items = await db
    .select({
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      product: productsTable,
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.userId, userId));

  if (items.length === 0) {
    res.status(400).json({ error: "Your cart is empty." });
    return;
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const originalTotal = items.reduce((sum, item) => {
    const orig = item.product.originalPrice ?? item.product.price;
    return sum + orig * item.quantity;
  }, 0);
  const discount = Math.max(0, originalTotal - subtotal);
  const total = Math.round(subtotal * 100) / 100;

  const [order] = await db
    .insert(ordersTable)
    .values({
      userId,
      customerName: customerName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      paymentMethod: "cash_on_delivery",
      status: "pending",
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total,
    })
    .returning();

  for (const item of items) {
    await db.insert(orderItemsTable).values({
      orderId: order.id,
      productId: item.productId,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
    });
  }

  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

  try {
    await sendAdminOrderNotification(order, items);
  } catch {
    // don't fail the order if the notification email fails
  }

  res.status(201).json({ order, items });
});

router.get("/orders", async (req, res): Promise<void> => {
  const userId = getUserId(req, res);
  if (userId === null) return;

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(desc(ordersTable.createdAt));

  const result = [];
  for (const order of orders) {
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));
    result.push({ ...order, items });
  }

  res.json(result);
});

router.get("/admin/orders", async (req, res): Promise<void> => {
  const adminId = getAdminUserId(req, res);
  if (adminId === null) return;

  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt));

  const result = [];
  for (const order of orders) {
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));
    result.push({ ...order, items });
  }

  res.json(result);
});

router.patch("/admin/orders/:id/status", async (req, res): Promise<void> => {
  const adminId = getAdminUserId(req, res);
  if (adminId === null) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const orderId = parseInt(raw, 10);
  const { status } = req.body ?? {};

  if (typeof status !== "string" || !["pending", "confirmed", "delivered"].includes(status)) {
    res.status(400).json({ error: "Invalid status." });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  if (status === "confirmed") {
    try {
      const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
      if (customer) {
        await sendCustomerConfirmationEmail(customer.email, updated.customerName, updated.id);
      }
    } catch {
      // don't fail the status update if the email fails
    }
  }

  res.json(updated);
});

router.delete("/admin/orders/:id", async (req, res): Promise<void> => {
  const adminId = getAdminUserId(req, res);
  if (adminId === null) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const orderId = parseInt(raw, 10);

  await db.delete(ordersTable).where(eq(ordersTable.id, orderId));
  res.sendStatus(204);
});

router.delete("/admin/orders", async (req, res): Promise<void> => {
  const adminId = getAdminUserId(req, res);
  if (adminId === null) return;

  await db.delete(ordersTable);
  res.sendStatus(204);
});

export default router;
