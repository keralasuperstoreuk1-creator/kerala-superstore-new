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
      let item = null;
      if (cartItem.itemType === "dress") {
        const dressRes = await db.select().from(dresses).where(eq(dresses.id, cartItem.itemId));
        item = dressRes[0] || null;
      } else if (cartItem.itemType === "offer") {
        const offerRes = await db.select().from(offers).where(eq(offers.id, cartItem.itemId));
        if (offerRes.length > 0) {
          const o = offerRes[0];
          item = { id: o.id, name: o.name, price: o.newPrice, images: [o.image] };
        }
      } else {
        const itemRes = await db.select().from(items).where(eq(items.id, Number(cartItem.itemId)));
        item = itemRes[0] || null;
      }

      if (!item) {
        console.warn('Cart GET: item not found, using placeholder', { itemId: cartItem.itemId, itemType: cartItem.itemType });
        item = {
          id: cartItem.itemId,
          name: `Item ${cartItem.itemId}`,
          price: 0,
          images: ["https://via.placeholder.com/150"],
        };
      }

      let variant = null;
      if (cartItem.variantId && cartItem.itemType !== "dress") {
        const variantRes = await db.select().from(itemVariants).where(eq(itemVariants.id, cartItem.variantId));
        variant = variantRes[0] || null;
      }
      // Push even if item is null to maintain cart entry; UI will handle missing gracefully
      result.push({ ...cartItem, item, variant });
      console.log('Cart GET item:', { cartItemId: cartItem.id, item, variant });
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
    // Read raw request body for debugging
    const rawBody = await req.text();
    console.log('Adding to cart payload:', rawBody);
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('JSON parse error in POST /api/cart:', parseError);
      return NextResponse.json({ error: 'Invalid JSON', details: parseError?.message }, { status: 400 });
    }
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
      console.log('Cart POST payload:', { body, sessionId });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set("cart_session", sessionId, { maxAge: 60 * 60 * 24 * 30, path: "/" });
    return res;
  } catch (error) {
    console.error('Error in POST /api/cart:', error);
    return NextResponse.json({ error: "Failed to add to cart", details: error?.message }, { status: 500 });
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
