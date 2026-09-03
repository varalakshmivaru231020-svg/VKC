"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  mobileImageUrl?: string | null;
  videoUrl?: string | null;
}

interface Props {
  slides: Slide[];
}

const AUTOPLAY_MS = 6500;
const EASE = [0.22, 1, 0.36, 1] as const;

/* Brand jaggery-gold, literal on purpose: the admin theme tokens default to a
   monochrome palette, and a hero CTA must stay readable over any photo. */
const GOLD = { base: "#C98B2E", light: "#F0C96D", dark: "#8A5B17" };

/* Paper-grain overlay, inline so it needs no asset. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")";

/* ── Headline that reveals one word at a time ────────────────────────────── */
function SplitHeading({ text, color, reduced }: { text: string; color: string; reduced: boolean }) {
  const lines = text.split("\n");
  let wordIdx = 0;
  return (
    <h1
      aria-label={text.replace(/\n/g, " ")}
      style={{
        fontFamily: "var(--font-heading)",
        fontSize: "clamp(2.9rem, 8.2vw, 7.2rem)",
        fontWeight: 500,
        lineHeight: 0.98,
        letterSpacing: "-0.025em",
        color,
        wordBreak: "break-word",
        overflowWrap: "break-word",
      }}
    >
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((word, wi) => {
            const i = wordIdx++;
            const isLast = li === lines.length - 1;
            return (
              <span key={wi} className="inline-block overflow-hidden align-bottom" style={{ paddingBottom: "0.08em", marginBottom: "-0.08em" }}>
                <motion.span
                  aria-hidden
                  className="inline-block"
                  initial={reduced ? false : { y: "110%", rotate: 4, opacity: 0 }}
                  animate={{ y: 0, rotate: 0, opacity: 1 }}
                  exit={reduced ? undefined : { y: "-60%", opacity: 0 }}
                  transition={{ duration: 0.9, ease: EASE, delay: 0.15 + i * 0.07 }}
                  style={{
                    fontStyle: isLast && lines.length > 1 ? "italic" : "normal",
                    color: isLast && lines.length > 1 ? GOLD.light : "inherit",
                  }}
                >
                  {word}
                </motion.span>
              </span>
            );
          }).reduce<React.ReactNode[]>((acc, el, wi) => (wi ? [...acc, " ", el] : [el]), [])}
        </span>
      ))}
    </h1>
  );
}

