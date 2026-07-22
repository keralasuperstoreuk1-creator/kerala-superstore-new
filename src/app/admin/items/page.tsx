"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, ImageIcon, X, Sparkles, CheckSquare, Square, Package,
  Search, Filter, Eye, AlertCircle
} from "lucide-react";

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: "", compareAtPrice: "", sku: "", stock: 100,
    images: [] as string[], categoryId: "", gender: "", ageGroup: "", sortOrder: 0, isActive: true,
  });
  const [variants, setVariants] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [pageSettings, setPageSettings] = useState({ title: "", subtitle: "", desc: "" });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [itemsRes, catRes, setRes] = await Promise.all([fetch("/api/items"), fetch("/api/categories"), fetch("/api/settings")]);
      const itemData = await itemsRes.json();
      const catData = await catRes.json();
      const setData = await setRes.json();
      
      if (Array.isArray(itemData)) setItems(itemData);
      if (Array.isArray(catData)) setCategories(catData);
      
      if (Array.isArray(setData)) {
        const map: Record<string, string> = {};
        setData.forEach((s: any) => { map[s.key] = s.value; });
        setPageSettings({
          title: map.admin_items_title || "Grocery Items & Store Products",
          subtitle: map.admin_items_subtitle || "PRODUCTS & GROCERY INVENTORY",
          desc: map.admin_items_desc || "റേഷൻ, സ്പൈസസ്, മട്ട അരി, വെളിച്ചെണ്ണ തുടങ്ങി എല്ലാ ഉൽപ്പന്നങ്ങളും എളുപ്പത്തിൽ മാനേജ് ചെയ്യാം."
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "uploads/items");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setForm((f) => ({ ...f, images: [...f.images, data.url] }));
    setUploading(false);
  }

  async function updateQuickStock(item: any, deltaOrZero: number | "zero") {
    const newStock = deltaOrZero === "zero" ? 0 : Math.max(0, (item.stock || 0) + deltaOrZero);
    await fetch("/api/items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, stock: newStock }),
    });
    fetchData();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      categoryId: parseInt(form.categoryId || String(categories[0]?.id || 1)),
      price: form.price,
      compareAtPrice: form.compareAtPrice || null,
      slug: form.slug || generateSlug(form.name),
      images: form.images.length > 0 ? form.images : null,
      variants: variants.map((v) => ({ ...v, price: v.price || form.price, stock: parseInt(v.stock) || 0 })),
    };
    if (editing) {
      await fetch("/api/items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editing.id }) });
    } else {
      await fetch("/api/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setShowForm(false);
    setEditing(null);
    resetForm();
    fetchData();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this product permanently?")) return;
    await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    fetchData();
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected product(s)?`)) return;
    await fetch(`/api/items?ids=${selectedIds.join(",")}`, { method: "DELETE" });
    setSelectedIds([]);
    fetchData();
  }

  function toggleSelectAll() {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  function resetForm() {
    setForm({ name: "", slug: "", description: "", price: "", compareAtPrice: "", sku: "", stock: 100, images: [], categoryId: String(categories[0]?.id || ""), gender: "", ageGroup: "", sortOrder: 0, isActive: true });
    setVariants([]);
  }

  function openEdit(item: any) {
    setEditing(item);
    setForm({
      name: item.name, slug: item.slug, description: item.description || "", price: String(item.price),
      compareAtPrice: item.compareAtPrice ? String(item.compareAtPrice) : "", sku: item.sku || "",
      stock: item.stock || 0, images: item.images || [], categoryId: String(item.categoryId),
      gender: item.gender || "", ageGroup: item.ageGroup || "", sortOrder: item.sortOrder || 0, isActive: item.isActive,
    });
    setVariants(item.variants || []);
    setShowForm(true);
  }

  const filteredItems = items.filter((item) => {
    if (categoryFilter && String(item.categoryId) !== categoryFilter) return false;
    if (searchTerm) {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold mb-1">
            <Package className="w-4 h-4 text-emerald-700" /> {pageSettings.subtitle}
          </div>
          <h1 className="admin-page-title font-display text-2xl md:text-3xl font-bold text-stone-900">
            {pageSettings.title} ({items.length})
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            {pageSettings.desc}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-xl hover:bg-rose-700 transition font-medium text-xs shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => { setShowForm(true); setEditing(null); resetForm(); }}
            className="flex items-center justify-center gap-2 bg-[#0b2416] text-white px-5 py-2.5 rounded-xl hover:bg-emerald-950 transition font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-xl space-y-5 animate-slide-up">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h2 className="font-display text-xl font-bold text-stone-900">
              {editing ? `Edit Product: ${editing.name}` : "Add New Product"}
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Category *</label>
              <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-medium">
                <option value="">Select Category...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>🏷️ {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Product Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fresh Coconut Oil 1L" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-medium" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Price (£) *</label>
              <input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 6.99" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Compare Price (£)</label>
              <input type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} placeholder="Original price for discount" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Stock Qty</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Product Image</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 text-xs font-semibold text-stone-700">
                  <ImageIcon className="w-4 h-4 text-emerald-700" />
                  <span>{uploading ? "Uploading..." : "Upload Image"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {form.images[0] && <img src={form.images[0]} alt="" className="w-10 h-10 object-cover rounded-xl border border-stone-200" />}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm" rows={2} placeholder="Product description..." />
          </div>

          <div className="flex gap-3 pt-4 border-t border-stone-100">
            <button type="submit" className="bg-[#0b2416] text-white px-6 py-2.5 rounded-xl hover:bg-emerald-950 transition font-bold text-xs shadow-sm">
              {editing ? "Update Product" : "Save Product"}
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
            placeholder="Search products by name..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <Filter className="w-3.5 h-3.5" /> Filter Category:
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold outline-none"
          >
            <option value="">All Categories ({items.length})</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
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
                  checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded text-forest-700 focus:ring-forest-600"
                />
              </th>
              <th className="p-4">Product</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4 text-center">Stock & Quick Adjustment</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-150">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const pCat = categories.find((c) => c.id === item.categoryId);

              return (
                <tr key={item.id} className={`hover:bg-stone-50/70 transition ${isSelected ? "bg-amber-50/40" : ""}`}>
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 rounded text-forest-700 focus:ring-forest-600"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt="" className="w-12 h-12 object-cover rounded-xl border border-stone-200 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-mono text-[9px] shrink-0">
                          No Img
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-stone-900 text-sm">{item.name}</div>
                        <div className="text-[10px] text-stone-400 font-mono">/{item.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[10px]">
                      🏷️ {pCat ? pCat.name : "General"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-stone-900 text-sm">£{item.price}</div>
                    {item.compareAtPrice && (
                      <div className="text-[10px] text-stone-400 line-through">£{item.compareAtPrice}</div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="space-y-1.5">
                      {item.stock > 10 ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                          In Stock ({item.stock})
                        </span>
                      ) : item.stock > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200">
                          Low Stock ({item.stock})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200">
                          Out of Stock
                        </span>
                      )}

                      {/* Quick 1-Click Adjust Stock Controls */}
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateQuickStock(item, 5)}
                          title="Add +5 to stock"
                          className="px-1.5 py-0.5 bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 rounded font-mono text-[9px] font-bold border border-stone-200 transition"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => updateQuickStock(item, 10)}
                          title="Add +10 to stock"
                          className="px-1.5 py-0.5 bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 rounded font-mono text-[9px] font-bold border border-stone-200 transition"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => updateQuickStock(item, "zero")}
                          title="Mark Out of Stock"
                          className="px-1.5 py-0.5 bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-900 rounded font-mono text-[9px] font-bold border border-stone-200 transition"
                        >
                          0
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(item)} className="p-2 text-stone-700 hover:bg-stone-100 rounded-xl transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-stone-500">
                  No products found. Click "+ Add New Product" above to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
