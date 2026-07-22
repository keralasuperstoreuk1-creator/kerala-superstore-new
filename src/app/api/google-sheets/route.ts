import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@/db";
import { items, orders, orderItems, collections, categories } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, spreadsheetId, sheetName } = body;

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID required" }, { status: 400 });
    }

    const sheets = await getSheetsClient();

    if (action === "export_products") {
      const allItems = await db.select().from(items);
      const allCollections = await db.select().from(collections);
      const allCategories = await db.select().from(categories);

      const rows = [
        ["ID", "Name", "Category", "Collection", "Price", "Stock", "Gender", "Age Group", "SKU", "Active"],
        ...allItems.map((item) => {
          const cat = allCategories.find((c) => c.id === item.categoryId);
          const col = allCollections.find((c) => c.id === cat?.collectionId);
          return [
            item.id,
            item.name,
            cat?.name || "",
            col?.name || "",
            item.price,
            item.stock,
            item.gender || "",
            item.ageGroup || "",
            item.sku || "",
            item.isActive ? "Yes" : "No",
          ];
        }),
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName || "Products"}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });

      return NextResponse.json({ success: true, count: allItems.length });
    }

    if (action === "export_orders") {
      const allOrders = await db.select().from(orders);
      const allOrderItems = await db.select().from(orderItems);

      const rows = [
        ["Order #", "Customer", "Phone", "Address", "Total", "Status", "Payment", "Date", "Items"],
        ...allOrders.map((order) => {
          const items = allOrderItems.filter((oi) => oi.orderId === order.id);
          return [
            order.orderNumber,
            order.customerName,
            order.customerPhone,
            order.address,
            order.totalAmount,
            order.status,
            order.paymentMethod,
            order.createdAt?.toISOString() || "",
            items.map((i) => `${i.itemName} x${i.quantity}`).join(", "),
          ];
        }),
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName || "Orders"}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });

      return NextResponse.json({ success: true, count: allOrders.length });
    }

    if (action === "import_products") {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName || "Products"}!A:J`,
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return NextResponse.json({ success: true, count: 0 });

      const imported = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[1]) continue;

        const existing = await db.select().from(items).where(eq(items.id, parseInt(row[0]) || 0));
        const data = {
          name: row[1],
          price: row[4] || "0",
          stock: parseInt(row[5]) || 0,
          gender: row[6] || null,
          ageGroup: row[7] || null,
          sku: row[8] || null,
          isActive: row[9] === "Yes",
        };

        if (existing.length > 0) {
          await db.update(items).set(data).where(eq(items.id, existing[0].id));
          imported.push({ id: existing[0].id, action: "updated" });
        }
      }

      return NextResponse.json({ success: true, imported });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Google Sheets error:", error);
    return NextResponse.json({ error: error.message || "Sync failed" }, { status: 500 });
  }
}
