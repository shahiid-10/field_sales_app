// actions/order.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@/lib/generated/prisma/enums";
import { auth } from "@clerk/nextjs/server";
import { error } from "console";
import { success } from "zod";

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
// export async function updateOrderStatus(orderId: string, newStatus: string) {
//   if (!["PENDING", "PARTIAL", "FULFILLED", "UNFULFILLED"].includes(newStatus)) {
//     throw new Error("Invalid order status");
//   }

//   await prisma.order.update({
//     where: { id: orderId },
//     data: { status: newStatus as OrderStatus },
//   });

//   // Revalidate the orders page for this store
//   // Note: storeId is not directly available here, so we revalidate all orders pages
//   // Alternatively, pass storeId and do targeted revalidation
//   revalidatePath("/stores/[storeId]/orders", "page");
// }

export async function getOrdersGroupedByStore() {
  const storesWithOrders = await prisma.store.findMany({
    where: {
      orders: {
        some: {
          status: { not: "FULFILLED" }, // only active orders
        },
      },
    },
    select: {
      id: true,
      name: true,
      address: true,
      orders: {
        where: {
          status: { not: "FULFILLED" },
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
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return storesWithOrders.map((store) => ({
    storeId: store.id,
    storeName: store.name,
    storeAddress: store.address,
    orders: store.orders.map((order) => ({
      id: order.id,
      salesmanName: order.salesman?.name || "Unknown",
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      items: order.items.map((item) => ({
        productName: item.product.name,
        mrp: item.product.mrp,
        quantity: item.quantity,
      })),
    })),
  }));
}


export async function getPendingOrdersAll() {
  const orders = await prisma.order.findMany({
    where: {
      status: { not: "FULFILLED" },
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
        },
      },
      salesman: {
        select: {
          name: true,
        },
      },
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders.map((order) => ({
    id: order.id,
    storeId: order.store.id,
    storeName: order.store.name,
    salesmanName: order.salesman?.name ?? "Unknown",
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    items: order.items.map((item) => ({
      productName: item.product.name,
      mrp: item.product.mrp,
      quantity: item.quantity,
    })),
  }));
}


export async function createMultiItemOrder(input: {
  storeId: string;
  items: { productId: string; quantity: number }[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {

    const salesman = await prisma.user.findFirst({
      where: { clerkUserId: userId},
      select: { id: true }
    })

    if (!salesman) {
      return {
        success: false,
        error: "Your account not found in database. Contact support.",
      };
    }


    const order = await prisma.order.create({
      data: {
        storeId: input.storeId,
        salesmanId: salesman.id,
        status: "PENDING",
        items: {
          create: input.items,
        },
      },
    });

    revalidatePath(`/stores/${input.storeId}/orders`);
    return { success: true, orderId: order.id };
  } catch (error) {
    console.error(error)
    return { success: false, error: "error" };
  }

  
}

export async function attemptFullFulfillment(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      store: { select: { id: true } },
    },
  });

  if (!order) throw new Error("Order not found");
  if (order.status !== "PENDING") throw new Error("Can only fulfill pending orders");

  // Check if enough stock for ALL items
  for (const item of order.items) {
    const inventory = await prisma.inventory.findUnique({
      where: { productId: item.productId },
    });
    const available = inventory?.quantity || 0;
    if (available < item.quantity) {
      throw new Error(`Insufficient stock for product ${item.productId}. Available: ${available}, Requested: ${item.quantity}`);
    }
  }

  // If all good, fulfill in transaction
  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      // Deduct from central inventory
      await tx.inventory.update({
        where: { productId: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });

      // Add to store's stock position (new row with null batch/expiry)
      await tx.stockPosition.create({
        data: {
          storeId: order.storeId,
          productId: item.productId,
          quantity: item.quantity,
          batchNumber: null,
          expiryDate: null,
        },
      });
    }

    // Update status
    await tx.order.update({
      where: { id: orderId },
      data: { status: "FULFILLED" },
    });
  });

  revalidatePath("/stores/[storeId]/orders", "page");
  return { success: true };
}

export async function attemptPartialFulfillment(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      store: { select: { id: true } },
    },
  });

  if (!order) throw new Error("Order not found");
  if (order.status !== "PENDING") throw new Error("Can only fulfill pending orders");

  let allFull = true;
  let allUnfulfilled = true;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const inventory = await tx.inventory.findUnique({
        where: { productId: item.productId },
      });
      let available = inventory?.quantity || 0;
      const fulfillAmt = Math.min(available, item.quantity);

      if (fulfillAmt > 0) {
        // Deduct from central inventory
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: fulfillAmt } },
        });

        // Add to store's stock position (new row with null batch/expiry)
        await tx.stockPosition.create({
          data: {
            storeId: order.storeId,
            productId: item.productId,
            quantity: fulfillAmt,
            batchNumber: null,
            expiryDate: null,
          },
        });

        allUnfulfilled = false;
      }

      if (fulfillAmt < item.quantity) {
        // Track shortfall
        await tx.unfulfilledItem.create({
          data: {
            orderId: order.id,
            storeId: order.storeId,
            productId: item.productId,
            requestedQty: item.quantity,
            availableQty: fulfillAmt,
          },
        });
        allFull = false;
      } else {
        allUnfulfilled = false;
      }
    }

    // Set status based on outcome
    let newStatus: OrderStatus;
    if (allFull) {
      newStatus = "FULFILLED";
    } else if (allUnfulfilled) {
      newStatus = "UNFULFILLED";
    } else {
      newStatus = "PARTIAL";
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
  });

  revalidatePath("/stores/[storeId]/orders", "page");
  return { success: true, message: allFull ? "Fully fulfilled" : "Partially fulfilled due to stock shortages" };
}

