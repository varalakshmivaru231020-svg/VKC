import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { auth } from "@/auth";
import { isCloudinaryConfigured, uploadBufferToCloudinary } from "@/lib/cloudinary";
import { diskUploadsConfigured, uploadsDir } from "@/lib/upload-storage";

const UPLOADS_DIR    = uploadsDir("reviews");
const MAX_INPUT_SIZE = 15 * 1024 * 1024;
const MAX_DIMENSION  = 1600;
const WEBP_QUALITY   = 80;

const ALLOWED_TYPES: Record<string, true> = {
  "image/jpeg": true, "image/jpg":  true, "image/png":  true,
  "image/webp": true, "image/heic": true, "image/heif": true,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json({ error: `Unsupported format: ${file.type}` }, { status: 415 });
  }
  if (file.size > MAX_INPUT_SIZE) {
    return NextResponse.json({ error: "File too large (max 15 MB)" }, { status: 413 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(inputBuffer).metadata();
  const needsResize = (meta.width ?? 0) > MAX_DIMENSION || (meta.height ?? 0) > MAX_DIMENSION;

  const outputBuffer = await sharp(inputBuffer)
    .rotate()
    .resize(needsResize ? MAX_DIMENSION : undefined, needsResize ? MAX_DIMENSION : undefined, {
      fit: "inside", withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  // Storage priority: UPLOADS_DIR (persistent disk outside the app folder,
  // served by nginx) wins when set; otherwise Cloudinary; otherwise local
  // public/uploads in dev only — `next start` only recognizes public/ files
  // that existed when the process last booted, so runtime public/ writes are
  // refused in production.
  if (!diskUploadsConfigured && isCloudinaryConfigured()) {
    const result = await uploadBufferToCloudinary(outputBuffer, { folder: "vkc/reviews" });
    return NextResponse.json({ url: result.secure_url });
  }

  if (!diskUploadsConfigured && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Image storage is not configured. Contact the site admin." },
      { status: 500 }
    );
  }

  await mkdir(UPLOADS_DIR, { recursive: true });
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
  await writeFile(path.join(UPLOADS_DIR, filename), outputBuffer);

  return NextResponse.json({ url: `/uploads/reviews/${filename}` });
}
