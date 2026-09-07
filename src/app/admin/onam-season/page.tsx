"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Shirt, Salad, Flower2, Trophy, ImageIcon, CheckCircle2, EyeOff, Eye, Settings2, ExternalLink, FolderOpen } from "lucide-react";

export default function OnamSeasonPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [dresses, setDresses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [promoBanners, setPromoBanners] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [setRes, dressRes, catRes, promoRes, winRes, slideRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/dresses"),
        fetch("/api/categories"),
        fetch("/api/promo-banners"),
        fetch("/api/winners"),
        fetch("/api/slides"),
      ]);
      const setData = await setRes.json();
      const map: Record<string, string> = {};
      if (Array.isArray(setData)) setData.forEach((s: any) => { map[s.key] = s.value; });
      setSettings(map);
      const d = await dressRes.json(); if (Array.isArray(d)) setDresses(d);
      const c = await catRes.json(); if (Array.isArray(c)) setCategories(c);
      const p = await promoRes.json(); if (Array.isArray(p)) setPromoBanners(p);
      const w = await winRes.json(); if (Array.isArray(w)) setWinners(w);
      const s = await slideRes.json(); if (Array.isArray(s)) setSlides(s);
    } catch (e) { console.error(e); }
  }

  async function saveSetting(key: string, value: string) {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  }

  async function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  async function toggleSetting(key: string) {
    const v = settings[key] === "false" ? "true" : "false";
    setSettings({ ...settings, [key]: v });
    await saveSetting(key, v);
    showMessage("Saved!");
  }

  // Master Onam season switch — controls everything
  const masterOn = settings.onam_season_active !== "false";
  const CHILD_KEYS = ["show_onam_sadhya", "show_onam_pookkalam", "show_fresh_pookkal"];

  async function setMaster(on: boolean) {
    setSaving(true);
    const v = on ? "true" : "false";
    setSettings((s) => ({ ...s, onam_season_active: v }));
    await saveSetting("onam_season_active", v);
    // Hard-set every individual Onam section toggle to match the master.
    // This makes the hide/show bulletproof and keeps the UI in sync.
    for (const key of CHILD_KEYS) {
      await saveSetting(key, v);
    }
    setSettings((s) => {
      const next: Record<string, string> = { ...s, onam_season_active: v };
      CHILD_KEYS.forEach((k) => { next[k] = v; });
      return next;
    });
    setSaving(false);
    showMessage(on ? "Onam season ON — all Onam content visible" : "Onam season OFF — all Onam content hidden");
  }

  // Children toggles
  const checkSetting = (key: string) => settings[key] !== "false";
  const catNameById = (id: any) => {
    const c = (categories || []).find((x) => x.id && String(x.id) === String(id));
    return c ? c.name : null;
  };
  const children = [
    { key: "show_onam_sadhya", label: "Onam Sadhya Section", icon: <Salad className="w-4 h-4" />, href: "/admin/onam-sadhya", linkedCat: catNameById(settings.onam_sadhya_category_id) },
    { key: "show_onam_pookkalam", label: "Onam Pookkalam Section", icon: <Flower2 className="w-4 h-4" />, href: "/admin/onam-pookkalam", linkedCat: catNameById(settings.pookkalam_category_id) },
    { key: "show_fresh_pookkal", label: "Fresh Pookkal Section", icon: <Flower2 className="w-4 h-4" />, href: "/admin/fresh-pookkal", linkedCat: catNameById(settings.fresh_pookkal_category_id) },
  ];

  const sadhyaCats = categories.filter((c) => c.name?.toLowerCase().includes("sadhya"));
  const dressTypes = dresses.length;

  const statsCards = [
    { label: "Onam Outfits (Dresses)", count: dressTypes, icon: <Shirt className="w-5 h-5" />, href: "/admin/dresses" },
    { label: "Sadhya Categories", count: sadhyaCats.length, icon: <Salad className="w-5 h-5" />, href: "/admin/onam-sadhya-items" },
    { label: "Promo Banners", count: promoBanners.length, icon: <ImageIcon className="w-5 h-5" />, href: "/admin/promo-banners" },
    { label: "Lucky Draw Winners", count: winners.length, icon: <Trophy className="w-5 h-5" />, href: "/admin/winners" },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-700 font-bold mb-1">
            <Sparkles className="w-4 h-4 text-amber-600" /> ONAM SEASON CONTROL
          </div>
          <h1 className="admin-page-title font-display text-2xl md:text-3xl font-bold text-stone-900">
            Onam Control Centre
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            എല്ലാ Onam കാര്യങ്ങളും (collections, banner, category, promo banner) ഒരിടത്ത് മാനേജ് ചെയ്യുക. ഒരു toggle കൊണ്ട് എല്ലാം ഒന്നിച്ച് ഹൈഡ് ചെയ്യാം — ഡാറ്റ ഒന്നും ഡിലീറ്റ് ആകില്ല.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.open("/", "_blank")}
            className="flex items-center gap-1.5 bg-stone-100 text-stone-700 px-4 py-2.5 rounded-xl hover:bg-stone-200 transition font-semibold text-xs border border-stone-200"
          >
            <ExternalLink className="w-4 h-4" /> View Storefront
          </button>
          <Link
            href="/admin/settings"
            className="flex items-center gap-1.5 bg-stone-100 text-stone-700 px-4 py-2.5 rounded-xl hover:bg-stone-200 transition font-semibold text-xs border border-stone-200"
          >
            <Settings2 className="w-4 h-4" /> Advanced Settings
          </Link>
        </div>
      </div>

      {message && <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-sm">{message}</div>}

      {/* MASTER TOGGLE */}
      <div className={`rounded-2xl border-2 p-6 md:p-8 shadow-lg transition ${
        masterOn ? "bg-gradient-to-br from-amber-50 via-amber-100/50 to-white border-amber-300" : "bg-gradient-to-br from-stone-100 via-slate-50 to-white border-stone-300"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md transition ${masterOn ? "bg-amber-400" : "bg-slate-300"}`}>
              {masterOn ? "🎉" : "🕸️"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900">Onam Season</h2>
              <p className="text-sm text-stone-600 mt-0.5 max-w-xl">
                {masterOn
                  ? "ON — All Onam content (dress collections, hero banner, Sadhya, Pookkalam, Lucky Draw) ദൃശ്യമാണ്."
                  : "OFF — All Onam content മറച്ചിരിക്കുന്നു. Data സുരക്ഷിതം, അടുത്ത Onam-ന് ON ചെയ്താൽ തിരികെ വരും."}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMaster(!masterOn)}
            disabled={saving}
            className={`px-6 py-3.5 rounded-xl text-sm font-bold transition shadow-md flex items-center gap-2 disabled:opacity-50 ${
              masterOn ? "bg-slate-800 text-white hover:bg-slate-900" : "bg-amber-500 text-stone-950 hover:bg-amber-400"
            }`}
          >
            {masterOn ? <><EyeOff className="w-4 h-4" /> Hide All Onam</> : <><Eye className="w-4 h-4" /> Show Onam (Enable)</>}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl border text-center transition ${masterOn ? "bg-white border-amber-200" : "bg-slate-100 border-slate-300"}`}>
            <div className="text-2xl font-bold text-stone-900">{masterOn ? "ON" : "OFF"}</div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 mt-0.5">Festive Collections</div>
            <div className="text-[10px] text-stone-400 mt-1">Dresses, Sadhya, Pookkalam</div>
          </div>
          <div className={`p-4 rounded-xl border text-center transition ${masterOn ? "bg-white border-amber-200" : "bg-slate-100 border-slate-300"}`}>
            <div className="text-2xl font-bold text-stone-900">{masterOn ? "ON" : "OFF"}</div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 mt-0.5">Hero Banner</div>
            <div className="text-[10px] text-stone-400 mt-1">Onam slides hidden</div>
          </div>
          <div className={`p-4 rounded-xl border text-center transition ${masterOn ? "bg-white border-amber-200" : "bg-slate-100 border-slate-300"}`}>
            <div className="text-2xl font-bold text-stone-900">{masterOn ? "ON" : "OFF"}</div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 mt-0.5">Lucky Draw Winners</div>
            <div className="text-[10px] text-stone-400 mt-1">Hall of Fame hidden</div>
          </div>
          <div className={`p-4 rounded-xl border text-center transition ${masterOn ? "bg-white border-amber-200" : "bg-slate-100 border-slate-300"}`}>
            <div className="text-2xl font-bold text-stone-900">{masterOn ? "ON" : "OFF"}</div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 mt-0.5">Categories</div>
            <div className="text-[10px] text-stone-400 mt-1">Sadhya & Pookkalam tiles</div>
          </div>
        </div>
      </div>

      {/* Stats of Onam content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition group"
          >
            <div className="flex items-center justify-between">
              <div className="text-stone-400 group-hover:text-amber-600 transition">{card.icon}</div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Manage ↗</span>
            </div>
            <div className="text-3xl font-bold text-stone-900 mt-3">{card.count}</div>
            <div className="text-xs text-stone-500 font-medium mt-0.5">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Individual section toggles */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-stone-900">Individual Onam Sections</h3>
          <span className="text-[10px] text-stone-400 font-mono">(ഇവ master OFF ആയാൽ ഓട്ടോമാറ്റിക്കായി മറയും)</span>
        </div>
        <div className="space-y-2.5">
          {children.map((item) => {
            const isOn = settings[item.key] !== "false";
            return (
              <div key={item.key} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOn ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-stone-800">{item.label}</div>
                    <Link href={item.href} className="text-[10px] text-blue-600 hover:underline">Open manager →</Link>
                    {item.linkedCat && <div className="text-[10px] text-stone-500 font-mono mt-0.5">Category: {item.linkedCat}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${isOn ? "text-emerald-700" : "text-slate-400"}`}>{isOn ? "Visible" : "Hidden"}</span>
                  <button
                    onClick={() => toggleSetting(item.key)}
                    disabled={!masterOn}
                    className={`w-12 h-7 rounded-full transition relative ${isOn ? "bg-emerald-600" : "bg-slate-300"} ${!masterOn ? "opacity-40 cursor-not-allowed" : ""}`}
                    title={!masterOn ? "Master toggle ON ആയാലേ ഇത് പ്രവർത്തിക്കൂ" : ""}
                  >
                    <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${isOn ? "left-6" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-stone-400 pt-1">
          💡 Tip: "Hide All Onam" എന്ന ഒറ്റ ബട്ടൺ എല്ലാം ഒന്നിച്ച് മറയ്ക്കും. "Show Onam" തിരികെ കൊണ്ടുവരും. ഒന്നും delete ആകില്ല.
        </p>
      </div>

      {/* Onam-related Categories (hide from Shop by Category when OFF) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-stone-900">Onam Categories</h3>
          <span className="text-[10px] text-stone-400 font-mono">(ഇവ "Shop by Category"-യിൽ നിന്ന് Off-season-ൽ മറയും)</span>
        </div>
        <p className="text-xs text-stone-500 max-w-2xl">
          Onam-മായി ബന്ധപ്പെട്ട Categories-ന് താഴെ check ചെയ്യുക. "Hide All Onam" ബട്ടൺ അമർത്തിയാൽ ഇവ/icons Shop by Category-യിൽ നിന്ന് ഒഴിവാക്കും. ഡാറ്റ delete ആകില്ല.
        </p>
        <div className="flex items-center gap-3 pb-2 border-b border-stone-100">
          <button
            onClick={async () => {
              await saveSetting("onam_categories_hidden", categories.map((c) => c.id).join(","));
              await saveSetting("onam_season_active", "false");
              showMessage("All categories hidden (Onam OFF)");
              setSettings((s) => ({ ...s, onam_categories_hidden: categories.map((c) => c.id).join(","), onam_season_active: "false" }));
            }}
            className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-900 transition"
          >
            Hide ALL categories now
          </button>
          <button
            onClick={async () => {
              await saveSetting("onam_categories_hidden", "");
              showMessage("All categories visible again (Onam ON)");
              setSettings((s) => ({ ...s, onam_categories_hidden: "" }));
            }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
          >
            Show ALL categories
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1">
          {(categories || []).map((cat) => {
            const isHidden = (settings.onam_categories_hidden || "").split(",").map((x) => x.trim()).filter(Boolean).includes(String(cat.id));
            const linkedTo =
              String(cat.id) === String(settings.onam_sadhya_category_id) ? "Onam Sadhya" :
              String(cat.id) === String(settings.pookkalam_category_id) ? "Onam Pookkalam" :
              String(cat.id) === String(settings.fresh_pookkal_category_id) ? "Fresh Pookkal" : null;
            return (
              <label
                key={cat.id}
                className={`flex items-center justify-between gap-2 p-3 rounded-xl border cursor-pointer transition ${
                  isHidden ? "bg-amber-50 border-amber-300" : "bg-stone-50 border-stone-200 hover:border-emerald-300"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {cat.name?.toLowerCase().includes("sadhya") || cat.name?.toLowerCase().includes("pookkalam") ? (
                    <Flower2 className="w-4 h-4 text-pink-500 shrink-0" />
                  ) : (
                    <FolderOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-stone-800 block truncate">{cat.name}</span>
                    {linkedTo && (
                      <span className="text-[9px] font-bold text-pink-700 bg-pink-50 border border-pink-200 rounded-full px-1.5 py-0.5">
                        {linkedTo} section icon
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={!isHidden}
                  onChange={async () => {
                    const current = (settings.onam_categories_hidden || "").split(",").map((x) => x.trim()).filter(Boolean);
                    const updated = isHidden
                      ? current.filter((x) => x !== String(cat.id))
                      : [...current, String(cat.id)];
                    await saveSetting("onam_categories_hidden", updated.join(","));
                    setSettings((s) => ({ ...s, onam_categories_hidden: updated.join(",") }));
                    showMessage(isHidden ? `${cat.name} — visible` : `${cat.name} — hidden when Onam OFF`);
                  }}
                />
              </label>
            );
          })}
        </div>
        <p className="text-[10px] text-stone-400">
          Note: Onam season OFF ആയാൽ മാത്രമേ ഈ icon-കൾ Shop by Category-യിൽ നിന്ന് മറയൂ. Season ON ആണെങ്കിൽ എല്ലാം ദൃശ്യമാണ്.
        </p>
      </div>
    </div>
  );
}