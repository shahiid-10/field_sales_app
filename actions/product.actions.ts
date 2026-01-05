// actions/product.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { error } from "console";
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
  console.log("Stored Id: ", storeId);
  const store = await prisma.store.findUnique({
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

  // return orders
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
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkUserId: userId
    }
  })
  if(!user) return { error: "user no found in db"}
  const userid = user?.id;
  const storeId = formData.get("storeId") as string;
  const productId = formData.get("productId") as string;
  const quantityStr = formData.get("quantity") as string;
  const expiryStr = formData.get("expiryDate") as string | null;
  const batch = formData.get("batchNumber") as string | null;

  const newQuantity = parseInt(quantityStr);
  if (isNaN(newQuantity) || newQuantity < 0) {
    return { success: false, error: "Invalid quantity" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create real Visit
      const visit = await tx.visit.create({
        data: {
          salesmanId: userid,
          storeId,
          timestamp: new Date(),
          notes: "Stock addition via dialog",
        },
      });

      // Always CREATE new stock position (allows multiple batches/expiry)
      const newPosition = await tx.stockPosition.create({
        data: {
          storeId,
          productId,
          quantity: newQuantity,
          expiryDate: expiryStr ? new Date(expiryStr) : null,
          batchNumber: batch || null,
        },
      });

      // Record adjustment
      await tx.stockAdjustment.create({
        data: {
          visitId: visit.id,
          productId,
          storeId,
          quantityChange: newQuantity,
          reason: "RESTOCK",
          batchNumber: batch || undefined,
          expiryDate: expiryStr ? new Date(expiryStr) : null,
          notes: "Added new batch during visit",
        },
      });

      return { success: true, positionId: newPosition.id };
    });

    revalidatePath(`/stores/${storeId}/visit`);

    return result;
  } catch (error) {
    console.error("Stock addition failed:", error);
    return { success: false, error: "Failed to add stock" };
  }
}
// export async function addStockAdjustment(formData: FormData) {
//   const storeId     = formData.get("storeId") as string;
//   const productId   = formData.get("productId") as string;
//   const quantityStr = formData.get("quantity") as string;
//   const expiryStr   = formData.get("expiryDate") as string | null;
//   const batch       = formData.get("batchNumber") as string | null;

//   const newQuantity = parseInt(quantityStr);
//   if (isNaN(newQuantity) || newQuantity < 0) {
//     return { success: false, error: "Invalid quantity" };
//   }

//   // Get current stock position (if exists)
//   const current = await prisma.stockPosition.findUnique({
//     where: { storeId_productId: { storeId, productId } },
//   });

//   const currentQty = current?.quantity ?? 0;
//   const quantityChange = newQuantity - currentQty;

//   if (quantityChange === 0) {
//     return { success: true, message: "No change detected" };
//   }

//   try {
//     await prisma.$transaction(async (tx) => {
//       // Record adjustment
//       await tx.stockAdjustment.create({
//         data: {
//           visitId: "0", // ← important: you need visitId!
//           productId,
//           storeId,
//           quantityChange,
//           reason: quantityChange > 0 ? "RESTOCK" : "COUNT_CORRECTION", // default
//           batchNumber: batch || undefined,
//           expiryDate: expiryStr ? new Date(expiryStr) : null,
//           notes: "Added via product selector",
//         },
//       });

//       // Update or create current stock position
//       await tx.stockPosition.upsert({
//         where: { storeId_productId: { storeId, productId } },
//         update: {
//           quantity: { increment: quantityChange },
//           ...(batch && { batchNumber: batch }),
//           ...(expiryStr && { expiryDate: new Date(expiryStr) }),
//         },
//         create: {
//           storeId,
//           productId,
//           quantity: newQuantity,
//           batchNumber: batch,
//           expiryDate: expiryStr ? new Date(expiryStr) : null,
//         },
//       });
//     });

//     revalidatePath(`/stores/${storeId}/visit`);
//     return { success: true };
//   } catch (error) {
//     console.error(error);
//     return { success: false, error: "Failed to record adjustment" };
//   }
// }

// ── Single product order add (order mode) ──
// Note: Creates a NEW order each time (simple approach)
// You can later change to add to existing draft order if desired
// export async function addOrderItem(formData: FormData) {
//   const storeId     = formData.get("storeId") as string;
//   const productId   = formData.get("productId") as string;
//   console.log("Storeee id: ", storeId);
//     // const storeId = "1"
//     // const productId = "2"
//   const quantityStr = formData.get("quantity") as string;

//   const qty = parseInt(quantityStr);
//   if (isNaN(qty) || qty < 1) {
//     return { success: false, error: "Invalid quantity" };
//   }

//   // const salesmanId = "2"; // ← replace with real auth
//   const { userId } = await auth();
//   if (!userId) throw new Error("Unauthorized: No user ID from Clerk");

//   try {
//     await prisma.order.create({
//       data: {
//         storeId,
//         salesmanId: userId,
//         status: "PENDING",
//         items: {
//           create: {
//             productId,
//             quantity: qty,
//           },
//         },
//       },
//     });

