// actions/visit.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AdjustmentReason } from "@/lib/generated/prisma/enums";
import { auth } from "@clerk/nextjs/server";
import { success } from "zod";
import { error } from "console";

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

type ActionResult =
  | { success: true }
  | { success: false; error: string };


export async function checkInAndUpdateStockPositions(formData: FormData): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "UserId not found please sign-in or sign-up"};

  const storeId = formData.get("storeId") as string;
  const stockPositionId = formData.get("stockPositionId") as string;
  const quantity = Number(formData.get("quantity"));
  const expiryDate = formData.get("expiryDate") as string | null;
  const batchNumber = formData.get("batchNumber") as string | null;

  const user = await prisma.user.findFirst({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, error: "user not found in db" };

  try {
    await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.create({
        data: {
          salesmanId: user.id,
          storeId,
          timestamp: new Date(),
          notes: "Stock update during visit",
        },
      });

      const existing = await tx.stockPosition.findUnique({
        where: { id: stockPositionId },
      });
      if (!existing) throw new Error("Stock position not found");

      const delta = quantity - existing.quantity;

      if (delta !== 0) {
        await tx.stockAdjustment.create({
          data: {
            visitId: visit.id,
            storeId,
            productId: existing.productId,
            quantityChange: delta,
            reason: "COUNT_CORRECTION",
            batchNumber: batchNumber || undefined,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
          },
        });
      }

      if (quantity === 0) {
        await tx.stockPosition.delete({
          where: { id: stockPositionId },
        });
      } else {
        await tx.stockPosition.update({
          where: { id: stockPositionId },
          data: {
            quantity,
            batchNumber: batchNumber || null,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
          },
        });
      }
    });

    revalidatePath(`/stores/${storeId}/visit`);
    return { success: true };
  } catch (error) {
    console.error("checkInAndUpdateStockPositions failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong while updating stock",
    };
  }
}
// export async function checkInAndUpdateStockPositions(formData: FormData) {
//   const { userId } = await auth();
//   if (!userId) {
//     return { success: false, error: "Unauthorized - please sign in" };
//   }


//   const storeId = formData.get("storeId") as string;
//   if (!storeId) {
//     return { success: false, error: "Missing store ID" };
//   }

//   const user = await prisma.user.findFirst({
//     where: {
//       clerkUserId: userId
//     }
//   })
//   if(!user) return {success: false, error: "Cannot find the user"}

//   const userid = user?.id;

//   // Optional geolocation
//   const latitudeStr = formData.get("latitude") as string;
//   const longitudeStr = formData.get("longitude") as string;
//   let latitude: number | null = null;
//   let longitude: number | null = null;

//   if (latitudeStr && longitudeStr) {
//     latitude = parseFloat(latitudeStr);
//     longitude = parseFloat(longitudeStr);
//     if (isNaN(latitude) || isNaN(longitude)) {
//       return { success: false, error: "Invalid location data" };
//     }
//   }

//   // Fetch store for reference (no need for location check if optional)
//   const store = await prisma.store.findUnique({
//     where: { id: storeId },
//     include: {
//       stockPositions: { include: { product: true } },
//     },
//   });

//   if (!store) {
//     return { success: false, error: "Store not found" };
//   }

//   // Optional geofencing (only if location provided)
//   if (latitude !== null && longitude !== null) {
//     if (store.latitude && store.longitude) {
//       const distance = getDistance(latitude, longitude, store.latitude, store.longitude);
//       if (distance > 200) {
//         return { success: false, error: "You must be within ~200 meters of the store" };
//       }
//     }
//   }

//   try {
//     const result = await prisma.$transaction(async (tx) => {
//       // 1. Create real Visit record (always, even without location)
//       const visit = await tx.visit.create({
//         data: {
//           salesmanId: userid,  // this userid with small i is diff and for user only
//           storeId,
//           timestamp: new Date(),
//           latitude: latitude ?? undefined,
//           longitude: longitude ?? undefined,
//           notes: (formData.get("notes") as string) || "Stock update during visit",
//         },
//       });

//       const visitId = visit.id;

//       // 2. Process each product submitted
//       const adjustments: any[] = [];
//       const stockCreates: any[] = []; // We will create new entries, not upsert

//       for (const [key, value] of formData.entries()) {
//         if (!key.startsWith("quantity-")) continue;

//         const productId = key.replace("quantity-", "");
//         const newQtyStr = value as string;
//         const newQty = parseInt(newQtyStr, 10);

//         if (isNaN(newQty)) continue;

//         const expiry = (formData.get(`expiry-${productId}`) as string) || null;
//         const batch = (formData.get(`batch-${productId}`) as string) || null;
//         const reason = (formData.get(`reason-${productId}`) as AdjustmentReason) || AdjustmentReason.COUNT_CORRECTION;

//         // Find current quantity for this exact batch/expiry combo (if exists)
//         const currentPosition = store.stockPositions.find(
//           (sp) =>
//             sp.productId === productId &&
//             sp.batchNumber === batch &&
//             (expiry ? sp.expiryDate?.toISOString() === new Date(expiry).toISOString() : !sp.expiryDate)
//         );

