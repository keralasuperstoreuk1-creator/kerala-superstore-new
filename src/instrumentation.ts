import { autoSeedIfEmpty } from "./lib/seed";

export async function register() {
  // Runs once when the Next.js server starts.
  // If the database is empty (e.g. fresh sandbox), seed it with demo data
  // so the storefront and admin always open alive.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await autoSeedIfEmpty();
  }
}
