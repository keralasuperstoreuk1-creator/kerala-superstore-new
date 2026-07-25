"use client";

import { useEffect, useState } from "react";
import { Save, Monitor, Smartphone, ImageIcon } from "lucide-react";

export default function OnamSadhyaPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    const map: Record<string, string> = {};
    data.forEach((s: any) => { map[s.key] = s.value; });
    setSettings(map);
  }

  async function saveSetting(key: string, value: string) {
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
  }

  async function handleUpload(file: File, key: string) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "onam-sadhya");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      setSettings((s) => ({ ...s, [key]: data.url }));
      await saveSetting(key, data.url);
    }
  }

  async function handleDesktopUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDesktop(true);
    await handleUpload(file, "onam_sadhya_banner_image");
    setUploadingDesktop(false);
  }

  async function handleMobileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMobile(true);
    await handleUpload(file, "onam_sadhya_banner_mobile_image");
    setUploadingMobile(false);
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">Onam Sadhya Banner</h1>
        <p className="text-sm text-stone-500 mt-1">Banner image shown above Onam Sadhya pre-order section</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6">
        {message && <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">{message}</div>}

        {/* Desktop Image */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-600" /> Desktop Banner Image
          </label>
          <p className="text-xs text-stone-400 mb-2">Recommended size: <strong>1400 × 500px</strong></p>
          <div className="flex items-start gap-4">
            <div className="w-full max-w-md h-40 bg-stone-50 border-2 border-dashed border-blue-300 rounded-xl flex items-center justify-center overflow-hidden relative group">
              {settings.onam_sadhya_banner_image ? (
                <img src={settings.onam_sadhya_banner_image} alt="Desktop" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-stone-400">
                  <Monitor className="w-8 h-8 mx-auto mb-1 opacity-50" />
                  <span className="text-xs">No Desktop Image</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 text-xs font-semibold text-blue-800 transition">
                <ImageIcon className="w-4 h-4" />
                {uploadingDesktop ? "Uploading..." : "Upload Desktop"}
                <input type="file" accept="image/*" className="hidden" onChange={handleDesktopUpload} disabled={uploadingDesktop} />
              </label>
              {settings.onam_sadhya_banner_image && (
                <button onClick={async () => { setSettings((s) => ({ ...s, onam_sadhya_banner_image: "" })); await saveSetting("onam_sadhya_banner_image", ""); }} className="text-red-600 text-xs font-medium hover:underline">Remove</button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Image */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600" /> Mobile Banner Image
          </label>
          <p className="text-xs text-stone-400 mb-2">Recommended size: <strong>600 × 400px</strong>. ഇല്ലെങ്കിൽ Desktop image auto ആയി കാണിക്കും.</p>
          <div className="flex items-start gap-4">
            <div className="w-full max-w-md h-40 bg-stone-50 border-2 border-dashed border-emerald-300 rounded-xl flex items-center justify-center overflow-hidden relative group">
              {settings.onam_sadhya_banner_mobile_image ? (
                <img src={settings.onam_sadhya_banner_mobile_image} alt="Mobile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-stone-400">
                  <Smartphone className="w-8 h-8 mx-auto mb-1 opacity-50" />
                  <span className="text-xs">No Mobile Image</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-100 text-xs font-semibold text-emerald-800 transition">
                <ImageIcon className="w-4 h-4" />
                {uploadingMobile ? "Uploading..." : "Upload Mobile"}
                <input type="file" accept="image/*" className="hidden" onChange={handleMobileUpload} disabled={uploadingMobile} />
              </label>
              {settings.onam_sadhya_banner_mobile_image && (
                <button onClick={async () => { setSettings((s) => ({ ...s, onam_sadhya_banner_mobile_image: "" })); await saveSetting("onam_sadhya_banner_mobile_image", ""); }} className="text-red-600 text-xs font-medium hover:underline">Remove</button>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="pt-4 border-t border-stone-100">
          <h3 className="text-sm font-bold text-stone-700 mb-3">Live Preview</h3>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 min-h-[150px] md:min-h-[250px] border-2 border-stone-200">
            {settings.onam_sadhya_banner_image && (
              <img src={settings.onam_sadhya_banner_image} alt="" className="hidden md:block absolute inset-0 w-full h-full object-cover" />
            )}
            {settings.onam_sadhya_banner_mobile_image ? (
              <img src={settings.onam_sadhya_banner_mobile_image} alt="" className="block md:hidden absolute inset-0 w-full h-full object-cover" />
            ) : settings.onam_sadhya_banner_image ? (
              <img src={settings.onam_sadhya_banner_image} alt="" className="block md:hidden absolute inset-0 w-full h-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-900/60 to-transparent flex items-center px-6">
              <div className="text-white">
                <div className="text-[10px] font-mono uppercase tracking-widest opacity-80">🍛 Onam 2026</div>
                <div className="text-2xl md:text-4xl font-bold">Onam Sadhya.</div>
              </div>
            </div>
          </div>
          {!settings.onam_sadhya_banner_image && (
            <p className="text-xs text-amber-600 mt-2">⚠️ No banner image set. Gradient background will show instead.</p>
          )}
        </div>
      </div>
    </div>
  );
}
