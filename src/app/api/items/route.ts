import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { items, itemVariants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    if (id) {
      const item = await db.select().from(items).where(eq(items.id, parseInt(id)));
      const variants = await db.select().from(itemVariants).where(eq(itemVariants.itemId, parseInt(id)));
      return NextResponse.json({ ...item[0], variants });
    }

    if (slug) {
      const item = await db.select().from(items).where(eq(items.slug, slug));
      if (item.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const variants = await db.select().from(itemVariants).where(eq(itemVariants.itemId, item[0].id));
      return NextResponse.json({ ...item[0], variants });
    }

    let query = db.select().from(items).orderBy(items.sortOrder);
    if (categoryId) {
      query = db.select().from(items).where(eq(items.categoryId, parseInt(categoryId))).orderBy(items.sortOrder) as any;
    }

    const data = await query;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variants, ...itemData } = body;
    const result = await db.insert(items).values(itemData).returning();
    const itemId = result[0].id;

    if (variants && variants.length > 0) {
      await db.insert(itemVariants).values(variants.map((v: any) => ({ ...v, itemId })));
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, variants, ...data } = body;
    const result = await db.update(items).set(data).where(eq(items.id, id)).returning();

    if (variants) {
      await db.delete(itemVariants).where(eq(itemVariants.itemId, id));
      if (variants.length > 0) {
        await db.insert(itemVariants).values(variants.map((v: any) => ({ ...v, itemId: id })));
      }
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
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
        await db.delete(itemVariants).where(eq(itemVariants.itemId, targetId));
        await db.delete(items).where(eq(items.id, targetId));
      }
      return NextResponse.json({ success: true, count: idList.length });
    }

    if (idStr) {
      const id = parseInt(idStr);
      await db.delete(itemVariants).where(eq(itemVariants.itemId, id));
      await db.delete(items).where(eq(items.id, id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing id or ids parameter" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete item(s)" }, { status: 500 });
  }
}
