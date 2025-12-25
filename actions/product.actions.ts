// actions/product.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAllProducts() {
  return await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      mrp: true,
      manufacturer: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getStoreStockPositions(storeId: string) {
  const store = await prisma.store.findFirst({
    where: { id: storeId },
    include: {
      stockPositions: {
        include: {
          product: {
            select: { name: true, mrp: true },
          },
        }, 
      },
    },
  });

  if (!store) throw new Error('Store not found');

  return store.stockPositions.map(sp => ({
    productId: sp.productId,
    productName: sp.product.name,
    mrp: sp.product.mrp,
    quantity: sp.quantity,
    expiryDate: sp.expiryDate ? new Date(sp.expiryDate).toISOString() : null,
    batchNumber: sp.batchNumber || '',
  }));
}

export async function getPendingOrdersForStore(storeId: string) {
  const orders = await prisma.order.findMany({
    where: { storeId, status: 'PENDING' },
    include: {
      items: {
        include: {
          product: { select: { name: true, mrp: true } },
        },
      },
      salesman: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map(order => ({
    id: order.id,
    salesmanName: order.salesman.name || 'Unknown',
    createdAt: order.createdAt.toISOString(),
    items: order.items.map(item => ({
      productName: item.product.name,
      mrp: item.product.mrp,
      quantity: item.quantity,
    })),
  }));
}

// ── Single product stock adjustment (visit mode) ──
export async function addStockAdjustment(formData: FormData) {
  const storeId     = formData.get("storeId") as string;
  const productId   = formData.get("productId") as string;
  const quantityStr = formData.get("quantity") as string;
  const expiryStr   = formData.get("expiryDate") as string | null;
  const batch       = formData.get("batchNumber") as string | null;

  const newQuantity = parseInt(quantityStr);
  if (isNaN(newQuantity) || newQuantity < 0) {
    return { success: false, error: "Invalid quantity" };
  }

  // Get current stock position (if exists)
  const current = await prisma.stockPosition.findUnique({
    where: { storeId_productId: { storeId, productId } },
  });

  const currentQty = current?.quantity ?? 0;
  const quantityChange = newQuantity - currentQty;

  if (quantityChange === 0) {
    return { success: true, message: "No change detected" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Record adjustment
      await tx.stockAdjustment.create({
        data: {
          visitId: "0", // ← important: you need visitId!
          productId,
          storeId,
          quantityChange,
          reason: quantityChange > 0 ? "RESTOCK" : "COUNT_CORRECTION", // default
          batchNumber: batch || undefined,
          expiryDate: expiryStr ? new Date(expiryStr) : null,
          notes: "Added via product selector",
        },
      });

      // Update or create current stock position
      await tx.stockPosition.upsert({
        where: { storeId_productId: { storeId, productId } },
        update: {
          quantity: { increment: quantityChange },
          ...(batch && { batchNumber: batch }),
          ...(expiryStr && { expiryDate: new Date(expiryStr) }),
        },
        create: {
          storeId,
          productId,
          quantity: newQuantity,
          batchNumber: batch,
          expiryDate: expiryStr ? new Date(expiryStr) : null,
        },
      });
    });

    revalidatePath(`/stores/${storeId}/visit`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to record adjustment" };
  }
}

// ── Single product order add (order mode) ──
// Note: Creates a NEW order each time (simple approach)
// You can later change to add to existing draft order if desired
export async function addOrderItem(formData: FormData) {
//   const storeId     = formData.get("storeId") as string;
//   const productId   = formData.get("productId") as string;
    const storeId = "1"
    const productId = "2"
  const quantityStr = formData.get("quantity") as string;

  const qty = parseInt(quantityStr);
  if (isNaN(qty) || qty < 1) {
    return { success: false, error: "Invalid quantity" };
  }

  const salesmanId = "2"; // ← replace with real auth

  try {
    await prisma.order.create({
      data: {
        storeId,
        salesmanId,
        status: "PENDING",
        items: {
          create: {
            productId,
            quantity: qty,
          },
        },
      },
    });

    revalidatePath(`/stores/${storeId}/orders`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to create order" };
  }
}