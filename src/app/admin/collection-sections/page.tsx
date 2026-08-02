"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, ImageIcon, X, Search, Save,
  Monitor, Smartphone, Upload, ChevronDown, ChevronUp, Sparkles, Flower2
} from "lucide-react";

export default function CollectionSectionsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Item form state (per-category quick add)
  const [itemForm, setItemForm] = useState<Record<number, any>>({});
  const [itemSizes, setItemSizes] = useState<Record<number, string[]>>({});
  const [itemSizePrices, setItemSizePrices] = useState<Record<number, Record<string, string>>>({});
  const [itemUploading, setItemUploading] = useState<number | null>(null);

  const gramPresets = ["50g", "100g", "200g", "250g", "30cm", "500g", "750g", "1kg", "2kg", "5kg"];

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [catRes, itemRes, setRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/items"),
        fetch("/api/settings"),
      ]);
      const catData = await catRes.json();
      const itemData = await itemRes.json();
      const setData = await setRes.json();
      if (Array.isArray(catData)) setCategories(catData);
      if (Array.isArray(itemData)) setItems(itemData);
      if (Array.isArray(setData)) {
        const map: Record<string, string> = {};
        setData.forEach((s: any) => { map[s.key] = s.value; });
        setSettings(map);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function saveSetting(key: string, value: string) {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>, catId: number, field: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(`${catId}_${field}`);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", `sections/cat-${catId}`);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      const key = `section_${catId}_${field}`;
      setSettings((s) => ({ ...s, [key]: data.url }));
      await saveSetting(key, data.url);
      showMessage("Banner uploaded & saved!");
    }
    setUploading("");
  }

  async function handleSaveSection(cat: any) {
    const fields = [
      `section_${cat.id}_banner_image`,
      `section_${cat.id}_banner_mobile_image`,
      `section_${cat.id}_title`,
      `section_${cat.id}_description`,
      `section_${cat.id}_btn_text`,
      `section_${cat.id}_btn_link`,
      `section_${cat.id}_button_action`,
      `section_${cat.id}_enabled`,
    ];
    for (const field of fields) {
      await saveSetting(field, settings[field] || "");
    }
    showMessage(`"${cat.name}" section saved!`);
  }

  function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
  }

  function getCatItems(catId: number) {
    return items.filter((i) => String(i.categoryId) === String(catId));
  }

  // ---- Item quick-add helpers ----
  function newEmptyItemForm(catId: number) {
    return {
      name: "", description: "", price: "", compareAtPrice: "",
      images: [] as string[], orderType: "add_to_bag", stock: 50,
      sortOrder: 0, isActive: true,
    };
  }

  function ensureItemForm(catId: number) {
    setItemForm((prev) => (prev[catId] ? prev : { ...prev, [catId]: newEmptyItemForm(catId) }));
    setItemSizes((prev) => (prev[catId] ? prev : { ...prev, [catId]: [] }));
    setItemSizePrices((prev) => (prev[catId] ? prev : { ...prev, [catId]: {} }));
  }

  function updateItemForm(catId: number, patch: any) {
    setItemForm((prev) => ({ ...prev, [catId]: { ...(prev[catId] || newEmptyItemForm(catId)), ...patch } }));
  }

  function toggleSize(catId: number, size: string) {
    setItemSizes((prev) => {
      const cur = prev[catId] || [];
      const next = cur.includes(size) ? cur.filter((s) => s !== size) : [...cur, size];
      return { ...prev, [catId]: next };
    });
    setItemSizePrices((prev) => {
      const cur = { ...(prev[catId] || {}) };
      if ((itemSizes[catId] || []).includes(size)) delete cur[size];
      else if (!cur[size]) cur[size] = itemForm[catId]?.price || "";
      return { ...prev, [catId]: cur };
    });
  }

  function updateSizePrice(catId: number, size: string, value: string) {
    setItemSizePrices((prev) => ({ ...prev, [catId]: { ...(prev[catId] || {}), [size]: value } }));
  }

  async function handleItemImageUpload(e: React.ChangeEvent<HTMLInputElement>, catId: number) {
    const file = e.target.files?.[0];
    if (!file) return;
    setItemUploading(catId);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", `sections/cat-${catId}/items`);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      const f = itemForm[catId] || newEmptyItemForm(catId);
      updateItemForm(catId, { images: [...f.images, data.url] });
    }
    setItemUploading(null);
  }

  async function handleAddItem(catId: number) {
    const f = itemForm[catId] || newEmptyItemForm(catId);
    if (!f.name.trim()) { alert("Please enter an item name"); return; }
    if (!f.price) { alert("Please enter a price"); return; }

    const sizes = itemSizes[catId] || [];
    const sizePrices = itemSizePrices[catId] || {};
    let variants: any[] = [];
    if (sizes.length > 0) {
      for (const sz of sizes) {
        variants.push({
          size: sz,
          price: sizePrices[sz] || f.price,
          images: [],
          stock: parseInt(String(f.stock)) || 50,
        });
      }
    }

    const payload = {
      categoryId: catId,
      name: f.name,
      slug: generateSlug(f.name),
      description: f.description || null,
      price: f.price,
      compareAtPrice: f.compareAtPrice || null,
      images: f.images.length > 0 ? f.images : null,
      buttonAction: f.orderType,
      stock: parseInt(String(f.stock)) || 0,
      sortOrder: f.sortOrder || 0,
      isActive: f.isActive,
      variants,
    };

    try {
      const res = await fetch("/api/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { alert("Save failed: " + (data.error || data.details || "Unknown error")); return; }
    } catch (err: any) { alert("Save failed: " + (err?.message || "Network error")); return; }

    setItemForm((prev) => ({ ...prev, [catId]: newEmptyItemForm(catId) }));
    setItemSizes((prev) => ({ ...prev, [catId]: [] }));
    setItemSizePrices((prev) => ({ ...prev, [catId]: {} }));
    await fetchItems();
    showMessage("Item added!");
  }

  async function fetchItems() {
    const res = await fetch("/api/items");
    const data = await res.json();
    if (Array.isArray(data)) setItems(data);
  }

  async function handleDeleteItem(id: number) {
    if (!confirm("Delete this item permanently?")) return;
    await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    await fetchItems();
  }

  function getSizes(item: any): string[] {
    return [...new Set((item.variants || []).map((v: any) => v.size).filter(Boolean))] as string[];
  }

  const filteredCats = categories.filter((c) => {
    if (searchTerm) return c.name.toLowerCase().includes(searchTerm.toLowerCase());
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" /> Collection Sections
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-stone-900">
            Banner + Items ({filteredCats.length} collections)
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            ഓരോ കളക്ഷനും ബാനറും അതിനു താഴെ ഐറ്റങ്ങളും. പുതിയ കളക്ഷൻ ഉണ്ടാക്കിയാൽ ഇവിടെ സ്വയം വരും. (New collections appear here automatically.)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search collections..." className="w-56 pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white" />
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium">{message}</div>
      )}

      {loading && <div className="text-center py-12 text-stone-500">Loading collections...</div>}

      {!loading && filteredCats.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
          No collections found. Create categories in Admin → Categories and they will appear here automatically.
        </div>
      )}

      {filteredCats.map((cat) => {
        const catId = cat.id;
        const catItems = getCatItems(catId);
        const isOpen = expanded === catId;
        const prefix = `section_${catId}_`;
        const enabled = settings[`${prefix}enabled`] !== "false";

        return (
          <div key={catId} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div
              className="flex items-center justify-between gap-4 p-5 cursor-pointer hover:bg-stone-50/70 transition"
              onClick={() => setExpanded(isOpen ? null : catId)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Flower2 className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-stone-900">{cat.name}</h2>
                    <span className="text-[10px] font-mono text-stone-400">/{catId}</span>
                    {settings[`${prefix}banner_image`] && <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">BANNER SET</span>}
                  </div>
                  <p className="text-xs text-stone-500">{catItems.length} items · {cat.description || "No description"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={enabled} onChange={(e) => { const key = `${prefix}enabled`; setSettings((s) => ({ ...s, [key]: e.target.checked ? "true" : "false" })); saveSetting(key, e.target.checked ? "true" : "false"); }} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded text-emerald-600" />
                  <span className="font-medium text-stone-600">Show</span>
                </label>
                {isOpen ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
              </div>
            </div>

            {/* Expanded content */}
            {isOpen && (
              <div className="border-t border-stone-100 p-6 space-y-6">
                {/* Banner Settings */}
                <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-emerald-900 flex items-center gap-2 text-sm">
                    <ImageIcon className="w-4 h-4 text-emerald-600" /> Section Banner & Text
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Title</label>
                      <input value={settings[`${prefix}title`] || ""} onChange={(e) => setSettings((s) => ({ ...s, [`${prefix}title`]: e.target.value }))} placeholder={cat.name} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Button Action</label>
                      <select value={settings[`${prefix}button_action`] || "add_to_bag"} onChange={(e) => setSettings((s) => ({ ...s, [`${prefix}button_action`]: e.target.value }))} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none">
                        <option value="add_to_bag">🛍️ ADD TO BAG</option>
                        <option value="pre_order">⏳ PRE-ORDER NOW</option>
                        <option value="both">🔀 BOTH — Pre-Order & Add to Cart</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Button Text</label>
                      <input value={settings[`${prefix}btn_text`] || ""} onChange={(e) => setSettings((s) => ({ ...s, [`${prefix}btn_text`]: e.target.value }))} placeholder="Shop Now" className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Description</label>
                    <textarea value={settings[`${prefix}description`] || ""} onChange={(e) => setSettings((s) => ({ ...s, [`${prefix}description`]: e.target.value }))} rows={2} placeholder={`Description for ${cat.name} section...`} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-white border border-emerald-200 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
                        <Monitor className="w-4 h-4 text-emerald-600" /> Desktop Banner (1400×500px)
                      </div>
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl cursor-pointer hover:bg-emerald-100 text-xs font-semibold text-emerald-800 transition">
                        <Upload className="w-4 h-4" />
                        {uploading === `${catId}_banner_image` ? "Uploading..." : "Upload Desktop Banner"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleBannerUpload(e, catId, "banner_image")} />
                      </label>
                      {settings[`${prefix}banner_image`] ? (
                        <div className="relative group">
                          <img src={settings[`${prefix}banner_image`]} alt="Desktop banner" className="w-full h-28 object-cover rounded-xl border border-stone-200" />
                          <button onClick={() => { const key = `${prefix}banner_image`; setSettings((s) => ({ ...s, [key]: "" })); saveSetting(key, ""); }} className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">×</button>
                        </div>
                      ) : <p className="text-[11px] text-stone-400 italic">No desktop banner set.</p>}
                    </div>
                    <div className="p-4 bg-white border border-emerald-200 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
                        <Smartphone className="w-4 h-4 text-emerald-600" /> Mobile Banner (600×400px)
                      </div>
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl cursor-pointer hover:bg-emerald-100 text-xs font-semibold text-emerald-800 transition">
                        <Upload className="w-4 h-4" />
                        {uploading === `${catId}_banner_mobile_image` ? "Uploading..." : "Upload Mobile Banner"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleBannerUpload(e, catId, "banner_mobile_image")} />
                      </label>
                      {settings[`${prefix}banner_mobile_image`] ? (
                        <div className="relative group">
                          <img src={settings[`${prefix}banner_mobile_image`]} alt="Mobile banner" className="w-full h-28 object-cover rounded-xl border border-stone-200" />
                          <button onClick={() => { const key = `${prefix}banner_mobile_image`; setSettings((s) => ({ ...s, [key]: "" })); saveSetting(key, ""); }} className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">×</button>
                        </div>
                      ) : <p className="text-[11px] text-stone-400 italic">No mobile banner set (desktop used on mobile too).</p>}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button onClick={() => handleSaveSection(cat)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition">
                      <Save className="w-4 h-4" /> Save {cat.name} Section
                    </button>
                  </div>
                </div>

                {/* Items in this collection */}
                <div>
                  <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Items in {cat.name} ({catItems.length})
                  </h3>

                  {/* Quick add form */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-600">+ Add New Item</span>
                      <button onClick={() => ensureItemForm(catId)} className="text-xs font-semibold text-emerald-700 hover:underline">Initialize form</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Item Name *</label>
                        <input value={itemForm[catId]?.name || ""} onChange={(e) => updateItemForm(catId, { name: e.target.value })} placeholder="e.g. Banana Chips" className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Price (£) *</label>
                        <input type="number" step="0.01" value={itemForm[catId]?.price || ""} onChange={(e) => updateItemForm(catId, { price: e.target.value })} placeholder="e.g. 5.00" className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Compare Price (£)</label>
                        <input type="number" step="0.01" value={itemForm[catId]?.compareAtPrice || ""} onChange={(e) => updateItemForm(catId, { compareAtPrice: e.target.value })} placeholder="Original price" className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Description</label>
                        <textarea value={itemForm[catId]?.description || ""} onChange={(e) => updateItemForm(catId, { description: e.target.value })} rows={2} placeholder="Description..." className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Stock</label>
                          <input type="number" value={itemForm[catId]?.stock || 50} onChange={(e) => updateItemForm(catId, { stock: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Button Action</label>
                          <select value={itemForm[catId]?.orderType || "add_to_bag"} onChange={(e) => updateItemForm(catId, { orderType: e.target.value })} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none">
                            <option value="add_to_bag">🛍️ ADD TO BAG</option>
                            <option value="pre_order">⏳ PRE-ORDER</option>
                            <option value="both">🔀 BOTH</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Product Photos</label>
                      <div className="flex flex-wrap gap-2">
                        {(itemForm[catId]?.images || []).map((img: string, idx: number) => (
                          <div key={idx} className="relative group">
                            <img src={img} alt="" className="w-16 h-16 object-cover rounded-xl border border-stone-200" />
                            <button type="button" onClick={() => { const f = itemForm[catId]; updateItemForm(catId, { images: f.images.filter((_: string, i: number) => i !== idx) }); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center">×</button>
                          </div>
                        ))}
                        <label className="w-16 h-16 flex items-center justify-center bg-white border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 transition text-stone-400">
                          {itemUploading === catId ? <span className="text-[8px] animate-pulse">⏳</span> : <Plus className="w-5 h-5" />}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleItemImageUpload(e, catId)} />
                        </label>
                      </div>
                    </div>
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">Gram Sizes ({itemSizes[catId]?.length || 0})</span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {gramPresets.map((sz) => {
                          const selected = (itemSizes[catId] || []).includes(sz);
                          return (
                            <button key={sz} type="button" onClick={() => toggleSize(catId, sz)} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${selected ? "bg-emerald-100 border-emerald-400 text-emerald-800" : "bg-white border-stone-200 text-stone-600 hover:bg-emerald-50 hover:border-emerald-300"}`}>
                              {selected ? "✓ " : "+ "}{sz}
                            </button>
                          );
                        })}
                      </div>
                      {(itemSizes[catId] || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(itemSizes[catId] || []).map((sz) => (
                            <div key={sz} className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-400 text-emerald-800 text-xs font-bold px-2 py-1 rounded-lg">
                              {sz}
                              <input type="number" step="0.01" placeholder="£" value={itemSizePrices[catId]?.[sz] || ""} onChange={(e) => updateSizePrice(catId, sz, e.target.value)} className="w-14 px-1 py-0.5 bg-white border border-emerald-300 rounded text-center text-[10px] font-bold outline-none" />
                              <span className="text-[9px] text-emerald-500 font-mono">£</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => handleAddItem(catId)} className="flex items-center gap-2 bg-[#0b2416] text-white px-5 py-2.5 rounded-xl hover:bg-emerald-950 transition font-bold text-xs shadow-sm">
                        <Plus className="w-4 h-4" /> Add Item
                      </button>
                    </div>
                  </div>

                  {/* Items list */}
                  {catItems.length === 0 ? (
                    <p className="text-sm text-stone-400 italic py-4">No items yet. Use the form above to add the first item.</p>
                  ) : (
                    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase font-mono tracking-wider text-stone-500">
                            <th className="p-3">Item</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Sizes</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-150">
                          {catItems.map((d) => (
                            <tr key={d.id} className="hover:bg-stone-50/70 transition">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {d.images?.[0] ? <img src={d.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg border border-stone-200" /> : <div className="w-10 h-10 bg-stone-100 rounded-lg" />}
                                  <div>
                                    <div className="font-bold text-stone-900">{d.name}</div>
                                    {d.buttonAction === "pre_order" && <span className="text-[9px] font-bold text-amber-700 bg-amber-100 rounded-full px-1.5 py-0.5">⏰ PRE-ORDER</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-bold">£{d.price}</td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  {getSizes(d).length > 0 ? getSizes(d).map((s, i) => (<span key={i} className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-800">{s}</span>)) : <span className="text-stone-400 italic">—</span>}
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <a href={`/admin/items?id=${d.id}`} className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg transition"><Pencil className="w-4 h-4" /></a>
                                  <button onClick={() => handleDeleteItem(d.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}