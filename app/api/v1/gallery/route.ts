import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Active gallery items for the mobile app's native Gallery screen — the same
 * rows Admin → Gallery manages and the website's /gallery page renders.
 *
 * Query params:
 *   limit   (default 100, max 200)
 *   type    IMAGE | VIDEO | FACEBOOK  (optional filter)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") ?? "100")));
    const type = url.searchParams.get("type") ?? undefined;

    const items = await db.galleryItem.findMany({
      where: { isActive: true, ...(type ? { type } : {}) },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
      select: { id: true, type: true, url: true, caption: true, sortOrder: true, createdAt: true },
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[v1/gallery]", err);
    return NextResponse.json({ error: "Failed to load gallery" }, { status: 500 });
  }
}
