"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit3, X, Check, Users, Shield } from "lucide-react";

type AdminUser = { id: number; name: string; email: string; phone: string | null; isActive: boolean | null; createdAt: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin-app/users");
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch {}
    setLoading(false);
  };

  const openCreate = () => { setEditUser(null); setName(""); setEmail(""); setPassword(""); setError(""); setShowForm(true); };

  const openEdit = (u: AdminUser) => { setEditUser(u); setName(u.name); setEmail(u.email); setPassword(""); setError(""); setShowForm(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || (!editUser && !password)) { setError("Fill all required fields"); return; }
    setSaving(true); setError("");
    try {
      if (editUser) {
        const res = await fetch(`/api/admin-app/users/${editUser.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, password: password || undefined }),
        });
        const data = await res.json();
        if (data.error) { setError(data.error); setSaving(false); return; }
      } else {
        const res = await fetch("/api/admin-app/users", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (data.error) { setError(data.error); setSaving(false); return; }
      }
      setShowForm(false); fetchUsers();
    } catch { setError("Failed to save"); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    try {
      await fetch(`/api/admin-app/users/${id}`, { method: "DELETE" });
      fetchUsers();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2"><Users className="w-6 h-6 text-emerald-700" /> Manage Admin Users</h1>
          <p className="text-sm text-stone-500 mt-1">Create and manage users for the Admin App (mobile)</p>
        </div>
        <button onClick={openCreate} className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition"><Plus className="w-4 h-4" /> Add User</button>
      </div>

      {/* User List */}
      {loading ? (
        <div className="text-center py-12 text-stone-400"><p>Loading...</p></div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">No users yet. Click "Add User" to create one.</p></div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold">{u.name.charAt(0)}</div>
                <div>
                  <p className="font-medium text-stone-900">{u.name}</p>
                  <p className="text-xs text-stone-500">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(u)} className="p-2 hover:bg-stone-100 rounded-xl text-stone-500"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-red-50 rounded-xl text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-900">{editUser ? "Edit User" : "Add New User"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-stone-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3.5">
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Name *</label><input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-400" /></div>
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Email *</label><input required disabled={!!editUser} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-stone-100" /></div>
              <div><label className="block text-sm font-medium text-stone-700 mb-1">{editUser ? "New Password (leave blank to keep)" : "Password *"} {!editUser && "<span class='text-red-500'>*</span>"}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-400" placeholder={editUser ? "Leave blank to keep current" : "Min 6 characters"} /></div>
              {error && <p className="text-red-600 text-xs">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-stone-300 text-sm font-medium text-stone-700">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold transition disabled:opacity-50">{saving ? "Saving..." : editUser ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        <p className="font-bold flex items-center gap-2"><Shield className="w-4 h-4" /> Login Credentials</p>
        <p className="text-xs mt-1">Users can login to <strong>/admin-app</strong> with their email and password. Default 5 accounts (rajesh@, priya@, suresh@, anitha@, vishnu@) are auto-created on first login.</p>
      </div>
    </div>
  );
}
