// actions/visit.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AdjustmentReason } from "@/lib/generated/prisma/enums"; // adjust path if needed

// Simple Haversine distance (in meters)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function checkInAndUpdateStockPositions(formData: FormData) {
  const storeId = formData.get("storeId") as string;
  const latitudeStr = formData.get("latitude") as string;
  const longitudeStr = formData.get("longitude") as string;

  const latitude = parseFloat(latitudeStr);
  const longitude = parseFloat(longitudeStr);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return { error: "Invalid location data" };
  }

  // Fetch store with current stock positions
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      stockPositions: { include: { product: true } },
    },
  });

  if (!store || !store.latitude || !store.longitude) {
    return { error: "Store location not configured" };
  }

  const distance = getDistance(latitude, longitude, store.latitude, store.longitude);

  if (distance > 200) { // 200 meters tolerance
    return { error: "You are not at the store location" };
  }

  // Placeholder – in real app use auth session
  const salesmanId = "current-user-id-placeholder"; // ← replace with real auth

  // Record the visit
  const visit = await prisma.visit.create({
    data: {
      storeId,
      salesmanId,
      latitude,
      longitude,
    },
  });

  // Collect all adjustments and stock updates
  const adjustments: any[] = [];
  const stockUpdates: any[] = [];

  // Go through every product the store might have
  const productIds = store.stockPositions.map((sp) => sp.productId);

  for (const productId of productIds) {
    const qtyStr = formData.get(`quantity-${productId}`) as string;
    const newQty = qtyStr ? parseInt(qtyStr, 10) : null;

    const expiry = (formData.get(`expiry-${productId}`) as string) || null;
    const batch = (formData.get(`batch-${productId}`) as string) || null;

    // Skip if no quantity change was submitted
    if (newQty === null || isNaN(newQty)) continue;

    // Find current stock position (if exists)
    const currentPosition = store.stockPositions.find(
      (sp) => sp.productId === productId
    );

    const currentQty = currentPosition?.quantity ?? 0;

    // Calculate the change
    const quantityChange = newQty - currentQty;

    // Only create adjustment if there was an actual change
    if (quantityChange !== 0) {
      adjustments.push({
        visitId: visit.id,
        productId,
        storeId,
        quantityChange,
        reason: AdjustmentReason.RESTOCK, // ← you can make this dynamic later
        batchNumber: batch,
        expiryDate: expiry ? new Date(expiry) : null,
        notes: quantityChange > 0 ? "Restocked during visit" : "Returned/damaged during visit",
      });

      // Prepare to update current stock position
      stockUpdates.push(
        prisma.stockPosition.upsert({
          where: { storeId_productId: { storeId, productId } },
          update: {
            quantity: {
              increment: quantityChange,
            },
            // Update batch/expiry only if provided (optional)
            ...(batch && { batchNumber: batch }),
            ...(expiry && { expiryDate: new Date(expiry) }),
          },
          create: {
            storeId,
            productId,
            quantity: quantityChange, // starting from the reported amount
            batchNumber: batch,
            expiryDate: expiry ? new Date(expiry) : null,
          },
        })
      );
    }
  }

  // Execute everything in one transaction
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create all adjustments
      if (adjustments.length > 0) {
        await tx.stockAdjustment.createMany({
          data: adjustments,
        });
      }

      // 2. Apply stock position changes
      await Promise.all(stockUpdates.map((op) => op(tx)));
    });
  } catch (err) {
    console.error("Transaction failed:", err);
    return { error: "Failed to record stock adjustments" };
  }

  revalidatePath(`/stores/${storeId}`);
  revalidatePath("/visits"); // optional: if you have a visits list

  return { success: true, visitId: visit.id };
}