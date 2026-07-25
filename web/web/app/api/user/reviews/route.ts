import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST — customer creates a review for an order item they've received.
 * Body: { orderItemId, rating (1-5), title?, body?, images? (string[] of URLs) }
 *
 * The review is held back from the public listing until an admin approves
 * it (`isApproved` defaults to false on the schema).
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { orderItemId, rating, title, body: text, images } = body as {
      orderItemId?: string; rating?: number; title?: string; body?: string; images?: string[];
    };

    if (!orderItemId) return NextResponse.json({ error: "orderItemId required" }, { status: 400 });
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });
    }

    const orderItem = await db.orderItem.findUnique({
      where: { id: orderItemId },
      include: { order: { select: { userId: true, status: true } } },
    });
    if (!orderItem || orderItem.order.userId !== userId) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 });
    }
    if (orderItem.order.status !== "DELIVERED" &&
        !["RETURN_REQUESTED", "RETURN_PICKUP_ASSIGNED", "RETURN_PICKUP_COMPLETED",
          "RETURN_DELIVERED", "RETURN_APPROVED", "REFUNDED"].includes(orderItem.order.status)) {
      return NextResponse.json({ error: "Reviews can be left only after delivery" }, { status: 400 });
    }

    // The OrderItem.productId column has no FK constraint, so legacy/seeded
    // rows can hold stale ids. Resolve the live productId via the variant
    // (which IS FK-bound to Product) and validate before inserting.
    const variant = await db.productVariant.findUnique({
      where: { id: orderItem.variantId },
      select: { productId: true },
    });
    const productId = variant?.productId ?? orderItem.productId;
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json(
        { error: "This product is no longer available, so it can't be reviewed." },
        { status: 410 }
      );
    }

    const existing = await db.review.findFirst({ where: { orderItemId, userId } });
    if (existing) {
      return NextResponse.json({ error: "You have already reviewed this item" }, { status: 409 });
    }

    const cleanImages = Array.isArray(images)
      ? images.filter((u) => typeof u === "string" && u.startsWith("/uploads/")).slice(0, 3)
      : [];

    const review = await db.review.create({
      data: {
        productId,
        userId,
        orderItemId,
        rating:      r,
        title:       title?.trim() || null,
        body:        text?.trim() || null,
        images:      cleanImages,
        isApproved:  false,
      },
    });

    return NextResponse.json({ review });
  } catch (err) {
    console.error("[user/reviews POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save review" },
      { status: 500 }
    );
  }
}

/**
 * GET — list this customer's reviews. Optional ?orderItemIds=a,b,c filter
 * lets the order detail page check which items already have a review.
 */
export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const idsParam = url.searchParams.get("orderItemIds");
  const ids = idsParam ? idsParam.split(",").filter(Boolean) : undefined;

  const reviews = await db.review.findMany({
    where: { userId, ...(ids ? { orderItemId: { in: ids } } : {}) },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, productId: true, orderItemId: true, rating: true,
      title: true, body: true, images: true, isApproved: true, createdAt: true,
    },
  });
  return NextResponse.json({ reviews });
}
