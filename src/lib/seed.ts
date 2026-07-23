import { db } from "@/db";
import {
  collections, categories, items, offers, dresses, slides, winners, settings,
} from "@/db/schema";

async function count(table: any) {
  try {
    const rows = await db.select().from(table);
    return rows.length;
  } catch {
    return 0;
  }
}

async function seed() {
  // Settings
  const settingsData = [
    { key: "store_name", value: "Kerala Super Store" },
    { key: "whatsapp_number", value: "447749132122" },
    { key: "store_address", value: "Old Market Street, M9 8DX, Manchester" },
    { key: "currency", value: "GBP" },
    { key: "admin_password", value: "admin123" },
  ];
  for (const s of settingsData) {
    await db.insert(settings).values(s).onConflictDoNothing();
  }

  // Collection — use ON CONFLICT DO NOTHING, then fetch existing
  await db.insert(collections).values({
    name: "Groceries", slug: "groceries",
    description: "Authentic South Indian pantry staples",
    sortOrder: 0, isActive: true,
  }).onConflictDoNothing();

  const allCols = await db.select().from(collections);
  const col = allCols.find((c: any) => c.slug === "groceries") || allCols[0];
  if (!col) throw new Error("Could not find or create Groceries collection");

  // Categories — use ON CONFLICT DO NOTHING, then fetch existing
  const catData = [
    ["Rice & Grains", "rice-grains"],
    ["Spices", "spices"],
    ["Snacks", "snacks"],
    ["Beverages", "beverages"],
    ["Dairy", "dairy"],
    ["Frozen", "frozen"],
  ];
  const catMap: Record<string, number> = {};
  for (const [name, slug] of catData) {
    await db.insert(categories).values({
      name, slug, collectionId: col.id, sortOrder: 0, isActive: true,
    }).onConflictDoNothing();
  }
  const allCats = await db.select().from(categories);
  for (const cat of allCats) {
    catMap[cat.slug] = cat.id;
  }

  // Products — skip if slug already exists
  const products: Array<[string, string, string, string, string, string | null, number]> = [
    ["Basmati Rice 5kg", "basmati-rice-5kg", "8.99", "rice-grains", "Premium long-grain basmati, aged 12 months.", "12.99", 30],
    ["Kerala Red Rice 2kg", "kerala-red-rice-2kg", "6.50", "rice-grains", "Traditional matta rice, hand-pounded.", null, 25],
    ["Sona Masoori 5kg", "sona-masoori-5kg", "7.99", "rice-grains", "Lightweight aromatic rice for daily meals.", "9.99", 40],
    ["Cardamom 100g", "cardamom-100g", "4.50", "spices", "Whole green cardamom from Idukki hills.", null, 50],
    ["Black Pepper 200g", "black-pepper-200g", "3.99", "spices", "Tellicherry garbled black pepper.", "5.50", 45],
    ["Turmeric Powder 250g", "turmeric-powder-250g", "2.50", "spices", "Stone-ground, high-curcumin turmeric.", null, 60],
    ["Garam Masala 100g", "garam-masala-100g", "2.99", "spices", "House-blend Kerala garam masala.", null, 55],
    ["Banana Chips 200g", "banana-chips-200g", "3.50", "snacks", "Crisp nendran chips in coconut oil.", "4.50", 80],
    ["Jackfruit Chips 150g", "jackfruit-chips-150g", "4.25", "snacks", "Thin-sliced raw jackfruit chips.", null, 40],
    ["Kerala Mixture 250g", "kerala-mixture-250g", "3.99", "snacks", "Classic savoury mixture with peanuts.", null, 70],
    ["Murukku 200g", "murukku-200g", "3.50", "snacks", "Hand-pressed rice flour murukku.", null, 45],
    ["Filter Coffee Powder 200g", "filter-coffee-200g", "4.99", "beverages", "80/20 coffee-chicory blend.", null, 50],
    ["Masala Chai 100g", "masala-chai-100g", "3.50", "beverages", "Traditional spiced tea mix.", "4.99", 60],
    ["Coconut Oil 1L", "coconut-oil-1l", "5.99", "dairy", "Cold-pressed virgin coconut oil.", "7.50", 35],
    ["Pure Ghee 500g", "pure-ghee-500g", "7.50", "dairy", "A2 cow ghee, traditionally churned.", null, 25],
    ["Frozen Paratha 10pc", "frozen-paratha-10pc", "4.50", "frozen", "Ready-to-cook whole wheat paratha.", "5.99", 40],
    ["Frozen Kerala Fish Curry", "frozen-fish-curry", "6.99", "frozen", "Meen curry in coconut gravy.", null, 20],
  ];
  for (const [name, slug, price, cat, desc, compare, stock] of products) {
    if (!catMap[cat]) continue; // skip if category not found
    await db.insert(items).values({
      name, slug, price, categoryId: catMap[cat],
      description: desc, compareAtPrice: compare, stock, sortOrder: 0, isActive: true,
    }).onConflictDoNothing();
  }

  // Offers — no unique constraint, only insert if table is empty
  const existingOffers = await db.select().from(offers);
  if (existingOffers.length === 0) {
    const offersData = [
      ["Basmati Rice 5kg", "🍚", "LIMITED TIME", "12.99", "8.99", "-30%"],
      ["Banana Chips Combo", "🍘", "MEGA DEAL", "9.96", "5.99", "-40%"],
      ["Spice Combo Pack", "🌶️", "BEST VALUE", "15.99", "11.99", "-25%"],
      ["Masala Chai Bundle", "☕", "HOT DEAL", "11.97", "7.99", "-35%"],
      ["Coconut Oil 2L", "🥥", "FRESH", "9.98", "7.99", "-20%"],
    ];
    for (const [name, emoji, tag, oldP, newP, disc] of offersData) {
      await db.insert(offers).values({
        name, emoji, tag, oldPrice: oldP, newPrice: newP, discount: disc, sortOrder: 0, isActive: true,
      });
    }
  }

  // Slides — only insert if table is empty
  const existingSlides = await db.select().from(slides);
  if (existingSlides.length === 0) {
    const slidesData = [
      ["Up to 40% OFF on Groceries", "Fresh vegetables, fruits, spices & more at unbeatable prices.", "Shop the shelves", "#products"],
      ["Onam Collection is Here", "Traditional Kerala dresses, hampers & festive essentials.", "Shop Onam", "#onam"],
      ["Free Delivery over £30", "Cash on delivery available across the UK.", "Order Now", "#products"],
      ["Fresh Kerala Spices & Snacks", "Authentic cardamom, pepper, banana chips — taste of home.", "Explore", "#products"],
    ];
    for (const [title, sub, btn, link] of slidesData) {
      await db.insert(slides).values({
        title, subtitle: sub, image: "", buttonText: btn, link, sortOrder: 0, isActive: true, width: 1920, height: 1080,
      });
    }
  }

  // Dresses — only insert if table is empty
  const existingDresses = await db.select().from(dresses);
  if (existingDresses.length === 0) {
    const dressesData: Array<[string, string, string, string | null, string[], string]> = [
      ["Kerala Kasavu Saree", "ladies", "89.00", "120.00", ["S","M","L","XL"], "Handloom Kasavu saree with golden zari border."],
      ["Ladies Half Saree (Settu)", "ladies", "65.00", "85.00", ["S","M","L"], "Traditional half-saree for Onam."],
      ["Gents Mundu & Shirt Set", "gents", "49.00", null, ["M","L","XL","2XL"], "Kasavu mundu paired with cotton shirt."],
      ["Boys Mundu Set", "kids", "35.00", null, ["3-5","6-8","9-12"], "Mini mundu set for little gentlemen."],
      ["Girls Frock Combo (3pc)", "kids", "45.00", "60.00", ["2-4","5-7","8-10"], "Three-piece frock combo in festive colors."],
      ["Family Onam Combo Pack", "combo", "180.00", "240.00", ["Assorted"], "Complete family dress set — 4 members."],
    ];
    for (const [name, type, price, compare, sizes, desc] of dressesData) {
      await db.insert(dresses).values({
        name, type, price, compareAtPrice: compare, sizes, colors: ["Gold","White"],
        description: desc, stock: 15, sortOrder: 0, isActive: true,
      });
    }
  }

  // Winners — only insert if table is empty
  const existingWinners = await db.select().from(winners);
  if (existingWinners.length === 0) {
    const winnersData = [
      ["Rajesh Kumar", "Won: £100 Voucher", "Onam 2025", "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh"],
      ["Priya Menon", "Won: Free Groceries", "Onam 2025", "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya"],
      ["Suresh Nair", "Won: Gold Coin", "Christmas 2025", "https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh"],
      ["Lakshmi Pillai", "Won: £50 Voucher", "New Year 2026", "https://api.dicebear.com/7.x/avataaars/svg?seed=Lakshmi"],
      ["Mohan Das", "Won: Free Delivery 1 Yr", "Onam 2024", "https://api.dicebear.com/7.x/avataaars/svg?seed=Mohan"],
      ["Anitha Varma", "Won: Kerala Saree", "Vishu 2025", "https://api.dicebear.com/7.x/avataaars/svg?seed=Anitha"],
    ];
    for (const [name, prize, event, photo] of winnersData) {
      await db.insert(winners).values({ name, prize, event, photo, sortOrder: 0, isActive: true });
    }
  }
}

export async function autoSeedIfEmpty() {
  try {
    const n = await count(items);
    if (n === 0) {
      console.log("[auto-seed] Empty database detected — seeding Kerala Super Store demo data…");
      await seed();
      console.log("[auto-seed] Done.");
    }
  } catch (err) {
    console.error("[auto-seed] Failed:", err);
  }
}
