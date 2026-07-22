"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, CheckCircle, ArrowLeft } from "lucide-react";

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", address: "", city: "", postcode: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    const res = await fetch("/api/cart");
    const data = await res.json();
    setCartItems(data);
  }

  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.item?.price || 0) * item.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setSubmitting(true);

    const cartData = cartItems.map((item) => ({
      itemId: item.itemId,
      variantId: item.variantId,
      name: item.item?.name,
      variantName: item.variant ? `${item.variant.color || ""} ${item.variant.size || ""}`.trim() : null,
      quantity: item.quantity,
      price: item.item?.price,
    }));

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        totalAmount: total.toFixed(2),
        paymentMethod: "cod",
        items: cartData,
      }),
    });

    const data = await res.json();
    if (data.orderNumber) {
      setOrderNumber(data.orderNumber);
      setOrderPlaced(true);
      // Clear cart
      for (const item of cartItems) {
        await fetch(`/api/cart?id=${item.id}`, { method: "DELETE" });
      }
    }
    setSubmitting(false);
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Placed!</h1>
          <p className="text-slate-600 mb-2">Your order number is <span className="font-bold">{orderNumber}</span></p>
          <p className="text-slate-500 mb-6">We will contact you soon for Cash on Delivery confirmation.</p>
          <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">Continue Shopping</Link>
        </div>
      </div>
    );
  }

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
        <Link href="/cart" className="flex items-center gap-1 text-slate-500 hover:text-slate-900 mb-6"><ArrowLeft className="w-4 h-4" /> Back to Cart</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-semibold text-slate-900 text-lg">Delivery Details</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <input required type="tel" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
              <textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Postcode</label>
                <input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Order Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={2} />
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="font-medium text-slate-900 mb-2">Payment Method</p>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-4 border-blue-600" />
                <span className="text-slate-700">Cash on Delivery</span>
              </div>
            </div>

            <button type="submit" disabled={submitting || cartItems.length === 0} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
              {submitting ? "Placing Order..." : `Place Order - £${total.toFixed(2)}`}
            </button>
          </form>

          <div>
            <h2 className="font-semibold text-slate-900 text-lg mb-4">Order Summary</h2>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden">
                      {item.item?.images?.[0] && <img src={item.item.images[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.item?.name}</p>
                      <p className="text-xs text-slate-500">x{item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium text-slate-900">£{(parseFloat(item.item?.price || 0) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-xl font-bold text-slate-900">£{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
