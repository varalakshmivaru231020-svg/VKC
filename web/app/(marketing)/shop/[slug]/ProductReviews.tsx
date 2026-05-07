"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  images: string[];
  createdAt: string;
  author: string;
}

interface Summary {
  averageRating: number;
  totalReviews: number;
}

export default function ProductReviews({ slug }: { slug: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<Summary>({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [showAll,  setShowAll] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/products/${slug}/reviews?limit=50`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.reviews)) setReviews(d.reviews);
        if (d.summary) setSummary(d.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const avg = Number(summary.averageRating || 0);
  const fullStars = Math.round(avg);
  const visible = showAll ? reviews : reviews.slice(0, 4);

  // Distribution per star bucket (5 → 1).
  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  return (
    <section className="mt-12 lg:mt-16">
      <h2 className="text-xl font-semibold mb-5" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
        Customer Reviews
      </h2>

      {loading ? (
        <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>Loading reviews…</p>
      ) : summary.totalReviews === 0 ? (
        <div className="rounded-md border p-8 text-center" style={{ background: "var(--color-cream)", borderColor: "var(--color-parchment)" }}>
          <Star className="h-10 w-10 mx-auto mb-2" style={{ color: "var(--color-text-disabled)" }} />
          <p className="text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>
            No reviews yet — be the first to share your experience after purchase.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary */}
          <div className="lg:col-span-1 rounded-md border p-5"
            style={{ background: "var(--color-cream)", borderColor: "var(--color-parchment)" }}>
            <p className="text-4xl font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}>
              {avg.toFixed(1)}
              <span className="text-base ml-1" style={{ color: "var(--color-text-muted)" }}>/5</span>
            </p>
            <div className="flex items-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className="h-4 w-4"
                  fill={fullStars >= n ? "#F59E0B" : "transparent"}
                  style={{ color: fullStars >= n ? "#F59E0B" : "var(--color-parchment)" }} />
              ))}
            </div>
            <p className="text-xs font-body mt-2" style={{ color: "var(--color-text-muted)" }}>
              Based on {summary.totalReviews} review{summary.totalReviews === 1 ? "" : "s"}
            </p>
            <div className="mt-4 space-y-1.5">
              {distribution.map(({ n, count }) => {
                const pct = summary.totalReviews ? (count / summary.totalReviews) * 100 : 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs font-body">
                    <span className="w-3" style={{ color: "var(--color-text-muted)" }}>{n}</span>
                    <Star className="h-3 w-3" fill="#F59E0B" style={{ color: "#F59E0B" }} />
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--color-parchment)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ background: "var(--color-primary)", width: `${pct}%` }} />
                    </div>
                    <span className="w-7 text-right" style={{ color: "var(--color-text-muted)" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews list */}
          <div className="lg:col-span-2 space-y-4">
            {visible.map((r) => (
              <article key={r.id} className="rounded-md border p-5" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
                <header className="flex items-center justify-between gap-3 flex-wrap mb-1">
                  <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{r.author}</p>
                  <span className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </header>
                <div className="flex items-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className="h-3.5 w-3.5"
                      fill={r.rating >= n ? "#F59E0B" : "transparent"}
                      style={{ color: r.rating >= n ? "#F59E0B" : "var(--color-parchment)" }} />
                  ))}
                </div>
                {r.title && <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{r.title}</p>}
                {r.body  && <p className="text-sm font-body whitespace-pre-wrap mt-1" style={{ color: "var(--color-text-secondary)" }}>{r.body}</p>}
                {r.images.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {r.images.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer"
                        className="relative w-16 h-16 rounded overflow-hidden border block"
                        style={{ borderColor: "var(--color-parchment)" }}>
                        <SmartImage src={url} alt="" fill objectFit="cover" />
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}

            {reviews.length > 4 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-3 rounded-md border text-sm font-body font-medium transition-colors hover:bg-cream"
                style={{ borderColor: "var(--color-parchment)", color: "var(--color-primary)" }}>
                Show all {reviews.length} reviews
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
