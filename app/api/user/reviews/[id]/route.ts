import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * PATCH — customer edits their own review. Editing puts it back into
 * `isApproved: false` so the admin moderates the new content before it
 * goes back on the public product page.
 *
 * Body: { rating?, title?, body?, images? }
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await db.review.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { rating, title, body: text, images } = body as {
      rating?: number; title?: string; body?: string; images?: string[];
    };

    const data: any = { isApproved: false };
    if (rating !== undefined) {
      const r = Number(rating);
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });
      }
      data.rating = r;
    }
    if (title !== undefined) data.title = title?.trim() || null;
    if (text  !== undefined) data.body  = text?.trim()  || null;
    if (images !== undefined) {
      data.images = Array.isArray(images)
        ? images.filter((u) => typeof u === "string" && u.startsWith("/uploads/")).slice(0, 3)
        : [];
    }

    const updated = await db.review.update({ where: { id: params.id }, data });
    return NextResponse.json({ review: updated });
  } catch (err) {
    console.error("[user/reviews PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update review" },
      { status: 500 }
    );
  }
}

/** DELETE — customer removes their own review. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await db.review.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await db.review.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[user/reviews DELETE]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete review" },
      { status: 500 }
    );
  }
}
