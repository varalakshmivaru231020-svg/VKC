import Link from "next/link";
import { Star, Quote } from "lucide-react";

/**
 * Customer testimonials for the home page.
 *
 * Sourced only from approved product reviews with written text — nothing is
 * invented. When there are none yet, the section renders nothing at all, so
 * the page never shows placeholder praise.
 */
export interface TestimonialItem {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  author: string;
  productName: string;
  productSlug: string;
  createdAt: Date;
}

const C = {
  bark: "#3A1F0A",
  jaggery: "#E0961C",
  jaggeryLite: "#FFD65C",
  jaggeryDark: "#9A5B0B",
  ivory: "#FFFBF4",
  cream: "#FBF1DE",
  parchment: "#F0DCB6",
  ink: "#2B1708",
  ink2: "#5C3A1E",
  muted: "#8A6A4E",
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "V";
}

export function Testimonials({ items }: { items: TestimonialItem[] }) {
  if (!items.length) return null;

  return (
    <section className="py-20 sm:py-24" style={{ background: C.ivory }} aria-labelledby="testimonials-heading">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-3 font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.24em", color: C.jaggeryDark }}>
              <span className="inline-block h-px w-7" style={{ background: C.jaggeryDark }} /> Testimonials
            </span>
            <h2 id="testimonials-heading" className="mt-4" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,4vw,3.2rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: C.ink, fontWeight: 500 }}>
              What our customers say
            </h2>
          </div>
          <p className="font-body" style={{ fontSize: 14.5, color: C.muted, textAlign: "left", hyphens: "none" }}>
            Verified reviews from people who bought and tasted our jaggery.
          </p>
        </div>

        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 list-none m-0 p-0">
          {items.map((t, i) => {
            const featured = i === 0;
            return (
              <li
                key={t.id}
                className="relative rounded-lg p-7 sm:p-8 flex flex-col transition-transform duration-300 hover:-translate-y-1"
                style={{
                  background: featured ? C.bark : "white",
                  color: featured ? C.ivory : C.ink,
                  border: `1px solid ${featured ? "rgba(255,214,92,0.25)" : C.parchment}`,
                  boxShadow: featured ? "0 24px 60px -24px rgba(58,31,10,0.45)" : "0 10px 30px -18px rgba(58,31,10,0.2)",
                }}
              >
                <Quote className="h-7 w-7" style={{ color: featured ? C.jaggeryLite : C.jaggery }} aria-hidden />
                <div className="mt-4 flex items-center gap-1" aria-label={`Rated ${t.rating} out of 5`}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-current" style={{ color: s <= t.rating ? (featured ? C.jaggeryLite : C.jaggery) : (featured ? "rgba(255,251,244,0.2)" : C.parchment) }} />
                  ))}
                </div>
                {t.title && (
                  <h3 className="mt-4" style={{ fontFamily: "var(--font-heading)", fontSize: 22, lineHeight: 1.15, color: featured ? C.ivory : C.ink, fontWeight: 500 }}>{t.title}</h3>
                )}
                <p className="font-body mt-3 flex-1" style={{ fontSize: 15.5, lineHeight: 1.7, color: featured ? "rgba(255,251,244,0.82)" : C.ink2, textAlign: "left", hyphens: "none" }}>
                  “{t.body}”
                </p>
                <div className="mt-7 pt-5 flex items-center gap-3" style={{ borderTop: `1px solid ${featured ? "rgba(255,214,92,0.2)" : C.parchment}` }}>
                  <span className="h-11 w-11 rounded-full grid place-items-center shrink-0" style={{ background: featured ? C.jaggery : `${C.jaggery}22`, color: featured ? C.bark : C.jaggeryDark, fontFamily: "var(--font-heading)", fontSize: 16 }}>
                    {initials(t.author)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-body font-semibold truncate" style={{ fontSize: 14.5 }}>{t.author}</div>
                    <Link href={`/shop/${t.productSlug}`} className="font-body block truncate hover:underline" style={{ fontSize: 12.5, color: featured ? C.jaggeryLite : C.jaggeryDark }}>
                      Bought {t.productName}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
