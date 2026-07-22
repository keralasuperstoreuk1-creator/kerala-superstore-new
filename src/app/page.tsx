import { db } from "@/db";
import { slides, offers, dresses, categories, items, winners, settings, collections } from "@/db/schema";
import { eq } from "drizzle-orm";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [allSlides, allOffers, allDresses, allCategories, allItems, allWinners, allSettings, allCollections] = await Promise.all([
    db.select().from(slides).where(eq(slides.isActive, true)).orderBy(slides.sortOrder),
    db.select().from(offers).where(eq(offers.isActive, true)).orderBy(offers.sortOrder),
    db.select().from(dresses).where(eq(dresses.isActive, true)).orderBy(dresses.sortOrder),
    db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder),
    db.select().from(items).where(eq(items.isActive, true)).orderBy(items.sortOrder),
    db.select().from(winners).where(eq(winners.isActive, true)).orderBy(winners.sortOrder),
    db.select().from(settings),
    db.select().from(collections).where(eq(collections.isActive, true)).orderBy(collections.sortOrder),
  ]);

  const settingsMap: Record<string, string> = {};
  allSettings.forEach((s) => { settingsMap[s.key] = s.value || ""; });

  return (
    <HomeClient
      data={{
        slides: allSlides,
        offers: allOffers,
        dresses: allDresses,
        categories: allCategories,
        items: allItems,
        winners: allWinners,
        settings: settingsMap,
        collections: allCollections,
      }}
    />
  );
}
