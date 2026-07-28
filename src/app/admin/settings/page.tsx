"use client";

import { useEffect, useState } from "react";
import { Save, FileSpreadsheet } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [sheetsId, setSheetsId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    const map: Record<string, string> = {};
    data.forEach((s: any) => { map[s.key] = s.value; });
    setSettings(map);
  }

  async function saveSetting(key: string, value: string) {
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
    setMessage("Saved!");
    setTimeout(() => setMessage(""), 2000);
  }

  async function syncToSheets(action: string) {
    if (!sheetsId) { setMessage("Enter Spreadsheet ID first"); return; }
    setSyncing(true);
    try {
      const res = await fetch("/api/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, spreadsheetId: sheetsId }),
      });
      const data = await res.json();
      setMessage(data.success ? `Synced ${data.count || data.imported?.length || 0} records!` : data.error);
    } catch (e) {
      setMessage("Sync failed");
    }
    setSyncing(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
      {message && <div className="mb-4 p-3 bg-emerald-100 text-emerald-700 rounded-lg">{message}</div>}

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-6">
        <h2 className="font-semibold text-slate-900">Store Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Store Name</label>
            <div className="flex gap-2">
              <input value={settings.store_name || ""} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <button onClick={() => saveSetting("store_name", settings.store_name || "")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Number (with country code)</label>
            <div className="flex gap-2">
              <input value={settings.whatsapp_number || ""} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} placeholder="447123456789" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <button onClick={() => saveSetting("whatsapp_number", settings.whatsapp_number || "")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Store Address</label>
            <div className="flex gap-2">
              <input value={settings.store_address || ""} onChange={(e) => setSettings({ ...settings, store_address: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <button onClick={() => saveSetting("store_address", settings.store_address || "")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
            <div className="flex gap-2">
              <input value={settings.currency || "GBP"} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <button onClick={() => saveSetting("currency", settings.currency || "GBP")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-6">
        <h2 className="font-semibold text-slate-900">Hero Banner Settings</h2>
        <p className="text-xs text-slate-500">Edit or clear these fields to customize the hero banner. Leave blank to hide.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Badge Text (left)</label>
            <div className="flex gap-2">
              <input value={settings.hero_badge_text || ""} onChange={(e) => setSettings({ ...settings, hero_badge_text: e.target.value })} placeholder="Authentic Kerala Store · UK Delivery" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <button onClick={() => saveSetting("hero_badge_text", settings.hero_badge_text || "")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Default: "Authentic Kerala Store · UK Delivery"</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Viewers Badge Text (right)</label>
            <div className="flex gap-2">
              <input value={settings.hero_viewers_text || ""} onChange={(e) => setSettings({ ...settings, hero_viewers_text: e.target.value })} placeholder="88 shopping now" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <button onClick={() => saveSetting("hero_viewers_text", settings.hero_viewers_text || "")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Default: auto viewer count. Leave blank to hide.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trust Strip 1</label>
            <div className="flex gap-2">
              <input value={settings.hero_trust_1 || ""} onChange={(e) => setSettings({ ...settings, hero_trust_1: e.target.value })} placeholder="Free UK delivery over £30" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("hero_trust_1", settings.hero_trust_1 || "")} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trust Strip 2</label>
            <div className="flex gap-2">
              <input value={settings.hero_trust_2 || ""} onChange={(e) => setSettings({ ...settings, hero_trust_2: e.target.value })} placeholder="Cash on Delivery Available" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("hero_trust_2", settings.hero_trust_2 || "")} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trust Strip 3</label>
            <div className="flex gap-2">
              <input value={settings.hero_trust_3 || ""} onChange={(e) => setSettings({ ...settings, hero_trust_3: e.target.value })} placeholder="100% Authentic Products" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("hero_trust_3", settings.hero_trust_3 || "")} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-6">
        <h2 className="font-semibold text-slate-900">Onam Pre-Order Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pre-order Deadline Date</label>
            <div className="flex gap-2">
              <input type="date" value={settings.pre_order_deadline || "2026-08-05"} onChange={(e) => setSettings({ ...settings, pre_order_deadline: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
              <button onClick={() => saveSetting("pre_order_deadline", settings.pre_order_deadline || "2026-08-05")} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"><Save className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Homepage-ൽ "Pre-order before [date]" badge ആയി കാണിക്കും</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pre-order Message</label>
            <div className="flex gap-2">
              <input value={settings.pre_order_message || ""} onChange={(e) => setSettings({ ...settings, pre_order_message: e.target.value })} placeholder="Pre-order before August 5 for Onam delivery" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
              <button onClick={() => saveSetting("pre_order_message", settings.pre_order_message || "")} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"><Save className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Custom message (optional). Blank = default message.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-6">
        <h2 className="font-semibold text-slate-900">Running Banner (Marquee) Settings</h2>
        <p className="text-xs text-slate-500">Edit or clear these fields to customize the scrolling green banner. Leave blank to hide.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item 1</label>
            <div className="flex gap-2">
              <input value={settings.marquee_1 || ""} onChange={(e) => setSettings({ ...settings, marquee_1: e.target.value })} placeholder="🚚 Free Delivery on orders over £35" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("marquee_1", settings.marquee_1 || "")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item 2</label>
            <div className="flex gap-2">
              <input value={settings.marquee_2 || ""} onChange={(e) => setSettings({ ...settings, marquee_2: e.target.value })} placeholder="🔥 Special Offers Available" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("marquee_2", settings.marquee_2 || "")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item 3</label>
            <div className="flex gap-2">
              <input value={settings.marquee_3 || ""} onChange={(e) => setSettings({ ...settings, marquee_3: e.target.value })} placeholder="📱 Order via WhatsApp: +44 7749 132122" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("marquee_3", settings.marquee_3 || "")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item 4</label>
            <div className="flex gap-2">
              <input value={settings.marquee_4 || ""} onChange={(e) => setSettings({ ...settings, marquee_4: e.target.value })} placeholder="🌿 Fresh Products Daily" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("marquee_4", settings.marquee_4 || "")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-6">
        <h2 className="font-semibold text-slate-900">Homepage Hero Banner Features</h2>
        <p className="text-xs text-slate-500">Edit the 4 feature items shown below the hero banner on the homepage.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Feature 1 Title</label>
            <div className="flex gap-2">
              <input value={settings.hero_f1 || "Free Delivery"} onChange={(e) => setSettings({ ...settings, hero_f1: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("hero_f1", settings.hero_f1 || "Free Delivery")} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Save className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Feature 1 Description</label>
            <div className="flex gap-2">
              <input value={settings.hero_d1 || "On orders over £35"} onChange={(e) => setSettings({ ...settings, hero_d1: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("hero_d1", settings.hero_d1 || "On orders over £35")} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Save className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Feature 2 Title</label>
            <div className="flex gap-2">
              <input value={settings.hero_f2 || "Cash on Delivery"} onChange={(e) => setSettings({ ...settings, hero_f2: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("hero_f2", settings.hero_f2 || "Cash on Delivery")} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Save className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Feature 2 Description</label>
            <div className="flex gap-2">
              <input value={settings.hero_d2 || "Pay when you receive"} onChange={(e) => setSettings({ ...settings, hero_d2: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("hero_d2", settings.hero_d2 || "Pay when you receive")} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Save className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Feature 3 Title</label>
            <div className="flex gap-2">
              <input value={settings.hero_f3 || "100% Fresh"} onChange={(e) => setSettings({ ...settings, hero_f3: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("hero_f3", settings.hero_f3 || "100% Fresh")} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Save className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Feature 3 Description</label>
            <div className="flex gap-2">
              <input value={settings.hero_d3 || "Quality guaranteed"} onChange={(e) => setSettings({ ...settings, hero_d3: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("hero_d3", settings.hero_d3 || "Quality guaranteed")} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Save className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Feature 4 Title</label>
            <div className="flex gap-2">
              <input value={settings.hero_f4 || "Easy Ordering"} onChange={(e) => setSettings({ ...settings, hero_f4: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("hero_f4", settings.hero_f4 || "Easy Ordering")} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Save className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Feature 4 Description</label>
            <div className="flex gap-2">
              <input value={settings.hero_d4 || "Order via WhatsApp"} onChange={(e) => setSettings({ ...settings, hero_d4: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button onClick={() => saveSetting("hero_d4", settings.hero_d4 || "Order via WhatsApp")} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Save className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" /> Google Sheets Sync</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Spreadsheet ID</label>
          <input value={sheetsId} onChange={(e) => setSheetsId(e.target.value)} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <p className="text-xs text-slate-500 mt-1">Add GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY to .env</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => syncToSheets("export_products")} disabled={syncing} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            <FileSpreadsheet className="w-4 h-4" /> Export Products
          </button>
          <button onClick={() => syncToSheets("export_orders")} disabled={syncing} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <FileSpreadsheet className="w-4 h-4" /> Export Orders
          </button>
          <button onClick={() => syncToSheets("import_products")} disabled={syncing} className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50">
            <FileSpreadsheet className="w-4 h-4" /> Import Products
          </button>
        </div>
      </div>
    </div>
  );
}