export async function getOrderForFulfillment(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              inventory: {
                select: {
                  quantity: true,
                },
              },
            },
          },
        },
      },
      store: { select: { id: true } },
    },
  });

  if (!order) throw new Error("Order not found");

  return {
    id: order.id,
    storeId: order.store.id,
    items: order.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      requestedQty: item.quantity,
      availableQty: item.product.inventory?.quantity || 0,
    })),
  };
}

// Process fulfillment with specified quantities
// fulfilledQtys: { [productId: string]: number }
export async function processFulfillment(
  orderId: string,
  fulfilledQtys: Record<string, number>,
  isFullMode: boolean // true if user selected "FULFILLED" (enforce all full)
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      store: { select: { id: true } },
    },
  });

  if (!order) throw new Error("Order not found");
  if (order.status !== "PENDING") throw new Error("Can only fulfill pending orders");

  // Validate inputs
  let allFull = true;
  let allZero = true;
  for (const item of order.items) {
    const fulfillQty = fulfilledQtys[item.productId] ?? 0;
    if (fulfillQty < 0 || fulfillQty > item.quantity) {
      throw new Error(`Invalid quantity for ${item.productId}: ${fulfillQty}`);
    }
    const inventory = await prisma.inventory.findUnique({ where: { productId: item.productId } });
    const available = inventory?.quantity || 0;
    if (fulfillQty > available) {
      throw new Error(`Insufficient stock for ${item.productId}. Available: ${available}, Fulfilling: ${fulfillQty}`);
    }

    if (fulfillQty < item.quantity) allFull = false;
    if (fulfillQty > 0) allZero = false;
  }

  if (isFullMode && !allFull) {
    throw new Error("Cannot mark as FULFILLED: Not all items are fully satisfied");
  }

  // Process in transaction
  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const fulfillQty = fulfilledQtys[item.productId] ?? 0;
      if (fulfillQty > 0) {
        // Deduct from inventory
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: fulfillQty } },
        });

        // Add to store stock position
        await tx.stockPosition.create({
          data: {
            storeId: order.storeId,
            productId: item.productId,
            quantity: fulfillQty,
            batchNumber: null,
            expiryDate: null,
          },
        });
      }

      if (fulfillQty < item.quantity) {
        // Track shortfall
        await tx.unfulfilledItem.create({
          data: {
            orderId: order.id,
            storeId: order.storeId,
            productId: item.productId,
            requestedQty: item.quantity,
            availableQty: fulfillQty,
          },
        });
      }
    }

    // Set status
    let newStatus: OrderStatus;
    if (allFull) {
      newStatus = "FULFILLED";
    } else if (allZero) {
      newStatus = "UNFULFILLED";
    } else {
      newStatus = "PARTIAL";
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
  });

  revalidatePath("/stores/[storeId]/orders", "page");
  return { success: true, newStatus: order.status };
}


// Update existing updateOrderStatus to restrict manual changes (e.g., only allow UNFULFILLED or PENDING manually)
export async function updateOrderStatus(orderId: string, newStatus: string) {
  if (!["PENDING", "UNFULFILLED"].includes(newStatus)) {
    throw new Error("Use fulfillment actions for FULFILLED or PARTIAL");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus as OrderStatus },
  });

  revalidatePath("/stores/[storeId]/orders", "page");
}
