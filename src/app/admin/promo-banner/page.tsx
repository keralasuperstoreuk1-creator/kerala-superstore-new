"use client";

import { useEffect, useState, useRef } from "react";
import { Save, Eye, EyeOff, Image as ImageIcon } from "lucide-react";

export default function PromoBannerPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    const map: Record<string, string> = {};
    data.forEach((s: any) => { map[s.key] = s.value; });
    
    // Set default values if not present
    if (!map.promo_banner_active) map.promo_banner_active = "true";
    if (!map.promo_banner_tag) map.promo_banner_tag = "🌿 Onam Special 2026";
    if (!map.promo_banner_title) map.promo_banner_title = "Happy Onam";
    if (!map.promo_banner_subtitle) map.promo_banner_subtitle = "Celebrate the harvest festival with our exclusive collection! Traditional dresses, special offers & more.";
    if (!map.promo_banner_btn_text) map.promo_banner_btn_text = "Explore Collection";
    if (!map.promo_banner_btn_link) map.promo_banner_btn_link = "#dresses";
    if (!map.promo_banner_color1) map.promo_banner_color1 = "#f97316";
    if (!map.promo_banner_color2) map.promo_banner_color2 = "#fbbf24";
    if (!map.promo_banner_color3) map.promo_banner_color3 = "#eab308";
    
    setSettings(map);
  }

  async function saveSetting(key: string, value: string) {
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
  }

  async function saveAllSettings() {
    const keys = [
      "promo_banner_active", "promo_banner_tag", "promo_banner_title", "promo_banner_subtitle", 
      "promo_banner_btn_text", "promo_banner_btn_link", "promo_banner_color1", "promo_banner_color2", "promo_banner_color3",
      "promo_banner_image"
    ];
    
    for (const key of keys) {
      if (settings[key] !== undefined) {
        await saveSetting(key, settings[key]);
      }
    }
    
    setMessage("Banner Settings Saved Successfully!");
    setTimeout(() => setMessage(""), 3000);
  }

  async function toggleActive() {
    const newVal = settings.promo_banner_active === "true" ? "false" : "true";
    setSettings({ ...settings, promo_banner_active: newVal });
    await saveSetting("promo_banner_active", newVal);
    setMessage(`Banner is now ${newVal === "true" ? "Visible" : "Hidden"}`);
    setTimeout(() => setMessage(""), 3000);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File too large! Maximum size is 5 MB.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "promo-banner");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const errText = await res.text();
        console.error("Upload error:", res.status, errText);
        alert(`Upload failed (${res.status}). Try a smaller image.`);
        setUploading(false);
        return;
      }
      const data = await res.json();
      if (data.success && data.url) {
        setSettings({ ...settings, promo_banner_image: data.url });
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Upload exception:", err);
      alert("Upload failed: " + (err?.message || "Network error."));
    }
    setUploading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Promo Banner Settings</h1>
        <button 
          onClick={toggleActive} 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition ${settings.promo_banner_active === "true" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
        >
          {settings.promo_banner_active === "true" ? <><EyeOff className="w-4 h-4" /> Hide Banner</> : <><Eye className="w-4 h-4" /> Show Banner</>}
        </button>
      </div>

      {message && <div className="mb-4 p-3 bg-emerald-100 text-emerald-700 rounded-lg font-medium">{message}</div>}

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tagline (e.g. 🌿 Onam Special 2026)</label>
          <input 
            value={settings.promo_banner_tag || ""} 
            onChange={(e) => setSettings({ ...settings, promo_banner_tag: e.target.value })} 
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Main Title (e.g. Happy Onam)</label>
          <input 
            value={settings.promo_banner_title || ""} 
            onChange={(e) => setSettings({ ...settings, promo_banner_title: e.target.value })} 
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
          <textarea 
            value={settings.promo_banner_subtitle || ""} 
            onChange={(e) => setSettings({ ...settings, promo_banner_subtitle: e.target.value })} 
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Button Text</label>
            <input 
              value={settings.promo_banner_btn_text || ""} 
              onChange={(e) => setSettings({ ...settings, promo_banner_btn_text: e.target.value })} 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Button Link</label>
            <input 
              value={settings.promo_banner_btn_link || ""} 
              onChange={(e) => setSettings({ ...settings, promo_banner_btn_link: e.target.value })} 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Banner Image (Optional)</label>
          <div className="flex items-start gap-4">
            <div className="w-40 h-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden relative group">
              {settings.promo_banner_image ? (
                <img src={settings.promo_banner_image} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-slate-400">
                  <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <span className="text-xs">No Image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <button onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full">Change</button>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-3">Upload a banner background image. Recommended size: 1200x400px.</p>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploading}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm transition"
              >
                {uploading ? "Uploading..." : "Upload Image"}
              </button>
              {settings.promo_banner_image && (
                <button 
                  onClick={() => setSettings({ ...settings, promo_banner_image: "" })} 
                  className="block text-red-600 text-xs font-medium mt-2 hover:underline"
                >
                  Remove Image
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Gradient Background Colors (Hex Code)</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={settings.promo_banner_color1 || "#f97316"} onChange={(e) => setSettings({ ...settings, promo_banner_color1: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <input value={settings.promo_banner_color1 || ""} onChange={(e) => setSettings({ ...settings, promo_banner_color1: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Middle Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={settings.promo_banner_color2 || "#fbbf24"} onChange={(e) => setSettings({ ...settings, promo_banner_color2: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <input value={settings.promo_banner_color2 || ""} onChange={(e) => setSettings({ ...settings, promo_banner_color2: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">End Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={settings.promo_banner_color3 || "#eab308"} onChange={(e) => setSettings({ ...settings, promo_banner_color3: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <input value={settings.promo_banner_color3 || ""} onChange={(e) => setSettings({ ...settings, promo_banner_color3: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button 
            onClick={saveAllSettings} 
            className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 font-medium transition"
          >
            <Save className="w-5 h-5" /> Save Changes
          </button>
        </div>
      </div>
      
      {/* Live Preview */}
      <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4">Live Preview</h2>
      <div className="border-4 border-slate-200 rounded-xl overflow-hidden shadow-lg mb-20 relative bg-white">
        <div className="relative py-16 overflow-hidden">
          <div 
            className="absolute inset-0 opacity-100" 
            style={{ background: `linear-gradient(to right, ${settings.promo_banner_color1}, ${settings.promo_banner_color2}, ${settings.promo_banner_color3})` }} 
          />
          {settings.promo_banner_image && (
            <img src={settings.promo_banner_image} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="relative max-w-5xl mx-auto px-4 text-center">
            {settings.promo_banner_tag && (
              <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">{settings.promo_banner_tag}</span>
            )}
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{settings.promo_banner_title}</h2>
            {settings.promo_banner_subtitle && (
              <p className="text-white/90 text-base md:text-lg max-w-2xl mx-auto mb-6">{settings.promo_banner_subtitle}</p>
            )}
            <button className="inline-block bg-white text-orange-600 px-8 py-3 rounded-lg font-bold">{settings.promo_banner_btn_text}</button>
          </div>
        </div>
        
        {settings.promo_banner_active === "false" && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center z-10">
            <div className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2">
              <EyeOff className="w-5 h-5" /> Banner is currently Hidden on website
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
