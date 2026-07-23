import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";
import { db, cartItemsTable, productsTable } from "@workspace/db";
import {
  AddToCartBody,
  UpdateCartItemParams,
  UpdateCartItemBody,
  RemoveFromCartParams,
  GetCartResponse,
  UpdateCartItemResponse,
  GetCartSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "cellhub-dev-secret-key-change-in-production";

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

async function getCartWithProducts(userId: number) {
  const items = await db
    .select({
      id: cartItemsTable.id,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      product: productsTable,
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.userId, userId))
    .orderBy(cartItemsTable.id);

  return items.map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    product: item.product,
  }));
}

router.get("/cart/summary", async (req, res): Promise<void> => {
  const userId = getUserId(req, res);
  if (userId === null) return;

  const items = await getCartWithProducts(userId);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const originalTotal = items.reduce((sum, item) => {
    const orig = item.product.originalPrice ?? item.product.price;
    return sum + orig * item.quantity;
  }, 0);
  const discount = Math.max(0, originalTotal - subtotal);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  res.json(
    GetCartSummaryResponse.parse({
      itemCount,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(subtotal * 100) / 100,
    })
  );
});

router.get("/cart", async (req, res): Promise<void> => {
  const userId = getUserId(req, res);
  if (userId === null) return;

  const items = await getCartWithProducts(userId);
  res.json(GetCartResponse.parse(items));
});

router.post("/cart", async (req, res): Promise<void> => {
  const userId = getUserId(req, res);
  if (userId === null) return;

  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { productId, quantity } = parsed.data;

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(cartItemsTable)
    .where(and(eq(cartItemsTable.productId, productId), eq(cartItemsTable.userId, userId)));

  let cartItemId: number;
  if (existing) {
    const [updated] = await db
      .update(cartItemsTable)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(cartItemsTable.id, existing.id))
      .returning();
    cartItemId = updated!.id;
  } else {
    const [inserted] = await db
      .insert(cartItemsTable)
      .values({ userId, productId, quantity })
      .returning();
    cartItemId = inserted!.id;
  }

  const [itemWithProduct] = await db
    .select({
      id: cartItemsTable.id,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      product: productsTable,
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.id, cartItemId));

  res.status(201).json(itemWithProduct);
});

router.patch("/cart/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req, res);
  if (userId === null) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateCartItemParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(cartItemsTable)
    .set({ quantity: parsed.data.quantity })
    .where(and(eq(cartItemsTable.id, params.data.id), eq(cartItemsTable.userId, userId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Cart item not found" });
    return;
  }

  const [itemWithProduct] = await db
    .select({
      id: cartItemsTable.id,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      product: productsTable,
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.id, updated.id));

  res.json(UpdateCartItemResponse.parse(itemWithProduct));
});

router.delete("/cart/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req, res);
  if (userId === null) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RemoveFromCartParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, params.data.id), eq(cartItemsTable.userId, userId)));
  res.sendStatus(204);
});

export default router;
