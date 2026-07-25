import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * PATCH — admin moderates / edits a review.
 * Body: { rating?, title?, body?, images?, isApproved? }
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { rating, title, body: text, images, isApproved } = body as {
      rating?: number; title?: string; body?: string; images?: string[]; isApproved?: boolean;
    };

    const data: any = {};
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
    if (typeof isApproved === "boolean") data.isApproved = isApproved;

    const updated = await db.review.update({ where: { id: params.id }, data });
    return NextResponse.json({ review: updated });
  } catch (err) {
    console.error("[admin/reviews PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update review" },
      { status: 500 }
    );
  }
}

/** DELETE — admin removes a review entirely. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await db.review.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/reviews DELETE]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete review" },
      { status: 500 }
    );
  }
}
