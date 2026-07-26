"use client";

import { useEffect, useState } from "react";
import { Save, Monitor, Smartphone, Flower2, Leaf, Upload } from "lucide-react";

interface PromoSection {
  key: string;
  title: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}

const promos: PromoSection[] = [
  { key: "pookkalam", title: "Pookkalam", icon: Flower2, color: "text-pink-700", bgColor: "bg-pink-50", borderColor: "border-pink-200" },
  { key: "fresh_pookkal", title: "Onam Fresh Pookkal", icon: Leaf, color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
];

export default function OnamPromosPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [uploading, setUploading] = useState<string>("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
    fetchCategories();
  }, []);

  async function fetchSettings() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    const map: Record<string, string> = {};
    data.forEach((s: any) => { map[s.key] = s.value; });
    setSettings(map);
  }

  async function fetchCategories() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (Array.isArray(data)) setCategories(data);
  }

  async function saveSetting(key: string, value: string) {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  }

  async function handleUpload(file: File, key: string, folder: string) {
    setUploading(key);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", `onam-promos/${folder}`);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      setSettings((s) => ({ ...s, [key]: data.url }));
      await saveSetting(key, data.url);
      setMessage("Banner uploaded & saved!");
      setTimeout(() => setMessage(""), 3000);
    }
    setUploading("");
  }

  async function handleSaveAll(promoKey: string) {
    const fields = [
      `${promoKey}_banner_image`,
      `${promoKey}_banner_mobile_image`,
      `${promoKey}_title`,
      `${promoKey}_description`,
      `${promoKey}_category_id`,
      `${promoKey}_dress_types`,
      `${promoKey}_btn_text`,
      `${promoKey}_btn_link`,
      `${promoKey}_button_action`,
    ];
    for (const field of fields) {
      await saveSetting(field, settings[field] || "");
    }
    setMessage(`${promoKey === "pookkalam" ? "Pookkalam" : "Fresh Pookkal"} settings saved!`);
    setTimeout(() => setMessage(""), 3000);
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">Onam Promo Sections</h1>
        <p className="text-sm text-stone-500 mt-1">Manage Pookkalam & Onam Fresh Pookkal promo banners and products</p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">{message}</div>
      )}

      {promos.map((promo) => {
        const Icon = promo.icon;
        return (
          <div key={promo.key} className={`bg-white rounded-2xl border ${promo.borderColor} p-6 space-y-5`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${promo.bgColor} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${promo.color}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900">{promo.title}</h2>
                <p className="text-xs text-stone-500">Banner + products for {promo.title} section</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Title</label>
                <input
                  value={settings[`${promo.key}_title`] || ""}
                  onChange={(e) => setSettings({ ...settings, [`${promo.key}_title`]: e.target.value })}
                  placeholder={promo.key === "pookkalam" ? "Onam Pookkalam" : "Onam Fresh Pookkal"}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Category (Items to show)</label>
                <select
                  value={settings[`${promo.key}_category_id`] || ""}
                  onChange={(e) => setSettings({ ...settings, [`${promo.key}_category_id`]: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:bg-white outline-none"
                >
                  <option value="">Select Category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Dress Types (to show)</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {["ladies", "gents", "kids", "kids-boys", "kids-girls", "combo"].map((t) => {
                    const selected = (settings[`${promo.key}_dress_types`] || "").split(",").filter(Boolean);
                    const isSelected = selected.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          const current = (settings[`${promo.key}_dress_types`] || "").split(",").filter(Boolean);
                          const updated = isSelected ? current.filter((x) => x !== t) : [...current, t];
                          setSettings({ ...settings, [`${promo.key}_dress_types`]: updated.join(",") });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                          isSelected
                            ? "bg-blue-100 border-blue-400 text-blue-800"
                            : "bg-white border-stone-200 text-stone-600 hover:bg-blue-50 hover:border-blue-300"
                        }`}
                      >
                        {isSelected ? "✓ " : ""} {t}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-stone-400 mt-1">Select multiple dress types or use Category above for items</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Button Action</label>
                <select
                  value={settings[`${promo.key}_button_action`] || "add_to_bag"}
                  onChange={(e) => setSettings({ ...settings, [`${promo.key}_button_action`]: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:bg-white outline-none"
                >
                  <option value="add_to_bag">🛒 Add to Cart (Instant Purchase)</option>
                  <option value="pre_order">⏳ Pre-Order Now</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Description</label>
              <textarea
                value={settings[`${promo.key}_description`] || ""}
                onChange={(e) => setSettings({ ...settings, [`${promo.key}_description`]: e.target.value })}
                placeholder={`Description for ${promo.title} section...`}
                rows={2}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Button Text</label>
                <input
                  value={settings[`${promo.key}_btn_text`] || ""}
                  onChange={(e) => setSettings({ ...settings, [`${promo.key}_btn_text`]: e.target.value })}
                  placeholder="Shop Now"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Button Link (#)</label>
                <input
                  value={settings[`${promo.key}_btn_link`] || ""}
                  onChange={(e) => setSettings({ ...settings, [`${promo.key}_btn_link`]: e.target.value })}
                  placeholder="#products"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-5 ${promo.bgColor} border ${promo.borderColor} rounded-2xl space-y-3`}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <Monitor className="w-4 h-4" /> Desktop Banner (1400×500px)
                </div>
                <label className="flex items-center gap-2 px-4 py-3 bg-white border border-stone-300 rounded-xl cursor-pointer hover:bg-stone-50 text-xs font-semibold text-stone-700">
                  <Upload className="w-4 h-4" />
                  {uploading === `${promo.key}_banner_image` ? "Uploading..." : "Upload Desktop Banner"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, `${promo.key}_banner_image`, "desktop");
                    }}
                  />
                </label>
                {settings[`${promo.key}_banner_image`] && (
                  <img src={settings[`${promo.key}_banner_image`]} alt="Desktop banner" className="w-full h-32 object-cover rounded-xl border border-stone-200" />
                )}
              </div>
              <div className={`p-5 ${promo.bgColor} border ${promo.borderColor} rounded-2xl space-y-3`}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <Smartphone className="w-4 h-4" /> Mobile Banner (600×400px)
                </div>
                <label className="flex items-center gap-2 px-4 py-3 bg-white border border-stone-300 rounded-xl cursor-pointer hover:bg-stone-50 text-xs font-semibold text-stone-700">
                  <Upload className="w-4 h-4" />
                  {uploading === `${promo.key}_banner_mobile_image` ? "Uploading..." : "Upload Mobile Banner"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, `${promo.key}_banner_mobile_image`, "mobile");
                    }}
                  />
                </label>
                {settings[`${promo.key}_banner_mobile_image`] && (
                  <img src={settings[`${promo.key}_banner_mobile_image`]} alt="Mobile banner" className="w-full h-32 object-cover rounded-xl border border-stone-200" />
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <button
                onClick={() => handleSaveAll(promo.key)}
                className={`flex items-center gap-2 ${promo.key === "pookkalam" ? "bg-pink-600 hover:bg-pink-700" : "bg-emerald-600 hover:bg-emerald-700"} text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition`}
              >
                <Save className="w-4 h-4" /> Save {promo.title}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
