import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : (body.settings || []);

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid backup format. Expected an array of { key, value }." }, { status: 400 });
    }

    let count = 0;
    for (const item of items) {
      if (!item || !item.key) continue;
      const existing = await db.select().from(settings).where(eq(settings.key, item.key));
      if (existing.length > 0) {
        await db.update(settings).set({ value: item.value ?? null, updatedAt: new Date() }).where(eq(settings.key, item.key));
      } else {
        await db.insert(settings).values({ key: item.key, value: item.value ?? null });
      }
      count++;
    }

    return NextResponse.json({ success: true, restored: count });
  } catch (error) {
    return NextResponse.json({ error: "Failed to restore settings" }, { status: 500 });
  }
}
