import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { isCloudinaryConfigured, uploadVideoBufferToCloudinary } from "@/lib/cloudinary";
import { MAX_VIDEO_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_LABEL } from "@/lib/utils/upload";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "videos");
const MAX_SIZE = MAX_VIDEO_UPLOAD_BYTES;
const ALLOWED = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `File too large (max ${MAX_VIDEO_UPLOAD_LABEL})` }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Only MP4, WebM, MOV allowed" }, { status: 400 });
    }

    // Cloudinary is preferred — local disk writes don't survive on most hosting
    // platforms (and even where they do, static file serving can be misconfigured),
    // which is why uploaded media can go missing in production even though it
    // works fine locally. Falls back to local disk only when Cloudinary isn't
    // configured (e.g. a bare local dev checkout without credentials).
    if (isCloudinaryConfigured()) {
      try {
        // Piped rather than buffered: `Buffer.from(await file.arrayBuffer())`
        // would hold a second full copy of the file in memory, and at the sizes
        // this route now accepts that doubling is what turns a slow upload into
        // an out-of-memory kill on the server.
        const result = await uploadVideoBufferToCloudinary(
          Readable.fromWeb(file.stream() as any),
          { folder: "vkc/videos" }
        );
        return NextResponse.json({ url: result.secure_url });
      } catch (uploadErr: any) {
        console.error("[Upload Video] ✗ Cloudinary upload failed:", uploadErr.message ?? uploadErr);
        return NextResponse.json(
          {
            error: "Failed to upload video",
            details: `Cloudinary upload error: ${uploadErr.message ?? "unknown error"}. Note Cloudinary enforces its own per-plan cap on video file size (100MB on the free tier) separately from this app's ${MAX_VIDEO_UPLOAD_LABEL} limit.`,
          },
          { status: 500 }
        );
      }
    }

    if (process.env.NODE_ENV === "production") {
      // Never silently fall back to local disk in production — those files
      // won't survive a redeploy/restart, so the admin would see a fake
      // "success" for an upload that later 404s on the live site.
      console.error("[Upload Video] ✗ CLOUDINARY_* env vars not set in production — refusing local-disk fallback.");
      return NextResponse.json(
        {
          error: "Video storage is not configured",
          details: "CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET must be set in the production environment. Contact the site admin.",
        },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await mkdir(UPLOADS_DIR, { recursive: true });
    const ext = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    await writeFile(filepath, buffer);
    console.warn("[Upload Video] ⚠ CLOUDINARY_* env vars not set — saved to local disk. This file will NOT be available on a deployed/production server.");

    const url = `/uploads/videos/${filename}`;
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("Video upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
