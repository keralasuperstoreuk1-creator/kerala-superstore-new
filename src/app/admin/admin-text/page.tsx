"use client";

import { useEffect, useState } from "react";
import { Save, Type, FileText } from "lucide-react";

const pageConfigs = [
  {
    id: "items",
    label: "Grocery Items & Products",
    defaults: {
      subtitle: "PRODUCTS & GROCERY INVENTORY",
      title: "Grocery Items & Store Products",
      desc: "റേഷൻ, സ്പൈസസ്, മട്ട അരി, വെളിച്ചെണ്ണ തുടങ്ങി എല്ലാ ഉൽപ്പന്നങ്ങളും എളുപ്പത്തിൽ മാനേജ് ചെയ്യാം."
    }
  },
  {
    id: "categories",
    label: "Categories Management",
    defaults: {
      subtitle: "STORE CATEGORIES",
      title: "Category Management",
      desc: "Manage product categories to organize your store inventory."
    }
  },
  {
    id: "orders",
    label: "Customer Orders",
    defaults: {
      subtitle: "STORE OPERATIONS",
      title: "Customer Orders",
      desc: "View and manage all customer orders and their current status."
    }
  }
];

export default function AdminTextEditorPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    const map: Record<string, string> = {};
    data.forEach((s: any) => { map[s.key] = s.value; });
    
    // Set defaults
    pageConfigs.forEach(page => {
      if (!map[`admin_${page.id}_subtitle`]) map[`admin_${page.id}_subtitle`] = page.defaults.subtitle;
      if (!map[`admin_${page.id}_title`]) map[`admin_${page.id}_title`] = page.defaults.title;
      if (!map[`admin_${page.id}_desc`]) map[`admin_${page.id}_desc`] = page.defaults.desc;
    });

    setSettings(map);
  }

  async function saveSetting(key: string, value: string) {
    await fetch("/api/settings", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ key, value }) 
    });
  }

  async function saveAllSettings() {
    const keys: string[] = [];
    pageConfigs.forEach(page => {
      keys.push(`admin_${page.id}_subtitle`);
      keys.push(`admin_${page.id}_title`);
      keys.push(`admin_${page.id}_desc`);
    });
    
    for (const key of keys) {
      if (settings[key] !== undefined) {
        await saveSetting(key, settings[key]);
      }
    }
    
    setMessage("Admin Texts Saved Successfully!");
    setTimeout(() => setMessage(""), 5000);
  }

  function handleChange(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Type className="w-6 h-6 text-emerald-600" /> Admin Text Editor
          </h1>
          <p className="text-slate-500 text-sm mt-1">Customize the headers and descriptions for all Admin pages.</p>
        </div>
        <button 
          onClick={saveAllSettings} 
          className="flex items-center gap-2 bg-[#0b2416] hover:bg-emerald-900 text-white px-6 py-2.5 rounded-lg font-bold transition shadow-lg"
        >
          <Save className="w-5 h-5" /> Save Changes
        </button>
      </div>

      {message && <div className="mb-6 p-4 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg font-medium">{message}</div>}

      <div className="grid grid-cols-1 gap-8 mb-10">
        {pageConfigs.map(page => (
          <div key={page.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-3">
              <FileText className="w-5 h-5 text-emerald-600" /> {page.label} Page
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Small Subtitle (All Caps)</label>
                <input 
                  value={settings[`admin_${page.id}_subtitle`] || ""} 
                  onChange={(e) => handleChange(`admin_${page.id}_subtitle`, e.target.value)} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 uppercase font-mono text-xs" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Main Heading (Title)</label>
                <input 
                  value={settings[`admin_${page.id}_title`] || ""} 
                  onChange={(e) => handleChange(`admin_${page.id}_title`, e.target.value)} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description (e.g. Malayalam text)</label>
                <textarea 
                  value={settings[`admin_${page.id}_desc`] || ""} 
                  onChange={(e) => handleChange(`admin_${page.id}_desc`, e.target.value)} 
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm" 
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
