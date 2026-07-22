import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { db } from "@/db";
import { settings } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kerala Super Store - UK | South Indian Grocery Online",
  description: "Kerala Super Store - Your trusted South Indian grocery store in the UK. Fresh products delivered to your doorstep.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const allSettings = await db.select().from(settings);
  const map: Record<string, string> = {};
  allSettings.forEach((s) => { map[s.key] = s.value || ""; });

  const fontFam = map.theme_font_family;
  const fontUrl = fontFam ? `https://fonts.googleapis.com/css2?family=${fontFam.replace(/ /g, '+')}:wght@400;500;600;700;800&display=swap` : null;

  return (
    <html lang="en">
      <head>
        {fontUrl && <link rel="stylesheet" href={fontUrl} />}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              ${map.theme_bg_color ? `--theme-bg: ${map.theme_bg_color};` : ""}
              ${fontFam ? `--font-sans: "${fontFam}", sans-serif !important;` : ""}
              ${map.theme_font_size ? `--theme-font-size: ${map.theme_font_size}px;` : ""}
            }
            body {
              ${map.theme_bg_color ? `background-color: var(--theme-bg) !important;` : ""}
              ${map.theme_font_size ? `font-size: var(--theme-font-size) !important;` : ""}
            }
          `
        }} />
      </head>
      <body className={`${map.theme_bg_color ? "" : "bg-white"} text-slate-900 antialiased`}>{children}</body>
    </html>
  );
}
