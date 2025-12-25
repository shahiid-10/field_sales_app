// actions/order.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@/lib/generated/prisma/enums";

export async function createOrder(formData: FormData) {
  const storeId = formData.get("storeId") as string;
  const salesmanId = "current-user-id-placeholder"; // replace with auth
  const productId = formData.get("productId") as string;
  const quantity = parseInt(formData.get("quantity") as string);

  if (quantity <= 0) return { error: "Invalid quantity" };

  const order = await prisma.order.create({
    data: {
      storeId,
      salesmanId,
      status: "PENDING",
      items: {
        create: [{ productId, quantity }],
      },
    },
  });

  revalidatePath(`/stores/${storeId}/orders`);

  return { success: true, orderId: order.id };
}

export async function getPendingOrdersForStore(storeId: string) {
  const orders = await prisma.order.findMany({
    where: {
      storeId,
      status: { not: "FULFILLED" }, // Exclude fulfilled orders
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              mrp: true,
            },
          },
        },
      },
      salesman: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders.map((order) => ({
    id: order.id,
    salesmanName: order.salesman?.name || "Unknown",
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    items: order.items.map((item) => ({
      productName: item.product.name,
      mrp: item.product.mrp,
      quantity: item.quantity,
    })),
  }));
}

// Update order status (used by stock manager)
export async function updateOrderStatus(orderId: string, newStatus: string) {
  if (!["PENDING", "PARTIAL", "FULFILLED", "UNFULFILLED"].includes(newStatus)) {
    throw new Error("Invalid order status");
  }
  
  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus as OrderStatus},
  });

  // Revalidate the orders page for this store
  // Note: storeId is not directly available here, so we revalidate all orders pages
  // Alternatively, pass storeId and do targeted revalidation
  revalidatePath("/stores/[storeId]/orders", "page");
}

