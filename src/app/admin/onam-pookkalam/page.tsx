"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, ImageIcon, X,
  Palette, Search, Flower2
} from "lucide-react";

export default function OnamPookkalamPage() {
  const [list, setList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [lastSizes, setLastSizes] = useState<string[]>([]);
  const [lastSizePrices, setLastSizePrices] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "", description: "", price: "", compareAtPrice: "",
    images: [] as string[], sizes: [] as string[],
    colorVariants: [{ color: "", image: "", isDefault: true }],
    sizePrices: {} as Record<string, string>,
    orderType: "add_to_bag",
    stock: 50, sortOrder: 0, isActive: true,
  });
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [catId, setCatId] = useState<number>(17);

  const gramPresets = ["50g", "100g", "200g", "250g", "30cm", "500g", "750g", "1kg", "2kg", "5kg"];

  useEffect(() => {
    fetchSettings();
    fetchItems();
  }, []);

  useEffect(() => {
    if (showForm && form.colorVariants.length === 0) {
      setForm(prev => ({ ...prev, colorVariants: [{ color: "", image: "", isDefault: true }] }));
    }
  }, [showForm]);

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
  }

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data) {
        const v = data.find((s: any) => s.key === "pookkalam_category_id");
        if (v?.value) setCatId(parseInt(v.value));
      }
    } catch (e) { console.error(e); }
  }

  async function fetchItems() {
    try {
      const res = await fetch(`/api/items?categoryId=${catId}`);
      const data = await res.json();
      if (Array.isArray(data)) setList(data);
    } catch (e) { console.error(e); }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "uploads/onam-pookkalam");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setForm((f) => ({ ...f, images: [...f.images, data.url] }));
    setUploading(false);
  }

  function setAsMainThumbnail(imageUrl: string) {
    if (!imageUrl) return;
    setForm((f) => ({ ...f, images: [imageUrl, ...f.images.filter((img) => img !== imageUrl)] }));
  }

  async function handleColorVariantImageUpload(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "uploads/color-variants");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      const cv = [...form.colorVariants];
      cv[idx].image = data.url;
      setForm((f) => ({ ...f, colorVariants: cv, images: f.images.length === 0 ? [data.url] : f.images }));
    }
  }

  function addColorVariant() {
    setForm((f) => ({ ...f, colorVariants: [...f.colorVariants, { color: "", image: "", isDefault: f.colorVariants.length === 0 }] }));
  }

  function removeColorVariant(idx: number) {
    setForm((f) => ({ ...f, colorVariants: f.colorVariants.filter((_, i) => i !== idx) }));
  }

  function updateColorVariantName(idx: number, name: string) {
    const cv = [...form.colorVariants];
    cv[idx].color = name;
    setForm((f) => ({ ...f, colorVariants: cv }));
  }

  function toggleSize(size: string) {
    setForm((f) => {
      const newSizes = f.sizes.includes(size) ? f.sizes.filter((s) => s !== size) : [...f.sizes, size];
      const newSizePrices = { ...f.sizePrices };
      if (!f.sizes.includes(size)) {
        if (!newSizePrices[size]) newSizePrices[size] = f.price || "";
      } else {
        delete newSizePrices[size];
      }
      return { ...f, sizes: newSizes, sizePrices: newSizePrices };
    });
  }

  function updateSizePrice(size: string, value: string) {
    setForm((f) => ({ ...f, sizePrices: { ...f.sizePrices, [size]: value } }));
  }

  function buildPayload() {
    const colors = form.colorVariants.filter((c) => c.color.trim());
    const hasColors = colors.length > 0;
    const allSizes = form.sizes.filter((s) => s.trim());
    const hasSizes = allSizes.length > 0;

    let variants: any[] = [];
    if (hasSizes && hasColors) {
      for (const sz of allSizes) {
        for (const cv of colors) {
          variants.push({
            size: sz,
            color: cv.color,
            price: form.sizePrices[sz] || form.price,
            images: cv.image ? [cv.image] : [],
            stock: parseInt(String(form.stock)) || 50,
          });
        }
      }
    } else if (hasSizes) {
      for (const sz of allSizes) {
        variants.push({
          size: sz,
          price: form.sizePrices[sz] || form.price,
          images: [],
          stock: parseInt(String(form.stock)) || 50,
        });
      }
    } else if (hasColors) {
      for (const cv of colors) {
        variants.push({
          color: cv.color,
          price: form.price,
          images: cv.image ? [cv.image] : [],
          stock: parseInt(String(form.stock)) || 50,
        });
      }
    }

    return {
      categoryId: catId,
      name: form.name,
      slug: generateSlug(form.name),
      description: form.description || null,
      price: form.price,
      compareAtPrice: form.compareAtPrice || null,
      images: form.images.length > 0 ? form.images : null,
      buttonAction: form.orderType,
      stock: parseInt(String(form.stock)) || 0,
      sortOrder: form.sortOrder || 0,
      isActive: form.isActive,
      variants,
    };
  }

  function itemToForm(item: any) {
    const v = item.variants || [];
    const sizes = [...new Set(v.map((x: any) => x.size).filter(Boolean))] as string[];
    const sizePrices: Record<string, string> = {};
    sizes.forEach((sz) => {
      const match = v.find((x: any) => x.size === sz && x.price);
      if (match) sizePrices[sz] = match.price;
    });
    const seenColors = new Set<string>();
    const colorVariants: { color: string; image: string; isDefault: boolean }[] = [];
    v.forEach((x: any) => {
      if (x.color && !seenColors.has(x.color)) {
        seenColors.add(x.color);
        colorVariants.push({
          color: x.color,
          image: (x.images && x.images[0]) || "",
          isDefault: colorVariants.length === 0,
        });
      }
    });
    if (colorVariants.length === 0) {
      colorVariants.push({ color: "", image: "", isDefault: true });
    }

    return {
      name: item.name || "",
      description: item.description || "",
      price: String(item.price || ""),
      compareAtPrice: item.compareAtPrice ? String(item.compareAtPrice) : "",
      images: item.images || [],
      sizes,
      colorVariants,
      sizePrices,
      orderType: item.buttonAction || "add_to_bag",
      stock: item.stock || 50,
      sortOrder: item.sortOrder || 0,
      isActive: item.isActive,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload.name.trim()) { alert("Please enter a name"); return; }
    if (payload.variants.length === 0 && !payload.price) { alert("Please add at least one size or color variant, or set a base price"); return; }

    try {
      let res;
      if (editing) {
        res = await fetch("/api/items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editing.id }) });
      } else {
        res = await fetch("/api/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      const data = await res.json();
      if (!res.ok) { alert("Save failed: " + (data.error || data.details || "Unknown error")); return; }
    } catch (err: any) { alert("Save failed: " + (err?.message || "Network error")); return; }

    setLastSizes(form.sizes);
    setLastSizePrices(form.sizePrices);
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", description: "", price: "", compareAtPrice: "", images: [], sizes: [], colorVariants: [{ color: "", image: "", isDefault: true }], sizePrices: {}, orderType: "add_to_bag", stock: 50, sortOrder: 0, isActive: true });
    fetchItems();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this item permanently?")) return;
    await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    fetchItems();
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected items?`)) return;
    for (const id of selectedIds) {
      await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    }
    setSelectedIds([]);
    fetchItems();
  }

  function toggleSelectAll() {
    if (selectedIds.length === filteredList.length) setSelectedIds([]);
    else setSelectedIds(filteredList.map((d) => d.id));
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  function openEdit(d: any) {
    setEditing(d);
    setForm(itemToForm(d));
    setShowForm(true);
  }

  const filteredList = list.filter((d) => {
    if (searchTerm) return d.name.toLowerCase().includes(searchTerm.toLowerCase());
    return true;
  });

  function getSizes(item: any): string[] {
    return [...new Set((item.variants || []).map((v: any) => v.size).filter(Boolean))] as string[];
  }
  function getColors(item: any): { color: string; image?: string }[] {
    const seen = new Set<string>();
    return (item.variants || []).filter((v: any) => { if (v.color && !seen.has(v.color)) { seen.add(v.color); return true; } return false; });
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-pink-800 font-bold mb-1">
            <Flower2 className="w-4 h-4 text-pink-500" /> Ona Pookkalam
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-stone-900">
            Pookkalam Flowers ({list.length})
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            പൂക്കൾ, മാലകൾ, ഗാർലൻഡ് എന്നിവ ഗ്രാമിനും കളറിനും അനുസരിച്ച് ചേർക്കുക।
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-xl hover:bg-rose-700 transition font-medium text-xs shadow-sm">
              <Trash2 className="w-4 h-4" /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", description: "", price: "", compareAtPrice: "", images: [], sizes: [...lastSizes], colorVariants: [{ color: "", image: "", isDefault: true }], sizePrices: { ...lastSizePrices }, orderType: "add_to_bag", stock: 50, sortOrder: 0, isActive: true }); }} className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl transition font-bold text-xs shadow-md">
            <Plus className="w-4 h-4" /> Add Pookkalam Item
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-xl space-y-5 animate-slide-up">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h2 className="font-display text-xl font-bold text-stone-900">{editing ? `Edit: ${editing.name}` : "Add New Pookkalam Item"}</h2>
            <span className="text-xs font-mono text-stone-400">Items API — variants auto-generated from sizes + colors</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Item Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Pookkalam Flowers - Mixed" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-medium" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Base Price (£) *</label>
              <input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 25.00" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-bold" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Compare Price (£)</label>
              <input type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} placeholder="Original price" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm" rows={2} placeholder="Description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Stock Count</label>
                <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Button Action</label>
                <select value={form.orderType} onChange={(e) => setForm({ ...form, orderType: e.target.value })} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-semibold">
                  <option value="add_to_bag">🛍️ ADD TO BAG</option>
                  <option value="pre_order">⏳ PRE-ORDER NOW</option>
                  <option value="both">🔀 BOTH — Pre-Order & Add to Cart</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Product Photos</label>
            <div className="flex flex-wrap gap-2">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative group/image">
                  <img src={img} alt="" className="w-16 h-16 object-cover rounded-xl border border-stone-200" />
                  <button type="button" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition">×</button>
                  {idx === 0 && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] bg-stone-900 text-white px-1 rounded font-bold">MAIN</span>}
                  {idx > 0 && (
                    <button type="button" onClick={() => setAsMainThumbnail(img)} className="absolute top-0 left-0 w-full h-full bg-black/40 opacity-0 group-hover/image:opacity-100 transition flex items-center justify-center text-white text-[8px] font-bold rounded-xl">Set as Main</button>
                  )}
                </div>
              ))}
              <label className="w-16 h-16 flex items-center justify-center bg-stone-50 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 transition text-stone-400">
                {uploading ? <span className="text-[8px] animate-pulse">⏳</span> : <Plus className="w-5 h-5" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          <div className="bg-pink-50/50 border border-pink-200 p-5 rounded-2xl space-y-3">
            <h3 className="font-display text-base font-bold text-pink-950 flex items-center gap-2">
              🌿 Gram Sizes {form.sizes.length > 0 && <span className="text-xs font-normal text-pink-600">({form.sizes.length} selected)</span>}
            </h3>
            {form.sizes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.sizes.map((size, idx) => (
                  <div key={idx} className="inline-flex items-center gap-1 bg-pink-100 border border-pink-400 text-pink-800 text-xs font-bold px-3 py-1.5 rounded-lg">
                    ✓ {size}
                    <input type="number" step="0.01" placeholder="Price" value={form.sizePrices[size] || ""} onChange={(e) => updateSizePrice(size, e.target.value)} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="w-16 px-1 py-0.5 bg-white border border-pink-300 rounded text-center text-[10px] font-bold outline-none" />
                    <span className="text-[9px] text-pink-500 font-mono">£</span>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggleSize(size); }} className="ml-0.5 text-pink-500 hover:text-red-500 font-bold">×</button>
                  </div>
                ))}
              </div>
            )}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Gram Presets:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {gramPresets.map((sz) => (
                  <button key={sz} type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggleSize(sz); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${form.sizes.includes(sz) ? "bg-pink-100 border-pink-400 text-pink-800" : "bg-white border-stone-200 text-stone-600 hover:bg-pink-50 hover:border-pink-300"}`}>
                    {form.sizes.includes(sz) ? "✓ " : "+ "}{sz}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input id="pookkalamCustomSize" placeholder="Custom gram (e.g. 150g, 1.5kg)" className="flex-1 px-3 py-2 bg-white border border-pink-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-pink-400" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const val = (e.target as HTMLInputElement).value.trim(); if (val && !form.sizes.includes(val)) { toggleSize(val); (e.target as HTMLInputElement).value = ""; } } }} />
              <button type="button" onClick={() => { const inp = document.getElementById("pookkalamCustomSize") as HTMLInputElement; const val = inp?.value?.trim(); if (val && !form.sizes.includes(val)) { toggleSize(val); inp.value = ""; } }} className="px-4 py-2 bg-pink-600 text-white text-xs font-bold rounded-lg hover:bg-pink-700 transition">Add</button>
            </div>
            <p className="text-[10px] text-pink-600 italic">💡 Each size × each color = one variant on the website.</p>
          </div>

          <div className="border border-amber-200 bg-amber-50/50 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-bold text-amber-950 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-600" /> Color Variants & Photos
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">Add color options (White, Red, Yellow, etc.) with dedicated variant photos.</p>
              </div>
              <button type="button" onClick={addColorVariant} className="flex items-center gap-1.5 text-xs font-bold bg-[#0b2416] text-white px-3.5 py-2 rounded-xl hover:bg-emerald-950 transition shadow-sm">
                <Plus className="w-3.5 h-3.5" /> Add Color Option
              </button>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-amber-200/80 space-y-1.5">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-900">⚡ 1-Click Color Presets:</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: "White", bg: "#fefce8", text: "#713f12" },
                  { name: "Pink", bg: "#fbcfe8", text: "#831843" },
                  { name: "Red", bg: "#dc2626", text: "#ffffff" },
                  { name: "Yellow", bg: "#f59e0b", text: "#451a03" },
                  { name: "Orange", bg: "#ea580c", text: "#ffffff" },
                  { name: "Mixed", bg: "#a21caf", text: "#ffffff" },
                  { name: "Purple", bg: "#7c3aed", text: "#ffffff" },
                ].map((preset) => (
                  <button key={preset.name} type="button" onClick={() => { setForm((f) => ({ ...f, colorVariants: [...f.colorVariants, { color: preset.name, image: "", isDefault: f.colorVariants.length === 0 }] })); }} style={{ backgroundColor: preset.bg, color: preset.text }} className="px-2.5 py-1 rounded-lg text-xs font-bold border border-black/10 hover:scale-105 transition shadow-xs flex items-center gap-1">
                    <Plus className="w-3 h-3" /> {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {form.colorVariants.map((cv, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white border border-amber-200 rounded-xl shadow-xs">
                <div className="flex-1 w-full sm:w-auto">
                  <label className="block text-[10px] uppercase font-mono text-stone-500">Color Name</label>
                  <input placeholder="e.g. White" value={cv.color} onChange={(e) => updateColorVariantName(idx, e.target.value)} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none font-medium" />
                </div>
                <div className="flex items-center gap-3 pt-2 sm:pt-4">
                  <label className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg cursor-pointer hover:bg-stone-100 text-xs font-medium">
                    <ImageIcon className="w-4 h-4 text-amber-700" />
                    <span>{cv.image ? "Change Photo" : "Upload Photo"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleColorVariantImageUpload(e, idx)} />
                  </label>
                  {cv.image && <img src={cv.image} alt={cv.color} className="w-10 h-10 object-cover rounded-lg border border-stone-200" />}
                  <div className="mt-1 flex items-center justify-center">
                    <label className="inline-flex items-center">
                      <input type="radio" name="defaultVariant" checked={!!cv.isDefault} onChange={() => setForm(prev => ({ ...prev, colorVariants: prev.colorVariants.map((v, i) => ({ ...v, isDefault: i === idx })) }))} className="form-radio h-4 w-4 text-emerald-600" />
                      <span className="ml-1 text-xs text-emerald-700">Default</span>
                    </label>
                  </div>
                  <button type="button" onClick={() => removeColorVariant(idx)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t border-stone-100">
            <button type="submit" className="bg-[#0b2416] text-white px-6 py-2.5 rounded-xl hover:bg-emerald-950 transition font-bold text-xs shadow-sm">
              {editing ? "Update Item" : "Save Item"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-stone-100 text-stone-700 px-6 py-2.5 rounded-xl hover:bg-stone-200 transition font-semibold text-xs">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search items..." className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white" />
        </div>
        <div className="text-xs text-stone-400 font-mono">{filteredList.length} items</div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase font-mono tracking-wider text-stone-500">
              <th className="p-4 w-10 text-center">
                <input type="checkbox" checked={filteredList.length > 0 && selectedIds.length === filteredList.length} onChange={toggleSelectAll} className="w-4 h-4 rounded text-forest-700 focus:ring-forest-600" />
              </th>
              <th className="p-4">Item</th>
              <th className="p-4">Price</th>
              <th className="p-4">Sizes</th>
              <th className="p-4">Color Variants</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-150">
            {filteredList.map((d) => {
              const isSelected = selectedIds.includes(d.id);
              const sizes = getSizes(d);
              const colors = getColors(d);
              return (
                <tr key={d.id} className={`hover:bg-stone-50/70 transition ${isSelected ? "bg-amber-50/40" : ""}`}>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(d.id)} className="w-4 h-4 rounded text-forest-700 focus:ring-forest-600" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {d.images?.[0] ? <img src={d.images[0]} alt="" className="w-12 h-12 object-cover rounded-xl border border-stone-200 shrink-0" /> : <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 shrink-0"><Flower2 className="w-5 h-5 text-pink-500" /></div>}
                      <div>
                        <div className="font-bold text-stone-900 text-sm">{d.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="text-[10px] text-stone-400 font-mono">/{d.categoryId}</div>
                          {d.buttonAction === "pre_order" && <span className="text-[9px] font-bold text-amber-700 bg-amber-100 rounded-full px-1.5 py-0.5">⏰ PRE-ORDER</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-stone-900 text-sm">£{d.price}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {sizes.length > 0 ? sizes.map((s: string, i: number) => (<span key={i} className="px-1.5 py-0.5 rounded bg-pink-50 border border-pink-200 text-[10px] font-semibold text-pink-800">{s}</span>)) : <span className="text-stone-400 text-[10px] italic">—</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {colors.length > 0 ? colors.map((cv: any, i: number) => (<span key={i} className="px-2 py-0.5 rounded bg-stone-100 border text-[10px] font-semibold text-stone-800">{cv.color}</span>)) : <span className="text-stone-400 text-[10px] italic">—</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(d)} className="p-2 text-stone-700 hover:bg-stone-100 rounded-xl transition"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(d.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredList.length === 0 && (
              <tr><td colSpan={6} className="p-12 text-center text-stone-500">No Pookkalam items found. Click "+ Add Pookkalam Item" above to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}