//     revalidatePath(`/stores/${storeId}/orders`);
//     return { success: true };
//   } catch (error) {
//     console.error(error);
//     return { success: false, error: "Failed to create order" };
//   }
// }

export async function addOrderItem(formData: FormData) {
  try {
    const storeId     = formData.get("storeId") as string;
    const productId   = formData.get("productId") as string;
    const quantityStr = formData.get("quantity") as string;

    console.log("Storeee id: ", storeId);

    console.log("[addOrderItem] Received data:", {
      storeId,
      productId,
      quantityStr,
      rawFormData: Object.fromEntries(formData),
    });

    if (!storeId?.trim()) throw new Error("Store ID is empty or missing");
    if (!productId?.trim()) throw new Error("Product ID is empty or missing");

    const qty = parseInt(quantityStr);
    if (isNaN(qty) || qty < 1) throw new Error(`Invalid quantity: ${quantityStr}`);

    const { userId } = await auth();
    console.log("[addOrderItem] Authenticated userId:", userId);

    if (!userId) throw new Error("Unauthorized: No user ID from Clerk");

    const salesman = await prisma.user.findUnique({ where: { id: userId } });
    console.log("[addOrderItem] Salesman found:", !!salesman, salesman?.id);

    if (!salesman) throw new Error(`Salesman with Clerk ID ${userId} not found in Prisma`);

    const store = await prisma.store.findFirst({ where: { id: storeId } });
    console.log("[addOrderItem] Store exists:", !!store, store?.id);

    if (!store) throw new Error(`Store with ID "${storeId}" does not exist`);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    console.log("[addOrderItem] Product exists:", !!product, product?.id);

    if (!product) throw new Error(`Product with ID "${productId}" does not exist`);

    const newOrder = await prisma.order.create({
      data: {
        storeId,
        salesmanId: userId,
        status: "PENDING",
        items: {
          create: {
            productId,
            quantity: qty,
          },
        },
      },
    });

    console.log("[addOrderItem] Order created successfully:", newOrder.id);

    revalidatePath(`/stores/${storeId}/orders`);

    return { success: true, orderId: newOrder.id };
  } catch (error: any) {
    console.error("[addOrderItem] FULL ERROR:", error);
    return {
      success: false,
      error: error.message || "Failed to create order",
      details: error.stack || null,
    };
  }
}

// export async function addOrderItem(formData: FormData) {
//   try {
//     const storeId     = formData.get("storeId") as string;
//     const productId   = formData.get("productId") as string;
//     const quantityStr = formData.get("quantity") as string;

//     if (!storeId)    throw new Error("Missing storeId");
//     if (!productId)  throw new Error("Missing productId");

//     const qty = parseInt(quantityStr);
//     if (isNaN(qty) || qty < 1) {
//       throw new Error("Invalid quantity");
//     }

//     const { userId } = await auth();
//     if (!userId) {
//       throw new Error("Unauthorized: Please sign in");
//     }

//     // Optional: Check if user exists in your Prisma User table
//     const salesman = await prisma.user.findUnique({ where: { id: userId } });
//     if (!salesman) {
//       throw new Error("User not found in database. Please contact support.");
//     }

//     // Optional: Check store & product exist (prevents cryptic DB errors)
//     const storeExists = await prisma.store.findUnique({ where: { id: storeId } });
//     const productExists = await prisma.product.findUnique({ where: { id: productId } });
//     if (!storeExists)   throw new Error("Store not found");
//     if (!productExists) throw new Error("Product not found");

//     await prisma.order.create({
//       data: {
//         storeId,
//         salesmanId: userId,
//         status: "PENDING",
//         items: {
//           create: {
//             productId,
//             quantity: qty,
//           },
//         },
//       },
//     });

//     revalidatePath(`/stores/${storeId}/orders`);

//     return { success: true };
//   } catch (error: any) {
//     console.error("Order creation failed:", error);
//     // Return detailed error for debugging
//     return {
//       success: false,
//       error: error.message || "Failed to create order (unknown error)",
//     };
//   }
// }

// export async function addOrderItem(formData: FormData) {
//   const storeId     = formData.get("storeId") as string;
//   const productId   = formData.get("productId") as string;
//   const quantityStr = formData.get("quantity") as string;

//   const qty = parseInt(quantityStr);
//   if (isNaN(qty) || qty < 1) {
//     return { success: false, error: "Invalid quantity" };
//   }

//   // Get the current authenticated user from Clerk
//   const authRes = await auth();
//   const userId = authRes.userId;

//   // If no user is authenticated → reject
//   if (!userId) {
//     return { success: false, error: "Unauthorized: Please sign in" };
//   }

//   // Optional: You can also get more Clerk user info if needed
//   // const clerkUser = await currentUser(); // if you need name/email/etc.

//   try {
//     await prisma.order.create({
//       data: {
//         storeId,
//         salesmanId: userId,          // ← Use Clerk's userId here!
//         status: "PENDING",
//         items: {
//           create: {
//             productId,
//             quantity: qty,
//           },
//         },
//       },
//     });

//     revalidatePath(`/stores/${storeId}/orders`);

//     return { success: true };
//   } catch (error) {
//     console.error("Order creation failed:", error);
//     return { success: false, error: "Failed to create order" };
//   }
// }