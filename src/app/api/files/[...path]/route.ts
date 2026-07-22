import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const UPLOAD_ROOT =
  process.env.UPLOAD_ROOT || path.join(/* turbopackIgnore: true */ process.cwd(), "data", "uploads");

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    if (!segments || segments.length === 0) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    const joined = path.join(...segments);
    if (joined.includes("..")) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    const filePath = path.join(UPLOAD_ROOT, joined);

    try {
      const info = await stat(filePath);
      if (!info.isFile()) return new NextResponse("Not found", { status: 404 });
    } catch {
      return new NextResponse("Not found", { status: 404 });
    }

    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return new NextResponse("Failed to serve file", { status: 500 });
  }
}
