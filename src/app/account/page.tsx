"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const u = localStorage.getItem("kerala_user");
    if (u) {
      const parsed = JSON.parse(u);
      setUser(parsed);
      fetch(`/api/orders?email=${encodeURIComponent(parsed.email)}`)
        .then((r) => r.json())
        .then((data) => setOrders(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, []);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-stone-900">My Account</h1>
        <p className="text-stone-500">Please login to view your orders.</p>
        <Link href="/login" className="inline-block bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold">Login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h1 className="text-2xl font-bold text-stone-900">Welcome, {user.name || user.email}</h1>
          <p className="text-sm text-stone-500">{user.email}</p>
        </div>
        <h2 className="text-lg font-bold text-stone-900">Order History ({orders.length})</h2>
        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-500">
            <p>No orders yet.</p>
            <Link href="/" className="text-emerald-700 font-semibold text-sm mt-2 inline-block">Start Shopping</Link>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-stone-900">Order #{order.orderNumber}</p>
                  <p className="text-xs text-stone-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === "delivered" ? "bg-emerald-100 text-emerald-800" : order.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{order.status}</span>
              </div>
              <p className="text-sm text-stone-700">Total: <span className="font-bold">£{(parseFloat(order.totalAmount) || 0).toFixed(2)}</span></p>
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl">
                  {item.imageUrl && <img src={item.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg" />}
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-stone-900">{item.itemName}</p>
                    <p className="text-xs text-stone-500">{item.variantName} x{item.quantity} - £{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
