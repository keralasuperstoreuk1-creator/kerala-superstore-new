import { db } from "@/db";
import { collections, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const col = await db.select().from(collections).where(eq(collections.slug, slug));
  if (col.length === 0) notFound();

  const cats = await db.select().from(categories).where(eq(categories.collectionId, col[0].id)).orderBy(categories.sortOrder);

  return (
    <div className="min-h-screen">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold">SuperMarket</Link>
            <Link href="/cart" className="flex items-center gap-1 hover:text-blue-300"><ShoppingCart className="w-5 h-5" /></Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="flex items-center gap-1 text-slate-500 hover:text-slate-900 mb-6"><ArrowLeft className="w-4 h-4" /> Back to Home</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{col[0].name}</h1>
        {col[0].description && <p className="text-slate-600 mb-8">{col[0].description}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cats.map((cat) => (
            <Link key={cat.id} href={`/category/${cat.slug}`} className="group">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-slate-200" />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
