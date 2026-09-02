import path from "path";

/**
 * Where uploaded files land when stored on disk.
 *
 * Set UPLOADS_DIR to an absolute path OUTSIDE the app folder (e.g.
 * /var/www/vkc-uploads) to keep uploads across redeploys/restarts; nginx must
 * then serve the /uploads/ URL prefix from that directory, because `next start`
 * only serves public/ files that existed when the process booted.
 *
 * When UPLOADS_DIR is unset, files go to public/uploads — fine in dev, refused
 * in production (they would 404 after the next deploy).
 */
export const diskUploadsConfigured = Boolean(process.env.UPLOADS_DIR);

export function uploadsDir(sub: "products" | "videos" | "reviews"): string {
  const base = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "public", "uploads");
  return path.join(base, sub);
}
