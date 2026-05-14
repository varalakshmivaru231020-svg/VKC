"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

interface Slide {
  tag: string;
  heading: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  ctaSecLabel?: string | null;
  ctaSecHref?: string | null;
  bgColor: string;
  imageBg: string;
  imageUrl?: string | null;
}

interface Props {
  slides: Slide[];
}

export default function HeroSlider({ slides }: Props) {
  const [current, setCurrent]     = useState(0);
  const [prev, setPrev]           = useState(-1);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir]             = useState<"next" | "prev">("next");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const go = useCallback(
    (idx: number, direction: "next" | "prev") => {
      if (animating) return;
      setDir(direction);
      setPrev(current);
      setCurrent(idx);
      setAnimating(true);
      setTimeout(() => { setPrev(-1); setAnimating(false); }, 650);
    },
    [animating, current]
  );

  const next = useCallback(() => go((current + 1) % slides.length, "next"), [current, go, slides.length]);

  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next]);

  if (!slides.length) return null;

  const s = slides[current];

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "88vh" }}>
      {/* Slides */}
      {slides.map((sl, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            opacity: i === current ? 1 : 0,
            transform: i === current
              ? "translateX(0)"
              : i === prev
              ? `translateX(${dir === "next" ? "-4%" : "4%"})`
              : `translateX(${dir === "next" ? "4%" : "-4%"})`,
            transition: i === current || i === prev
              ? "opacity 0.65s ease, transform 0.65s ease"
              : "none",
            pointerEvents: i === current ? "auto" : "none",
            zIndex: i === current ? 2 : i === prev ? 1 : 0,
          }}
        >
          {/* Full-bleed background */}
          <div className="absolute inset-0" style={{ background: sl.imageUrl ? sl.imageBg : sl.bgColor }}>
            {sl.imageUrl && (
              <SmartImage src={sl.imageUrl} alt={sl.tag} fill objectFit="cover" objectPosition="center" />
            )}
          </div>

          {/* Gradient overlay — only when there is text to keep readable */}
          {sl.imageUrl && (sl.tag || sl.heading || sl.subtext || sl.ctaLabel) && (
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(105deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.38) 45%, rgba(0,0,0,0.08) 100%)" }}
            />
          )}

          {/* Content — only rendered when there is something to show */}
          {(sl.tag || sl.heading || sl.subtext || sl.ctaLabel) && (
            <div className="relative z-10 flex items-center h-full min-h-[88vh]">
              <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-16 w-full py-20">
                <div className="max-w-xl space-y-6">
                  {sl.tag && (
                    <div className="flex items-center gap-3">
                      <div className="h-px w-10" style={{ background: "var(--color-gold)" }} />
                      <span
                        className="text-xs font-semibold tracking-[0.18em] uppercase font-body"
                        style={{ color: sl.imageUrl ? "var(--color-gold-light)" : "var(--color-gold)" }}
                      >
                        {sl.tag}
                      </span>
                    </div>
                  )}

                  {sl.heading && (
                    <h1
                      className="whitespace-pre-line"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "var(--text-display)",
                        fontWeight: "var(--weight-heading)",
                        lineHeight: "var(--leading-display)",
                        letterSpacing: "var(--tracking-display)",
                        color: sl.imageUrl ? "#FFFFFF" : "var(--color-text-primary)",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {sl.heading}
                    </h1>
                  )}

                  {sl.subtext && (
                    <p
                      className="max-w-md"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-body-xl)",
                        lineHeight: "var(--leading-body)",
                        color: sl.imageUrl ? "rgba(255,255,255,0.82)" : "var(--color-text-secondary)",
                      }}
                    >
                      {sl.subtext}
                    </p>
                  )}

                  {(sl.ctaLabel || sl.ctaSecLabel) && (
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      {sl.ctaLabel && (
                        <Link
                          href={sl.ctaHref || "/shop"}
                          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xs text-sm font-semibold font-body transition-all duration-normal hover:gap-3.5 hover:shadow-md"
                          style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
                        >
                          {sl.ctaLabel}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                      {sl.ctaSecLabel && sl.ctaSecHref && (
                        <Link
                          href={sl.ctaSecHref}
                          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xs text-sm font-semibold font-body border transition-colors duration-normal"
                          style={{
                            borderColor: sl.imageUrl ? "rgba(255,255,255,0.6)" : "var(--color-primary)",
                            color: sl.imageUrl ? "#FFFFFF" : "var(--color-primary)",
                            background: sl.imageUrl ? "rgba(255,255,255,0.08)" : "transparent",
                          }}
                        >
                          {sl.ctaSecLabel}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-2.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i, i > current ? "next" : "prev")}
              aria-label={`Go to slide ${i + 1}`}
              className="transition-all duration-300"
              style={{
                width: i === current ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current
                  ? (s.imageUrl ? "#FFFFFF" : "var(--color-primary)")
                  : (s.imageUrl ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)"),
              }}
            />
          ))}
        </div>
      )}

      {/* Slide counter */}
      {slides.length > 1 && (
        <div
          className="absolute bottom-8 right-4 lg:right-8 z-10 text-xs font-body font-medium tabular-nums"
          style={{ color: s.imageUrl ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)" }}
        >
          {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </div>
      )}
    </section>
  );
}
