"use client";

import { useEffect, useState, useRef } from "react";
import { Save, Image as ImageIcon, PaintBucket, Type, Monitor } from "lucide-react";

export default function ThemeSettingsPage() {
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
    
    // Default values
    if (!map.theme_logo_width) map.theme_logo_width = "40";
    if (!map.theme_bg_color) map.theme_bg_color = "#ffffff";
    if (!map.theme_font_family) map.theme_font_family = "Inter";
    if (!map.theme_font_size) map.theme_font_size = "16";
    if (!map.admin_font_family) map.admin_font_family = "Inter";
    if (!map.admin_font_size) map.admin_font_size = "24";

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
    const keys = ["theme_logo", "theme_logo_width", "theme_bg_color", "theme_font_family", "theme_font_size", "admin_font_family", "admin_font_size"];
    
    for (const key of keys) {
      if (settings[key] !== undefined) {
        await saveSetting(key, settings[key]);
      }
    }
    
    setMessage("Theme Settings Saved! Reload the website to see the changes.");
    setTimeout(() => setMessage(""), 5000);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large! Maximum size is 10 MB. Please use a smaller image.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "theme");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const errText = await res.text();
        console.error("Upload response error:", res.status, errText);
        alert(`Upload failed (${res.status}). Try a smaller image or check your internet connection.`);
        setUploading(false);
        return;
      }
      const data = await res.json();
      if (data.success && data.url) {
        setSettings({ ...settings, theme_logo: data.url });
      } else {
        console.error("Upload response:", data);
        alert("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Upload exception:", err);
      alert("Upload failed: " + (err?.message || "Network error. Check your internet connection."));
    }
    setUploading(false);
  }

  // Pre-defined font options
  const fonts = [
    "Inter", "Roboto", "Open Sans", "Poppins", "Montserrat", 
    "Playfair Display", "Lora", "Merriweather", "Outfit", "Plus Jakarta Sans"
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Global Theme Engine</h1>
        <button 
          onClick={saveAllSettings} 
          className="flex items-center gap-2 bg-[#0b2416] hover:bg-emerald-900 text-white px-6 py-2.5 rounded-lg font-bold transition shadow-lg"
        >
          <Save className="w-5 h-5" /> Save All Changes
        </button>
      </div>

      {message && <div className="mb-6 p-4 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg font-medium">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Logo Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-3">
            <ImageIcon className="w-5 h-5 text-emerald-600" /> Logo & Identity
          </h2>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-3">Company Logo</label>
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden relative group">
                {settings.theme_logo ? (
                  <img src={settings.theme_logo} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span className="text-xs font-medium">No Logo</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <button onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full">Change</button>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 mb-3">Upload your brand logo. A transparent PNG or SVG is recommended.</p>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLogoUpload} />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={uploading}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm transition"
                >
                  {uploading ? "Uploading..." : "Upload New Image"}
                </button>
                {settings.theme_logo && (
                  <button 
                    onClick={() => setSettings({ ...settings, theme_logo: "" })} 
                    className="block text-red-600 text-xs font-medium mt-3 hover:underline"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Header Logo Width: <span className="text-emerald-600">{settings.theme_logo_width || 40}px</span>
            </label>
            <input 
              type="range" 
              min="20" max="250" step="5"
              value={settings.theme_logo_width || 40} 
              onChange={(e) => setSettings({ ...settings, theme_logo_width: e.target.value })} 
              className="w-full accent-emerald-600" 
            />
            <div className="flex justify-between text-xs text-slate-400 font-mono mt-1">
              <span>20px (Small)</span>
              <span>250px (Large)</span>
            </div>
          </div>
        </div>

        {/* Global Styles */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-3">
            <PaintBucket className="w-5 h-5 text-emerald-600" /> Colors & Typography
          </h2>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Global Background Color</label>
            <div className="flex gap-3 items-center">
              <input 
                type="color" 
                value={settings.theme_bg_color || "#ffffff"} 
                onChange={(e) => setSettings({ ...settings, theme_bg_color: e.target.value })} 
                className="w-12 h-12 rounded cursor-pointer border-0 p-0" 
              />
              <input 
                value={settings.theme_bg_color || "#ffffff"} 
                onChange={(e) => setSettings({ ...settings, theme_bg_color: e.target.value })} 
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
              <button 
                onClick={() => setSettings({ ...settings, theme_bg_color: "#ffffff" })}
                className="text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Reset to White
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Type className="w-4 h-4" /> Global Font Family
            </label>
            <select 
              value={settings.theme_font_family || "Inter"}
              onChange={(e) => setSettings({ ...settings, theme_font_family: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              style={{ fontFamily: settings.theme_font_family || "Inter" }}
            >
              {fonts.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
            </select>
            <p className="text-xs text-slate-500 mt-2">This font will be dynamically loaded from Google Fonts and applied everywhere.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Base Font Size: <span className="text-emerald-600">{settings.theme_font_size || 16}px</span>
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="12" max="24" step="1"
                value={settings.theme_font_size || 16} 
                onChange={(e) => setSettings({ ...settings, theme_font_size: e.target.value })} 
                className="flex-1 accent-emerald-600" 
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-mono mt-1">
              <span>12px</span>
              <span>24px</span>
            </div>
          </div>
        </div>
        {/* Admin Typography Styles */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-3">
            <Type className="w-5 h-5 text-emerald-600" /> Admin Panel Typography
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Admin Headings Font Family</label>
              <select 
                value={settings.admin_font_family || "Inter"}
                onChange={(e) => setSettings({ ...settings, admin_font_family: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg font-medium focus:border-emerald-500"
                style={{ fontFamily: settings.admin_font_family || "Inter" }}
              >
                {fonts.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
              <p className="text-xs text-slate-500 mt-2">Applies to the large titles in the Admin Panel.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Admin Title Font Size: <span className="text-emerald-600">{settings.admin_font_size || 24}px</span>
              </label>
              <input 
                type="range" 
                min="18" max="48" step="1"
                value={settings.admin_font_size || 24} 
                onChange={(e) => setSettings({ ...settings, admin_font_size: e.target.value })} 
                className="w-full accent-emerald-600" 
              />
              <div className="flex justify-between text-xs text-slate-400 font-mono mt-1">
                <span>18px</span>
                <span>48px</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Live Preview UI */}
      <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Monitor className="w-5 h-5" /> Live Preview</h2>
      <div 
        className="rounded-xl border-4 border-slate-200 overflow-hidden shadow-lg"
        style={{ 
          backgroundColor: settings.theme_bg_color || "#ffffff",
          fontFamily: settings.theme_font_family ? `"${settings.theme_font_family}", sans-serif` : "Inter",
          fontSize: `${settings.theme_font_size || 16}px`
        }}
      >
        <div className="h-16 bg-white border-b border-stone-100 flex items-center px-6">
          <div className="flex items-center gap-3">
            {settings.theme_logo ? (
              <img src={settings.theme_logo} alt="Preview Logo" style={{ width: settings.theme_logo_width ? `${settings.theme_logo_width}px` : '40px' }} className="object-contain" />
            ) : (
              <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center text-white font-bold text-lg">K</div>
            )}
            <div className="leading-tight">
              <div className="font-bold text-slate-900 text-lg">Kerala Super Store</div>
              <div className="text-xs text-slate-500">SOUTH INDIAN GROCERY</div>
            </div>
          </div>
        </div>
        <div className="p-10 text-center">
          <h1 className="text-4xl font-bold mb-4 text-slate-900">Welcome to Our Store</h1>
          <p className="text-slate-600 max-w-xl mx-auto">This is a live preview of how your website will look with the current theme settings. Notice the font family, font size, logo, and background colors changing in real-time!</p>
          <div className="mt-8 flex justify-center gap-4">
            <button className="bg-[#0b2416] text-white px-6 py-2.5 rounded-lg font-bold">Primary Button</button>
            <button className="bg-white text-slate-700 border border-slate-300 px-6 py-2.5 rounded-lg font-bold">Secondary Button</button>
          </div>
        </div>
      </div>
    </div>
  );
}
