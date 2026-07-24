"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, ImageIcon, X, Sparkles, CheckSquare, Square, Shirt,
  Palette, ShoppingBag, Clock, Search, Filter
} from "lucide-react";

export default function DressesPage() {
  const [dressesList, setDressesList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [form, setForm] = useState({
    name: "", type: "ladies", description: "", price: "", compareAtPrice: "",
    images: [] as string[], sizes: [] as string[], colors: [] as string[],
    // Initialise with a single default colour variant so the radio button is always visible
    colorVariants: [{ color: "", image: "", isDefault: true }],
    orderType: "add_to_bag",
    stock: 50, sortOrder: 0, isActive: true,
  });
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [dbCategories, setDbCategories] = useState<any[]>([]);

  const availableSizes = [
    { category: "Kids Sizes", sizes: ["20", "22", "24", "26", "28", "30", "32"] },
    { category: "Standard Sizes", sizes: ["Free Size", "XS", "S", "M", "L", "XL", "2XL", "3XL"] },
  ];

  useEffect(() => {
    fetchDresses();
    fetchCategories();
  }, []);

  // When the Add/Edit form is opened, make sure there is at least one colour variant
  useEffect(() => {
    if (showForm && form.colorVariants.length === 0) {
      setForm(prev => ({
        ...prev,
        colorVariants: [{ color: "", image: "", isDefault: true }],
      }));
    }
  }, [showForm]);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (Array.isArray(data)) setDbCategories(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchDresses() {
    try {
      const res = await fetch("/api/dresses");
      const data = await res.json();
      if (Array.isArray(data)) setDressesList(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "uploads/dresses");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setForm((f) => ({ ...f, images: [...f.images, data.url] }));
    setUploading(false);
  }

  function setAsMainThumbnail(imageUrl: string) {
    if (!imageUrl) return;
    setForm((f) => ({
      ...f,
      images: [imageUrl, ...f.images.filter((img) => img !== imageUrl)],
    }));
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
      setForm((f) => ({
        ...f,
        colorVariants: cv,
        images: f.images.length === 0 ? [data.url] : f.images,
      }));
    }
  }

  function addColorVariant() {
    setForm((f) => ({
      ...f,
      colorVariants: [...f.colorVariants, {
        color: "",
        image: "",
        isDefault: f.colorVariants.length === 0 ? true : false,
      }],
    }));
  }

  function removeColorVariant(idx: number) {
    setForm((f) => ({ ...f, colorVariants: f.colorVariants.filter((_, i) => i !== idx) }));
  }

  function updateColorVariantName(idx: number, name: string) {
    const cv = [...form.colorVariants];
    cv[idx].color = name;
    setForm((f) => ({ ...f, colorVariants: cv }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const autoColors = form.colorVariants.map((cv) => cv.color).filter(Boolean);
    const payload = {
      ...form,
      sizes: form.sizes || [],
      colors: autoColors.length > 0 ? autoColors : form.colors,
      price: form.price,
      compareAtPrice: form.compareAtPrice || null,
      images: form.images.length > 0 ? form.images : null,
      colorVariants: form.colorVariants.length > 0 ? form.colorVariants : null,
    };
    if (editing) {
      await fetch("/api/dresses", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editing.id }) });
    } else {
      await fetch("/api/dresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", type: "ladies", description: "", price: "", compareAtPrice: "", images: [], sizes: [], colors: [], colorVariants: [], orderType: "add_to_bag", stock: 50, sortOrder: 0, isActive: true });
    fetchDresses();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this dress outfit permanently?")) return;
    await fetch(`/api/dresses?id=${id}`, { method: "DELETE" });
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    fetchDresses();
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected dress(es)?`)) return;
    await fetch(`/api/dresses?ids=${selectedIds.join(",")}`, { method: "DELETE" });
    setSelectedIds([]);
    fetchDresses();
  }

  function toggleSelectAll() {
    if (selectedIds.length === filteredDresses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDresses.map((d) => d.id));
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  function openEdit(d: any) {
    setEditing(d);
    setForm({
      name: d.name, type: d.type, description: d.description || "", price: String(d.price),
      compareAtPrice: d.compareAtPrice ? String(d.compareAtPrice) : "",
      images: d.images || [], sizes: d.sizes || [], colors: d.colors || [],
      colorVariants: d.colorVariants || [],
      orderType: d.orderType || "add_to_bag",
      stock: d.stock || 50, sortOrder: d.sortOrder || 0, isActive: d.isActive,
    });
    setShowForm(true);
  }

  function toggleSize(size: string) {
    setForm((f) => ({ ...f, sizes: f.sizes.includes(size) ? f.sizes.filter((s) => s !== size) : [...f.sizes, size] }));
  }

  const filteredDresses = dressesList.filter((d) => {
    if (typeFilter && d.type !== typeFilter) return false;
    if (searchTerm) {
      return d.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-800 font-bold mb-1">
            <Shirt className="w-4 h-4 text-amber-500" /> Festive Attire & Dresses
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-stone-900">
            Onam & Traditional Dresses ({dressesList.length})
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            ഓണം കസവ് സാരികൾ, ജുബ്ബ, കുട്ടികളുടെ ഡ്രസ്സുകൾ എന്നിവ കളർ വേരിയൻറുകളോടെ മാനേജ് ചെയ്യാം.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-xl hover:bg-rose-700 transition font-medium text-xs shadow-sm">
              <Trash2 className="w-4 h-4" /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", type: "ladies", description: "", price: "", compareAtPrice: "", images: [], sizes: [], colors: [], colorVariants: [], orderType: "add_to_bag", stock: 50, sortOrder: 0, isActive: true }); }} className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 px-5 py-2.5 rounded-xl transition font-bold text-xs shadow-md">
            <Plus className="w-4 h-4" /> Add Dress Outfit
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-xl space-y-5 animate-slide-up">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h2 className="font-display text-xl font-bold text-stone-900">{editing ? `Edit Dress: ${editing.name}` : "Add New Dress Outfit"}</h2>
            <span className="text-xs font-mono text-stone-400">Shopify Color Variant Builder</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Dress Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Traditional Zari Kasavu Saree" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-medium" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Category Group *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-semibold">
                <option value="ladies">👩 Women's Kasavu Saree & Set Mundu</option>
                <option value="gents">👨 Men's Jubba & Kasavu Mundu</option>
                <option value="kids">👶 Kids Festive Attire</option>
                <option value="combo">👪 Family Combo Set</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Price (£) *</label>
              <input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 45.00" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Compare Price (£)</label>
              <input type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} placeholder="Original price" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Stock Count</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Button Action</label>
              <select value={form.orderType} onChange={(e) => setForm({ ...form, orderType: e.target.value })} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-semibold">
                <option value="add_to_bag">🛍️ ADD TO BAG (Instant Purchase)</option>
                <option value="pre_order">⏳ PRE-ORDER NOW Badge</option>
              </select>
            </div>
          </div>

          {/* Sizes Section */}
          <div className="bg-blue-50/50 border border-blue-200 p-5 rounded-2xl space-y-3">
            <h3 className="font-display text-base font-bold text-blue-950 flex items-center gap-2">
              📏 Available Sizes {form.sizes.length > 0 && <span className="text-xs font-normal text-blue-600">({form.sizes.length} selected)</span>}
            </h3>
            {form.sizes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.sizes.map((size, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 bg-blue-100 border border-blue-400 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg">
                    ✓ {size}
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggleSize(size); }} className="ml-1 text-blue-500 hover:text-red-500 font-bold">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {availableSizes.map((group) => (
                <div key={group.category}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{group.category}:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {group.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggleSize(size); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                          form.sizes.includes(size)
                            ? "bg-blue-100 border-blue-400 text-blue-800"
                            : "bg-white border-stone-200 text-stone-600 hover:bg-blue-50 hover:border-blue-300"
                        }`}
                      >
                        {form.sizes.includes(size) ? "✓ " : "+ "}{size}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                id="dressCustomSizeInput"
                placeholder="Add custom size (e.g. 24, 26, 28, 30)"
                className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val && !form.sizes.includes(val)) {
                      toggleSize(val);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const input = document.getElementById("dressCustomSizeInput") as HTMLInputElement;
                  const val = input?.value?.trim();
                  if (val && !form.sizes.includes(val)) {
                    toggleSize(val);
                    input.value = "";
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition"
              >Add</button>
            </div>
          </div>

          {/* Color Image Variants Section */}
          <div className="border border-amber-200 bg-amber-50/50 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-bold text-amber-950 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-600" /> Color Variants & Photos
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Add color options (Maroon, Black, Kasavu, etc.) with dedicated variant photos.
                </p>
              </div>
              <button type="button" onClick={addColorVariant} className="flex items-center gap-1.5 text-xs font-bold bg-[#0b2416] text-white px-3.5 py-2 rounded-xl hover:bg-emerald-950 transition shadow-sm">
                <Plus className="w-3.5 h-3.5" /> Add Color Option
              </button>
            </div>

            {/* Quick Add Presets */}
            <div className="bg-white/80 p-3 rounded-xl border border-amber-200/80 space-y-1.5">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-900">⚡ 1-Click Color Presets:</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: "Black", bg: "#18181b", text: "#ffffff" },
                  { name: "Maroon", bg: "#800000", text: "#ffffff" },
                  { name: "White", bg: "#ffffff", text: "#18181b" },
                  { name: "Off-White / Kasavu", bg: "#fef3c7", text: "#78350f" },
                  { name: "Green", bg: "#15803d", text: "#ffffff" },
                  { name: "Gold", bg: "#eab308", text: "#18181b" },
                  { name: "Red", bg: "#dc2626", text: "#ffffff" },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        colorVariants: [...f.colorVariants, {
                          color: preset.name,
                          image: "",
                          isDefault: f.colorVariants.length === 0 ? true : false,
                        }],
                      }));
                    }}
                    style={{ backgroundColor: preset.bg, color: preset.text }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold border border-black/10 hover:scale-105 transition shadow-xs flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {form.colorVariants.map((cv, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white border border-amber-200 rounded-xl shadow-xs">
                <div className="flex-1 w-full sm:w-auto">
                  <label className="block text-[10px] uppercase font-mono text-stone-500">Color Name</label>
                  <input
                    placeholder="e.g. Maroon"
                    value={cv.color}
                    onChange={(e) => updateColorVariantName(idx, e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none font-medium"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2 sm:pt-4">
                  <label className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg cursor-pointer hover:bg-stone-100 text-xs font-medium">
                    <ImageIcon className="w-4 h-4 text-amber-700" />
                    <span>{cv.image ? "Change Photo" : "Upload Photo"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleColorVariantImageUpload(e, idx)} />
                  </label>

                  {cv.image && (
                    <img src={cv.image} alt={cv.color} className="w-10 h-10 object-cover rounded-lg border border-stone-200" />
                  )}

                  {/* Default selection radio button */}
                  <div className="mt-1 flex items-center justify-center">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="defaultVariant"
                        checked={!!cv.isDefault}
                        onChange={() => setForm(prev => ({
                          ...prev,
                          colorVariants: prev.colorVariants.map((v, i) => ({ ...v, isDefault: i === idx }))
                        }))}
                        className="form-radio h-4 w-4 text-emerald-600"
                      />
                      <span className="ml-1 text-xs text-emerald-700">Default</span>
                    </label>
                  </div>

                  <button type="button" onClick={() => removeColorVariant(idx)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t border-stone-100">
            <button type="submit" className="bg-[#0b2416] text-white px-6 py-2.5 rounded-xl hover:bg-emerald-950 transition font-bold text-xs shadow-sm">
              {editing ? "Update Dress" : "Save Dress Outfit"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-stone-100 text-stone-700 px-6 py-2.5 rounded-xl hover:bg-stone-200 transition font-semibold text-xs">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Toolbar Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search dress outfits..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <Filter className="w-3.5 h-3.5" /> Group Filter:
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold outline-none"
          >
            <option value="">All Groups ({dressesList.length})</option>
            <option value="ladies">Ladies Kasavu & Saree</option>
            <option value="gents">Gents Shirt & Mundu</option>
            <option value="kids">Kids Festive Attire</option>
            <option value="combo">Family Combo Set</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase font-mono tracking-wider text-stone-500">
              <th className="p-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={filteredDresses.length > 0 && selectedIds.length === filteredDresses.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded text-forest-700 focus:ring-forest-600"
                />
              </th>
              <th className="p-4">Dress Outfit</th>
              <th className="p-4">Group</th>
              <th className="p-4">Price</th>
              <th className="p-4">Color Variants</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-150">
            {filteredDresses.map((d) => {
              const isSelected = selectedIds.includes(d.id);
              return (
                <tr key={d.id} className={`hover:bg-stone-50/70 transition ${isSelected ? "bg-amber-50/40" : ""}`}>
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(d.id)}
                      className="w-4 h-4 rounded text-forest-700 focus:ring-forest-600"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {d.images?.[0] ? (
                        <img src={d.images[0]} alt="" className="w-12 h-12 object-cover rounded-xl border border-stone-200 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-mono text-[9px] shrink-0">
                          <Shirt className="w-5 h-5 text-amber-700" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-stone-900 text-sm">{d.name}</div>
                        <div className="text-[10px] text-stone-400 font-mono">/{d.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="capitalize px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold">
                      👗 {d.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-stone-900 text-sm">£{d.price}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {d.colorVariants?.length > 0 ? (
                        d.colorVariants.map((cv: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-stone-100 border text-[10px] font-semibold text-stone-800">
                            {cv.color}
                          </span>
                        ))
                      ) : (
                        <span className="text-stone-400 text-[10px] italic">Standard</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(d)} className="p-2 text-stone-700 hover:bg-stone-100 rounded-xl transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredDresses.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-stone-500">
                  No dresses found. Click "+ Add Dress Outfit" above to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
