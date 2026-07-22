"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, ImageIcon, Share2, ShoppingBag, Clock, Sparkles,
  FolderOpen, Filter, X, Search, ArrowLeft, Link2, Eye
} from "lucide-react";

function CategoriesContent() {
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [assignSearch, setAssignSearch] = useState("");
  const [pageSettings, setPageSettings] = useState({ title: "", subtitle: "", desc: "" });

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    collectionId: "",
    orderType: "add_to_bag",
    sortOrder: 0,
    isActive: true,
  });

  const [groceryForm, setGroceryForm] = useState({
    name: "",
    slug: "",
    price: "",
    compareAtPrice: "",
    description: "",
    stock: 100,
    images: [] as string[],
    isActive: true,
  });

  const [uploading, setUploading] = useState(false);
  const [groceryUploading, setGroceryUploading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const filterId = searchParams?.get("id");

  useEffect(() => {
    fetchData();
  }, [filterId]);

  async function fetchData() {
    try {
      const [catRes, colRes, prodRes, setRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/collections"),
        fetch("/api/items"),
        fetch("/api/settings")
      ]);
      const catData = await catRes.json();
      const colData = await colRes.json();
      const prodData = await prodRes.json();
      const setData = await setRes.json();

      if (Array.isArray(catData)) setCategories(catData);
      if (Array.isArray(colData)) setCollections(colData);
      if (Array.isArray(prodData)) setProducts(prodData);
      if (Array.isArray(setData)) {
        const map: Record<string, string> = {};
        setData.forEach((s: any) => { map[s.key] = s.value; });
        setPageSettings({
          title: map.admin_categories_title || "Category Management",
          subtitle: map.admin_categories_subtitle || "STORE CATEGORIES",
          desc: map.admin_categories_desc || "Manage product categories to organize your store inventory."
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
    fd.append("folder", "uploads/categories");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setForm((f) => ({ ...f, image: data.url }));
    setUploading(false);
  }

  async function handleGroceryImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setGroceryUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "uploads/products");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setGroceryForm((f) => ({ ...f, images: [...f.images, data.url] }));
    setGroceryUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      collectionId: form.collectionId ? parseInt(form.collectionId) : collections[0]?.id || 1,
      slug: form.slug || generateSlug(form.name),
    };
    if (editing) {
      await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: editing.id }),
      });
    } else {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", slug: "", description: "", image: "", collectionId: "", orderType: "add_to_bag", sortOrder: 0, isActive: true });
    fetchData();
  }

  async function handleAddProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!filterId) return;
    const catId = parseInt(filterId);

    const payload = {
      ...groceryForm,
      categoryId: catId,
      slug: groceryForm.slug || generateSlug(groceryForm.name),
      price: groceryForm.price,
      compareAtPrice: groceryForm.compareAtPrice || null,
    };

    if (editingProduct) {
      await fetch("/api/items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: editingProduct.id }),
      });
    } else {
      await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setGroceryForm({ name: "", slug: "", price: "", compareAtPrice: "", description: "", stock: 100, images: [], isActive: true });
    setEditingProduct(null);
    setShowProductForm(false);
    fetchData();
  }

  function openEditProduct(p: any) {
    setEditingProduct(p);
    setGroceryForm({
      name: p.name,
      slug: p.slug || "",
      price: String(p.price),
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
      description: p.description || "",
      stock: p.stock || 100,
      images: p.images || [],
      isActive: p.isActive ?? true,
    });
    setShowProductForm(true);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    if (filterId === String(id)) {
      router.push("/admin/categories");
    } else {
      fetchData();
    }
  }

  async function handleProductDelete(id: number) {
    if (!confirm("Delete this product permanently?")) return;
    await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  async function assignGroceryToCategory(productId: number, catId: number) {
    await fetch("/api/items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, categoryId: catId }),
    });
    fetchData();
  }

  function openEdit(c: any) {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      image: c.image || "",
      collectionId: String(c.collectionId || ""),
      orderType: c.orderType || "add_to_bag",
      sortOrder: c.sortOrder || 0,
      isActive: c.isActive ?? true,
    });
    setShowForm(true);
  }

  const selectedFilteredCat = filterId ? categories.find((c) => String(c.id) === String(filterId)) : null;

  // Products belonging to this Category
  const categoryProducts = selectedFilteredCat
    ? products.filter((p) => p.categoryId === selectedFilteredCat.id)
    : [];

  const filteredCategoryProducts = categoryProducts.filter((p) => {
    if (!searchTerm) return true;
    return p.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const assignableProducts = products.filter(
    (p) => !selectedFilteredCat || p.categoryId !== selectedFilteredCat.id
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-blue-700 font-bold mb-1">
            <FolderOpen className="w-4 h-4 text-blue-600" /> {selectedFilteredCat ? "CATEGORY DETAIL" : (pageSettings.subtitle || "STORE CATEGORIES")}
          </div>
          <h1 className="admin-page-title font-display text-2xl md:text-3xl font-bold text-stone-900">
            {selectedFilteredCat ? selectedFilteredCat.name : (pageSettings.title || `Product Categories (${categories.length})`)}
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            {selectedFilteredCat
              ? `Manage all products under ${selectedFilteredCat.name} and configure order behavior.`
              : (pageSettings.desc || "Manage product categories to organize your store inventory.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {selectedFilteredCat && (
            <button
              onClick={() => router.push("/admin/categories")}
              className="flex items-center gap-1.5 bg-stone-100 text-stone-700 px-4 py-2.5 rounded-xl hover:bg-stone-200 transition font-semibold text-xs border border-stone-200"
            >
              <ArrowLeft className="w-4 h-4" /> All Categories
            </button>
          )}
          {selectedFilteredCat && (
            <button
              onClick={() => openEdit(selectedFilteredCat)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl transition font-bold text-xs shadow-xs"
            >
              <Pencil className="w-4 h-4" /> Edit Category Settings
            </button>
          )}
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setForm({ name: "", slug: "", description: "", image: "", collectionId: String(collections[0]?.id || ""), orderType: "add_to_bag", sortOrder: 0, isActive: true });
            }}
            className="flex items-center gap-2 bg-[#0b2416] text-white px-5 py-2.5 rounded-xl hover:bg-emerald-950 transition font-medium shadow-md text-xs"
          >
            <Plus className="w-4 h-4" /> New Category
          </button>
        </div>
      </div>

      {/* Main Category Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-xl space-y-5 animate-slide-up">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h2 className="font-display text-xl font-semibold text-stone-900">
              {editing ? `Edit Category: ${editing.name}` : "Create New Category"}
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Parent Collection *</label>
              <select
                required
                value={form.collectionId}
                onChange={(e) => setForm({ ...form, collectionId: e.target.value })}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-medium"
              >
                <option value="">Select Collection...</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    📁 {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Category Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Spices & Masala"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">URL Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="Auto-generated"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Order Button Action Type</label>
              <select
                value={form.orderType}
                onChange={(e) => setForm({ ...form, orderType: e.target.value })}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none text-sm font-semibold"
              >
                <option value="add_to_bag">🛍️ ADD TO BAG (Standard Cart Checkout)</option>
                <option value="pre_order">⏳ PRE-ORDER NOW Badge</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Category Image</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 text-xs font-semibold text-stone-700">
                  <ImageIcon className="w-4 h-4 text-blue-700" />
                  <span>{uploading ? "Uploading..." : "Upload Image"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {form.image && <img src={form.image} alt="" className="w-10 h-10 object-cover rounded-xl border border-stone-200" />}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-stone-100">
            <button type="submit" className="bg-[#0b2416] text-white px-6 py-2.5 rounded-xl hover:bg-emerald-950 transition font-medium shadow-sm">
              Save Category
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-stone-100 text-stone-700 px-6 py-2.5 rounded-xl hover:bg-stone-200 transition font-medium">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* OVERVIEW MODE: Grid of all Categories */}
      {!filterId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const parentCol = collections.find((col) => col.id === cat.collectionId);
            const catProds = products.filter((p) => p.categoryId === cat.id);

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-36 bg-stone-100 overflow-hidden">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 font-mono text-xs gap-1">
                        <FolderOpen className="w-8 h-8 text-stone-300" />
                        No Category Image
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      {cat.orderType === "pre_order" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950 shadow-md">
                          ⏳ PRE-ORDER
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-700 text-white shadow-md">
                          🛍️ ADD TO BAG
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-stone-900 text-lg group-hover:text-blue-700 transition flex items-center gap-2">
                      🏷️ {cat.name}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">
                      Collection: <strong>{parentCol ? parentCol.name : "None"}</strong>
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs text-stone-600 font-semibold">
                      <span>Total Products: <strong>{catProds.length}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 border-t border-stone-150 flex items-center justify-between gap-2">
                  <button
                    onClick={() => router.push(`/admin/categories?id=${cat.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#0b2416] text-white hover:bg-emerald-950 py-2.5 rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Eye className="w-4 h-4" /> View & Manage Items ({catProds.length})
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition border border-stone-200"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FILTERED CATEGORY MODE: Selected Category Detail & Products */}
      {selectedFilteredCat && (
        <div className="space-y-6">
          {/* Selected Category Header Card */}
          <div className="bg-gradient-to-r from-blue-500/10 via-blue-600/5 to-white p-6 rounded-2xl border border-blue-300/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {selectedFilteredCat.image ? (
                <img src={selectedFilteredCat.image} alt="" className="w-20 h-20 object-cover rounded-2xl border border-blue-200 shadow-sm" />
              ) : (
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 font-bold text-xl shadow-inner">
                  🏷️
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-blue-900 bg-blue-400/30 px-2 py-0.5 rounded-md border border-blue-400/40">
                    Active Category View
                  </span>
                  {selectedFilteredCat.orderType === "pre_order" ? (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                      ⏳ Pre-Order Button
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                      🛍️ Add to Bag Button
                    </span>
                  )}
                </div>
                <h2 className="font-bold text-stone-900 text-2xl">
                  {selectedFilteredCat.name}
                </h2>
                <p className="text-xs text-stone-600">
                  Parent Collection: <strong>{collections.find((c) => c.id === selectedFilteredCat.collectionId)?.name || "None"}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowAssignModal(true)}
                className="bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Link2 className="w-4 h-4 text-blue-700" /> Assign Existing Item
              </button>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setGroceryForm({ name: "", slug: "", price: "", compareAtPrice: "", description: "", stock: 100, images: [], isActive: true });
                  setShowProductForm(true);
                }}
                className="bg-blue-700 text-white hover:bg-blue-600 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add New Product to Category
              </button>
            </div>
          </div>

          {/* Add / Edit Product Form Modal */}
          {showProductForm && (
            <form onSubmit={handleAddProductSubmit} className="bg-white border border-stone-200 p-6 md:p-8 rounded-2xl shadow-xl space-y-6 animate-slide-up">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-700" />
                  {editingProduct ? `Edit Product: ${editingProduct.name}` : `Add New Product to ${selectedFilteredCat.name}`}
                </h3>
                <button type="button" onClick={() => { setShowProductForm(false); setEditingProduct(null); }} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Product Name *</label>
                  <input
                    required
                    value={groceryForm.name}
                    onChange={(e) => setGroceryForm({ ...groceryForm, name: e.target.value })}
                    placeholder="e.g. Kerala Matta Rice"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Price (£) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={groceryForm.price}
                    onChange={(e) => setGroceryForm({ ...groceryForm, price: e.target.value })}
                    placeholder="e.g. 12.99"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Compare Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={groceryForm.compareAtPrice}
                    onChange={(e) => setGroceryForm({ ...groceryForm, compareAtPrice: e.target.value })}
                    placeholder="e.g. 15.00"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={groceryForm.stock}
                    onChange={(e) => setGroceryForm({ ...groceryForm, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Product Image</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 px-3 py-2 border border-stone-300 rounded-xl cursor-pointer hover:bg-stone-50 text-[11px] font-semibold">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-700" />
                      <span>{groceryUploading ? "Uploading..." : "Choose Image"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleGroceryImageUpload} />
                    </label>
                    {groceryForm.images.length > 0 && (
                      <img src={groceryForm.images[0]} alt="" className="w-10 h-10 object-cover rounded-xl border border-stone-250" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-stone-100">
                <button type="submit" className="bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-600 transition">
                  {editingProduct ? "Update Product" : "Save Product to Category"}
                </button>
                <button type="button" onClick={() => { setShowProductForm(false); setEditingProduct(null); }} className="bg-stone-100 text-stone-700 px-6 py-2.5 rounded-xl text-xs font-semibold hover:bg-stone-200 transition">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* PRODUCTS LIST TABLE UNDER CATEGORY */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-150 pb-4">
              <h3 className="font-bold text-stone-900 text-base">
                Products in {selectedFilteredCat.name} ({categoryProducts.length})
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter category items..."
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white"
                />
              </div>
            </div>

            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase font-mono tracking-wider text-stone-500">
                    <th className="p-3">Product</th>
                    <th className="p-3">Price</th>
                    <th className="p-3 text-center">Stock</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {filteredCategoryProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/70 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {p.images && p.images[0] ? (
                            <img src={p.images[0]} alt="" className="w-12 h-12 object-cover rounded-xl border border-stone-200" />
                          ) : (
                            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-mono text-[9px]">
                              No Img
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-stone-900 text-sm">{p.name}</div>
                            <div className="text-[10px] text-stone-400 font-mono">/{p.slug}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-stone-900">£{p.price}</div>
                        {p.compareAtPrice && (
                          <div className="text-[10px] text-stone-400 line-through">£{p.compareAtPrice}</div>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-semibold text-[11px]">
                          {p.stock} in stock
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditProduct(p)}
                            title="Edit Product Details"
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleProductDelete(p.id)}
                            title="Delete Product"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredCategoryProducts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-stone-500">
                        <div className="max-w-sm mx-auto space-y-3">
                          <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                            🏷️
                          </div>
                          <h4 className="font-bold text-stone-900 text-sm">No products found in this category</h4>
                          <p className="text-xs text-stone-500">
                            Click "Add New Product" or "Assign Existing Item" to populate this category.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN EXISTING PRODUCT MODAL FOR CATEGORY */}
      {showAssignModal && selectedFilteredCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-scale-up max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-150 pb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-lg">
                  Assign Existing Products to {selectedFilteredCat.name}
                </h3>
                <p className="text-xs text-stone-500">Select any product to move it into this category.</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-xl p-2 space-y-1">
              {assignableProducts
                .filter((p) => !assignSearch || p.name.toLowerCase().includes(assignSearch.toLowerCase()))
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 hover:bg-stone-50 rounded-xl transition">
                    <div className="flex items-center gap-3">
                      {p.images && p.images[0] ? (
                        <img src={p.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg border" />
                      ) : (
                        <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-xs">🛒</div>
                      )}
                      <div>
                        <div className="font-bold text-stone-900 text-xs">{p.name}</div>
                        <div className="text-[10px] text-stone-500">£{p.price} • Stock: {p.stock}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => assignGroceryToCategory(p.id, selectedFilteredCat.id)}
                      className="bg-blue-700 text-white hover:bg-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Move to Category
                    </button>
                  </div>
                ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowAssignModal(false)}
                className="bg-stone-100 text-stone-700 hover:bg-stone-200 px-5 py-2 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-stone-500 font-mono text-xs">Loading Categories...</div>}>
      <CategoriesContent />
    </Suspense>
  );
}
