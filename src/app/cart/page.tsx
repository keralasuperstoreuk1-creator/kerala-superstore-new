"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from "lucide-react";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    const res = await fetch("/api/cart");
    const data = await res.json();
    console.log('Fetched cart data:', data);
    setCartItems(data);
    setLoading(false);
  }

  async function updateQuantity(id: number, qty: number) {
    if (qty < 1) return;
    await fetch("/api/cart", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, quantity: qty }) });
    fetchCart();
  }

  async function removeItem(id: number) {
    await fetch(`/api/cart?id=${id}`, { method: "DELETE" });
    fetchCart();
  }

  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.item?.price || 0) * item.quantity, 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold">SuperMarket</Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3"><ShoppingCart className="w-8 h-8" /> Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Your cart is empty</p>
            <Link href="/" className="inline-block mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">Continue Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((cartItem) => (
              <div key={cartItem.id} className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4">
                <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    {cartItem.item?.images?.[0] ? (
                      <img src={cartItem.item.images[0]} alt={cartItem.item?.name} className="w-full h-full object-cover" />
                    ) : (
                      <img src="https://via.placeholder.com/150" alt="Placeholder" className="w-full h-full object-cover" />
                    )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <Link href={`/product/${cartItem.item?.slug}`} className="font-semibold text-slate-900 hover:text-blue-600 truncate block">{cartItem.item?.name}</Link>
                  {cartItem.variant && (
                    <p className="text-sm text-slate-500">{cartItem.variant.color} {cartItem.variant.size && `- ${cartItem.variant.size}`}</p>
                  )}
                  <p className="font-medium text-slate-900 mt-1">£{cartItem.item?.price}</p>
                  {cartItem.item?.description && (
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{cartItem.item?.description}</p>
                  )}
                </div>
                <div className="flex items-center border border-slate-300 rounded-lg">
                  <button onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)} className="px-3 py-2 hover:bg-slate-50"><Minus className="w-4 h-4" /></button>
                  <span className="px-3 py-2 min-w-[2rem] text-center">{cartItem.quantity}</span>
                  <button onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)} className="px-3 py-2 hover:bg-slate-50"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="text-right min-w-[5rem]">
                  <p className="font-bold text-slate-900">£{(parseFloat(cartItem.item?.price || 0) * cartItem.quantity).toFixed(2)}</p>
                </div>
                <button onClick={() => removeItem(cartItem.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))}

            <div className="bg-slate-50 rounded-xl p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg text-slate-700">Subtotal</span>
                <span className="text-2xl font-bold text-slate-900">£{total.toFixed(2)}</span>
              </div>
              <Link href="/checkout" className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                Proceed to Checkout <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
