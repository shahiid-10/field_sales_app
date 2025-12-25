// import { PrismaClient, Role, OrderStatus } from "../lib/generated/prisma";
// import { PrismaClient } from '../lib/generated/prisma';
import 'dotenv/config';
import { PrismaClient } from '../lib/generated/prisma/client';
import { Role, OrderStatus } from "../lib/generated/prisma/enums";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "@neondatabase/serverless";

declare global {
  // Allow global `prisma` in development to prevent hot-reload creating many clients
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL!;

const prisma =
  global.prisma ||
  new PrismaClient({
    adapter: new PrismaPg(new Pool({ connectionString })),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });

async function main() {
  /* =========================
     USERS
  ========================= */
  const admin = await prisma.user.create({
    data: {
      email: "admin@demo.com",
      name: "Admin User",
      role: Role.ADMIN,
    },
  });

  const salesman = await prisma.user.create({
    data: {
      email: "salesman@demo.com",
      name: "Salesman One",
      role: Role.SALESMAN,
    },
  });

  const stockManager = await prisma.user.create({
    data: {
      email: "stock@demo.com",
      name: "Stock Manager",
      role: Role.STOCK_MANAGER,
    },
  });

  /* =========================
     STORES
  ========================= */
  const store1 = await prisma.store.create({
    data: {
      name: "Central Medical Store",
      address: "MG Road, Bangalore",
      latitude: 12.9716,
      longitude: 77.5946,
    },
  });

  const store2 = await prisma.store.create({
    data: {
      name: "City Pharma",
      address: "Indiranagar, Bangalore",
      latitude: 12.9784,
      longitude: 77.6408,
    },
  });

  /* =========================
     PRODUCTS
  ========================= */
  const paracetamol = await prisma.product.create({
    data: {
      name: "Paracetamol 500mg",
      manufacturer: "ABC Pharma",
      mrp: 25,
    },
  });

  const vitaminC = await prisma.product.create({
    data: {
      name: "Vitamin C Tablets",
      manufacturer: "HealthPlus",
      mrp: 120,
    },
  });

  /* =========================
     INVENTORY (Central Warehouse)
  ========================= */
  await prisma.inventory.createMany({
    data: [
      { productId: paracetamol.id, quantity: 500 },
      { productId: vitaminC.id, quantity: 300 },
    ],
  });

  /* =========================
     STORE STOCK POSITIONS
  ========================= */
  await prisma.stockPosition.createMany({
    data: [
      {
        storeId: store1.id,
        productId: paracetamol.id,
        quantity: 100,
        batchNumber: "PCM-001",
        expiryDate: new Date("2026-01-01"),
      },
      {
        storeId: store1.id,
        productId: vitaminC.id,
        quantity: 50,
        batchNumber: "VTC-001",
        expiryDate: new Date("2025-10-01"),
      },
      {
        storeId: store2.id,
        productId: paracetamol.id,
        quantity: 60,
        batchNumber: "PCM-002",
        expiryDate: new Date("2026-02-01"),
      },
    ],
  });

  /* =========================
     VISIT
  ========================= */
  await prisma.visit.create({
    data: {
      salesmanId: salesman.id,
      storeId: store1.id,
      latitude: 12.9716,
      longitude: 77.5946,
    },
  });

  /* =========================
     ORDER
  ========================= */
  const order = await prisma.order.create({
    data: {
      storeId: store1.id,
      salesmanId: salesman.id,
      status: OrderStatus.PARTIAL,
    },
  });

  /* =========================
     ORDER ITEMS
  ========================= */
  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order.id,
        productId: paracetamol.id,
        quantity: 80,
      },
      {
        orderId: order.id,
        productId: vitaminC.id,
        quantity: 70, // intentionally higher than stock
      },
    ],
  });

  /* =========================
     UNFULFILLED ITEM
  ========================= */
  await prisma.unfulfilledItem.create({
    data: {
      orderId: order.id,
      storeId: store1.id,
      productId: vitaminC.id,
      requestedQty: 70,
      availableQty: 50,
    },
  });

  console.log("Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(" Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