//         const currentQty = currentPosition?.quantity ?? 0;
//         const quantityChange = newQty - currentQty;

//         // Only log adjustment if change > 0 (addition)
//         if (quantityChange !== 0) {
//           adjustments.push({
//             visitId,
//             productId,
//             storeId,
//             quantityChange,
//             reason,
//             batchNumber: batch || undefined,
//             expiryDate: expiry ? new Date(expiry) : null,
//             notes: `Added during visit: +${quantityChange}`,
//           });
//         }

//         // Always CREATE new stock position (allows multiple batches/expiry)
//         stockCreates.push(
//           tx.stockPosition.create({
//             data: {
//               storeId,
//               productId,
//               quantity: newQty,
//               batchNumber: batch || null,
//               expiryDate: expiry ? new Date(expiry) : null,
//             },
//           })
//         );
//       }

//       // Execute in transaction
//       if (adjustments.length > 0) {
//         await tx.stockAdjustment.createMany({ data: adjustments });
//       }

//       await Promise.all(stockCreates);

//       return { success: true, visitId };
//     });

//     // Revalidate UI paths
//     revalidatePath(`/stores/${storeId}/visit`);
//     revalidatePath(`/stores/${storeId}`);

//     return result;
//   } catch (err) {
//     console.error("Stock update transaction failed:", err);
//     return { success: false, error: "Failed to save stock changes" };
//   }
// }
// export async function checkInAndUpdateStockPositions(formData: FormData) {
//   const { userId } = await auth();
//   if (!userId) {
//     return { success: false, error: "Unauthorized - please sign in" };
//   }

//   const storeId = formData.get("storeId") as string;
//   if (!storeId) {
//     return { success: false, error: "Missing store ID" };
//   }

//   // Optional location data
//   const latitudeStr = formData.get("latitude") as string;
//   const longitudeStr = formData.get("longitude") as string;
//   let latitude: number | null = null;
//   let longitude: number | null = null;

//   if (latitudeStr && longitudeStr) {
//     latitude = parseFloat(latitudeStr);
//     longitude = parseFloat(longitudeStr);
//     if (isNaN(latitude) || isNaN(longitude)) {
//       return { success: false, error: "Invalid location data" };
//     }
//   }

//   // Fetch store (with location if needed for geofencing)
//   const store = await prisma.store.findUnique({
//     where: { id: storeId },
//     include: { stockPositions: { include: { product: true } } },
//   });

//   if (!store) {
//     return { success: false, error: "Store not found" };
//   }

//   // Optional geofencing check (only if location is provided)
//   if (latitude !== null && longitude !== null) {
//     if (!store.latitude || !store.longitude) {
//       return { success: false, error: "Store location not configured - cannot verify distance" };
//     }

//     const distance = getDistance(latitude, longitude, store.latitude, store.longitude);
//     if (distance > 200) {
//       return { success: false, error: "You must be within ~200 meters of the store to update stock" };
//     }
//   }

//   try {
//     const result = await prisma.$transaction(async (tx) => {
//       // 1. Create a new Visit record (always, even without location)
//       const visit = await tx.visit.create({
//         data: {
//           salesmanId: userId,
//           storeId,
//           timestamp: new Date(),
//           latitude: latitude,   // optional
//           longitude: longitude, // optional
//           notes: formData.get("notes") as string || "Stock update during visit",
//         },
//       });

//       const visitId = visit.id;

//       // 2. Collect all adjustments and upserts
//       const adjustments: any[] = [];
//       const stockUpserts: any[] = [];

//       for (const [key, value] of formData.entries()) {
//         if (!key.startsWith("quantity-")) continue;

//         const productId = key.replace("quantity-", "");
//         const newQtyStr = value as string;
//         const newQty = parseInt(newQtyStr, 10);

//         if (isNaN(newQty)) continue;

//         const expiry = (formData.get(`expiry-${productId}`) as string) || null;
//         const batch = (formData.get(`batch-${productId}`) as string) || null;

//         // Find current quantity (if position exists)
//         const currentPosition = store.stockPositions.find((sp) => sp.productId === productId);
//         const currentQty = currentPosition?.quantity ?? 0;

//         const quantityChange = newQty - currentQty;

//         // Only log adjustment if there was a change
//         if (quantityChange !== 0) {
//           adjustments.push({
//             visitId,
//             productId,
//             storeId,
//             quantityChange,
//             notes: `Updated during visit: ${quantityChange > 0 ? "+" : ""}${quantityChange}`,
//           });
//         }

//         // Always upsert stock position (create or update)
//         stockUpserts.push(
//           tx.stockPosition.upsert({
//             where: { storeId_productId: { storeId, productId } },
//             update: {
//               quantity: newQty,
//               ...(batch && { batchNumber: batch }),
//               ...(expiry && { expiryDate: new Date(expiry) }),
//             },
//             create: {
//               storeId,
//               productId,
//               quantity: newQty,
//               batchNumber: batch,
//               expiryDate: expiry ? new Date(expiry) : null,
//             },
//           })
//         );
//       }

