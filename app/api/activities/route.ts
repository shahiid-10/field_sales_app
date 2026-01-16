// app/api/activities/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit")) || 10;

  try {
    const recentOrders = await prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        status: true,
        store: { select: { name: true } },
        salesman: { select: { name: true } },
      },
    });

    const recentVisits = await prisma.visit.findMany({
      take: limit,
      orderBy: { timestamp: "desc" },
      select: {
        id: true,
        timestamp: true,
        store: { select: { name: true } },
        salesman: { select: { name: true } },
      },
    });

    const recentAdjustments = await prisma.stockAdjustment.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        reason: true,
        quantityChange: true,
        product: { select: { name: true } },
        store: { select: { name: true } },
      },
    });

    const all = [
      ...recentOrders.map((o) => ({
        id: o.id,
        createdAt: o.createdAt.toISOString(),
        type: "Order",
        description: `Order created/updated for ${o.store.name} by ${o.salesman?.name || "Unknown"} - ${o.status}`,
      })),
      ...recentVisits.map((v) => ({
        id: v.id,
        createdAt: v.timestamp.toISOString(),
        type: "Visit",
        description: `Visit to ${v.store.name} by ${v.salesman?.name || "Unknown"}`,
      })),
      ...recentAdjustments.map((a) => ({
        id: a.id,
        createdAt: a.createdAt.toISOString(),
        type: "Stock Adjustment",
        description: `${a.quantityChange > 0 ? "Added" : "Removed"} ${Math.abs(a.quantityChange)} of ${a.product.name} in ${a.store.name}`,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(all.slice(0, limit));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}