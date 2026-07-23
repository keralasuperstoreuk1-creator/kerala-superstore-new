import { NextResponse } from "next/server";
import { db } from "@/db";
import { carts, items } from "@/db/schema";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("cart_session")?.value || "none";

  // Get all cart records for this session
  const cartRecords = await db.select().from(carts).where(eq(carts.sessionId, sessionId));

  // Get all items (first 20)
  const allItems = await db.select({
    id: items.id,
    name: items.name,
    slug: items.slug,
    price: items.price,
    hasImages: items.images,
  }).from(items).limit(20);

  // For each cart record, try the exact lookup
  const lookups = [];
  for (const cr of cartRecords) {
    const directLookup = await db.select().from(items).where(eq(items.id, Number(cr.itemId)));
    lookups.push({
      cartItemId: cr.id,
      storedItemId: cr.itemId,
      storedItemType: cr.itemType,
      storedVariantId: cr.variantId,
      lookupResult: directLookup.length > 0 ? { id: directLookup[0].id, name: directLookup[0].name } : "NOT FOUND",
    });
  }

  return NextResponse.json({
    sessionId,
    cartRecords,
    lookups,
    allItemsPreview: allItems.map(i => ({ id: i.id, name: i.name, slug: i.slug })),
  }, { status: 200 });
}
