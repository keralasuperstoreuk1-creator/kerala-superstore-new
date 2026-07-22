import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get("collectionId");
    
    let query = db.select().from(categories).orderBy(categories.sortOrder);
    if (collectionId) {
      query = db.select().from(categories).where(eq(categories.collectionId, parseInt(collectionId))).orderBy(categories.sortOrder) as any;
    }
    
    const data = await query;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await db.insert(categories).values(body).returning();
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const result = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    const idParam = searchParams.get("id");

    if (idsParam) {
      const ids = idsParam.split(",").map((i) => parseInt(i.trim())).filter((i) => !isNaN(i));
      if (ids.length > 0) {
        await db.delete(categories).where(inArray(categories.id, ids));
      }
      return NextResponse.json({ success: true, count: ids.length });
    }

    const id = parseInt(idParam || "0");
    if (id) {
      await db.delete(categories).where(eq(categories.id, id));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
