import { db } from "@/lib/db";
import { Search, Star } from "lucide-react";
import ReviewsTable from "./ReviewsTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews — Admin" };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { q?: string; approved?: string; page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const limit = 25;
  const q = searchParams.q ?? "";
  const approved = searchParams.approved ?? "all";

  const where: any = {};
  if (approved === "true")  where.isApproved = true;
  if (approved === "false") where.isApproved = false;
  if (q) {
    where.OR = [
      { body:    { contains: q, mode: "insensitive" } },
      { title:   { contains: q, mode: "insensitive" } },
      { user:    { OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName:  { contains: q, mode: "insensitive" } },
        { email:     { contains: q, mode: "insensitive" } },
      ] } },
      { product: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, pendingCount, approvedCount, reviews] = await Promise.all([
    db.review.count({ where }),
    db.review.count({ where: { isApproved: false } }),
    db.review.count({ where: { isApproved: true } }),
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user:    { select: { id: true, firstName: true, lastName: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
        orderItem: {
          select: {
            id: true, productName: true, variantColor: true, sareeCode: true,
            order: { select: { id: true, orderNumber: true, deliveredAt: true } },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Reviews</h1>
        <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {total} matching · {pendingCount} pending approval · {approvedCount} live
        </p>
      </div>

      <form className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by customer, product, or review text…"
            className="w-full h-10 pl-9 pr-4 border rounded-sm text-sm font-body focus:outline-none"
            style={{ borderColor: "var(--color-parchment)", background: "white" }}
          />
        </div>
        <select name="approved" defaultValue={approved}
          className="h-10 px-3 border rounded-sm text-sm font-body bg-white"
          style={{ borderColor: "var(--color-parchment)" }}>
          <option value="all">All reviews</option>
          <option value="false">Pending approval</option>
          <option value="true">Approved</option>
        </select>
        <button type="submit"
          className="h-10 px-4 rounded-sm text-sm font-body font-semibold text-white"
          style={{ background: "var(--color-primary)" }}>
          Filter
        </button>
      </form>

      {reviews.length === 0 ? (
        <div className="rounded-md border p-16 flex flex-col items-center text-center gap-3" style={{ borderColor: "var(--color-parchment)", background: "white" }}>
          <Star className="h-10 w-10" style={{ color: "var(--color-text-disabled)" }} />
          <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>No reviews found</p>
          <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>Try a different search or filter.</p>
        </div>
      ) : (
        <ReviewsTable initialReviews={reviews as any} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?q=${encodeURIComponent(q)}&approved=${approved}&page=${page - 1}`}
                className="px-3 h-8 inline-flex items-center rounded-sm border" style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)" }}>
                Prev
              </a>
            )}
            {page < totalPages && (
              <a href={`?q=${encodeURIComponent(q)}&approved=${approved}&page=${page + 1}`}
                className="px-3 h-8 inline-flex items-center rounded-sm border" style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)" }}>
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
