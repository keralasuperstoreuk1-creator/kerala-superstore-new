"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ImageIcon, X } from "lucide-react";

export default function OffersPage() {
  const [offersList, setOffersList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", emoji: "🎁", tag: "SPECIAL", oldPrice: "", newPrice: "", discount: "", image: "", sortOrder: 0, isActive: true });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchOffers(); }, []);

  async function fetchOffers() {
    const res = await fetch("/api/offers");
    const data = await res.json();
    setOffersList(data);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "uploads/offers");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setForm((f) => ({ ...f, image: data.url }));
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, oldPrice: form.oldPrice, newPrice: form.newPrice };
    if (editing) {
      await fetch("/api/offers", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editing.id }) });
    } else {
      await fetch("/api/offers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setShowForm(false); setEditing(null);
    setForm({ name: "", emoji: "🎁", tag: "SPECIAL", oldPrice: "", newPrice: "", discount: "", image: "", sortOrder: 0, isActive: true });
    fetchOffers();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this offer?")) return;
    await fetch(`/api/offers?id=${id}`, { method: "DELETE" });
    fetchOffers();
  }

  function openEdit(o: any) {
    setEditing(o);
    setForm({ name: o.name, emoji: o.emoji || "🎁", tag: o.tag || "SPECIAL", oldPrice: String(o.oldPrice), newPrice: String(o.newPrice), discount: o.discount || "", image: o.image || "", sortOrder: o.sortOrder || 0, isActive: o.isActive });
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Today's Offers</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", emoji: "🎁", tag: "SPECIAL", oldPrice: "", newPrice: "", discount: "", image: "", sortOrder: 0, isActive: true }); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Offer
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Emoji</label><input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Tag</label><input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Old Price</label><input required type="number" step="0.01" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">New Price</label><input required type="number" step="0.01" value={form.newPrice} onChange={(e) => setForm({ ...form, newPrice: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Discount Text</label><input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="-30%" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                  <ImageIcon className="w-4 h-4" /><span className="text-sm">{uploading ? "Uploading..." : "Upload"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {form.image && <img src={form.image} alt="" className="w-12 h-12 object-cover rounded-lg" />}
              </div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
            <label className="text-sm text-slate-700">Active</label>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">{editing ? "Update" : "Create"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offersList.map((o) => (
          <div key={o.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="h-40 bg-slate-100 relative">
              {o.image ? <img src={o.image} alt={o.name} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-6xl">{o.emoji}</div>}
              {o.discount && <span className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-bold">{o.discount}</span>}
            </div>
            <div className="p-4">
              <span className="text-xs font-semibold text-blue-600">{o.tag}</span>
              <h3 className="font-semibold text-slate-900 mt-1">{o.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-bold text-slate-900">£{o.newPrice}</span>
                <span className="text-sm text-slate-400 line-through">£{o.oldPrice}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(o)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(o.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
