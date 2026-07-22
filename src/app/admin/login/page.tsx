"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, ArrowRight } from "lucide-react";

// Simple password-based auth (in production, use proper auth library)
// Default password: admin123
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");

    // Simple check - in production use bcrypt and proper sessions
    if (password === ADMIN_PASSWORD) {
      // Store auth token in sessionStorage
      sessionStorage.setItem("admin_auth", "true");
      router.push("/admin");
    } else {
      setError("Incorrect password. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf7f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/30 mb-5">
            <span className="font-display text-4xl font-bold text-forest-900">K</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-[#0b2416]">Kerala Super Store</h1>
          <p className="text-stone-600 mt-2">Admin Console · Sign In</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-stone-200 shadow-xl p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#0b2416] mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-forest-500 focus:border-forest-500 outline-none transition font-sans"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-[#0b2416] text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-900 transition shadow-lg shadow-forest-900/20 disabled:opacity-50"
          >
            {loading ? "Signing in…" : <>
              <Shield className="w-5 h-5" /> Sign In
            </>}
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="mt-6 pt-6 border-t border-stone-200 text-center text-xs text-stone-500">
            <p>Default password: <code className="bg-stone-100 px-2 py-0.5 rounded">admin123</code></p>
            <p className="mt-2">In production, set ADMIN_PASSWORD in .env and remove this hint.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