export default function HeroSlider({ slides }: Props) {
  const reduced = useReducedMotion() ?? false;
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [cycle, setCycle] = useState(0); // bumps to restart the progress bar
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback(
    (idx: number, direction: 1 | -1) => {
      if (count < 2) return;
      setDir(direction);
      setCurrent(((idx % count) + count) % count);
      setCycle((c) => c + 1);
    },
    [count]
  );
  const next = useCallback(() => go(current + 1, 1), [current, go]);
  const prev = useCallback(() => go(current - 1, -1), [current, go]);

  /* Autoplay — paused on hover, on the pause button, or when the tab is hidden. */
  const running = count > 1 && !paused && !hovering;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(next, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [running, next, cycle]);

  /* Keyboard arrows. */
  useEffect(() => {
    if (count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, next, prev]);

  if (!count) return null;

  const s = slides[current];
  const hasMedia = Boolean(s.videoUrl || s.imageUrl);
  const hasCopy = Boolean(s.tag || s.heading || s.subtext || s.ctaLabel);
  const ink = hasMedia ? "#FFFFFF" : "var(--color-text-primary)";
  const inkSoft = hasMedia ? "rgba(255,255,255,0.78)" : "var(--color-text-secondary)";
  const inkFaint = hasMedia ? "rgba(255,255,255,0.45)" : "rgba(28,20,16,0.4)";
  const line = hasMedia ? "rgba(255,255,255,0.28)" : "rgba(28,20,16,0.16)";

  return (
    <section
      className="relative overflow-hidden select-none"
      style={{ minHeight: "clamp(560px, 92vh, 960px)", background: s.bgColor }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 48) (dx < 0 ? next : prev)();
      }}
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      <style dangerouslySetInnerHTML={{ __html: "@keyframes vkc-hero-progress{from{width:0%}to{width:100%}}" }} />

      {/* ── Backgrounds: crossfade + slow Ken Burns drift ─────────────────── */}
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: reduced ? 1 : 1.06, x: reduced ? 0 : dir * 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: reduced ? 1 : 0.98, x: reduced ? 0 : dir * -40 }}
          transition={{ duration: 1.1, ease: EASE }}
          style={{ background: hasMedia ? s.imageBg || "#1C1410" : s.bgColor }}
        >
          {s.videoUrl ? (
            <video src={s.videoUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
          ) : s.imageUrl ? (
            <motion.div
              className="absolute inset-0"
              initial={reduced ? false : { scale: 1 }}
              animate={reduced ? undefined : { scale: 1.08 }}
              transition={{ duration: AUTOPLAY_MS / 1000 + 1.5, ease: "linear" }}
            >
              <div className={s.mobileImageUrl ? "hidden md:block absolute inset-0" : "absolute inset-0"}>
                <SmartImage src={s.imageUrl} alt={s.tag || s.heading} fill objectFit="cover" objectPosition="center" />
              </div>
              {s.mobileImageUrl && (
                <div className="block md:hidden absolute inset-0">
                  <SmartImage src={s.mobileImageUrl} alt={s.tag || s.heading} fill objectFit="cover" objectPosition="center" />
                </div>
              )}
            </motion.div>
          ) : (
            /* No media: a sculpted colour field so the slide still feels art-directed. */
            <>
              <div
                aria-hidden
                className="absolute -right-[12%] top-1/2 -translate-y-1/2 hidden md:block"
                style={{
                  width: "min(58vw, 820px)",
                  aspectRatio: "1 / 1.15",
                  borderRadius: "48% 52% 44% 56% / 55% 42% 58% 45%",
                  background: s.imageBg || `linear-gradient(135deg, ${GOLD.light}, ${GOLD.dark})`,
                  boxShadow: "0 40px 120px rgba(28,20,16,0.18)",
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0 md:hidden"
                style={{ background: `linear-gradient(180deg, ${s.bgColor} 30%, transparent 100%), ${s.imageBg || "none"}` }}
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: `radial-gradient(60% 50% at 20% 30%, rgba(255,255,255,0.55), transparent 70%)` }}
              />
            </>
          )}

          {/* Readability scrim, only over photos/video with copy on top. */}
          {hasMedia && hasCopy && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(100deg, rgba(10,6,3,0.72) 0%, rgba(10,6,3,0.42) 45%, rgba(10,6,3,0.05) 100%), linear-gradient(0deg, rgba(10,6,3,0.55) 0%, transparent 35%)",
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRAIN, opacity: hasMedia ? 0.14 : 0.08, mixBlendMode: "overlay" }} />

      {/* ── Copy ──────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col justify-center" style={{ minHeight: "clamp(560px, 92vh, 960px)" }}>
        <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-10 lg:px-16 pt-20 pb-32 sm:pb-36">
          <AnimatePresence mode="wait" initial={true}>
            <motion.div key={current} className="max-w-3xl" exit={{ opacity: 0, transition: { duration: 0.35 } }}>
              {s.tag && (
                <motion.div
                  className="flex items-center gap-3 mb-6 sm:mb-8"
                  initial={reduced ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
                >
                  <motion.span
                    className="block h-px"
                    initial={reduced ? false : { width: 0 }}
                    animate={{ width: 44 }}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
                    style={{ background: GOLD.base }}
                  />
                  <span
                    className="font-body font-semibold uppercase"
                    style={{ fontSize: 11.5, letterSpacing: "0.26em", color: hasMedia ? GOLD.light : GOLD.dark }}
                  >
                    {s.tag}
                  </span>
                </motion.div>
              )}

              {s.heading && <SplitHeading text={s.heading} color={ink} reduced={reduced} />}

              {s.subtext && (
                <motion.p
                  className="font-body text-left mt-7 max-w-lg"
                  initial={reduced ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
                  style={{ fontSize: "clamp(1rem, 1.35vw, 1.25rem)", lineHeight: 1.65, color: inkSoft }}
                >
                  {s.subtext}
                </motion.p>
              )}

              {(s.ctaLabel || (s.ctaSecLabel && s.ctaSecHref)) && (
                <motion.div
                  className="mt-9 sm:mt-11 flex flex-wrap items-center gap-3 sm:gap-4"
                  initial={reduced ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: EASE, delay: 0.7 }}
                >
                  {s.ctaLabel && (
                    <Link
                      href={s.ctaHref || "/shop"}
                      className="group inline-flex items-center gap-3 h-13 pl-7 pr-2 rounded-full font-body font-semibold text-sm transition-transform duration-300 hover:-translate-y-0.5"
                      style={{ height: 52, background: GOLD.base, color: "#1C1410", boxShadow: "0 12px 32px rgba(196,146,42,0.35)" }}
                    >
                      {s.ctaLabel}
                      <span className="grid place-items-center h-9 w-9 rounded-full transition-transform duration-300 group-hover:rotate-45" style={{ background: "#1C1410", color: GOLD.light }}>
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </Link>
                  )}
                  {s.ctaSecLabel && s.ctaSecHref && (
                    <Link
                      href={s.ctaSecHref}
                      className="group inline-flex items-center gap-2 h-13 px-7 rounded-full font-body font-semibold text-sm transition-colors duration-300 backdrop-blur-sm"
                      style={{
                        height: 52,
                        border: `1px solid ${hasMedia ? "rgba(255,255,255,0.45)" : "rgba(28,20,16,0.25)"}`,
                        color: ink,
                        background: hasMedia ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {s.ctaSecLabel}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom rail: progress, counter, controls ───────────────────────── */}
      {count > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pb-7 sm:pb-9 flex items-end justify-between gap-6">
            {/* Segmented progress */}
            <div className="flex items-center gap-2 flex-1 max-w-xs" role="tablist" aria-label="Slides">
              {slides.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => go(i, i > current ? 1 : -1)}
                  className="relative h-6 flex-1 group"
                >
                  <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] rounded-full overflow-hidden" style={{ background: line }}>
                    {i === current && (
                      <span
                        key={cycle}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: count > 1 ? undefined : "100%",
                          background: hasMedia ? "#FFFFFF" : GOLD.dark,
                          animation: `vkc-hero-progress ${AUTOPLAY_MS}ms linear forwards`,
                          animationPlayState: running ? "running" : "paused",
                        }}
                      />
                    )}
                    {i < current && <span className="absolute inset-0" style={{ background: hasMedia ? "rgba(255,255,255,0.7)" : "rgba(28,20,16,0.45)" }} />}
                  </span>
                </button>
              ))}
            </div>

            {/* Counter */}
            <div className="hidden sm:flex items-baseline gap-1 font-heading tabular-nums leading-none" style={{ color: ink }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={current}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  style={{ fontSize: 34 }}
                >
                  {String(current + 1).padStart(2, "0")}
                </motion.span>
              </AnimatePresence>
              <span style={{ fontSize: 14, color: inkFaint }}>/ {String(count).padStart(2, "0")}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? "Play slideshow" : "Pause slideshow"}
                className="grid place-items-center h-10 w-10 rounded-full transition-colors duration-300 backdrop-blur-sm"
                style={{ border: `1px solid ${line}`, color: ink, background: hasMedia ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.3)" }}
              >
                {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={prev}
                aria-label="Previous slide"
                className="grid place-items-center h-11 w-11 rounded-full transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                style={{ border: `1px solid ${line}`, color: ink, background: hasMedia ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.3)" }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                aria-label="Next slide"
                className="grid place-items-center h-11 w-11 rounded-full transition-all duration-300 hover:scale-105"
                style={{ background: hasMedia ? "#FFFFFF" : "var(--color-text-primary)", color: hasMedia ? "#1C1410" : "#FBF8F3" }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll cue */}
      <div className="absolute right-6 sm:right-10 lg:right-16 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-3 z-10 pointer-events-none">
        <span className="font-body uppercase" style={{ fontSize: 10, letterSpacing: "0.3em", color: inkFaint, writingMode: "vertical-rl" }}>Scroll</span>
        <span className="relative block w-px h-16 overflow-hidden" style={{ background: line }}>
          <motion.span
            className="absolute left-0 top-0 w-px h-6"
            animate={reduced ? undefined : { y: [-24, 64] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ background: hasMedia ? "#FFFFFF" : GOLD.dark }}
          />
        </span>
      </div>
    </section>
  );
}