//       // Execute upserts and adjustments in transaction
//       if (adjustments.length > 0) {
//         await tx.stockAdjustment.createMany({ data: adjustments });
//       }

//       await Promise.all(stockUpserts.map((op) => op));

//       return { success: true, visitId };
//     });

//     // Revalidate related paths
//     revalidatePath(`/stores/${storeId}/visit`);
//     revalidatePath(`/stores/${storeId}`);

//     return result;
//   } catch (err) {
//     console.error("Stock update transaction failed:", err);
//     return { success: false, error: "Failed to save stock changes" };
//   }
// }

// export async function checkInAndUpdateStockPositions(formData: FormData) {
//   const { userId } = await auth();
//   if (!userId) {
//     return { success: false, error: "Unauthorized - please sign in" };
//   }

//   const storeId = formData.get("storeId") as string;
//   const latitudeStr = formData.get("latitude") as string;
//   const longitudeStr = formData.get("longitude") as string;

//   if (!storeId || !latitudeStr || !longitudeStr) {
//     return { success: false, error: "Missing required fields (storeId, location)" };
//   }

//   const latitude = parseFloat(latitudeStr);
//   const longitude = parseFloat(longitudeStr);

//   if (isNaN(latitude) || isNaN(longitude)) {
//     return { success: false, error: "Invalid location data" };
//   }

//   // Fetch store with location & existing stock
//   const store = await prisma.store.findUnique({
//     where: { id: storeId },
//     include: {
//       stockPositions: { include: { product: true } },
//     },
//   });

//   if (!store) {
//     return { success: false, error: "Store not found" };
//   }

//   if (!store.latitude || !store.longitude) {
//     return { success: false, error: "Store location not configured" };
//   }

//   const distance = getDistance(latitude, longitude, store.latitude, store.longitude);
//   if (distance > 200) { // 200 meters tolerance
//     return { success: false, error: "You must be at the store location to update stock" };
//   }

//   // Create the Visit (one per submission/check-in)
//   const visit = await prisma.visit.create({
//     data: {
//       salesmanId: userId,
//       storeId,
//       timestamp: new Date(),
//       latitude,
//       longitude,
//       notes: formData.get("notes") as string || "Stock update during visit",
//     },
//   });

//   // Collect all changes
//   const adjustments: any[] = [];
//   const stockUpserts: any[] = [];

//   // Process each product submitted in form
//   for (const [key, value] of formData.entries()) {
//     if (!key.startsWith("quantity-")) continue;

//     const productId = key.replace("quantity-", "");
//     const newQtyStr = value as string;
//     const newQty = parseInt(newQtyStr, 10);

//     if (isNaN(newQty)) continue; // Skip invalid

//     const expiry = (formData.get(`expiry-${productId}`) as string) || null;
//     const batch = (formData.get(`batch-${productId}`) as string) || null;
//     const reason = (formData.get(`reason-${productId}`) as AdjustmentReason) || AdjustmentReason.COUNT_CORRECTION;

//     // Find current quantity (if position exists)
//     const currentPosition = store.stockPositions.find((sp) => sp.productId === productId);
//     const currentQty = currentPosition?.quantity ?? 0;

//     const quantityChange = newQty - currentQty;

//     // Only log adjustment if there was a change
//     if (quantityChange !== 0) {
//       adjustments.push({
//         visitId: visit.id,
//         productId,
//         storeId,
//         quantityChange,
//         reason,
//         batchNumber: batch,
//         expiryDate: expiry ? new Date(expiry) : null,
//         notes: `Updated during visit: ${quantityChange > 0 ? "+" : ""}${quantityChange}`,
//       });

//       // Prepare upsert for stock position
//       stockUpserts.push(
//         prisma.stockPosition.upsert({
//           where: { storeId_productId: { storeId, productId } },
//           update: {
//             quantity: newQty,
//             ...(batch && { batchNumber: batch }),
//             ...(expiry && { expiryDate: new Date(expiry) }),
//           },
//           create: {
//             storeId,
//             productId,
//             quantity: newQty,
//             batchNumber: batch,
//             expiryDate: expiry ? new Date(expiry) : null,
//           },
//         })
//       );
//     }
//   }

//   // Execute in transaction for atomicity
//   try {
//     await prisma.$transaction(async (tx) => {
//       if (adjustments.length > 0) {
//         await tx.stockAdjustment.createMany({ data: adjustments });
//       }
//       await Promise.all(stockUpserts.map((op) => op(tx)));
//     });

//     revalidatePath(`/stores/${storeId}/visit`);
//     revalidatePath(`/stores/${storeId}`);

//     return { success: true, visitId: visit.id };
//   } catch (err) {
//     console.error("Stock update transaction failed:", err);
//     return { success: false, error: "Failed to save stock changes" };
//   }
// } 