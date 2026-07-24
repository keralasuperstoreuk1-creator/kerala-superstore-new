"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "" });
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || "Registration failed");
    localStorage.setItem("kerala_user", JSON.stringify(data));
    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-stone-200 max-w-md w-full space-y-4 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">Create Account</h1>
        {msg && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{msg}</p>}
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm" />
        <input required type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm" />
        <input required type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm" />
        <input required type="password" placeholder="Password *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm" />
        <button type="submit" className="w-full bg-emerald-700 text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-800 transition">Sign Up</button>
        <p className="text-xs text-stone-500 text-center">Already have an account? <Link href="/login" className="text-emerald-700 font-semibold">Login</Link></p>
      </form>
    </div>
  );
}
