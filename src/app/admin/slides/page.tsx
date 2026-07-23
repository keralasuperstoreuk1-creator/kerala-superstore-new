"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ImageIcon, Layers, FolderOpen, ExternalLink, Sparkles, Monitor, Smartphone } from "lucide-react";

export default function SlidesPage() {
  const [slides, setSlides] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image: "",
    link: "",
    buttonText: "Explore Collection",
    sortOrder: 0,
    width: 1920,
    height: 600,
    isActive: true,
    titleColor: "#ffffff",
    titleSize: "72",
    titleFont: "",
    subtitleColor: "#ffffffcc",
    subtitleSize: "20",
    subtitleFont: "",
    btnBgColor: "#f59e0b",
    btnTextColor: "#1c1917",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [slidesRes, colRes, catRes] = await Promise.all([
        fetch("/api/slides"),
        fetch("/api/collections"),
        fetch("/api/categories"),
      ]);
      const slidesData = await slidesRes.json();
      const colData = await colRes.json();
      const catData = await catRes.json();

      if (Array.isArray(slidesData)) setSlides(slidesData);
      if (Array.isArray(colData)) setCollections(colData);
      if (Array.isArray(catData)) setCategories(catData);
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
    fd.append("folder", "uploads/slides");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setForm((f) => ({ ...f, image: data.url }));
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form };
    if (editing) {
      await fetch("/api/slides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: editing.id }),
      });
    } else {
      await fetch("/api/slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setShowForm(false);
    setEditing(null);
    setForm({ title: "", subtitle: "", image: "", link: "", buttonText: "Explore Collection", sortOrder: 0, width: 1920, height: 600, isActive: true, titleColor: "#ffffff", titleSize: "72", titleFont: "", subtitleColor: "#ffffffcc", subtitleSize: "20", subtitleFont: "", btnBgColor: "#f59e0b", btnTextColor: "#1c1917" });
    fetchData();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this hero slide?")) return;
    await fetch(`/api/slides?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  function openEdit(s: any) {
    setEditing(s);
    setForm({
      title: s.title || "",
      subtitle: s.subtitle || "",
      image: s.image || "",
      link: s.link || "",
      buttonText: s.buttonText || "Explore Collection",
      sortOrder: s.sortOrder || 0,
      width: s.width || 1920,
      height: s.height || 600,
      isActive: s.isActive ?? true,
      titleColor: s.titleColor || "#ffffff",
      titleSize: s.titleSize || "72",
      titleFont: s.titleFont || "",
      subtitleColor: s.subtitleColor || "#ffffffcc",
      subtitleSize: s.subtitleSize || "20",
      subtitleFont: s.subtitleFont || "",
      btnBgColor: s.btnBgColor || "#f59e0b",
      btnTextColor: s.btnTextColor || "#1c1917",
    });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-forest-700/70 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Hero Carousel Banner Manager
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-forest-900">
            Hero Slides & Banners ({slides.length})
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Manage main homepage slides, set exact photo sizes (1920x600 px), and link the "Explore" button to any Collection!
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
    setForm({ title: "", subtitle: "", image: "", link: "", buttonText: "Explore Collection", sortOrder: 0, width: 1920, height: 600, isActive: true, titleColor: "#ffffff", titleSize: "72", titleFont: "", subtitleColor: "#ffffffcc", subtitleSize: "20", subtitleFont: "", btnBgColor: "#f59e0b", btnTextColor: "#1c1917" });
          }}
          className="flex items-center gap-2 bg-forest-900 text-white px-5 py-2.5 rounded-xl hover:bg-forest-800 transition font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Hero Slide
        </button>
      </div>

      {/* Recommended Photo Size Guidance Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-forest-900 to-amber-950 text-white p-5 rounded-2xl shadow-md border border-emerald-800/40 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
          📐 RECOMMENDED HERO BANNER PHOTO DIMENSIONS & SIZES
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-amber-400" /> Desktop Hero Banner (Recommended)
            </div>
            <div className="text-emerald-100 font-mono font-bold text-sm">1920 x 600 px</div>
            <div className="text-emerald-200/80 text-[11px]">Aspect ratio: 16:5 (Ultra Wide). Ideal for high-definition desktop displays.</div>
          </div>

          <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1">
            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" /> Mobile / Tablet Banner
            </div>
            <div className="text-emerald-100 font-mono font-bold text-sm">800 x 600 px</div>
            <div className="text-emerald-200/80 text-[11px]">Aspect ratio: 4:3. Ideal for crisp mobile screen displays.</div>
          </div>

          <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1">
            <div className="font-semibold text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" /> Best Format & Quality
            </div>
            <div className="text-emerald-100 font-mono font-bold text-sm">JPG / WebP / PNG</div>
            <div className="text-emerald-200/80 text-[11px]">Keep file size under 1MB for instant fast loading.</div>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-xl space-y-5 animate-slide-up">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h2 className="font-display text-xl font-semibold text-forest-900">
              {editing ? "Edit Hero Slide" : "Add New Hero Slide"}
            </h2>
            <span className="text-xs font-mono text-stone-400">Slide & Explore Link Config</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Slide Main Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Up to 40% OFF on Festive Attire"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-forest-600 outline-none transition text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Button Text</label>
              <input
                value={form.buttonText}
                onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                placeholder="e.g. Explore Collection"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-forest-600 outline-none transition text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Subtitle / Highlight Text</label>
            <textarea
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="e.g. Hand-picked Kerala silk sarees, Kasavu shirt sets, and kids festive attire."
              rows={2}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-forest-600 outline-none transition text-sm"
            />
          </div>

          <div className="bg-slate-50 border border-stone-200 p-4 rounded-xl space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Text Styling</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-stone-500 mb-1">Title Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.titleColor || "#ffffff"} onChange={(e) => setForm({ ...form, titleColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                  <input value={form.titleColor || ""} onChange={(e) => setForm({ ...form, titleColor: e.target.value })} className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-500 mb-1">Title Font Size: <span className="text-forest-700 font-bold">{form.titleSize || 72}px</span></label>
                <input type="range" min="24" max="120" step="2" value={form.titleSize || 72} onChange={(e) => setForm({ ...form, titleSize: e.target.value })} className="w-full accent-forest-600" />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-500 mb-1">Title Font Family</label>
                <select value={form.titleFont || ""} onChange={(e) => setForm({ ...form, titleFont: e.target.value })} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm">
                  <option value="">Default (Editorial)</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Oswald">Oswald</option>
                  <option value="Raleway">Raleway</option>
                  <option value="Bebas Neue">Bebas Neue</option>
                  <option value="Lora">Lora</option>
                  <option value="Merriweather">Merriweather</option>
                  <option value="Abril Fatface">Abril Fatface</option>
                  <option value="Righteous">Righteous</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-stone-500 mb-1">Subtitle Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={(form.subtitleColor || "#ffffff").slice(0, 7)} onChange={(e) => setForm({ ...form, subtitleColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                  <input value={form.subtitleColor || ""} onChange={(e) => setForm({ ...form, subtitleColor: e.target.value })} className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-500 mb-1">Subtitle Font Size: <span className="text-forest-700 font-bold">{form.subtitleSize || 20}px</span></label>
                <input type="range" min="12" max="36" step="1" value={form.subtitleSize || 20} onChange={(e) => setForm({ ...form, subtitleSize: e.target.value })} className="w-full accent-forest-600" />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-500 mb-1">Subtitle Font Family</label>
                <select value={form.subtitleFont || ""} onChange={(e) => setForm({ ...form, subtitleFont: e.target.value })} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm">
                  <option value="">Default (Inter)</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Lato">Lato</option>
                  <option value="Nunito">Nunito</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Raleway">Raleway</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-stone-500 mb-1">Button Background</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.btnBgColor || "#f59e0b"} onChange={(e) => setForm({ ...form, btnBgColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                  <input value={form.btnBgColor || ""} onChange={(e) => setForm({ ...form, btnBgColor: e.target.value })} className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-500 mb-1">Button Text Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.btnTextColor || "#1c1917"} onChange={(e) => setForm({ ...form, btnTextColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                  <input value={form.btnTextColor || ""} onChange={(e) => setForm({ ...form, btnTextColor: e.target.value })} className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono" />
                </div>
              </div>
              <div></div>
            </div>
          </div>

          {/* DYNAMIC EXPLORE BUTTON TARGET COLLECTION SELECTOR */}
          <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-900">
                🔗 Explore Button Link Target (When clicked, navigate to collection:)
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-stone-500 mb-1">Select Collection or Category Target:</label>
                <select
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-medium text-amber-950 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">Select Target Collection...</option>

                  <optgroup label="📁 Collections">
                    {collections.map((col) => (
                      <option key={col.id} value={`#collection-${col.slug}`}>
                        📁 {col.name} ({col.orderType === "pre_order" ? "Pre-Order" : "Add to Bag"})
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="🏷️ Categories">
                    {categories.map((cat) => (
                      <option key={cat.id} value={`#category-${cat.slug}`}>
                        🏷️ {cat.name}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="⚡ Quick Website Sections">
                    <option value="#onam">🎉 Onam Dress Collection</option>
                    <option value="#fresh">🌿 Fresh Kerala Vegetables</option>
                    <option value="#frozen">❄️ Frozen Delights</option>
                    <option value="#snacks">🍪 Kerala Snacks</option>
                    <option value="#products">🛒 All Storefront Products</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-500 mb-1">Or Type Custom URL / Link:</label>
                <input
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="e.g. #collection-onam-dresses or /admin/dresses"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm font-mono focus:bg-white outline-none"
                />
              </div>
            </div>
            {form.link && (
              <div className="text-xs font-mono text-amber-900 bg-white/80 px-3 py-1.5 rounded-lg border border-amber-200 inline-flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-amber-600" /> Slide Explore Link Set To: <strong>{form.link}</strong>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Slide Photo *</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 text-xs font-semibold text-stone-700">
                  <ImageIcon className="w-4 h-4 text-forest-700" />
                  <span>{uploading ? "Uploading..." : "Upload Slide Photo"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {form.image && <img src={form.image} alt="" className="w-16 h-10 object-cover rounded-xl border border-stone-200" />}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Width (px)</label>
              <input
                type="number"
                value={form.width}
                onChange={(e) => setForm({ ...form, width: parseInt(e.target.value) || 1920 })}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Height (px)</label>
              <input
                type="number"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: parseInt(e.target.value) || 600 })}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none text-sm font-mono"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="slideActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 text-forest-700 rounded focus:ring-forest-600"
              />
              <label htmlFor="slideActive" className="text-sm font-medium text-stone-700">
                Active (Visible on Homepage Carousel)
              </label>
            </div>
          </div>

          <div className="flex gap-3 border-t border-stone-100 pt-4">
            <button type="submit" className="bg-forest-900 text-white px-6 py-2.5 rounded-xl hover:bg-forest-800 transition font-medium shadow-sm">
              {editing ? "Update Slide" : "Save Hero Slide"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-stone-100 text-stone-700 px-6 py-2.5 rounded-xl hover:bg-stone-200 transition font-medium">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Slides Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slides.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition">
            <div 
              className="relative aspect-[16/6] bg-stone-900 overflow-hidden cursor-pointer"
              onClick={() => openEdit(s)}
            >
              {s.image ? (
                <img src={s.image} alt={s.title || ""} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-800 to-forest-950 flex items-center justify-center text-stone-400 font-mono text-xs">
                  No Image
                </div>
              )}
              <div className="absolute top-2 right-2 bg-black/75 text-white font-mono text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs">
                {s.width || 1920} x {s.height || 600} px
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-semibold text-stone-900 text-base">{s.title || "Untitled Slide"}</h3>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">{s.subtitle}</p>

                {s.link && (
                  <div className="mt-2 text-[11px] font-mono text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-flex items-center gap-1">
                    <ExternalLink className="w-3 h-3 text-amber-600" /> Target: {s.link}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.isActive !== false ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>
                  {s.isActive !== false ? "Active" : "Inactive"}
                </span>

                <div className="flex gap-2">
                  <button onClick={() => openEdit(s)} title="Edit Slide" className="p-2 text-forest-700 hover:bg-stone-100 rounded-xl transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} title="Delete Slide" className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {slides.length === 0 && (
          <div className="col-span-full bg-white p-8 text-center rounded-2xl border border-stone-200 text-stone-500 italic">
            No hero slides found. Click "+ Add Hero Slide" above to create your first homepage carousel slide!
          </div>
        )}
      </div>
    </div>
  );
}
