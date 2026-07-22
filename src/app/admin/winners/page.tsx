"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";

export default function WinnersPage() {
  const [winnersList, setWinnersList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", photo: "", prize: "", event: "", sortOrder: 0, isActive: true });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchWinners(); }, []);

  async function fetchWinners() {
    const res = await fetch("/api/winners");
    const data = await res.json();
    setWinnersList(data);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "uploads/winners");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setForm((f) => ({ ...f, photo: data.url }));
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await fetch("/api/winners", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, id: editing.id }) });
    } else {
      await fetch("/api/winners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setShowForm(false); setEditing(null);
    setForm({ name: "", photo: "", prize: "", event: "", sortOrder: 0, isActive: true });
    fetchWinners();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this winner?")) return;
    await fetch(`/api/winners?id=${id}`, { method: "DELETE" });
    fetchWinners();
  }

  function openEdit(w: any) {
    setEditing(w);
    setForm({ name: w.name, photo: w.photo || "", prize: w.prize, event: w.event, sortOrder: w.sortOrder || 0, isActive: w.isActive });
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Lucky Draw Winners</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", photo: "", prize: "", event: "", sortOrder: 0, isActive: true }); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Winner
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Prize</label><input required value={form.prize} onChange={(e) => setForm({ ...form, prize: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Event</label><input required value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} placeholder="Onam 2026" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Photo</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                <ImageIcon className="w-4 h-4" /><span className="text-sm">{uploading ? "Uploading..." : "Upload Photo"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {form.photo && <img src={form.photo} alt="" className="w-12 h-12 object-cover rounded-full" />}
            </div>
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
        {winnersList.map((w) => (
          <div key={w.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-slate-100 mb-4">
                {w.photo ? <img src={w.photo} alt={w.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🏆</div>}
              </div>
              <h3 className="font-semibold text-slate-900">{w.name}</h3>
              <p className="text-sm text-blue-600 mt-1">{w.prize}</p>
              <p className="text-xs text-slate-500 mt-1">{w.event}</p>
              <div className="flex gap-2 justify-center mt-4">
                <button onClick={() => openEdit(w)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(w.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
