import { db } from "@/db";
import { slides, offers, dresses, categories, items, itemVariants, winners, settings, collections, promoBanners } from "@/db/schema";
import { eq } from "drizzle-orm";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [allSlides, allOffers, allDresses, allCategories, allItems, allVariants, allWinners, allSettings, allCollections, allPromoBanners] = await Promise.all([
    db.select().from(slides).where(eq(slides.isActive, true)).orderBy(slides.sortOrder),
    db.select().from(offers).where(eq(offers.isActive, true)).orderBy(offers.sortOrder),
    db.select().from(dresses).where(eq(dresses.isActive, true)).orderBy(dresses.sortOrder),
    db.select().from(categories).orderBy(categories.sortOrder),
    db.select().from(items).where(eq(items.isActive, true)).orderBy(items.sortOrder),
    db.select().from(itemVariants),
    db.select().from(winners).where(eq(winners.isActive, true)).orderBy(winners.sortOrder),
    db.select().from(settings),
    db.select().from(collections).where(eq(collections.isActive, true)).orderBy(collections.sortOrder),
    db.select().from(promoBanners).where(eq(promoBanners.isActive, true)).orderBy(promoBanners.sortOrder),
  ]);

  const settingsMap: Record<string, string> = {};
  allSettings.forEach((s) => { settingsMap[s.key] = s.value || ""; });

  const variantsByItem: Record<number, any[]> = {};
  allVariants.forEach((v) => {
    if (!variantsByItem[v.itemId]) variantsByItem[v.itemId] = [];
    variantsByItem[v.itemId].push(v);
  });

  const itemsWithVariants = allItems.map((item) => ({
    ...item,
    variants: variantsByItem[item.id] || [],
  }));

  return (
    <HomeClient
      data={{
        slides: allSlides,
        offers: allOffers,
        dresses: allDresses,
        categories: allCategories,
        items: itemsWithVariants,
        winners: allWinners,
        settings: settingsMap,
        collections: allCollections,
        promoBanners: allPromoBanners,
      }}
    />
  );
}
