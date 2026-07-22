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
