// actions/visit.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AdjustmentReason } from "@/lib/generated/prisma/enums";
import { auth } from "@clerk/nextjs/server";

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
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized - please sign in" };
  }

  const storeId = formData.get("storeId") as string;
  const latitudeStr = formData.get("latitude") as string;
  const longitudeStr = formData.get("longitude") as string;

  if (!storeId || !latitudeStr || !longitudeStr) {
    return { success: false, error: "Missing required fields (storeId, location)" };
  }

  const latitude = parseFloat(latitudeStr);
  const longitude = parseFloat(longitudeStr);

  if (isNaN(latitude) || isNaN(longitude)) {
    return { success: false, error: "Invalid location data" };
  }

  // Fetch store with location & existing stock
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      stockPositions: { include: { product: true } },
    },
  });

  if (!store) {
    return { success: false, error: "Store not found" };
  }

  if (!store.latitude || !store.longitude) {
    return { success: false, error: "Store location not configured" };
  }

  const distance = getDistance(latitude, longitude, store.latitude, store.longitude);
  if (distance > 200) { // 200 meters tolerance
    return { success: false, error: "You must be at the store location to update stock" };
  }

  // Create the Visit (one per submission/check-in)
  const visit = await prisma.visit.create({
    data: {
      salesmanId: userId,
      storeId,
      timestamp: new Date(),
      latitude,
      longitude,
      notes: formData.get("notes") as string || "Stock update during visit",
    },
  });

  // Collect all changes
  const adjustments: any[] = [];
  const stockUpserts: any[] = [];

  // Process each product submitted in form
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("quantity-")) continue;

    const productId = key.replace("quantity-", "");
    const newQtyStr = value as string;
    const newQty = parseInt(newQtyStr, 10);

    if (isNaN(newQty)) continue; // Skip invalid

    const expiry = (formData.get(`expiry-${productId}`) as string) || null;
    const batch = (formData.get(`batch-${productId}`) as string) || null;
    const reason = (formData.get(`reason-${productId}`) as AdjustmentReason) || AdjustmentReason.COUNT_CORRECTION;

    // Find current quantity (if position exists)
    const currentPosition = store.stockPositions.find((sp) => sp.productId === productId);
    const currentQty = currentPosition?.quantity ?? 0;

    const quantityChange = newQty - currentQty;

    // Only log adjustment if there was a change
    if (quantityChange !== 0) {
      adjustments.push({
        visitId: visit.id,
        productId,
        storeId,
        quantityChange,
        reason,
        batchNumber: batch,
        expiryDate: expiry ? new Date(expiry) : null,
        notes: `Updated during visit: ${quantityChange > 0 ? "+" : ""}${quantityChange}`,
      });

      // Prepare upsert for stock position
      stockUpserts.push(
        prisma.stockPosition.upsert({
          where: { storeId_productId: { storeId, productId } },
          update: {
            quantity: newQty,
            ...(batch && { batchNumber: batch }),
            ...(expiry && { expiryDate: new Date(expiry) }),
          },
          create: {
            storeId,
            productId,
            quantity: newQty,
            batchNumber: batch,
            expiryDate: expiry ? new Date(expiry) : null,
          },
        })
      );
    }
  }

  // Execute in transaction for atomicity
  try {
    await prisma.$transaction(async (tx) => {
      if (adjustments.length > 0) {
        await tx.stockAdjustment.createMany({ data: adjustments });
      }
      await Promise.all(stockUpserts.map((op) => op(tx)));
    });

    revalidatePath(`/stores/${storeId}/visit`);
    revalidatePath(`/stores/${storeId}`);

    return { success: true, visitId: visit.id };
  } catch (err) {
    console.error("Stock update transaction failed:", err);
    return { success: false, error: "Failed to save stock changes" };
  }
}