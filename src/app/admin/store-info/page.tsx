"use client";

import { useEffect, useState } from "react";
import { Save, Store, MapPin, Phone, Mail, MessageCircle, Info, Megaphone } from "lucide-react";

export default function StoreInfoPage() {
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
    
    // Set default values if empty
    if (!map.store_name) map.store_name = "Kerala Super Store";
    if (!map.store_tagline) map.store_tagline = "SOUTH INDIAN GROCERY";
    if (!map.store_topbar_text) map.store_topbar_text = "🎉 Free Delivery on orders over £30 | Cash on Delivery Available";
    if (!map.store_phone) map.store_phone = "+44 7749 132122";
    if (!map.store_whatsapp) map.store_whatsapp = "447749132122";
    if (!map.store_email) map.store_email = "info@keralasuperstore.co.uk";
    if (!map.store_address) map.store_address = "Old Market Street, M98DX, Manchester";
    if (!map.store_map_link) map.store_map_link = "https://www.google.com/maps/search/Kerala+superstore+ltd+Old+Market+Street+M98DX+Manchester";
    if (!map.store_about_title) map.store_about_title = "Your Trusted South Indian Grocery in UK";
    if (!map.store_about_text) map.store_about_text = "We are a family-run South Indian grocery store dedicated to bringing you the authentic tastes of Kerala and South India. From fresh spices to traditional snacks, we have everything you need.";

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
    const keys = [
      "store_name", "store_tagline", "store_topbar_text", 
      "store_phone", "store_whatsapp", "store_email", 
      "store_address", "store_map_link", 
      "store_about_title", "store_about_text"
    ];
    
    for (const key of keys) {
      if (settings[key] !== undefined) {
        await saveSetting(key, settings[key]);
      }
    }
    
    setMessage("Store Information Saved Successfully!");
    setTimeout(() => setMessage(""), 5000);
  }

  function handleChange(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Store Information CMS</h1>
        <button 
          onClick={saveAllSettings} 
          className="flex items-center gap-2 bg-[#0b2416] hover:bg-emerald-900 text-white px-6 py-2.5 rounded-lg font-bold transition shadow-lg"
        >
          <Save className="w-5 h-5" /> Save Changes
        </button>
      </div>

      {message && <div className="mb-6 p-4 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg font-medium">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Basic Brand Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-3">
            <Store className="w-5 h-5 text-emerald-600" /> Basic Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Store Name</label>
              <input 
                value={settings.store_name || ""} 
                onChange={(e) => handleChange("store_name", e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Store Tagline</label>
              <input 
                value={settings.store_tagline || ""} 
                onChange={(e) => handleChange("store_tagline", e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><Megaphone className="w-4 h-4"/> Top Announcement Bar</label>
              <textarea 
                value={settings.store_topbar_text || ""} 
                onChange={(e) => handleChange("store_topbar_text", e.target.value)} 
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
              <p className="text-xs text-slate-500 mt-1">This text appears at the very top of your website.</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-3">
            <Phone className="w-5 h-5 text-emerald-600" /> Contact Details
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><Phone className="w-4 h-4 text-slate-500"/> Phone Number</label>
                <input 
                  value={settings.store_phone || ""} 
                  onChange={(e) => handleChange("store_phone", e.target.value)} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><MessageCircle className="w-4 h-4 text-green-500"/> WhatsApp Number</label>
                <input 
                  value={settings.store_whatsapp || ""} 
                  onChange={(e) => handleChange("store_whatsapp", e.target.value)} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                  placeholder="e.g. 447749132122 (No +)"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><Mail className="w-4 h-4 text-slate-500"/> Email Address</label>
              <input 
                value={settings.store_email || ""} 
                onChange={(e) => handleChange("store_email", e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-500"/> Physical Address</label>
              <input 
                value={settings.store_address || ""} 
                onChange={(e) => handleChange("store_address", e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Google Maps URL</label>
              <input 
                value={settings.store_map_link || ""} 
                onChange={(e) => handleChange("store_map_link", e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
            </div>
          </div>
        </div>

        {/* About Us Content */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-3">
            <Info className="w-5 h-5 text-emerald-600" /> "About Us" Section
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">About Us Title</label>
              <input 
                value={settings.store_about_title || ""} 
                onChange={(e) => handleChange("store_about_title", e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">About Us Description</label>
              <textarea 
                value={settings.store_about_text || ""} 
                onChange={(e) => handleChange("store_about_text", e.target.value)} 
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
