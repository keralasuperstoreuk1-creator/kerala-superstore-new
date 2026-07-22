import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    
    if (key) {
      const data = await db.select().from(settings).where(eq(settings.key, key));
      return NextResponse.json(data[0] || null);
    }
    
    const data = await db.select().from(settings);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = await db.select().from(settings).where(eq(settings.key, body.key));
    
    if (existing.length > 0) {
      const result = await db.update(settings).set({ value: body.value, updatedAt: new Date() }).where(eq(settings.key, body.key)).returning();
      return NextResponse.json(result[0]);
    }
    
    const result = await db.insert(settings).values(body).returning();
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
  }
}
