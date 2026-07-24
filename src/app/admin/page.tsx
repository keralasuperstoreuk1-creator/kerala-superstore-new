"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers, FolderOpen, Package, ImageIcon, ShoppingBag,
  Tag, Shirt, Trophy, ArrowUpRight, Plus, TrendingUp, Sparkles, Store, ExternalLink
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    collections: 0, categories: 0, items: 0, slides: 0,
    orders: 0, revenue: 0, offers: 0, dresses: 0, winners: 0,
  });
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    try {
      const [collections, categories, items, slides, orders, offers, dresses, winners] = await Promise.all([
        fetch("/api/collections").then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
        fetch("/api/items").then((r) => r.json()),
        fetch("/api/slides").then((r) => r.json()),
        fetch("/api/orders").then((r) => r.json()),
        fetch("/api/offers").then((r) => r.json()),
        fetch("/api/dresses").then((r) => r.json()),
        fetch("/api/winners").then((r) => r.json()),
      ]);
      const revenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
      setAllOrders(orders);
      setStats({
        collections: collections.length || 0, categories: categories.length || 0,
        items: items.length || 0, slides: slides.length || 0, orders: orders.length || 0,
        revenue, offers: offers.length || 0, dresses: dresses.length || 0, winners: winners.length || 0,
      });
    } catch (e) {}
    setLoading(false);
  }

  const primaryActions = [
    {
      title: "📱 Admin App (Mobile)",
      malayalam: "അഡ്മിൻ ആപ്പ്",
      desc: "Order notifications, confirm/deliver, reports",
      href: "/admin-app",
      icon: ShoppingBag,
      btnText: "Open Admin App",
      bgTone: "bg-emerald-900 text-white hover:bg-emerald-800",
    },
    {
      title: "👥 Admin App Users",
      malayalam: "അഡ്മിൻ ഉപയോക്താക്കൾ",
      desc: "Create/manage login credentials for staff",
      href: "/admin/admin-users",
      icon: ShoppingBag,
      btnText: "Manage Users",
      bgTone: "bg-blue-800 text-white hover:bg-blue-700",
    },
    {
      title: "Add Grocery Product",
      malayalam: "പുതിയ സാധനം ചേർക്കുക",
      desc: "Rice, Spices, Oils & Grocery Items",
      href: "/admin/items",
      icon: Package,
      btnText: "+ Add Product",
      bgTone: "bg-emerald-900 text-white hover:bg-emerald-800",
    },
    {
      title: "Add Onam Dress Outfit",
      malayalam: "ഓണം ഡ്രസ്സ് ചേർക്കുക",
      desc: "Kasavu Sarees, Mundu & Kids Sets",
      href: "/admin/dresses",
      icon: Shirt,
      btnText: "+ Add Dress",
      bgTone: "bg-amber-500 text-stone-950 hover:bg-amber-400 font-bold",
    },
    {
      title: "Create Offer / Special Deal",
      malayalam: "പുതിയ ഓഫർ നൽകുക",
      desc: "Daily Deals & Offer Banners",
      href: "/admin/offers",
      icon: Tag,
      btnText: "+ Create Offer",
      bgTone: "bg-rose-700 text-white hover:bg-rose-600",
    },
    {
      title: "View Customer Orders",
      malayalam: "കസ്റ്റമർ ഓർഡറുകൾ",
      desc: "Review Orders & WhatsApp Messages",
      href: "/admin/orders",
      icon: ShoppingBag,
      btnText: "View Orders",
      bgTone: "bg-blue-800 text-white hover:bg-blue-700",
    },
  ];

  const tiles = [
    { label: "Products (സാധനങ്ങൾ)", value: stats.items, icon: Package, color: "text-emerald-700 bg-emerald-100 border-emerald-200", link: "/admin/items" },
    { label: "Onam Dresses (ഡ്രസ്സുകൾ)", value: stats.dresses, icon: Shirt, color: "text-amber-800 bg-amber-100 border-amber-200", link: "/admin/dresses" },
    { label: "Today's Offers (ഓഫറുകൾ)", value: stats.offers, icon: Tag, color: "text-rose-700 bg-rose-100 border-rose-200", link: "/admin/offers" },
    { label: "Categories (വിഭാഗങ്ങൾ)", value: stats.categories, icon: FolderOpen, color: "text-blue-700 bg-blue-100 border-blue-200", link: "/admin/categories" },
    { label: "Collections (കളക്ഷനുകൾ)", value: stats.collections, icon: Layers, color: "text-purple-700 bg-purple-100 border-purple-200", link: "/admin/collections" },
    { label: "Hero Slides (ചിത്രങ്ങൾ)", value: stats.slides, icon: ImageIcon, color: "text-teal-700 bg-teal-100 border-teal-200", link: "/admin/slides" },
    { label: "Lucky Winners (വിജയികൾ)", value: stats.winners, icon: Trophy, color: "text-amber-700 bg-amber-50 border-amber-200", link: "/admin/winners" },
    { label: "Total Orders (ഓർഡറുകൾ)", value: stats.orders, icon: ShoppingBag, color: "text-emerald-900 bg-emerald-50 border-emerald-300 font-bold", link: "/admin/orders" },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" /> Store Control Center
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-stone-900">
            Welcome to <span className="text-emerald-800">Kerala Super Store</span> Admin
          </h1>
          <p className="text-stone-600 text-sm mt-1 max-w-xl">
            എല്ലാ സാധനങ്ങളും, ഡ്രസ്സുകളും, ഓഫറുകളും, ഓർഡറുകളും ഇവിടെ നിന്നു എളുപ്പത്തിൽ നിയന്ത്രിക്കാം.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-2 bg-[#0b2416] hover:bg-emerald-950 text-white px-6 py-3 rounded-2xl text-xs font-bold transition shadow-md"
        >
          <Store className="w-4 h-4" /> Open Storefront Website ↗
        </Link>
      </div>

      {/* Primary 1-Click Quick Actions */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-900 text-lg flex items-center gap-2">
            ⚡ Quick Shortcuts (വേഗത്തിലുള്ള നിയന്ത്രണം)
          </h2>
          <span className="text-xs text-stone-500 font-mono">1-Click Actions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {primaryActions.map((action) => (
            <div
              key={action.title}
              className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-800 group-hover:scale-110 transition">
                  <action.icon className="w-5 h-5 text-emerald-800" />
                </div>
                <h3 className="font-bold text-stone-900 text-base pt-2">{action.title}</h3>
                <p className="text-xs text-emerald-700 font-medium">{action.malayalam}</p>
                <p className="text-xs text-stone-500">{action.desc}</p>
              </div>

              <Link
                href={action.href}
                className={`w-full py-2.5 rounded-xl text-xs text-center font-bold transition flex items-center justify-center gap-1 shadow-xs ${action.bgTone}`}
              >
                {action.btnText}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Revenue Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2416] via-[#0e301d] to-[#14472c] p-8 md:p-10 text-white shadow-xl">
        <div className="relative grid md:grid-cols-3 gap-8 items-end">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-mono uppercase tracking-widest mb-3">
              <TrendingUp className="w-4 h-4 text-amber-400" /> Total Sales & Revenue Overview
            </div>
            <div className="font-display text-5xl md:text-6xl font-extrabold tracking-tight leading-none text-white">
              £{stats.revenue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-3 text-emerald-200/90 text-xs font-medium">
              Total {stats.orders} {stats.orders === 1 ? "Order" : "Orders"} Received • Cash on Delivery & Online
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="text-[10px] uppercase tracking-widest text-amber-300 font-mono font-bold">Total Orders</div>
              <div className="font-display text-3xl font-bold mt-1 text-white">{stats.orders}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="text-[10px] uppercase tracking-widest text-amber-300 font-mono font-bold">Avg. Order Value</div>
              <div className="font-display text-3xl font-bold mt-1 text-white">
                £{stats.orders ? (stats.revenue / stats.orders).toFixed(2) : "0.00"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monthly Sales Report */}
      {!loading && allOrders.length > 0 && (
        <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="font-bold text-stone-900 text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-700" /> Monthly Sales Report
          </h2>
          {(() => {
            const months: Record<string, { orders: number; revenue: number }> = {};
            allOrders.forEach((o: any) => {
              if (!o.createdAt) return;
              const m = new Date(o.createdAt).toLocaleString("en-GB", { month: "short", year: "numeric" });
              if (!months[m]) months[m] = { orders: 0, revenue: 0 };
              months[m].orders++;
              months[m].revenue += parseFloat(o.totalAmount || 0);
            });
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-stone-500 text-xs uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Month</th>
                      <th className="pb-3 font-semibold">Orders</th>
                      <th className="pb-3 font-semibold">Revenue</th>
                      <th className="pb-3 font-semibold">Avg Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(months).reverse().map(([month, data]) => (
                      <tr key={month} className="border-b border-stone-100">
                        <td className="py-3 font-medium text-stone-900">{month}</td>
                        <td className="py-3">{data.orders}</td>
                        <td className="py-3 font-semibold text-emerald-700">£{data.revenue.toFixed(2)}</td>
                        <td className="py-3 text-stone-500">£{(data.revenue / data.orders).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </section>
      )}

      {/* Catalog Tiles */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-900 text-lg flex items-center gap-2">
            📊 Catalog Overview (വിഭാഗങ്ങൾ ഒരു നോട്ടത്തിൽ)
          </h2>
          <span className="text-xs text-stone-500">Click to view items</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tiles.map((t) => (
            <Link
              key={t.label}
              href={t.link}
              className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${t.color}`}>
                  <t.icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800 transition" />
              </div>

              <div className="mt-4 space-y-1">
                <div className="font-extrabold text-3xl text-stone-900 leading-none">
                  {loading ? "—" : t.value}
                </div>
                <div className="text-xs font-semibold text-stone-700">{t.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Help Guide */}
      <section className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 space-y-4">
        <h2 className="font-bold text-stone-900 text-lg flex items-center gap-2">
          ❓ How to Manage your Store (ഉപയോഗിക്കേണ്ട രീതി)
        </h2>
        <div className="grid md:grid-cols-4 gap-6 text-xs text-stone-600">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1.5">
            <span className="text-amber-700 font-bold font-mono">01. ADD PRODUCTS</span>
            <div className="font-bold text-stone-900 text-sm">ഉൽപ്പന്നങ്ങൾ ചേർക്കുക</div>
            <p>Products പേജിൽ പോയി പുതിയ റേഷൻ, ഗ്രോസറി സാധനങ്ങളോ ഓണം ഡ്രസ്സുകളോ ഫോട്ടോയോടും വിലയോടും കൂടി ആഡ് ചെയ്യാം.</p>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1.5">
            <span className="text-amber-700 font-bold font-mono">02. SET CATEGORIES</span>
            <div className="font-bold text-stone-900 text-sm">വിഭാഗങ്ങൾ ക്രമീകരിക്കുക</div>
            <p>Categories / Collections പേജിൽ പോയി ഓരോ കാറ്റഗറിക്കും Buy Now അല്ലെങ്കിൽ Pre-Order എന്ന് സെറ്റ് ചെയ്യാം.</p>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1.5">
            <span className="text-amber-700 font-bold font-mono">03. OFFERS & SLIDES</span>
            <div className="font-bold text-stone-900 text-sm">ഓഫറുകളും ബാനറുകളും</div>
            <p>Offers & Banner Slides പേജ് വഴി വെബ്‌സൈറ്റിലെ ഓഫറുകളും പ്രധാന സ്ലൈഡറുകളും ആഡ് ചെയ്യാനും മാറ്റാനും സാധിക്കും.</p>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1.5">
            <span className="text-amber-700 font-bold font-mono">04. VIEW ORDERS</span>
            <div className="font-bold text-stone-900 text-sm">കസ്റ്റമർ ഓർഡറുകൾ</div>
            <p>Orders പേജിൽ വരുമ്പോൾ കസ്റ്റമർ വാട്സ്ആപ്പിലും വെബ്സൈറ്റിലും ചെയ്ത പുതിയ എല്ലാ ബുക്കിംഗുകളും കാണാം.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
