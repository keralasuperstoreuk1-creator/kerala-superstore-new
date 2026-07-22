import { db } from "@/db";
import { items, itemVariants, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ShoppingCart, ArrowLeft, Share2 } from "lucide-react";
import { notFound } from "next/navigation";
import AddToCartButton from "./AddToCartButton";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await db.select().from(items).where(eq(items.slug, slug));
  if (item.length === 0) notFound();

  const variants = await db.select().from(itemVariants).where(eq(itemVariants.itemId, item[0].id));
  const cat = await db.select().from(categories).where(eq(categories.id, item[0].categoryId));

  const product = item[0];
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const whatsappShare = `https://wa.me/?text=Check%20out%20this%20product:%20${encodeURIComponent(product.name)}%20-%20£${product.price}`;

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
        <Link href={`/category/${cat[0]?.slug || ""}`} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 mb-6"><ArrowLeft className="w-4 h-4" /> Back to {cat[0]?.name || "Category"}</Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Images */}
          <div>
            <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden mb-4">
              {product.images?.[0] ? (
                <img id="main-image" src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200" />
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button key={i} className="w-20 h-20 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-bold text-slate-900">£{product.price}</span>
              {product.compareAtPrice && <span className="text-lg text-slate-400 line-through">£{product.compareAtPrice}</span>}
            </div>
            {product.sku && <p className="text-sm text-slate-500 mb-4">SKU: {product.sku}</p>}
            <p className="text-slate-600 mb-6">{product.description}</p>

            {product.gender && (
              <div className="mb-4">
                <span className="text-sm font-medium text-slate-700">Gender: </span>
                <span className="text-sm text-slate-600">{product.gender}</span>
              </div>
            )}
            {product.ageGroup && (
              <div className="mb-4">
                <span className="text-sm font-medium text-slate-700">Age Group: </span>
                <span className="text-sm text-slate-600">{product.ageGroup}</span>
              </div>
            )}

            <AddToCartButton product={product} variants={variants} />

            <div className="mt-6 pt-6 border-t border-slate-200">
              <a href={whatsappShare} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium">
                <Share2 className="w-4 h-4" /> Share on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
