import { Star } from "lucide-react";

/**
 * "What our customers say" — admin-managed testimonials (Admin → Testimonials).
 * Renders nothing when there are no active entries, so the page never shows
 * placeholder praise.
 */
export interface TestimonialItem {
  id: string;
  name: string;
  location: string | null;
  tag: string | null;
  rating: number;
  quote: string;
}

const C = {
  bark: "#3A1F0A",
  jaggery: "#E0961C",
  jaggeryDark: "#9A5B0B",
  ivory: "#FFFBF4",
  cream: "#FBF1DE",
  parchment: "#F0DCB6",
  ink: "#2B1708",
  ink2: "#5C3A1E",
  muted: "#8A6A4E",
};

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || "V";

export function Testimonials({ items, eyebrow = "Customer stories", heading = "What our customers say" }: { items: TestimonialItem[]; eyebrow?: string; heading?: string }) {
  if (!items.length) return null;
  const cols = items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";

  return (
    <section className="py-20 sm:py-24" style={{ background: C.ivory }} aria-labelledby="testimonials-heading">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="font-body font-semibold uppercase" style={{ fontSize: 11.5, letterSpacing: "0.26em", color: C.jaggeryDark }}>{eyebrow}</span>
          <h2 id="testimonials-heading" className="mt-4" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.1rem,4.4vw,3.4rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: C.ink, fontWeight: 500 }}>
            {heading}
          </h2>
          <span className="block mx-auto mt-5 h-[2px] w-16" style={{ background: `linear-gradient(90deg, transparent, ${C.jaggery}, transparent)` }} />
        </div>

        <ul className={`mt-14 grid gap-6 md:grid-cols-2 ${cols} list-none m-0 p-0`}>
          {items.map((t) => (
            <li
              key={t.id}
              className="rounded-lg p-7 sm:p-8 flex flex-col transition-transform duration-300 hover:-translate-y-1"
              style={{ background: C.cream, border: `1px solid ${C.parchment}`, boxShadow: "0 18px 40px -28px rgba(58,31,10,0.35)" }}
            >
              <div className="flex items-center gap-1" aria-label={`Rated ${t.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-current" style={{ color: s <= t.rating ? C.jaggery : C.parchment }} />
                ))}
              </div>
              {t.tag && (
                <span className="mt-5 self-start font-body font-semibold uppercase rounded-full px-3 py-1.5" style={{ fontSize: 10.5, letterSpacing: "0.14em", background: C.ivory, color: C.jaggeryDark, border: `1px solid ${C.parchment}` }}>
                  {t.tag}
                </span>
              )}
              <p className="mt-5 flex-1" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: 18.5, lineHeight: 1.55, color: C.ink2, textAlign: "left", hyphens: "none" }}>
                “{t.quote}”
              </p>
              <div className="mt-7 pt-5 flex items-center gap-3" style={{ borderTop: `1px solid ${C.parchment}` }}>
                <span className="h-11 w-11 rounded-full grid place-items-center shrink-0" style={{ background: C.bark, color: C.ivory, fontFamily: "var(--font-heading)", fontSize: 18 }}>
                  {initial(t.name)}
                </span>
                <div className="min-w-0">
                  <div className="font-body font-semibold truncate" style={{ fontSize: 15, color: C.ink }}>{t.name}</div>
                  {t.location && <div className="font-body truncate" style={{ fontSize: 13, color: C.muted }}>{t.location}</div>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
