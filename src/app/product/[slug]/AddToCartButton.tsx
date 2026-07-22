"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";

export default function AddToCartButton({ product, variants }: { product: any; variants: any[] }) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];

  async function addToCart() {
    const payload: any = {
      itemId: product.id,
      quantity,
    };
    if (selectedVariant) {
      payload.variantId = selectedVariant.id;
    }

    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const currentPrice = selectedVariant?.price || product.price;

  return (
    <div className="space-y-4">
      {colors.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {colors.map((color) => {
              const variant = variants.find((v) => v.color === color);
              const isSelected = selectedVariant?.color === color;
              return (
                <button
                  key={color}
                  onClick={() => setSelectedVariant(variant)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${isSelected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 hover:border-slate-400"}`}
                >
                  {variant?.colorCode && <span className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: variant.colorCode }} />}
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Size</label>
          <div className="flex gap-2 flex-wrap">
            {sizes.map((size) => {
              const variant = variants.find((v) => v.size === size && (!selectedVariant || v.color === selectedVariant.color));
              const isSelected = selectedVariant?.size === size;
              return (
                <button
                  key={size}
                  onClick={() => variant && setSelectedVariant(variant)}
                  disabled={!variant}
                  className={`px-3 py-2 rounded-lg border text-sm ${isSelected ? "border-blue-500 bg-blue-50 text-blue-700" : variant ? "border-slate-300 hover:border-slate-400" : "border-slate-200 text-slate-300 cursor-not-allowed"}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
          <div className="flex items-center border border-slate-300 rounded-lg">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-slate-50">-</button>
            <span className="px-3 py-2 min-w-[3rem] text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 hover:bg-slate-50">+</button>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-slate-900">£{(parseFloat(currentPrice) * quantity).toFixed(2)}</p>
        </div>
      </div>

      <button
        onClick={addToCart}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors ${added ? "bg-emerald-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}
      >
        {added ? <><Check className="w-5 h-5" /> Added to Cart</> : <><ShoppingCart className="w-5 h-5" /> Add to Cart</>}
      </button>
    </div>
  );
}
