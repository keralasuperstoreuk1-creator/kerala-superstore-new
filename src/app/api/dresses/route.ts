import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dresses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const collectionId = searchParams.get("collectionId");
    
    let query = db.select().from(dresses).orderBy(dresses.sortOrder);
    
    if (collectionId) {
      query = db.select().from(dresses).where(eq(dresses.collectionId, parseInt(collectionId))).orderBy(dresses.sortOrder) as any;
    } else if (type && type !== "all") {
      query = db.select().from(dresses).where(eq(dresses.type, type)).orderBy(dresses.sortOrder) as any;
    }
    
    const data = await query;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dresses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...cleanData } = body;
    const result = await db.insert(dresses).values(cleanData as any).returning();
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Dress create error:", error);
    return NextResponse.json({ error: "Failed to create dress", details: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const result = await db.update(dresses).set(data as any).where(eq(dresses.id, id)).returning();
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Dress update error:", error);
    return NextResponse.json({ error: "Failed to update dress", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get("id");
    const idsStr = searchParams.get("ids");

    if (idsStr) {
      const idList = idsStr.split(",").map((i) => parseInt(i)).filter(Boolean);
      for (const targetId of idList) {
        await db.delete(dresses).where(eq(dresses.id, targetId));
      }
      return NextResponse.json({ success: true, count: idList.length });
    }

    if (idStr) {
      const id = parseInt(idStr);
      await db.delete(dresses).where(eq(dresses.id, id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing id or ids parameter" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete dress(es)" }, { status: 500 });
  }
}
