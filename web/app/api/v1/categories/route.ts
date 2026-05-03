import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Returns the full category tree (active only). Mobile uses this for the
 * shop drawer and category drill-down.
 *
 * Query params:
 *   ?flat=1   → return a flat list instead of a tree
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const flat = url.searchParams.get("flat") === "1";

    const all = await db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true, name: true, slug: true, parentId: true,
        description: true, imageUrl: true, sortOrder: true,
      },
    });

    if (flat) return NextResponse.json({ categories: all });

    // Build tree
    const byParent: Record<string, typeof all> = {};
    for (const c of all) {
      const k = c.parentId ?? "ROOT";
      (byParent[k] ||= []).push(c);
    }
    const attachChildren = (cat: any): any => ({
      ...cat,
      children: (byParent[cat.id] ?? []).map(attachChildren),
    });
    const roots = (byParent["ROOT"] ?? []).map(attachChildren);

    return NextResponse.json({ categories: roots });
  } catch (err) {
    console.error("[v1/categories]", err);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
