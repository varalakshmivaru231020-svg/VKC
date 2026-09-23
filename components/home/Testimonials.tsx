import { TestimonialsCarousel } from "./TestimonialsCarousel";

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
  bark: "#241A12",
  jaggery: "#C99118",
  jaggeryDark: "#8F6A10",
  ivory: "#FCFAF5",
  cream: "#F7F0E3",
  parchment: "#E9DCC3",
  ink: "#241A12",
  ink2: "#6F6255",
  muted: "#8F8171",
};

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || "V";

export function Testimonials({ items, eyebrow = "Customer stories", heading = "What our customers say" }: { items: TestimonialItem[]; eyebrow?: string; heading?: string }) {
  if (!items.length) return null;

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

        <TestimonialsCarousel items={items} />
      </div>
    </section>
  );
}
