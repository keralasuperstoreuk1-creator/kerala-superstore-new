import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter((o) => o.status === "pending").length;
    const deliveredOrders = allOrders.filter((o) => o.status === "delivered").length;

    const daily: Record<string, { orders: number; revenue: number }> = {};
    const monthly: Record<string, { orders: number; revenue: number }> = {};
    const today = new Date().toDateString();
    let todayOrders = 0;
    let todayRevenue = 0;

    allOrders.forEach((o) => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      const dayKey = d.toLocaleDateString("en-GB");
      const monthKey = d.toLocaleString("en-GB", { month: "short", year: "numeric" });
      const rev = parseFloat(o.totalAmount || "0");

      if (!daily[dayKey]) daily[dayKey] = { orders: 0, revenue: 0 };
      daily[dayKey].orders++;
      daily[dayKey].revenue += rev;

      if (!monthly[monthKey]) monthly[monthKey] = { orders: 0, revenue: 0 };
      monthly[monthKey].orders++;
      monthly[monthKey].revenue += rev;

      if (d.toDateString() === today) {
        todayOrders++;
        todayRevenue += rev;
      }
    });

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
      todayOrders,
      todayRevenue,
      daily,
      monthly,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
