import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, items, itemVariants, settings } from "@/db/schema";
import { eq, desc, like } from "drizzle-orm";
import { generateOrderNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");

    if (id) {
      const order = await db.select().from(orders).where(eq(orders.id, parseInt(id)));
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, parseInt(id)));
      return NextResponse.json({ ...order[0], items });
    }

    if (email) {
      const data = await db.select().from(orders).where(eq(orders.customerEmail, email)).orderBy(desc(orders.createdAt));
      const withItems = await Promise.all(data.map(async (o) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
        return { ...o, items };
      }));
      return NextResponse.json(withItems);
    }

    const data = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items: cartItems, ...orderData } = body;

    const orderNumber = generateOrderNumber();
    const result = await db.insert(orders).values({ ...orderData, orderNumber }).returning();
    const orderId = result[0].id;

    for (const cartItem of cartItems) {
      await db.insert(orderItems).values({
        orderId,
        itemId: cartItem.itemId,
        variantId: cartItem.variantId,
        itemName: cartItem.name,
        variantName: cartItem.variantName,
        quantity: cartItem.quantity,
        price: cartItem.price,
        imageUrl: cartItem.imageUrl,
        total: (parseFloat(cartItem.price) * cartItem.quantity).toFixed(2),
      });
    }

    // Send WhatsApp
    try {
      const whatsappSetting = await db.select().from(settings).where(eq(settings.key, "whatsapp_number"));
      const whatsappNumber = whatsappSetting[0]?.value;

      if (whatsappNumber) {
        const message = encodeURIComponent(
          `*New Order: ${orderNumber}*\n\n` +
          `*Customer:* ${orderData.customerName}\n` +
          `*Phone:* ${orderData.customerPhone}\n` +
          `*Address:* ${orderData.address}\n` +
          `*Total:* £${orderData.totalAmount}\n\n` +
          `*Items:*\n` +
          cartItems.map((i: any) => `- ${i.name} ${i.variantName ? `(${i.variantName})` : ""} x${i.quantity} = £${(parseFloat(i.price) * i.quantity).toFixed(2)}`).join("\n")
        );

        await fetch(`https://api.callmebot.com/whatsapp.php?phone=${whatsappNumber}&text=${message}&apikey=0`, { method: "GET" }).catch(() => {});
      }
    } catch (e) {}

    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const result = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
