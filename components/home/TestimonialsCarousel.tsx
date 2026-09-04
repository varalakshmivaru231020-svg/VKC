"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { TestimonialItem } from "./Testimonials";

/**
 * Sliding testimonials: two cards per view on desktop, one on phones.
 * Native scroll-snap does the sliding (so touch swipe works for free);
 * arrows, dots and a gentle autoplay drive it on desktop.
 */
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

const AUTOPLAY_MS = 5500;
const initial = (name: string) => name.trim().charAt(0).toUpperCase() || "V";

export function TestimonialsCarousel({ items }: { items: TestimonialItem[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [perView, setPerView] = useState(2);
  const [page, setPage] = useState(0);
  const [hovering, setHovering] = useState(false);
  const pages = Math.max(1, Math.ceil(items.length / perView));

  // Cards per view follows the breakpoint (md and up shows two).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setPerView(mq.matches ? 2 : 1);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const goTo = useCallback((p: number) => {
    const el = trackRef.current;
    if (!el) return;
    const target = ((p % pages) + pages) % pages;
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
    setPage(target);
  }, [pages]);

  // Keep the dots in sync with manual swipes.
  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    const p = Math.round(el.scrollLeft / el.clientWidth);
    if (p !== page) setPage(p);
  };

  // Autoplay when there is more than one page and the pointer is away.
  useEffect(() => {
    if (pages < 2 || hovering) return;
    const t = setInterval(() => goTo(page + 1), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [pages, hovering, page, goTo]);

  return (
    <div className="relative mt-12" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <style dangerouslySetInnerHTML={{ __html: ".vkc-tm-track::-webkit-scrollbar{display:none}" }} />

      <ul
        ref={trackRef}
        onScroll={onScroll}
        className="vkc-tm-track flex overflow-x-auto snap-x snap-mandatory list-none m-0 p-0"
        style={{ scrollbarWidth: "none", scrollBehavior: "smooth" }}
        aria-roledescription="carousel"
        aria-label="Customer testimonials"
      >
        {items.map((t, i) => (
          <li
            key={t.id}
            className="snap-start shrink-0 w-full md:w-1/2 px-2 md:px-3 py-2"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${items.length}`}
          >
            <article
              className="h-full rounded-lg p-7 sm:p-8 flex flex-col transition-transform duration-300 hover:-translate-y-1"
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
            </article>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-5">
          <button onClick={() => goTo(page - 1)} aria-label="Previous testimonials" className="h-11 w-11 rounded-full grid place-items-center transition-colors duration-300 hover:text-white" style={{ border: `1px solid ${C.jaggery}66`, color: C.jaggeryDark }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.jaggeryDark; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2" role="tablist" aria-label="Testimonial pages">
            {Array.from({ length: pages }).map((_, i) => (
              <button key={i} role="tab" aria-selected={i === page} aria-label={`Go to page ${i + 1}`} onClick={() => goTo(i)}
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: i === page ? 26 : 8, background: i === page ? C.jaggery : C.parchment }} />
            ))}
          </div>
          <button onClick={() => goTo(page + 1)} aria-label="Next testimonials" className="h-11 w-11 rounded-full grid place-items-center transition-colors duration-300" style={{ background: C.bark, color: C.ivory }}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
