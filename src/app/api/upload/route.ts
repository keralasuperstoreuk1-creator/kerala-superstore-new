import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const maxDuration = 60;

// Support both CLOUDINARY_URL (standard) and individual CLOUDINARY_* keys.
cloudinary.config({
  cloud_url: process.env.CLOUDINARY_URL,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_ROOT =
  process.env.UPLOAD_ROOT || path.join(/* turbopackIgnore: true */ process.cwd(), "data", "uploads");

function cloudinaryConfigured(): boolean {
  return Boolean(process.env.CLOUDINARY_URL) ||
    Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 5 MB." }, { status: 400 });
    }

    const safeFolder = folder.replace(/[^a-zA-Z0-9_\-/]/g, "").replace(/^\/+|\/+$/g, "");

    // Prefer Cloudinary when keys are configured (persists across deployments).
    if (cloudinaryConfigured()) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");
        const dataUri = `data:${file.type || "image/png"};base64,${base64}`;

        const result = await cloudinary.uploader.upload(dataUri, {
          folder: `kerala-superstore/${safeFolder}`,
          resource_type: "auto",
        });

        return NextResponse.json({ success: true, url: result.secure_url });
      } catch (cloudErr) {
        console.error("Cloudinary upload failed, falling back to local filesystem:", cloudErr);
        // Fall through to local filesystem so uploads never fail
      }
    }

    // Fallback: save locally and serve via /api/files/*.
    const uploadDir = path.join(UPLOAD_ROOT, safeFolder);
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "-");
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const publicPath = `/api/files/${safeFolder}/${fileName}`;

    return NextResponse.json({ success: true, url: publicPath });
  } catch (error: any) {
    console.error("Upload error:", error);
    const msg = error?.message || error?.error?.message || String(error);
    return NextResponse.json({ error: "Upload failed", details: msg }, { status: 500 });
  }
}