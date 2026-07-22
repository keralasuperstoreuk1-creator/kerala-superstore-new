import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// In production, Next.js may not serve new files written to /public at runtime
// (especially in standalone mode). So we save uploads to a dedicated writable
// directory and serve them through /api/files/* route.
const UPLOAD_ROOT =
  process.env.UPLOAD_ROOT || path.join(/* turbopackIgnore: true */ process.cwd(), "data", "uploads");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Sanitize folder
    const safeFolder = folder.replace(/[^a-zA-Z0-9_\-/]/g, "").replace(/^\/+|\/+$/g, "");
    const uploadDir = path.join(UPLOAD_ROOT, safeFolder);
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "-");
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const publicPath = `/api/files/${safeFolder}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicPath,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
