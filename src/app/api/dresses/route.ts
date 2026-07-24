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

function extractDressData(body: any) {
  return {
    name: body.name,
    type: body.type,
    description: body.description || null,
    price: body.price,
    compareAtPrice: body.compareAtPrice || null,
    collectionId: body.collectionId || null,
    images: Array.isArray(body.images) ? body.images : null,
    sizes: Array.isArray(body.sizes) ? body.sizes : null,
    colors: Array.isArray(body.colors) ? body.colors : null,
    colorVariants: body.colorVariants || null,
    orderType: body.orderType || "add_to_bag",
    stock: body.stock ?? 50,
    sortOrder: body.sortOrder ?? 0,
    isActive: body.isActive ?? true,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = extractDressData(body);
    console.log("Dress create payload:", JSON.stringify(data, null, 2));
    const result = await db.insert(dresses).values(data).returning();
    console.log("Dress created:", JSON.stringify(result[0], null, 2));
    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error("Dress create error:", error?.message || error);
    console.error("Dress create error detail:", error?.cause || "no cause");
    return NextResponse.json({ error: "Failed to create dress", details: String(error?.message || error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...rawData } = body;
    const data = extractDressData(rawData);
    console.log("Dress update payload:", JSON.stringify({ id, ...data }, null, 2));
    const result = await db.update(dresses).set(data).where(eq(dresses.id, id)).returning();
    console.log("Dress updated:", JSON.stringify(result[0], null, 2));
    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error("Dress update error:", error?.message || error);
    console.error("Dress update error detail:", error?.cause || "no cause");
    return NextResponse.json({ error: "Failed to update dress", details: String(error?.message || error) }, { status: 500 });
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
