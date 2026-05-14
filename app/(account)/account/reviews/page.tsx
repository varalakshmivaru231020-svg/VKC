import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Star } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import ReviewActions from "./ReviewActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Reviews" };

export default async function CustomerReviewsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login?next=/account/reviews");

  const reviews = await db.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product:   { select: { id: true, name: true, slug: true } },
      orderItem: {
        select: {
          id: true, productName: true, variantColor: true, sareeCode: true, imageUrl: true,
          order: { select: { id: true, orderNumber: true } },
        },
      },
    },
  });

  return (
    <div className="px-6 sm:px-8 lg:px-10 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>My Reviews</h1>
        <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {reviews.length === 0 ? "You haven't written any reviews yet." : `${reviews.length} review${reviews.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-md border p-12 text-center" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
          <Star className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--color-text-disabled)" }} />
          <p className="text-sm font-body font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>No reviews yet</p>
          <p className="text-xs font-body mb-4" style={{ color: "var(--color-text-muted)" }}>
            Once you receive an order, you can rate &amp; review it from the order details.
          </p>
          <Link href="/account/orders"
            className="inline-flex items-center px-4 py-2 rounded-sm text-sm font-body font-semibold text-white"
            style={{ background: "var(--color-primary)" }}>
            View my orders
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-md border p-5 flex gap-4" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
              {/* Product image */}
              <Link href={r.product ? `/shop/${r.product.slug}` : "#"}
                className="relative shrink-0 w-16 h-20 rounded-sm overflow-hidden border block"
                style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
                {r.orderItem?.imageUrl
                  ? <SmartImage src={r.orderItem.imageUrl} alt={r.orderItem.productName} fill objectFit="cover" />
                  : null}
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                  <Link href={r.product ? `/shop/${r.product.slug}` : "#"}
                    className="text-sm font-body font-semibold hover:underline truncate"
                    style={{ color: "var(--color-text-primary)" }}>
                    {r.product?.name ?? r.orderItem?.productName ?? "Product"}
                  </Link>
                  <span className="px-2 py-0.5 text-[10px] font-body font-bold uppercase tracking-wide rounded"
                    style={{
                      background: r.isApproved ? "var(--color-success-bg)" : "var(--color-warning-bg)",
                      color:      r.isApproved ? "var(--color-success)"    : "var(--color-warning)",
                    }}>
                    {r.isApproved ? "Live" : "Awaiting approval"}
                  </span>
                </div>

                {r.orderItem?.order && (
                  <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                    From order
                    <Link href={`/account/orders/${r.orderItem.order.id}`} className="ml-1 underline" style={{ color: "var(--color-primary)" }}>
                      #{r.orderItem.order.orderNumber}
                    </Link>
                  </p>
                )}

                <div className="flex items-center gap-0.5 my-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className="h-4 w-4"
                      fill={r.rating >= n ? "#F59E0B" : "transparent"}
                      style={{ color: r.rating >= n ? "#F59E0B" : "var(--color-parchment)" }} />
                  ))}
                  <span className="ml-2 text-xs font-body font-semibold" style={{ color: "var(--color-text-secondary)" }}>{r.rating}/5</span>
                  <span className="ml-3 text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>

                {r.title && <p className="text-sm font-body font-semibold mb-0.5" style={{ color: "var(--color-text-primary)" }}>{r.title}</p>}
                {r.body  && <p className="text-sm font-body whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>{r.body}</p>}

                {r.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {r.images.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer"
                        className="relative w-14 h-14 rounded overflow-hidden border block"
                        style={{ borderColor: "var(--color-parchment)" }}>
                        <SmartImage src={url} alt="" fill objectFit="cover" />
                      </a>
                    ))}
                  </div>
                )}

                <ReviewActions
                  reviewId={r.id}
                  orderId={r.orderItem?.order?.id ?? null}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
