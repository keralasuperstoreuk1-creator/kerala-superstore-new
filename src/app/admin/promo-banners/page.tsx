"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ImageIcon, ArrowUp, ArrowDown } from "lucide-react";

export default function PromoBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ image: "", link: "", sortOrder: 0 });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchBanners(); }, []);

  async function fetchBanners() {
    const res = await fetch("/api/promo-banners");
    const data = await res.json();
    if (Array.isArray(data)) setBanners(data);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "promo-banners");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setForm((f) => ({ ...f, image: data.url }));
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.image) { alert("Please upload a banner image"); return; }
    const payload = { ...form, sortOrder: banners.length };
    try {
      let res;
      if (editing) {
        res = await fetch("/api/promo-banners", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...form }) });
      } else {
        res = await fetch("/api/promo-banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      if (!res.ok) { alert("Save failed"); return; }
    } catch { alert("Network error"); return; }
    setShowForm(false);
    setEditing(null);
    setForm({ image: "", link: "", sortOrder: 0 });
    fetchBanners();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this banner?")) return;
    await fetch(`/api/promo-banners?id=${id}`, { method: "DELETE" });
    fetchBanners();
  }

  function openEdit(b: any) {
    setEditing(b);
    setForm({ image: b.image, link: b.link || "", sortOrder: b.sortOrder || 0 });
    setShowForm(true);
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Promo Banners ({banners.length})</h1>
          <p className="text-sm text-stone-500 mt-1">Auto-sliding banners above Onam Collection</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ image: "", link: "", sortOrder: 0 }); }} className="flex items-center gap-2 bg-amber-500 text-stone-950 px-4 py-2 rounded-xl hover:bg-amber-400 font-bold text-xs transition shadow-sm">
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 animate-slide-up">
          <h2 className="font-bold text-lg">{editing ? "Edit Banner" : "New Banner"}</h2>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Banner Image *</label>
            {form.image ? (
              <div className="relative w-full h-40 bg-stone-100 rounded-xl overflow-hidden border mb-2">
                <img src={form.image} alt="Banner" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setForm({ ...form, image: "" })} className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold">Remove</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 bg-stone-50 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:bg-stone-100">
                <ImageIcon className="w-8 h-8 text-stone-400 mb-2" />
                <span className="text-xs text-stone-500">{uploading ? "Uploading..." : "Click to upload image"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Link URL (optional)</label>
            <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="e.g. #dresses or /products/something" className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-emerald-700 text-white px-5 py-2 rounded-xl hover:bg-emerald-800 font-bold text-xs transition">{editing ? "Update" : "Save Banner"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-stone-100 text-stone-600 px-5 py-2 rounded-xl hover:bg-stone-200 font-bold text-xs transition">Cancel</button>
          </div>
        </form>
      )}

      {/* Grid of banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.map((b, idx) => (
          <div key={b.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm group">
            <div className="aspect-[3/1] bg-stone-100 relative">
              <img src={b.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="text-xs text-stone-500">#{idx + 1}{b.link ? ` • ${b.link}` : ""}</div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(b)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                <button onClick={() => handleDelete(b.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && !showForm && (
          <div className="col-span-full text-center py-12 text-stone-500 bg-white rounded-2xl border border-stone-200">
            No promo banners yet. Click "Add Banner" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
