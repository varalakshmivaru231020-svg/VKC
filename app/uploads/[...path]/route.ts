import { NextRequest } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import path from "path";

/**
 * Serves uploaded media from UPLOADS_DIR (or public/uploads in dev).
 *
 * `next start` only serves public/ files that existed when the process booted,
 * and the nginx worker on the production host cannot read the site user's home
 * directory — so files uploaded at runtime are streamed by the app itself.
 * Files that were in public/uploads at boot are still served statically by
 * Next before this route is reached.
 */

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const base = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "public", "uploads");
  const filePath = path.normalize(path.join(base, ...params.path));

  // Refuse anything that escapes the uploads directory (e.g. ../../.env)
  if (!filePath.startsWith(path.normalize(base) + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  let size: number;
  try {
    const st = await stat(filePath);
    if (!st.isFile()) return new Response("Not found", { status: 404 });
    size = st.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const type = MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Cache-Control": "public, max-age=2592000, immutable",
    "Accept-Ranges": "bytes",
  };

  // Minimal single-range support so video seeking works
  const range = req.headers.get("range");
  const m = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (m && (m[1] !== "" || m[2] !== "")) {
    let start = m[1] === "" ? Math.max(0, size - Number(m[2])) : Number(m[1]);
    let end = m[1] !== "" && m[2] !== "" ? Number(m[2]) : size - 1;
    if (start >= size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    end = Math.min(end, size - 1);
    const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(size) } });
}
