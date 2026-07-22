import { db } from "@/db";
import { categories, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = await db.select().from(categories).where(eq(categories.slug, slug));
  if (cat.length === 0) notFound();

  const allItems = await db.select().from(items).where(eq(items.categoryId, cat[0].id)).orderBy(items.sortOrder);

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
        <Link href={`/collections/${cat[0].collectionId}`} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 mb-6"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{cat[0].name}</h1>
        {cat[0].description && <p className="text-slate-600 mb-8">{cat[0].description}</p>}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allItems.map((item) => (
            <Link key={item.id} href={`/product/${item.slug}`} className="group">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-slate-100">
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-slate-200" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-slate-900">£{item.price}</span>
                    {item.compareAtPrice && <span className="text-sm text-slate-400 line-through">£{item.compareAtPrice}</span>}
                  </div>
                  {item.gender && <span className="text-xs text-slate-500 mt-1 block">{item.gender}</span>}
                  {item.ageGroup && <span className="text-xs text-slate-500">{item.ageGroup}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
