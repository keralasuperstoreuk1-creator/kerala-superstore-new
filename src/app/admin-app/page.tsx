"use client";
import { useEffect, useState, useCallback } from "react";
import { Store, Bell, Package, TrendingUp, CheckCircle, Truck, Search, LogOut, Clock, ChevronLeft, ArrowLeft, Mail, Lock, UserPlus, KeyRound } from "lucide-react";

type AdminUser = { id: number; name: string; email: string; phone: string | null };
type OrderItem = { id: number; itemName: string; variantName: string | null; quantity: number; price: string; imageUrl: string | null; total: string };
type Order = { id: number; orderNumber: string; customerName: string; customerPhone: string; customerEmail: string | null; address: string; totalAmount: string; status: string; createdAt: string; items: OrderItem[] };
type Stats = { totalOrders: number; totalRevenue: number; pendingOrders: number; deliveredOrders: number; todayOrders: number; todayRevenue: number; daily: Record<string, { orders: number; revenue: number }>; monthly: Record<string, { orders: number; revenue: number }> };

export default function AdminAppPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [view, setView] = useState<"login" | "signup" | "forgot" | "reset">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup fields
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState("");

  // Reset password fields
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");

  // Dashboard fields
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "stats">("orders");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("admin_app_user");
    if (stored) setAdmin(JSON.parse(stored));
    const params = new URLSearchParams(window.location.search);
    const reset = params.get("reset");
    if (reset) { setResetToken(reset); setView("reset"); }
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin-app/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      localStorage.setItem("admin_app_user", JSON.stringify(data));
      setAdmin(data);
    } catch { setError("Login failed"); }
    setLoading(false);
  };

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/admin-app/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setSuccess("Account created! Please login.");
      setTimeout(() => setView("login"), 1500);
    } catch { setError("Registration failed"); }
    setLoading(false);
  };

  const forgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/admin-app/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      if (data.devMode && data.resetUrl) {
        setSuccess(`Reset link: ${data.resetUrl}`);
      } else {
        setSuccess(data.message || "If the email exists, a reset link has been sent.");
      }
    } catch { setError("Failed to process"); }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/admin-app/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: resetPassword }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setSuccess("Password reset! Please login.");
      setTimeout(() => { setView("login"); window.history.replaceState({}, "", "/admin-app"); }, 1500);
    } catch { setError("Failed to reset"); }
    setLoading(false);
  };

  const logout = () => { localStorage.removeItem("admin_app_user"); setAdmin(null); setLoginEmail(""); setLoginPassword(""); };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin-app/orders" + (statusFilter !== "all" ? `?status=${statusFilter}` : ""));
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch {}
  }, [statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin-app/stats");
      const data = await res.json();
      if (data.monthly) setStats(data);
    } catch {}
  }, []);

  useEffect(() => { if (admin) { fetchOrders(); fetchStats(); } }, [admin, fetchOrders, fetchStats]);
  useEffect(() => { if (!admin) return; setNewOrdersCount(orders.filter((o) => o.status === "pending").length); }, [orders, admin]);

  useEffect(() => {
    if (!admin) return;
    const interval = setInterval(() => { fetchOrders(); fetchStats(); }, 30000);
    return () => clearInterval(interval);
  }, [admin, fetchOrders, fetchStats]);

  const updateStatus = async (orderId: number, newStatus: string) => {
    setUpdating(true);
    try {
      await fetch(`/api/admin-app/orders/${orderId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchOrders();
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch {}
    setUpdating(false);
  };

  const filteredOrders = orders.filter((o) => {
    if (searchQuery) { const q = searchQuery.toLowerCase(); return o.customerName.toLowerCase().includes(q) || o.orderNumber.toLowerCase().includes(q) || o.customerPhone.includes(q); }
    return true;
  });

  const statusBadge = (status: string) => {
    const s: Record<string, string> = { pending: "bg-amber-100 text-amber-800", confirmed: "bg-blue-100 text-blue-800", processing: "bg-purple-100 text-purple-800", delivered: "bg-emerald-100 text-emerald-800", cancelled: "bg-red-100 text-red-800" };
    return s[status] || "bg-stone-100 text-stone-800";
  };

  // Auth screens (login/signup/forgot/reset)
  if (!admin) {
    const AuthCard = ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) => (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-stone-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3"><Store className="w-7 h-7 text-emerald-300" /></div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-emerald-200/70 text-xs mt-1">{subtitle}</p>}
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10">{children}</div>
        </div>
      </div>
    );

    const Input = ({ label, type, value, onChange, placeholder, icon }: any) => (
      <div>
        <label className="block text-xs font-medium text-emerald-200 mb-1.5">{label}</label>
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300/50">{icon}</div>}
          <input type={type} required value={value} onChange={onChange} className={`w-full ${icon ? "pl-9" : "px-4"} py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-emerald-400`} placeholder={placeholder} />
        </div>
      </div>
    );

    if (view === "signup") {
      return (
        <AuthCard title="Create Account" subtitle="Register as an admin">
          <form onSubmit={signup} className="space-y-3.5">
            <Input label="Full Name" type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Your name" icon={<UserPlus className="w-4 h-4" />} />
            <Input label="Email" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="admin@email.com" icon={<Mail className="w-4 h-4" />} />
            <Input label="Password (min 6 characters)" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="••••••••" icon={<Lock className="w-4 h-4" />} />
            {error && <p className="text-red-300 text-xs text-center">{error}</p>}
            {success && <p className="text-emerald-300 text-xs text-center">{success}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-900 font-bold text-sm transition disabled:opacity-50">{loading ? "Creating..." : "Sign Up"}</button>
            <p className="text-center text-xs text-emerald-200/60">Already have an account? <button type="button" onClick={() => { setView("login"); setError(""); setSuccess(""); }} className="text-emerald-300 font-semibold underline">Login</button></p>
          </form>
        </AuthCard>
      );
    }

    if (view === "forgot") {
      return (
        <AuthCard title="Forgot Password" subtitle="Enter your email to reset">
          <form onSubmit={forgotPassword} className="space-y-3.5">
            <Input label="Email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="admin@email.com" icon={<Mail className="w-4 h-4" />} />
            {error && <p className="text-red-300 text-xs text-center">{error}</p>}
            {success && <p className="text-emerald-300 text-xs text-center">{success}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-900 font-bold text-sm transition disabled:opacity-50">{loading ? "Sending..." : "Send Reset Link"}</button>
            <p className="text-center text-xs text-emerald-200/60"><button type="button" onClick={() => { setView("login"); setError(""); setSuccess(""); }} className="text-emerald-300 font-semibold underline">Back to Login</button></p>
          </form>
        </AuthCard>
      );
    }

    if (view === "reset") {
      return (
        <AuthCard title="Reset Password" subtitle="Enter your new password">
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <Input label="New Password (min 6 characters)" type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="••••••••" icon={<KeyRound className="w-4 h-4" />} />
            {error && <p className="text-red-300 text-xs text-center">{error}</p>}
            {success && <p className="text-emerald-300 text-xs text-center">{success}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-900 font-bold text-sm transition disabled:opacity-50">{loading ? "Resetting..." : "Reset Password"}</button>
          </form>
        </AuthCard>
      );
    }

    // Login view (default)
    return (
      <AuthCard title="Admin App" subtitle="Kerala Super Store">
        <form onSubmit={login} className="space-y-3.5">
          <Input label="Email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="admin@keralasuperstore.com" icon={<Mail className="w-4 h-4" />} />
          <Input label="Password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" icon={<Lock className="w-4 h-4" />} />
          {error && <p className="text-red-300 text-xs text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-900 font-bold text-sm transition disabled:opacity-50">{loading ? "Logging in..." : "Login"}</button>
          <div className="flex justify-between text-xs text-emerald-200/60">
            <button type="button" onClick={() => { setView("signup"); setError(""); }} className="text-emerald-300 font-semibold underline">Sign Up</button>
            <button type="button" onClick={() => { setView("forgot"); setError(""); }} className="text-emerald-300 font-semibold underline">Forgot Password?</button>
          </div>
        </form>
      </AuthCard>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <div className="sticky top-0 z-50 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-emerald-700" />
          <span className="font-bold text-stone-900 text-sm">{admin.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {newOrdersCount > 0 && (
            <span className="relative"><Bell className="w-5 h-5 text-amber-600" /><span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{newOrdersCount}</span></span>
          )}
          <button onClick={logout} className="text-xs text-stone-500 flex items-center gap-1"><LogOut className="w-3.5 h-3.5" /> Logout</button>
        </div>
      </div>

      <div className="flex border-b border-stone-200 bg-white sticky top-14 z-40">
        <button onClick={() => setActiveTab("orders")} className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition ${activeTab === "orders" ? "border-emerald-700 text-emerald-800" : "border-transparent text-stone-500"}`}><Package className="w-4 h-4 inline mr-1" />Orders {newOrdersCount > 0 && `(${newOrdersCount})`}</button>
        <button onClick={() => setActiveTab("stats")} className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition ${activeTab === "stats" ? "border-emerald-700 text-emerald-800" : "border-transparent text-stone-500"}`}><TrendingUp className="w-4 h-4 inline mr-1" />Reports</button>
      </div>

      {activeTab === "orders" && (
        <div className="p-3 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search orders..." className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm outline-none">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-stone-400"><Package className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">No orders found</p></div>
          ) : filteredOrders.map((order) => (
            <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-3 cursor-pointer active:scale-[0.99] transition">
              <div className="flex items-start justify-between">
                <div><p className="font-bold text-stone-900 text-sm">#{order.orderNumber}</p><p className="text-xs text-stone-500">{new Date(order.createdAt).toLocaleString()}</p></div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusBadge(order.status)}`}>{order.status}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">{order.customerName.charAt(0)}</div>
                <div><p className="font-medium text-stone-900 text-sm">{order.customerName}</p><p className="text-xs text-stone-500">{order.customerPhone}</p></div>
              </div>
              {order.items?.slice(0, 2).map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 bg-stone-50 rounded-xl p-2">
                  {item.imageUrl && <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0"><p className="text-xs font-medium text-stone-900 truncate">{item.itemName}</p><p className="text-[10px] text-stone-500">{item.variantName} x{item.quantity}</p></div>
                  <p className="text-xs font-bold text-stone-900">£{item.price}</p>
                </div>
              ))}
              {order.items?.length > 2 && <p className="text-xs text-stone-400 text-center">+{order.items.length - 2} more items</p>}
              <div className="flex justify-between items-center pt-1 border-t border-stone-100"><span className="text-xs text-stone-500">Total</span><span className="font-bold text-stone-900">£{parseFloat(order.totalAmount).toFixed(2)}</span></div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "stats" && stats && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-700 rounded-2xl p-4 text-white shadow-sm">
              <p className="text-emerald-200 text-xs font-medium">Today's Orders</p>
              <p className="text-3xl font-bold mt-1">{stats.todayOrders}</p>
              <p className="text-emerald-200/70 text-xs mt-1">£{stats.todayRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
              <p className="text-stone-500 text-xs font-medium">Pending</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingOrders}</p>
              <p className="text-stone-400 text-xs mt-1">awaiting action</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-xs text-stone-500">Total Orders</p><p className="text-xl font-bold text-stone-900">{stats.totalOrders}</p></div>
              <div><p className="text-xs text-stone-500">Delivered</p><p className="text-xl font-bold text-emerald-700">{stats.deliveredOrders}</p></div>
              <div><p className="text-xs text-stone-500">Revenue</p><p className="text-xl font-bold text-stone-900">£{(stats.totalRevenue).toFixed(0)}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
            <h3 className="font-bold text-stone-900 text-sm mb-3">Monthly Report</h3>
            <div className="space-y-2">
              {Object.entries(stats.monthly).reverse().map(([month, data]) => (
                <div key={month} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                  <span className="text-sm font-medium text-stone-900">{month}</span>
                  <div className="text-right"><span className="text-sm font-bold text-stone-900">{data.orders} orders</span><span className="text-xs text-stone-500 ml-2">£{data.revenue.toFixed(2)}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
            <h3 className="font-bold text-stone-900 text-sm mb-3">Daily Report</h3>
            <div className="space-y-2">
              {Object.entries(stats.daily).reverse().slice(0, 14).map(([day, data]) => (
                <div key={day} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                  <span className="text-sm text-stone-700">{day}</span>
                  <div className="text-right"><span className="text-sm font-medium text-stone-900">{data.orders} orders</span><span className="text-xs text-stone-500 ml-2">£{data.revenue.toFixed(2)}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-stone-100 px-5 py-4 flex items-center justify-between z-10">
              <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-stone-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
              <h2 className="font-bold text-sm text-stone-900">Order #{selectedOrder.orderNumber}</h2>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusBadge(selectedOrder.status)}`}>{selectedOrder.status}</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-stone-50 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Customer</p>
                <p className="font-bold text-stone-900">{selectedOrder.customerName}</p>
                <p className="text-sm text-stone-600">{selectedOrder.customerPhone}</p>
                {selectedOrder.customerEmail && <p className="text-sm text-stone-600">{selectedOrder.customerEmail}</p>}
                <p className="text-sm text-stone-600">{selectedOrder.address}</p>
                <p className="text-xs text-stone-500">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <div><p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Items ({selectedOrder.items.length})</p></div>
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl p-3">
                  {item.imageUrl && <img src={item.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 text-sm">{item.itemName}</p>
                    <p className="text-xs text-stone-500">{item.variantName || ""}</p>
                    <p className="text-xs text-stone-500">Qty: {item.quantity} × £{item.price}</p>
                  </div>
                  <p className="font-bold text-stone-900">£{parseFloat(item.total || item.price).toFixed(2)}</p>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 border-t border-stone-200">
                <span className="font-bold text-stone-900">Total</span>
                <span className="text-lg font-bold text-emerald-800">£{parseFloat(selectedOrder.totalAmount).toFixed(2)}</span>
              </div>
              <div className="space-y-2 pt-2">
                {selectedOrder.status === "pending" && <button onClick={() => updateStatus(selectedOrder.id, "confirmed")} disabled={updating} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Confirm Order</button>}
                {selectedOrder.status === "confirmed" && <button onClick={() => updateStatus(selectedOrder.id, "processing")} disabled={updating} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"><Clock className="w-4 h-4" /> Mark Processing</button>}
                {selectedOrder.status === "processing" && <button onClick={() => updateStatus(selectedOrder.id, "delivered")} disabled={updating} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"><Truck className="w-4 h-4" /> Mark Delivered</button>}
                {!["delivered", "cancelled"].includes(selectedOrder.status) && <button onClick={() => updateStatus(selectedOrder.id, "cancelled")} disabled={updating} className="w-full py-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-sm transition disabled:opacity-50">Cancel Order</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
