"use client";

import { useEffect, useState } from "react";
import { Eye, CheckCircle, XCircle, Clock, MessageSquare, Truck, PackageCheck, Phone } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSettings, setPageSettings] = useState({ title: "", subtitle: "", desc: "" });

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const [res, setRes] = await Promise.all([fetch("/api/orders"), fetch("/api/settings")]);
      const data = await res.json();
      const setData = await setRes.json();
      
      if (Array.isArray(data)) setOrders(data);
      if (Array.isArray(setData)) {
        const map: Record<string, string> = {};
        setData.forEach((s: any) => { map[s.key] = s.value; });
        setPageSettings({
          title: map.admin_orders_title || "Customer Orders",
          subtitle: map.admin_orders_subtitle || "STORE OPERATIONS",
          desc: map.admin_orders_desc || "വന്ന ഓർഡറുകൾ പരിശോധിക്കാനും 1-ക്ലിക്കിൽ വാട്‌സാപ്പിലേക്ക് രസീതും ഓർഡർ അപ്‌ഡേറ്റും അയക്കാനും സാധിക്കും."
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function updateStatus(id: number, status: string) {
    await fetch("/api/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    fetchOrders();
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder({ ...selectedOrder, status });
    }
  }

  async function viewOrder(id: number) {
    const res = await fetch(`/api/orders?id=${id}`);
    const data = await res.json();
    setSelectedOrder(data);
  }

  function sendWhatsAppNotification(o: any, customMsg?: string) {
    if (!o.customerPhone) {
      alert("No customer phone number available for this order.");
      return;
    }
    const cleanPhone = o.customerPhone.replace(/[^0-9+]/g, "");
    const formattedPhone = cleanPhone.startsWith("+") ? cleanPhone.slice(1) : cleanPhone.startsWith("0") ? "44" + cleanPhone.slice(1) : cleanPhone;

    const message = customMsg || `Hello ${o.customerName || "Customer"}, your order #${o.orderNumber} at Kerala Super Store (Total: £${parseFloat(o.totalAmount).toFixed(2)}) is currently ${o.status.toUpperCase()}. Thank you for shopping with us! 🛒✨`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-300",
    confirmed: "bg-blue-100 text-blue-800 border-blue-300",
    shipped: "bg-purple-100 text-purple-800 border-purple-300",
    delivered: "bg-emerald-100 text-emerald-800 border-emerald-300",
    cancelled: "bg-rose-100 text-rose-800 border-rose-300",
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerPhone?.toLowerCase().includes(q)
    );
  });

  const totalRevenue = orders.reduce((acc, o) => acc + (parseFloat(o.totalAmount) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold mb-1">
            <PackageCheck className="w-4 h-4 text-emerald-700" /> {pageSettings.subtitle}
          </div>
          <h1 className="admin-page-title font-display text-2xl md:text-3xl font-bold text-stone-900">
            {pageSettings.title} ({orders.length})
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            {pageSettings.desc}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-200">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-emerald-800 font-bold">Total Revenue</div>
            <div className="text-xl font-bold text-emerald-950 font-display">£{totalRevenue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between gap-4">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Order #, Customer Name, or Phone..."
          className="w-full md:w-96 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white font-medium"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase font-mono tracking-wider text-stone-500">
              <th className="p-4">Order #</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-150">
            {filteredOrders.map((o) => (
              <tr key={o.id} className="hover:bg-stone-50/70 transition">
                <td className="p-4 font-bold text-stone-900">{o.orderNumber}</td>
                <td className="p-4 font-semibold text-stone-800">{o.customerName || "Guest"}</td>
                <td className="p-4 text-stone-600 font-mono">{o.customerPhone || "-"}</td>
                <td className="p-4 font-bold text-stone-900 text-sm">£{parseFloat(o.totalAmount || 0).toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${statusColors[o.status] || "bg-stone-100 text-stone-700"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="p-4 text-stone-500">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "-"}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => sendWhatsAppNotification(o)}
                      title="Send WhatsApp Update to Customer"
                      className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-xl transition border border-emerald-200 bg-emerald-50/50"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => viewOrder(o.id)}
                      title="View Full Order Details"
                      className="p-2 text-blue-700 hover:bg-blue-50 rounded-xl transition border border-blue-200 bg-blue-50/50"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-stone-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-150 pb-4">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Order #{selectedOrder.orderNumber}</h2>
                <div className="text-xs text-stone-500 font-mono">Date: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : "-"}</div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-stone-400 hover:text-stone-600 rounded-xl">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400 font-bold">Customer Name</span>
                  <div className="font-bold text-stone-900 text-sm">{selectedOrder.customerName}</div>
                </div>
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400 font-bold">Phone Number</span>
                  <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" /> {selectedOrder.customerPhone || "-"}
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
                <span className="text-[10px] font-mono uppercase text-stone-400 font-bold">Delivery Address</span>
                <div className="font-semibold text-stone-900">{selectedOrder.address}</div>
                <div className="text-stone-600">{selectedOrder.city} {selectedOrder.postcode}</div>
              </div>

              {/* Status Manager Controls */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-2">
                <span className="text-[10px] font-mono uppercase text-amber-900 font-bold">Update Order Status:</span>
                <div className="flex flex-wrap gap-2">
                  {["pending", "confirmed", "shipped", "delivered", "cancelled"].map((st) => (
                    <button
                      key={st}
                      onClick={() => updateStatus(selectedOrder.id, st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                        selectedOrder.status === st
                          ? "bg-[#0b2416] text-white shadow-xs"
                          : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp Receipt Quick Actions */}
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div>
                  <div className="font-bold text-emerald-950 text-xs">💬 Send Customer WhatsApp Receipt</div>
                  <div className="text-[11px] text-emerald-800">Directly notify customer about order status or bill receipt.</div>
                </div>
                <button
                  onClick={() => sendWhatsAppNotification(selectedOrder)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" /> Open WhatsApp
                </button>
              </div>

              <div>
                <h3 className="font-bold text-stone-900 text-sm mb-2">Purchased Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-150">
                      <div>
                        <p className="font-bold text-stone-900">{item.itemName}</p>
                        {item.variantName && <p className="text-xs text-stone-500">{item.variantName}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-stone-500">Qty: {item.quantity}</p>
                        <p className="font-bold text-stone-900">£{parseFloat(item.total).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                <p className="text-stone-500">Payment: <span className="font-bold text-stone-900 uppercase">{selectedOrder.paymentMethod || "COD"}</span></p>
                <p className="text-xl font-bold text-stone-900 font-display">Total: £{parseFloat(selectedOrder.totalAmount || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
