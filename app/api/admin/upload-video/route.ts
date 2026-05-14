import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "videos");
const MAX_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 100MB)" }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Only MP4, WebM, MOV allowed" }, { status: 400 });
    }

    await mkdir(UPLOADS_DIR, { recursive: true });

    const ext = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const url = `/uploads/videos/${filename}`;
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("Video upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
