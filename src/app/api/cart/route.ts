import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, items, itemVariants, dresses, offers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";

async function getSessionId() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("cart_session")?.value;
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  return sessionId;
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = await getSessionId();
    const cartItems = await db.select().from(carts).where(eq(carts.sessionId, sessionId));
    
    const result = [];
    for (const cartItem of cartItems) {
      let item = [];
      if (cartItem.itemType === "dress") {
        item = await db.select().from(dresses).where(eq(dresses.id, cartItem.itemId));
      } else if (cartItem.itemType === "offer") {
        const offerItem = await db.select().from(offers).where(eq(offers.id, cartItem.itemId));
        if (offerItem.length > 0) {
          // Normalize offer to look like an item for the cart
          item = [{ id: offerItem[0].id, name: offerItem[0].name, price: offerItem[0].newPrice, images: [offerItem[0].image] }];
        }
      } else {
        item = await db.select().from(items).where(eq(items.id, cartItem.itemId));
      }
      let variant = null;
      if (cartItem.variantId && cartItem.itemType !== "dress") {
        const variants = await db.select().from(itemVariants).where(eq(itemVariants.id, cartItem.variantId));
        variant = variants[0];
      }
      result.push({
        ...cartItem,
        item: item[0],
        variant,
      });
    }

    const res = NextResponse.json(result);
    res.cookies.set("cart_session", sessionId, { maxAge: 60 * 60 * 24 * 30, path: "/" });
    return res;
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = await getSessionId();

    const existing = await db.select().from(carts).where(
      and(
        eq(carts.sessionId, sessionId), 
        eq(carts.itemId, body.itemId),
        eq(carts.itemType, body.itemType || "item")
      )
    );

    // Find if there's an exact match including variantId or variantName
    const exactMatch = existing.find(c => 
      c.variantId === (body.variantId || null) && 
      c.variantName === (body.variantName || null)
    );

    if (exactMatch) {
      await db.update(carts)
        .set({ quantity: exactMatch.quantity + (body.quantity || 1) })
        .where(eq(carts.id, exactMatch.id));
    } else {
      await db.insert(carts).values({ ...body, sessionId });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set("cart_session", sessionId, { maxAge: 60 * 60 * 24 * 30, path: "/" });
    return res;
  } catch (error) {
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    await db.update(carts).set({ quantity: body.quantity }).where(eq(carts.id, body.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    await db.delete(carts).where(eq(carts.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove from cart" }, { status: 500 });
  }
}
