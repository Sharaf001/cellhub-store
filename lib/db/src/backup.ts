import { db, usersTable, productsTable, categoriesTable, cartItemsTable, ordersTable, orderItemsTable } from "./index";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

async function backup() {
  const users = await db.select().from(usersTable);
  const products = await db.select().from(productsTable);
  const categories = await db.select().from(categoriesTable);
  const cartItems = await db.select().from(cartItemsTable);
  const orders = await db.select().from(ordersTable);
  const orderItems = await db.select().from(orderItemsTable);

  const data = { users, products, categories, cartItems, orders, orderItems, exportedAt: new Date().toISOString() };

  const backupsDir = path.join(import.meta.dirname, "..", "backups");
  mkdirSync(backupsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(backupsDir, `backup-${timestamp}.json`);
  writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log(`Backup saved to: ${filePath}`);
  console.log(`Users: ${users.length}, Products: ${products.length}, Categories: ${categories.length}, Cart Items: ${cartItems.length}, Orders: ${orders.length}, Order Items: ${orderItems.length}`);
  process.exit(0);
}

backup().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});

