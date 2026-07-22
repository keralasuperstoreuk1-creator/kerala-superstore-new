"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard, Layers, FolderOpen, Package, ImageIcon,
  ShoppingBag, Settings, Store, Tag, Shirt, Trophy, ExternalLink,
  Menu, X, Sparkles, Type
} from "lucide-react";

const navGroups = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Catalog Management",
    items: [
      { href: "/admin/items", label: "All Products", icon: Package },
      { href: "/admin/dresses", label: "Onam Outfits", icon: Shirt },
      { href: "/admin/categories", label: "Categories", icon: FolderOpen },
      { href: "/admin/collections", label: "Collections", icon: Layers },
      { href: "/admin/offers", label: "Offers & Discounts", icon: Tag },
    ],
  },
  {
    title: "Content & Marketing",
    items: [
      { href: "/admin/slides", label: "Hero Banners", icon: ImageIcon },
      { href: "/admin/promo-banner", label: "Promo Banner", icon: Sparkles },
      { href: "/admin/winners", label: "Lucky Winners", icon: Trophy },
    ],
  },
  {
    title: "Store Operations",
    items: [
      { href: "/admin/orders", label: "Customer Orders", icon: ShoppingBag },
      { href: "/admin/store-info", label: "Store Information", icon: Store },
      { href: "/admin/settings", label: "Store Settings", icon: Settings },
      { href: "/admin/theme", label: "Theme Customization", icon: Sparkles },
      { href: "/admin/admin-text", label: "Admin Text Editor", icon: Type },
    ],
  },
];

function AdminShellContent({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [themeLogo, setThemeLogo] = useState("");
  const [themeLogoWidth, setThemeLogoWidth] = useState("");
  const [adminFont, setAdminFont] = useState("Inter");
  const [adminSize, setAdminSize] = useState("24");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      const map: Record<string, string> = {};
      data.forEach((s: any) => { map[s.key] = s.value; });
      setThemeLogo(map.theme_logo || "");
      setThemeLogoWidth(map.theme_logo_width || "");
      setAdminFont(map.admin_font_family || "Inter");
      setAdminSize(map.admin_font_size || "24");
    }).catch(console.error);
  }, []);

  useEffect(() => {
    setHydrated(true);
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!hydrated) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --admin-font: "${adminFont}", sans-serif;
          --admin-title-size: ${adminSize}px;
        }
        .admin-page-title {
          font-family: var(--admin-font) !important;
          font-size: var(--admin-title-size) !important;
        }
      `}} />
      <div className="min-h-screen bg-stone-50 flex font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0b2416] text-white border-r border-[#081c11] shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10 bg-[#081c11]/60">
          {themeLogo ? (
            <img src={themeLogo} alt="Logo" style={{ width: themeLogoWidth ? `${Math.min(parseInt(themeLogoWidth), 100)}px` : '32px' }} className="object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center text-[#0b2416] font-extrabold text-lg shadow-sm">
              K
            </div>
          )}
          <div>
            <div className="font-bold text-sm tracking-tight text-white">Kerala Super Store</div>
            <div className="text-[10px] text-amber-400 font-bold tracking-widest uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Admin Console
            </div>
          </div>
        </div>

        {/* Minimal Clean Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-emerald-400/90 font-bold">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition duration-150 group ${
                        active
                          ? "bg-white/15 text-white shadow-xs border-l-4 border-amber-400 font-bold"
                          : "text-emerald-100/75 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${active ? "text-amber-400" : "text-emerald-400 group-hover:text-amber-300"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Button to View Live Website */}
        <div className="p-4 border-t border-white/10 bg-[#081c11]/40">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition shadow-md"
          >
            <Store className="w-4 h-4" /> Open Storefront Website ↗
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Desktop & Mobile */}
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="font-semibold text-stone-900 text-sm hidden lg:block">
              {pathname === "/admin" ? "🏠 Overview Dashboard" : "🛍️ Catalog Administration"}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 transition"
            >
              <span>View Storefront</span> <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0b2416] text-white p-6 flex flex-col">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <span className="font-bold text-base">Admin Navigation</span>
              <button onClick={() => setOpen(false)} className="p-2 text-white/80 hover:bg-white/10 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">{group.title}</div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                          pathname === item.href ? "bg-white/15 text-white" : "text-emerald-100/75 hover:bg-white/5"
                        }`}
                      >
                        <item.icon className="w-4 h-4 text-emerald-400" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
    </>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="p-8 text-stone-600 font-mono text-xs">Loading Admin Console...</div>}>
      <AdminShellContent>{children}</AdminShellContent>
    </Suspense>
  );
}
