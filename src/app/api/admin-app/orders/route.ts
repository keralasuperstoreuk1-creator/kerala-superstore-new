import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let data;
    if (status) {
      data = await db.select().from(orders).where(eq(orders.status, status)).orderBy(desc(orders.createdAt));
    } else {
      data = await db.select().from(orders).orderBy(desc(orders.createdAt));
    }

    const withItems = await Promise.all(data.map(async (o) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
      return { ...o, items };
    }));

    return NextResponse.json(withItems);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
