import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Active customer testimonials (Admin → Testimonials), in display order —
 * the same rows the website's "What our customers say" carousel reads.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "12")));

    const testimonials = await db.testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
      select: { id: true, name: true, location: true, tag: true, rating: true, quote: true, avatarUrl: true },
    });

    return NextResponse.json({ testimonials });
  } catch (err) {
    console.error("[v1/testimonials]", err);
    return NextResponse.json({ error: "Failed to load testimonials" }, { status: 500 });
  }
}
