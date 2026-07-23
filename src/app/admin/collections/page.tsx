"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, ImageIcon, Share2, ShoppingBag, Clock, Sparkles,
  Filter, X, Package, Check, ChevronRight, Tags, Search, ArrowLeft, Link2,
  FolderOpen, Layers, Eye
} from "lucide-react";

function CollectionsContent() {
  const [collections, setCollections] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [dressesList, setDressesList] = useState<any[]>([]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<"all" | "grocery" | "dress">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [assignSearch, setAssignSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    orderType: "add_to_bag",
    sortOrder: 0,
    isActive: true,
  });

  const [productTypeSelector, setProductTypeSelector] = useState<"grocery" | "dress">("grocery");

  const [groceryForm, setGroceryForm] = useState({
    name: "",
    slug: "",
    categoryId: "",
    price: "",
    compareAtPrice: "",
    description: "",
    stock: 100,
    images: [] as string[],
    isActive: true,
  });

  const [dressForm, setDressForm] = useState({
    name: "",
    type: "ladies" as "ladies" | "gents" | "kids" | "combo",
    description: "",
    price: "",
    compareAtPrice: "",
    images: [] as string[],
    sizes: ["Free Size"] as string[],
    colors: [] as string[],
    colorVariants: [] as { color: string; image: string; isDefault?: boolean }[],
    orderType: "add_to_bag" as "add_to_bag" | "pre_order",
    stock: 50,
    isActive: true,
  });

  const [uploading, setUploading] = useState(false);
  const [groceryUploading, setGroceryUploading] = useState(false);

  const [currentColorInput, setCurrentColorInput] = useState("");
  const [currentColorImage, setCurrentColorImage] = useState("");
  const [variantUploading, setVariantUploading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const filterId = searchParams?.get("id");

  useEffect(() => {
    fetchData();
  }, [filterId]);

  async function fetchData() {
    try {
      const [colRes, catRes, prodRes, dressRes] = await Promise.all([
        fetch("/api/collections"),
        fetch("/api/categories"),
        fetch("/api/items"),
        fetch("/api/dresses"),
      ]);
      const colData = await colRes.json();
      const catData = await catRes.json();
      const prodData = await prodRes.json();
      const dressData = await dressRes.json();

      if (Array.isArray(colData)) setCollections(colData);
      if (Array.isArray(catData)) setCategories(catData);
      if (Array.isArray(prodData)) setProducts(prodData);
      if (Array.isArray(dressData)) setDressesList(dressData);

      if (filterId && Array.isArray(colData)) {
        const found = colData.find((c) => String(c.id) === String(filterId));
        if (found) {
          setForm({
            name: found.name,
            slug: found.slug,
            description: found.description || "",
            image: found.image || "",
            orderType: found.orderType || "add_to_bag",
            sortOrder: found.sortOrder || 0,
            isActive: found.isActive ?? true,
          });
        }
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
    fd.append("folder", "uploads/collections");
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

  async function handleDressVariantImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVariantUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "uploads/dresses");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setCurrentColorImage(data.url);
    setVariantUploading(false);
  }

  async function ensureCategoryExists(collectionId: number, collectionName: string) {
    const colCats = categories.filter((cat) => cat.collectionId === collectionId);
    if (colCats.length > 0) return colCats[0].id;

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `General ${collectionName}`,
        slug: generateSlug(`general-${collectionName}-${Date.now()}`),
        collectionId,
        orderType: "add_to_bag",
      }),
    });
    const newCat = await res.json();
    fetchData();
    return newCat.id;
  }

  async function handleSaveCollection(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, slug: form.slug || generateSlug(form.name) };

    if (selectedFilteredCol) {
      await fetch("/api/collections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: selectedFilteredCol.id }),
      });
      alert("Collection settings saved successfully!");
    } else {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const newCol = await res.json();
      setShowCreateForm(false);
      setForm({ name: "", slug: "", description: "", image: "", orderType: "add_to_bag", sortOrder: 0, isActive: true });
      if (newCol.id) {
        router.push(`/admin/collections?id=${newCol.id}`);
      }
    }
    fetchData();
  }

  async function handleAddOrUpdateProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!filterId) return;
    const colId = parseInt(filterId);
    const colName = selectedFilteredCol?.name || "Collection";

    if (productTypeSelector === "grocery") {
      let catId = groceryForm.categoryId;
      if (!catId) {
        catId = await ensureCategoryExists(colId, colName);
      }

      const payload = {
        ...groceryForm,
        categoryId: parseInt(String(catId)),
        slug: groceryForm.slug || generateSlug(groceryForm.name),
        price: groceryForm.price,
        compareAtPrice: groceryForm.compareAtPrice || null,
      };

      if (editingItem && editingItem.itemKind === "grocery") {
        await fetch("/api/items", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: editingItem.id }),
        });
      } else {
        await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setGroceryForm({ name: "", slug: "", categoryId: "", price: "", compareAtPrice: "", description: "", stock: 100, images: [], isActive: true });
    } else {
      const mainImages = dressForm.images.length > 0 ? dressForm.images : dressForm.colorVariants.map((v) => v.image).filter(Boolean);
      const payload = {
        ...dressForm,
        collectionId: colId,
        images: mainImages,
        price: dressForm.price,
        compareAtPrice: dressForm.compareAtPrice || null,
      };

      if (editingItem && editingItem.itemKind === "dress") {
        await fetch("/api/dresses", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: editingItem.id }),
        });
      } else {
        await fetch("/api/dresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setDressForm({
        name: "",
        type: "ladies",
        description: "",
        price: "",
        compareAtPrice: "",
        images: [],
        sizes: ["Free Size"],
        colors: [],
        colorVariants: [],
        orderType: "add_to_bag",
        stock: 50,
        isActive: true,
      });
      setCurrentColorInput("");
      setCurrentColorImage("");
    }

    setEditingItem(null);
    setShowProductForm(false);
    fetchData();
  }

  function openEditProduct(item: any) {
    setEditingItem(item);
    if (item.itemKind === "grocery") {
      setProductTypeSelector("grocery");
      setGroceryForm({
        name: item.name,
        slug: item.slug || "",
        categoryId: String(item.categoryId || ""),
        price: String(item.price),
        compareAtPrice: item.compareAtPrice ? String(item.compareAtPrice) : "",
        description: item.description || "",
        stock: item.stock || 100,
        images: item.images || [],
        isActive: item.isActive ?? true,
      });
    } else {
      setProductTypeSelector("dress");
      setDressForm({
        name: item.name,
        type: item.type || "ladies",
        description: item.description || "",
        price: String(item.price),
        compareAtPrice: item.compareAtPrice ? String(item.compareAtPrice) : "",
        images: item.images || [],
        sizes: item.sizes || ["Free Size"],
        colors: item.colors || [],
        // Ensure each variant has isDefault flag (default false if missing)
        colorVariants: (item.colorVariants || []).map((cv: { color: string; image: string; isDefault?: boolean }) => ({ ...cv, isDefault: cv.isDefault ?? false })),
        orderType: item.orderType || "add_to_bag",
        stock: item.stock || 50,
        isActive: item.isActive ?? true,
      });
    }
    setShowProductForm(true);
  }

  async function handleDeleteCollection(id: number) {
    if (!confirm("Are you sure you want to delete this collection?")) return;
    await fetch(`/api/collections?id=${id}`, { method: "DELETE" });
    if (filterId === String(id)) {
      router.push("/admin/collections");
    } else {
      fetchData();
    }
  }

  async function handleProductDelete(id: number) {
    if (!confirm("Delete this product permanently?")) return;
    await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  async function handleDressDelete(id: number) {
    if (!confirm("Delete this dress outfit permanently?")) return;
    await fetch(`/api/dresses?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  async function assignDressToCollection(dressId: number, colId: number) {
    await fetch("/api/dresses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dressId, collectionId: colId }),
    });
    fetchData();
  }

  async function unassignDressFromCollection(dressId: number) {
    await fetch("/api/dresses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dressId, collectionId: null }),
    });
    fetchData();
  }

  async function assignGroceryToCollection(productId: number, colId: number) {
    const colName = selectedFilteredCol?.name || "Collection";
    const catId = await ensureCategoryExists(colId, colName);
    await fetch("/api/items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, categoryId: catId }),
    });
    fetchData();
  }

  function addColorVariant() {
    if (!currentColorInput.trim()) return;
    const color = currentColorInput.trim();
    const image = currentColorImage;

    setDressForm((prev) => ({
      ...prev,
      colors: prev.colors.includes(color) ? prev.colors : [...prev.colors, color],
      colorVariants: [...prev.colorVariants, { color, image }],
    }));

    setCurrentColorInput("");
    setCurrentColorImage("");
  }

  function removeColorVariant(index: number) {
    setDressForm((prev) => {
      const newVariants = prev.colorVariants.filter((_, i) => i !== index);
      const remainingColors = Array.from(new Set(newVariants.map((v) => v.color)));
      return {
        ...prev,
        colorVariants: newVariants,
        colors: remainingColors,
      };
    });
  }

  const selectedFilteredCol = filterId ? collections.find((c) => String(c.id) === String(filterId)) : null;

  // Filter categories belonging to this collection
  const collectionCategories = selectedFilteredCol
    ? categories.filter((cat) => cat.collectionId === selectedFilteredCol.id)
    : [];

  const collectionCategoryIds = collectionCategories.map((cat) => cat.id);

  // Filter grocery products belonging strictly to this collection
  const collectionProducts = selectedFilteredCol
    ? products.filter((prod) => collectionCategoryIds.includes(prod.categoryId))
    : [];

  // Filter dresses belonging strictly to this collection
  const collectionDresses = selectedFilteredCol
    ? dressesList.filter((d) => d.collectionId === selectedFilteredCol.id)
    : [];

  // Combined items strictly inside this selected collection
  const combinedItems = [
    ...collectionProducts.map((p) => ({ ...p, itemKind: "grocery" })),
    ...collectionDresses.map((d) => ({ ...d, itemKind: "dress" })),
  ].filter((item) => {
    if (activeTab === "grocery" && item.itemKind !== "grocery") return false;
    if (activeTab === "dress" && item.itemKind !== "dress") return false;
    if (searchTerm) {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  // Assignable items (NOT in this collection)
  const assignableDresses = dressesList.filter(
    (d) => !selectedFilteredCol || d.collectionId !== selectedFilteredCol.id
  );
  const assignableProducts = products.filter(
    (p) => !selectedFilteredCol || !collectionCategoryIds.includes(p.categoryId)
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold mb-1">
            <Layers className="w-4 h-4 text-amber-500" /> Catalog Collections Manager
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-stone-900">
            {selectedFilteredCol ? selectedFilteredCol.name : `Product Collections (${collections.length})`}
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            {selectedFilteredCol
              ? `Showing strictly products and settings for ${selectedFilteredCol.name}.`
              : "Select a collection to manage its details and items."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {selectedFilteredCol ? (
            <button
              onClick={() => {
                setForm({ name: "", slug: "", description: "", image: "", orderType: "add_to_bag", sortOrder: 0, isActive: true });
                router.push("/admin/collections");
              }}
              className="flex items-center gap-2 bg-[#0b2416] text-white px-5 py-2.5 rounded-xl hover:bg-emerald-950 transition font-bold text-xs shadow-md"
            >
              <ArrowLeft className="w-4 h-4" /> All Collections Overview
            </button>
          ) : (
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setForm({ name: "", slug: "", description: "", image: "", orderType: "add_to_bag", sortOrder: 0, isActive: true });
              }}
              className="flex items-center gap-2 bg-[#0b2416] text-white px-5 py-2.5 rounded-xl hover:bg-emerald-950 transition font-bold text-xs shadow-md"
            >
              <Plus className="w-4 h-4" /> New Collection
            </button>
          )}
        </div>
      </div>

      {/* CREATE NEW COLLECTION FORM */}
      {showCreateForm && !selectedFilteredCol && (
        <form onSubmit={handleSaveCollection} className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-xl space-y-5 animate-slide-up">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h2 className="font-display text-xl font-bold text-stone-900">Create New Collection</h2>
            <button type="button" onClick={() => setShowCreateForm(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Collection Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Onam Dress Collection"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-medium"
              />
            </div>
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
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short summary for this collection..."
              rows={2}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Cover Image</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 text-xs font-semibold text-stone-700">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span>{uploading ? "Uploading..." : "Upload Image"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {form.image && <img src={form.image} alt="" className="w-10 h-10 object-cover rounded-xl border border-stone-200" />}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-stone-100">
            <button type="submit" className="bg-[#0b2416] text-white px-6 py-2.5 rounded-xl hover:bg-emerald-950 transition font-bold text-xs shadow-sm">
              Save Collection
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="bg-stone-100 text-stone-700 px-6 py-2.5 rounded-xl hover:bg-stone-200 transition font-semibold text-xs">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* OVERVIEW MODE */}
      {!selectedFilteredCol && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => {
            const colCats = categories.filter((cat) => cat.collectionId === col.id);
            const catIds = colCats.map((cat) => cat.id);
            const groceryCount = products.filter((p) => catIds.includes(p.categoryId)).length;
            const dressCount = dressesList.filter((d) => d.collectionId === col.id).length;
            const totalCount = groceryCount + dressCount;

            return (
              <div
                key={col.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-40 bg-stone-100 overflow-hidden">
                    {col.image ? (
                      <img src={col.image} alt={col.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 font-mono text-xs gap-1">
                        <Layers className="w-8 h-8 text-stone-300" />
                        No Cover Image
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      {col.orderType === "pre_order" ? (
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
                    <h3 className="font-bold text-stone-900 text-lg group-hover:text-emerald-800 transition flex items-center gap-2">
                      📁 {col.name}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2">{col.description || "No description provided."}</p>

                    <div className="pt-2 flex items-center justify-between text-xs text-stone-600 font-medium">
                      <span>Total Products: <strong>{totalCount}</strong> ({groceryCount} grocery, {dressCount} dress)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 border-t border-stone-150 flex items-center justify-between gap-2">
                  <button
                    onClick={() => router.push(`/admin/collections?id=${col.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#0b2416] text-white hover:bg-emerald-950 py-2.5 rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Eye className="w-4 h-4" /> Manage Items & Edit ({totalCount})
                  </button>
                  <button
                    onClick={() => handleDeleteCollection(col.id)}
                    className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition border border-stone-200"
                    title="Delete Collection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ISOLATED SELECTED COLLECTION VIEW */}
      {selectedFilteredCol && (
        <div className="space-y-6 animate-fade-in">
          {/* COLLECTION EDIT SETTINGS CARD */}
          <form onSubmit={handleSaveCollection} className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h2 className="font-bold text-xl text-stone-900 flex items-center gap-2">
                ✏️ Edit Collection Settings: <span className="text-emerald-800">{selectedFilteredCol.name}</span>
              </h2>
              <span className="text-xs font-mono text-stone-400">ID: {selectedFilteredCol.id}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Collection Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">URL Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Cover Image</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 text-xs font-semibold text-stone-700">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    <span>{uploading ? "Uploading..." : "Upload Image"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {form.image && <img src={form.image} alt="" className="w-10 h-10 object-cover rounded-xl border border-stone-200" />}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none transition text-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="submit" className="bg-[#0b2416] text-white px-6 py-2.5 rounded-xl hover:bg-emerald-950 transition font-bold text-xs shadow-sm">
                Save Collection Settings
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCollection(selectedFilteredCol.id)}
                className="text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                Delete This Collection
              </button>
            </div>
          </form>

          {/* ACTION BUTTONS */}
          <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
                📦 Products Inside {selectedFilteredCol.name} ({combinedItems.length})
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Add new items directly under this collection or attach existing store items.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowAssignModal(true)}
                className="bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Link2 className="w-4 h-4 text-emerald-700" /> Attach Existing Item
              </button>

              <button
                onClick={() => {
                  setEditingItem(null);
                  setProductTypeSelector("grocery");
                  setGroceryForm({ name: "", slug: "", categoryId: String(collectionCategories[0]?.id || ""), price: "", compareAtPrice: "", description: "", stock: 100, images: [], isActive: true });
                  setShowProductForm(true);
                }}
                className="bg-emerald-800 text-white hover:bg-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Grocery Item
              </button>

              <button
                onClick={() => {
                  setEditingItem(null);
                  setProductTypeSelector("dress");
                  setDressForm({ name: "", type: "ladies", description: "", price: "", compareAtPrice: "", images: [], sizes: ["Free Size"], colors: [], colorVariants: [], orderType: "add_to_bag", stock: 50, isActive: true });
                  setShowProductForm(true);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Traditional Dress
              </button>
            </div>
          </div>

          {/* Add / Edit Product Form Modal */}
          {showProductForm && (
            <form onSubmit={handleAddOrUpdateProductSubmit} className="bg-white border border-stone-200 p-6 md:p-8 rounded-2xl shadow-xl space-y-6 animate-slide-up">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${productTypeSelector === "dress" ? "bg-amber-500" : "bg-emerald-700"}`} />
                  <h3 className="font-bold text-stone-900 text-base">
                    {editingItem
                      ? `✏️ Edit Item: ${editingItem.name}`
                      : productTypeSelector === "dress"
                      ? `👗 Add Traditional Dress strictly to ${selectedFilteredCol.name}`
                      : `🛒 Add Grocery Item strictly to ${selectedFilteredCol.name}`}
                  </h3>
                </div>
                <button type="button" onClick={() => { setShowProductForm(false); setEditingItem(null); }} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {productTypeSelector === "grocery" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Target Category</label>
                      <select
                        value={groceryForm.categoryId}
                        onChange={(e) => setGroceryForm({ ...groceryForm, categoryId: e.target.value })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                      >
                        <option value="">Auto-Create General Category...</option>
                        {collectionCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            🏷️ {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Product Name *</label>
                      <input
                        required
                        value={groceryForm.name}
                        onChange={(e) => setGroceryForm({ ...groceryForm, name: e.target.value })}
                        placeholder="e.g. Fresh Coconut Oil"
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
                        placeholder="e.g. 5.99"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Compare Price (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={groceryForm.compareAtPrice}
                        onChange={(e) => setGroceryForm({ ...groceryForm, compareAtPrice: e.target.value })}
                        placeholder="e.g. 7.99"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white outline-none"
                      />
                    </div>
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
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{groceryUploading ? "Uploading..." : "Choose Image"}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleGroceryImageUpload} />
                        </label>
                        {groceryForm.images.length > 0 && (
                          <img src={groceryForm.images[0]} alt="" className="w-10 h-10 object-cover rounded-xl border border-stone-250" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Dress Type / Group *</label>
                      <select
                        value={dressForm.type}
                        onChange={(e: any) => {
                          const val = e.target.value;
                          setDressForm({
                            ...dressForm,
                            type: val,
                            sizes: val === "kids" ? ["22", "24", "26"] : ["Free Size", "M", "L", "XL"],
                          });
                        }}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                      >
                        <option value="ladies">👩 Women's Kasavu Saree & Set Mundu</option>
                        <option value="gents">👨 Men's Jubba & Kasavu Mundu</option>
                        <option value="kids">👶 Kids Festive Dress Set</option>
                        <option value="combo">👪 Family Matching Combo Set</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Dress Name *</label>
                      <input
                        required
                        value={dressForm.name}
                        onChange={(e) => setDressForm({ ...dressForm, name: e.target.value })}
                        placeholder="e.g. Traditional Golden zari Kerala Saree"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Price (£) *</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={dressForm.price}
                        onChange={(e) => setDressForm({ ...dressForm, price: e.target.value })}
                        placeholder="e.g. 45.00"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/65 space-y-3">
                    <label className="block text-xs font-semibold text-amber-900">
                      🎨 Color Variants & Images Setup:
                    </label>

                    {/* Quick Color Preset Buttons */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">⚡ Quick Add (tap to add color):</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: "Gold", bg: "#D4A843", text: "#fff" },
                          { name: "Kasavu White", bg: "#FFF8E7", text: "#333" },
                          { name: "Maroon", bg: "#800000", text: "#fff" },
                          { name: "Black", bg: "#1a1a1a", text: "#fff" },
                          { name: "White", bg: "#ffffff", text: "#333" },
                          { name: "Red", bg: "#DC2626", text: "#fff" },
                          { name: "Green", bg: "#166534", text: "#fff" },
                          { name: "Navy Blue", bg: "#1e3a5f", text: "#fff" },
                          { name: "Pink", bg: "#EC4899", text: "#fff" },
                          { name: "Purple", bg: "#7C3AED", text: "#fff" },
                          { name: "Orange", bg: "#EA580C", text: "#fff" },
                          { name: "Cream", bg: "#FFFDD0", text: "#333" },
                        ].map((preset) => {
                          const alreadyAdded = dressForm.colorVariants.some((v) => v.color === preset.name);
                          return (
                            <button
                              key={preset.name}
                              type="button"
                              disabled={alreadyAdded}
                              onClick={() => {
                                if (!alreadyAdded) {
                                  setDressForm((prev) => ({
                                    ...prev,
                                    colors: prev.colors.includes(preset.name) ? prev.colors : [...prev.colors, preset.name],
                                    colorVariants: [...prev.colorVariants, { color: preset.name, image: "", isDefault: false }],
                                  }));
                                }
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${
                                alreadyAdded
                                  ? "opacity-40 cursor-not-allowed border-stone-200"
                                  : "hover:scale-105 hover:shadow-md cursor-pointer border-stone-300"
                              }`}
                              style={{ backgroundColor: preset.bg, color: preset.text }}
                            >
                              {alreadyAdded ? "✓" : "+"} {preset.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Color Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        value={currentColorInput}
                        onChange={(e) => setCurrentColorInput(e.target.value)}
                        placeholder="Or type custom color name..."
                        className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (currentColorInput.trim()) {
                              const color = currentColorInput.trim();
                              setDressForm((prev) => ({
                                ...prev,
                                colors: prev.colors.includes(color) ? prev.colors : [...prev.colors, color],
                                colorVariants: [...prev.colorVariants, { color, image: "", isDefault: false }],
                              }));
                              setCurrentColorInput("");
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (currentColorInput.trim()) {
                            const color = currentColorInput.trim();
                            setDressForm((prev) => ({
                              ...prev,
                              colors: prev.colors.includes(color) ? prev.colors : [...prev.colors, color],
                              colorVariants: [...prev.colorVariants, { color, image: "", isDefault: false }],
                            }));
                            setCurrentColorInput("");
                          }
                        }}
                        className="bg-[#0b2416] text-white hover:bg-emerald-950 px-4 py-2 rounded-xl text-xs font-bold transition"
                      >
                        ➕ Add
                      </button>
                    </div>

                    {/* Added Variants Grid with Inline Image Upload */}
                    {dressForm.colorVariants.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                          Added Variants ({dressForm.colorVariants.length}):
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {dressForm.colorVariants.map((variant, idx) => (
                            <div key={idx} className="relative bg-white border border-stone-200 rounded-xl p-2 text-center text-xs shadow-xs space-y-1.5 group hover:border-emerald-300 transition">
                              {variant.image ? (
                                <div className="relative">
                                  <img src={variant.image} alt="" className="w-full h-20 object-cover rounded-lg" />
                                  <label className="absolute bottom-1 right-1 bg-white/90 text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer hover:bg-emerald-50 border border-stone-200">
                                    📷 Change
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const fd = new FormData();
                                        fd.append("file", file);
                                        fd.append("folder", "uploads/dresses");
                                        const res = await fetch("/api/upload", { method: "POST", body: fd });
                                        const data = await res.json();
                                        if (data.url) {
                                          setDressForm((prev) => {
                                            const newVariants = [...prev.colorVariants];
                                            newVariants[idx] = { ...newVariants[idx], image: data.url };
                                            return { ...prev, colorVariants: newVariants };
                                          });
                                        }
                                      }}
                                    />
                                  </label>
                                  {/* Default selection radio button */}
                                  <div className="mt-1 flex items-center justify-center">
                                    <label className="inline-flex items-center">
                                      <input type="radio" name="defaultVariant" checked={variant.isDefault} onChange={() => setDressForm(prev => ({
                                        ...prev,
                                        colorVariants: prev.colorVariants.map((v, i) => ({ ...v, isDefault: i === idx }))
                                      }))} className="form-radio h-4 w-4 text-emerald-600" />
                                      <span className="ml-1 text-xs text-emerald-700">Default</span>
                                    </label>
                                  </div>
                                </div>
                              ) : (
                                <label className="w-full h-20 bg-stone-50 border-2 border-dashed border-stone-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition">
                                  <ImageIcon className="w-5 h-5 text-stone-400 mb-1" />
                                  <span className="text-[10px] text-stone-500 font-semibold">📷 Upload Photo</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const fd = new FormData();
                                      fd.append("file", file);
                                      fd.append("folder", "uploads/dresses");
                                      const res = await fetch("/api/upload", { method: "POST", body: fd });
                                      const data = await res.json();
                                      if (data.url) {
                                        setDressForm((prev) => {
                                          const newVariants = [...prev.colorVariants];
                                          newVariants[idx] = { ...newVariants[idx], image: data.url };
                                          return { ...prev, colorVariants: newVariants };
                                        });
                                      }
                                    }}
                                  />
                                </label>
                              )}
                              <div className="font-bold text-stone-900 text-[11px]">{variant.color}</div>
                              <button
                                type="button"
                                onClick={() => removeColorVariant(idx)}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-stone-100">
                <button type="submit" className="bg-[#0b2416] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-950 transition">
                  {editingItem ? "Update Product" : "Save Product to Collection"}
                </button>
                <button type="button" onClick={() => { setShowProductForm(false); setEditingItem(null); }} className="bg-stone-100 text-stone-700 px-6 py-2.5 rounded-xl text-xs font-semibold hover:bg-stone-200 transition">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* UNIFIED PRODUCTS LIST STRICTLY UNDER THIS COLLECTION */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-150 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === "all" ? "bg-[#0b2416] text-white shadow-xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  All Items ({collectionProducts.length + collectionDresses.length})
                </button>
                <button
                  onClick={() => setActiveTab("grocery")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === "grocery" ? "bg-emerald-800 text-white shadow-xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  Grocery Items ({collectionProducts.length})
                </button>
                <button
                  onClick={() => setActiveTab("dress")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === "dress" ? "bg-amber-500 text-stone-950 shadow-xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  Traditional Outfits ({collectionDresses.length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter items..."
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white"
                />
              </div>
            </div>

            {/* Product Table */}
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase font-mono tracking-wider text-stone-500">
                    <th className="p-3">Product</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Price</th>
                    <th className="p-3 text-center">Stock / Variants</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {combinedItems.map((item: any) => {
                    const isGrocery = item.itemKind === "grocery";
                    const imgUrl = item.images && item.images[0] ? item.images[0] : null;

                    return (
                      <tr key={`${item.itemKind}-${item.id}`} className="hover:bg-stone-50/70 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {imgUrl ? (
                              <img src={imgUrl} alt="" className="w-12 h-12 object-cover rounded-xl border border-stone-200 shrink-0" />
                            ) : (
                              <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-mono text-[9px] shrink-0">
                                No Img
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-stone-400 font-mono">
                                /{item.slug || item.type}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          {isGrocery ? (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              🛒 Grocery
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              👗 Dress ({item.type})
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-stone-900">£{item.price}</div>
                          {item.compareAtPrice && (
                            <div className="text-[10px] text-stone-400 line-through">£{item.compareAtPrice}</div>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          {isGrocery ? (
                            <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-semibold text-[11px]">
                              {item.stock} in stock
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-semibold text-[11px] border border-amber-200/60">
                              {item.colorVariants?.length || 0} Colors
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditProduct(item)}
                              title="Edit Product Details"
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {!isGrocery && (
                              <button
                                onClick={() => unassignDressFromCollection(item.id)}
                                title="Remove from this Collection"
                                className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-semibold transition"
                              >
                                Remove
                              </button>
                            )}
                            <button
                              onClick={() => (isGrocery ? handleProductDelete(item.id) : handleDressDelete(item.id))}
                              title="Delete Item"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {combinedItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-stone-500">
                        <div className="max-w-sm mx-auto space-y-3">
                          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                            📦
                          </div>
                          <h4 className="font-bold text-stone-900 text-sm">No items currently inside {selectedFilteredCol.name}</h4>
                          <p className="text-xs text-stone-500">
                            Click "Add Grocery Item", "Add Traditional Dress", or "Attach Existing Item" to populate this collection.
                          </p>
                          <div className="flex justify-center gap-2 pt-2">
                            <button
                              onClick={() => setShowAssignModal(true)}
                              className="bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                            >
                              <Link2 className="w-3.5 h-3.5 inline mr-1" /> Attach Existing Item
                            </button>
                          </div>
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

      {/* ASSIGN EXISTING PRODUCT MODAL */}
      {showAssignModal && selectedFilteredCol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-scale-up max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-150 pb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-lg">
                  Attach Items to {selectedFilteredCol.name}
                </h3>
                <p className="text-xs text-stone-500">Select any product to attach it directly to this collection.</p>
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
                placeholder="Search products to attach..."
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-xl p-2 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase font-bold text-amber-800 bg-amber-50 rounded-lg">
                👗 Dress Outfits Available ({assignableDresses.length}):
              </div>
              {assignableDresses
                .filter((d) => !assignSearch || d.name.toLowerCase().includes(assignSearch.toLowerCase()))
                .map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-2.5 hover:bg-stone-50 rounded-xl transition">
                    <div className="flex items-center gap-3">
                      {d.images && d.images[0] ? (
                        <img src={d.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg border" />
                      ) : (
                        <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-xs">👗</div>
                      )}
                      <div>
                        <div className="font-bold text-stone-900 text-xs">{d.name}</div>
                        <div className="text-[10px] text-stone-500">£{d.price} • {d.type}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => assignDressToCollection(d.id, selectedFilteredCol.id)}
                      className="bg-emerald-800 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Attach
                    </button>
                  </div>
                ))}

              <div className="px-3 py-1.5 text-[10px] font-mono uppercase font-bold text-emerald-800 bg-emerald-50 rounded-lg mt-3">
                🛒 Grocery Items Available ({assignableProducts.length}):
              </div>
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
                      onClick={() => assignGroceryToCollection(p.id, selectedFilteredCol.id)}
                      className="bg-emerald-800 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Attach
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

export default function CollectionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-stone-500 font-mono text-xs">Loading Collections...</div>}>
      <CollectionsContent />
    </Suspense>
  );
}
