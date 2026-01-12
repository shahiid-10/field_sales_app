// actions/report.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { addDays, format } from "date-fns";

export async function getPartialOrdersByStore(days = 30) {
  const startDate = addDays(new Date(), -days);

  const stores = await prisma.store.findMany({
    where: {
      orders: {
        some: {
          status: { in: ["PARTIAL", "UNFULFILLED"] },
          createdAt: { gte: startDate },
        },
      },
    },
    select: {
      id: true,
      name: true,
      orders: {
        where: {
          status: { in: ["PARTIAL", "UNFULFILLED"] },
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          status: true,
          unfulfilledItems: {
            select: {
              requestedQty: true,
              availableQty: true,
              // You can keep product name if you want to display it later
              product: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  });

  // TypeScript now understands store.orders exists and has the selected fields
  return stores.map((store) => {
    const partialCount = store.orders.filter((o) => o.status === "PARTIAL").length;
    const unfulfilledCount = store.orders.filter((o) => o.status === "UNFULFILLED").length;

    const totalShortfallItems = store.orders.reduce(
      (acc, order) => acc + order.unfulfilledItems.length,
      0
    );

    const totalShortfallQty = store.orders.reduce(
      (acc, order) =>
        acc +
        order.unfulfilledItems.reduce(
          (sum, item) => sum + (item.requestedQty - item.availableQty),
          0
        ),
      0
    );

    return {
      storeId: store.id,
      storeName: store.name,
      partialOrdersCount: partialCount,
      unfulfilledOrdersCount: unfulfilledCount,
      totalShortfallItems,
      totalShortfallQty,
    };
  });
}

export async function getProductShortages(days = 30) {
  const startDate = addDays(new Date(), -days);

  const shortages = await prisma.unfulfilledItem.groupBy({
    by: ["productId"],
    _sum: {
      requestedQty: true,
      availableQty: true,
    },
    where: {
      createdAt: { gte: startDate },
    },
    orderBy: {
      _sum: { requestedQty: "desc" },
    },
    take: 20, // Top 20
  });

  // Enrich with product names
  const productIds = shortages.map((s) => s.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });

  return shortages.map((s) => ({
    productId: s.productId,
    productName: products.find((p) => p.id === s.productId)?.name || "Unknown",
    requestedTotal: s._sum.requestedQty || 0,
    fulfilledTotal: s._sum.availableQty || 0,
    shortfallTotal: (s._sum.requestedQty || 0) - (s._sum.availableQty || 0),
    fulfillmentRate: (((s._sum.availableQty || 0) / (s._sum.requestedQty || 1)) * 100).toFixed(1),
  }));
}

// export async function getProductDemandTrends(days = 30) {
//   const startDate = addDays(new Date(), -days);

//   const demand = await prisma.orderItem.groupBy({
//     by: ["productId"],
//     _sum: { quantity: true },
//     where: {
//       order: {
//         createdAt: { gte: startDate },
//       },
//     },
//     orderBy: {
//       _sum: { quantity: "desc" },
//     },
//     take: 10, // Top 10
//   });

//   const unfulfilled = await prisma.unfulfilledItem.groupBy({
//     by: ["productId"],
//     _sum: { requestedQty: true },
//     where: { createdAt: { gte: startDate } },
//   });

//   const products = await prisma.product.findMany({
//     where: { id: { in: demand.map((d) => d.productId) } },
//     select: { id: true, name: true },
//   });

//   return demand.map((d) => ({
//     productId: d.productId,
//     productName: products.find((p) => p.id === d.productId)?.name || "Unknown",
//     totalDemand: d._sum.quantity || 0,
//     unfulfilledDemand: unfulfilled.find((u) => u.productId === d.productId)?._sum.requestedQty || 0,
//   }));
// }

export async function getOverallFulfillmentStats(days = 30) {
  const startDate = addDays(new Date(), -days);

  const totalOrders = await prisma.order.count({
    where: { createdAt: { gte: startDate } },
  });

  const fulfilledOrders = await prisma.order.count({
    where: {
      status: "FULFILLED",
      createdAt: { gte: startDate },
    },
  });

  const partialOrders = await prisma.order.count({
    where: {
      status: "PARTIAL",
      createdAt: { gte: startDate },
    },
  });

  const unfulfilledOrders = await prisma.order.count({
    where: {
      status: "UNFULFILLED",
      createdAt: { gte: startDate },
    },
  });

  return {
    totalOrders,
    fulfillmentRate: ((fulfilledOrders + partialOrders) / (totalOrders || 1)) * 100,
    partialRate: (partialOrders / (totalOrders || 1)) * 100,
    unfulfilledRate: (unfulfilledOrders / (totalOrders || 1)) * 100,
  };
}


export async function getProductDemandTrends(days = 30) {
  const startDate = addDays(new Date(), -days);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: startDate },
      },
    },
    select: {
      quantity: true,
      order: {
        select: { createdAt: true },
      },
    },
  });

  const unfulfilledItems = await prisma.unfulfilledItem.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      requestedQty: true,
      availableQty: true,
      createdAt: true,
    },
  });

  const demandByDate = new Map<
    string,
    { totalDemand: number; fulfilled: number }
  >();

  // Orders (fulfilled)
  for (const item of orderItems) {
    const date = format(item.order.createdAt, "yyyy-MM-dd"); // ✅ LOCAL DATE
    const current = demandByDate.get(date) ?? {
      totalDemand: 0,
      fulfilled: 0,
    };

    current.totalDemand += item.quantity;
    current.fulfilled += item.quantity;

    demandByDate.set(date, current);
  }

  // Unfulfilled
  for (const item of unfulfilledItems) {
    const date = format(item.createdAt, "yyyy-MM-dd"); // ✅ LOCAL DATE
    const current = demandByDate.get(date) ?? {
      totalDemand: 0,
      fulfilled: 0,
    };

    current.totalDemand += item.requestedQty;
    current.fulfilled += item.availableQty;

    demandByDate.set(date, current);
  }

  return Array.from(demandByDate.entries())
    .map(([date, v]) => ({
      date,
      totalDemand: v.totalDemand,
      fulfilled: v.fulfilled,
      shortfall: Math.max(v.totalDemand - v.fulfilled, 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
// export async function getProductDemandTrends(days = 30) {
//   const startDate = addDays(new Date(), - days);

//   // Get all order items in the period
//   const orderItems = await prisma.orderItem.findMany({
//     where: {
//       order: {
//         createdAt: { gte: startDate },
//       },
//     },
//     select: {
//       quantity: true,
//       order: {
//         select: {
//           createdAt: true,
//         },
//       },
//     },
//   });

//   // Get unfulfilled items in the same period
//   const unfulfilledItems = await prisma.unfulfilledItem.findMany({
//     where: {
//       createdAt: { gte: startDate },
//     },
//     select: {
//       requestedQty: true,
//       availableQty: true,
//       createdAt: true,
//     },
//   });

//   // Aggregate by date
//   const demandByDate = new Map<string, { totalDemand: number; fulfilled: number }>();

//   // Process order items (demand)
//   orderItems.forEach((item) => {
//     const date = item.order.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
//     const current = demandByDate.get(date) || { totalDemand: 0, fulfilled: 0 };
//     demandByDate.set(date, {
//       totalDemand: current.totalDemand + item.quantity,
//       fulfilled: current.fulfilled, // will be updated below
//     });
//   });

//   // Process unfulfilled (shortfall = requested - available)
//   unfulfilledItems.forEach((item) => {
//     const date = item.createdAt.toISOString().split("T")[0];
//     const current = demandByDate.get(date) || { totalDemand: 0, fulfilled: 0 };
//     const shortfall = item.requestedQty - item.availableQty;
//     demandByDate.set(date, {
//       totalDemand: current.totalDemand,
//       fulfilled: current.fulfilled + (item.requestedQty - shortfall), // fulfilled = available
//     });
//   });

//   // Convert to array and sort by date
//   const result = Array.from(demandByDate.entries())
//     .map(([date, values]) => ({
//       date,
//       totalDemand: values.totalDemand,
//       fulfilled: values.fulfilled,
//       shortfall: values.totalDemand - values.fulfilled,
//     }))
//     .sort((a, b) => a.date.localeCompare(b.date));

//   return result;
// }