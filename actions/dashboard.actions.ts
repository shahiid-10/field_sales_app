// actions/dashboard.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function getDashboardStats() {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const todaysVisits = await prisma.visit.count({
        where: {
            timestamp: {
                gte: todayStart,
                lte: todayEnd,
            },
        },
    });

    const todaysOrders = await prisma.order.count({
        where: {
            createdAt: {
                gte: todayStart,
                lte: todayEnd,
            },
        },
    });

    const pendingOrders = await prisma.order.count({
        where: {
            status: "PENDING",
        },
    });
    const pendingOrderss = await prisma.order.count({
        where: {
            status: {
                in: ["PENDING", "PARTIAL"],
            },
        },
    })

    // Active salesmen: distinct salesmen with visits or orders today
    const activeSalesmenFromVisits = await prisma.visit.findMany({
        where: {
            timestamp: {
                gte: todayStart,
                lte: todayEnd,
            },
        },
        select: { salesmanId: true },
        distinct: ["salesmanId"],
    });

    const activeSalesmenFromOrders = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: todayStart,
                lte: todayEnd,
            },
        },
        select: { salesmanId: true },
        distinct: ["salesmanId"],
    });

    const activeSalesmen = new Set([
        ...activeSalesmenFromVisits.map((v) => v.salesmanId),
        ...activeSalesmenFromOrders.map((o) => o.salesmanId),
    ]).size;

    return {
        todaysVisits,
        todaysOrders,
        pendingOrders,
        activeSalesmen,
    };
}

export async function getRecentActivities(limit: number = 10) {
    // Union of recent activities from different models
    // For now: Orders, Visits, StockAdjustments, StockPositions (updates), Orders fulfillment (status changes)

    // Recent Orders
    const recentOrders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
            id: true,
            createdAt: true,
            status: true,
            store: { select: { name: true } },
            salesman: { select: { name: true } },
        },
    });

    // Recent Visits
    const recentVisits = await prisma.visit.findMany({
        orderBy: { timestamp: "desc" },
        take: limit,
        select: {
            id: true,
            timestamp: true,
            store: { select: { name: true } },
            salesman: { select: { name: true } },
        },
    });

    // Recent Stock Adjustments
    const recentAdjustments = await prisma.stockAdjustment.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
            id: true,
            createdAt: true,
            reason: true,
            quantityChange: true,
            product: { select: { name: true } },
            store: { select: { name: true } },
        },
    });

    // Recent Stock Position Updates (e.g., new positions or updates)
    const recentStockPositions = await prisma.stockPosition.findMany({
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: {
            id: true,
            updatedAt: true,
            quantity: true,
            product: { select: { name: true } },
            store: { select: { name: true } },
        },
    });

    // Combine and sort all activities
    const allActivities = [
        ...recentOrders.map((o) => ({
            id: o.id,
            createdAt: o.createdAt,
            type: "Order",
            description: `Order ${o.id.slice(0, 8)} created/updated for store ${o.store.name} by ${o.salesman.name} - Status: ${o.status}`,
        })),
        ...recentVisits.map((v) => ({
            id: v.id,
            createdAt: v.timestamp,
            type: "Visit",
            description: `Visit to store ${v.store.name} by ${v.salesman.name}`,
        })),
        ...recentAdjustments.map((a) => ({
            id: a.id,
            createdAt: a.createdAt,
            type: "Stock Adjustment",
            description: `${a.quantityChange > 0 ? "Added" : "Removed"} ${Math.abs(a.quantityChange)} units of ${a.product.name} in store ${a.store.name} - Reason: ${a.reason || "N/A"}`,
        })),
        ...recentStockPositions.map((s) => ({
            id: s.id,
            createdAt: s.updatedAt,
            type: "Stock Update",
            description: `Stock updated for ${s.product.name} in store ${s.store.name} - New quantity: ${s.quantity}`,
        })),
    ];

    // Sort by createdAt descending and take top limit
    allActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return allActivities.slice(0, limit);
}