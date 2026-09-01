import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { isCloudinaryConfigured, uploadBufferToCloudinary } from "@/lib/cloudinary";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "products");
const MAX_INPUT_SIZE = 30 * 1024 * 1024; // 30 MB raw input
const MAX_DIMENSION  = 2400;             // px — resize if wider/taller
const WEBP_QUALITY   = 85;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg":  "JPEG",
  "image/jpg":   "JPEG",
  "image/png":   "PNG",
  "image/webp":  "WebP",
  "image/avif":  "AVIF",
  "image/gif":   "GIF",
  "image/tiff":  "TIFF",
  "image/bmp":   "BMP",
  "image/heic":  "HEIC",
  "image/heif":  "HEIF",
};

export async function POST(req: NextRequest) {
  const t0 = Date.now();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!file) {
      return NextResponse.json(
        { error: "No file provided", details: "Attach a file with field name 'file'." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        {
          error: `Unsupported format: ${file.type || "unknown"}`,
          details: `"${file.name}" cannot be converted. Accepted formats: JPEG, PNG, WebP, AVIF, GIF, TIFF, BMP, HEIC.`,
        },
        { status: 415 }
      );
    }

    if (file.size > MAX_INPUT_SIZE) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      return NextResponse.json(
        {
          error: `File too large: ${mb} MB`,
          details: `Maximum input size is ${MAX_INPUT_SIZE / 1024 / 1024} MB. "${file.name}" is ${mb} MB. Resize it in a photo editor before uploading.`,
        },
        { status: 413 }
      );
    }

    // ── Read bytes ────────────────────────────────────────────────────────────
    let inputBuffer: Buffer;
    try {
      inputBuffer = Buffer.from(await file.arrayBuffer());
    } catch (readErr: any) {
      console.error("[Upload] Buffer read failed:", readErr.message);
      return NextResponse.json(
        { error: "Could not read file", details: `Failed to read file data: ${readErr.message}` },
        { status: 400 }
      );
    }

    const inputMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`[Upload] ▶ ${file.name} | ${ALLOWED_TYPES[file.type]} | ${inputMB} MB`);

    // ── Sharp: inspect + convert ──────────────────────────────────────────────
    let outputBuffer: Buffer;
    let meta: sharp.Metadata;

    try {
      const img  = sharp(inputBuffer, { failOn: "error" });
      meta = await img.metadata();

      const { width = 0, height = 0 } = meta;
      console.log(`[Upload]   dimensions: ${width}×${height}px`);

      const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION;
      if (needsResize) {
        console.log(`[Upload]   resizing to max ${MAX_DIMENSION}px`);
      }

      outputBuffer = await img
        .rotate()                                           // auto-orient from EXIF
        .resize(
          needsResize ? MAX_DIMENSION : undefined,
          needsResize ? MAX_DIMENSION : undefined,
          { fit: "inside", withoutEnlargement: true }
        )
        .webp({ quality: WEBP_QUALITY, effort: 4, smartSubsample: true })
        .toBuffer();

    } catch (sharpErr: any) {
      console.error(`[Upload] ✗ Conversion failed for "${file.name}":`, sharpErr.message);
      return NextResponse.json(
        {
          error: "Image conversion failed",
          details:
            `Could not convert "${file.name}" to WebP. Reason: ${sharpErr.message}. ` +
            "Try re-saving the image in a photo editor and uploading again.",
        },
        { status: 422 }
      );
    }

    // ── Store file ────────────────────────────────────────────────────────────
    // Cloudinary is preferred — local disk writes don't survive on most hosting
    // platforms (ephemeral/serverless filesystems), which is why uploaded images
    // can go missing in production even though they work fine locally. Falls
    // back to local disk only when Cloudinary isn't configured (e.g. a bare
    // local dev checkout without credentials).
    let url: string;
    let storedWidth = meta.width;
    let storedHeight = meta.height;

    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadBufferToCloudinary(outputBuffer, { folder: "vkc/products" });
        url = result.secure_url;
        storedWidth = result.width ?? storedWidth;
        storedHeight = result.height ?? storedHeight;
      } catch (uploadErr: any) {
        console.error("[Upload] ✗ Cloudinary upload failed:", uploadErr.message ?? uploadErr);
        return NextResponse.json(
          {
            error: "Failed to upload image",
            details: `Cloudinary upload error: ${uploadErr.message ?? "unknown error"}. Contact support if this persists.`,
          },
          { status: 500 }
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      // Never silently fall back to local disk in production — those files
      // won't survive a redeploy/restart, so the admin would see a fake
      // "success" for an upload that later 404s on the live site.
      console.error("[Upload] ✗ CLOUDINARY_* env vars not set in production — refusing local-disk fallback.");
      return NextResponse.json(
        {
          error: "Image storage is not configured",
          details: "CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET must be set in the production environment. Contact the site admin.",
        },
        { status: 500 }
      );
    } else {
      await mkdir(UPLOADS_DIR, { recursive: true });
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
      const filepath  = path.join(UPLOADS_DIR, filename);
      try {
        await writeFile(filepath, outputBuffer);
      } catch (writeErr: any) {
        console.error(`[Upload] ✗ Write failed for ${filename}:`, writeErr.message);
        return NextResponse.json(
          {
            error: "Failed to save image",
            details: `Server disk write error: ${writeErr.message}. Contact support if this persists.`,
          },
          { status: 500 }
        );
      }
      url = `/uploads/products/${filename}`;
      console.warn("[Upload] ⚠ CLOUDINARY_* env vars not set — saved to local disk. This file will NOT be available on a deployed/production server.");
    }

    // ── Done ──────────────────────────────────────────────────────────────────
    const outputKB      = (outputBuffer.length / 1024).toFixed(1);
    const savedPct      = ((1 - outputBuffer.length / file.size) * 100).toFixed(1);
    const elapsed       = Date.now() - t0;

    console.log(
      `[Upload] ✓ ${url} | Output: ${outputKB} KB | Saved: ${savedPct}% smaller | ${elapsed} ms`
    );

    return NextResponse.json({
      url,
      meta: {
        originalSize:       file.size,
        outputSize:         outputBuffer.length,
        compressionPercent: Number(savedPct),
        format:             "webp",
        width:              storedWidth,
        height:             storedHeight,
      },
    });

  } catch (err: any) {
    console.error("[Upload] ✗ Unexpected error:", err);
    return NextResponse.json(
      {
        error:   "Upload failed unexpectedly",
        details: err.message ?? "An unknown server error occurred. Check server logs.",
      },
      { status: 500 }
    );
  }
}
