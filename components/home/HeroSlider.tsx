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
const GOLD = { base: "#E0961C", light: "#FFD65C", dark: "#9A5B0B" };
const INK = "#2B1708";

/* Paper-grain overlay, inline so it needs no asset. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")";

/* ── Headline that reveals one word at a time ────────────────────────────── */
function SplitHeading({ text, color, reduced, size = "lg" }: { text: string; color: string; reduced: boolean; size?: "lg" | "md" }) {
  const lines = text.split("\n");
  let wordIdx = 0;
  return (
    <h1
      aria-label={text.replace(/\n/g, " ")}
      style={{
        fontFamily: "var(--font-heading)",
        fontSize: size === "lg" ? "clamp(2.1rem, 4.2vw, 4rem)" : "clamp(1.9rem, 7.5vw, 2.6rem)",
        fontWeight: 500,
        lineHeight: 1.08,
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

/* ── Slide copy (tag, heading, subtext, CTAs) ──────────────────────────────
   `onDark` = sitting on a photo/dark scrim; otherwise on the slide's bgColor. */
function SlideCopy({ s, onDark, reduced, compact = false }: { s: Slide; onDark: boolean; reduced: boolean; compact?: boolean }) {
  const ink = onDark ? "#FFFFFF" : INK;
  const inkSoft = onDark ? "rgba(255,255,255,0.78)" : "rgba(28,20,16,0.72)";
  return (
    <div className="max-w-xl">
      {s.tag && (
        <motion.div
          className={compact ? "flex items-center gap-3 mb-4" : "flex items-center gap-3 mb-6 sm:mb-8"}
          initial={reduced ? false : { opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
        >
          <motion.span className="block h-px" initial={reduced ? false : { width: 0 }} animate={{ width: 44 }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }} style={{ background: GOLD.base }} />
          <span className="font-body font-semibold uppercase" style={{ fontSize: 11.5, letterSpacing: "0.26em", color: onDark ? GOLD.light : GOLD.dark }}>
            {s.tag}
          </span>
        </motion.div>
      )}

      {s.heading && <SplitHeading text={s.heading} color={ink} reduced={reduced} size={compact ? "md" : "lg"} />}

      {s.subtext && (
        <motion.p
          className={compact ? "font-body mt-4 max-w-lg" : "font-body mt-6 max-w-lg"}
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
          style={{ fontSize: compact ? 15.5 : "clamp(1rem, 1.3vw, 1.2rem)", lineHeight: 1.65, color: inkSoft, textAlign: "left", hyphens: "none" }}
        >
          {s.subtext}
        </motion.p>
      )}

      {(s.ctaLabel || (s.ctaSecLabel && s.ctaSecHref)) && (
        <motion.div
          className={compact ? "mt-6 flex flex-wrap items-center gap-3" : "mt-8 sm:mt-10 flex flex-wrap items-center gap-3 sm:gap-4"}
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.7 }}
        >
          {s.ctaLabel && (
            <Link
              href={s.ctaHref || "/shop"}
              className="group inline-flex items-center gap-3 pl-6 pr-2 rounded-full font-body font-semibold text-sm transition-transform duration-300 hover:-translate-y-0.5"
              style={{ height: 48, background: GOLD.base, color: INK, boxShadow: "0 12px 32px rgba(196,146,42,0.35)" }}
            >
              {s.ctaLabel}
              <span className="grid place-items-center h-8 w-8 rounded-full transition-transform duration-300 group-hover:rotate-45" style={{ background: INK, color: GOLD.light }}>
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          )}
          {s.ctaSecLabel && s.ctaSecHref && (
            <Link
              href={s.ctaSecHref}
              className="group inline-flex items-center gap-2 px-6 rounded-full font-body font-semibold text-sm transition-colors duration-300 backdrop-blur-sm"
              style={{
                height: 48,
                border: `1px solid ${onDark ? "rgba(255,255,255,0.45)" : "rgba(28,20,16,0.25)"}`,
                color: ink,
                background: onDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.35)",
              }}
            >
              {s.ctaSecLabel}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function HeroSlider({ slides }: Props) {
  const reduced = useReducedMotion() ?? false;
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [cycle, setCycle] = useState(0); // bumps to restart the progress bar
  // Natural aspect ratio (w/h) of each slide image, read once it loads. The
  // stage sizes itself from this so the composition is preserved instead of
  // being forced into an arbitrary height. 3:2 is assumed until the image
  // reports its real size, which avoids a layout jump for typical banners.
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const noteRatio = (src: string) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (w && h) setRatios((r) => (r[src] ? r : { ...r, [src]: w / h }));
  };
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

  /* Autoplay — paused on hover or via the pause button. */
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
  const hasImage = Boolean(s.imageUrl) && !s.videoUrl;
  const hasCopy = Boolean(s.tag || s.heading || s.subtext || s.ctaLabel);
  const mobileSrc = s.mobileImageUrl || s.imageUrl || null;
  const ink = hasMedia ? "#FFFFFF" : INK;
  const inkFaint = hasMedia ? "rgba(255,255,255,0.45)" : "rgba(28,20,16,0.4)";
  const line = hasMedia ? "rgba(255,255,255,0.28)" : "rgba(28,20,16,0.16)";

  /* Bottom rail: progress, counter, controls. `onDark` picks the colour scheme. */
  const Rail = ({ onDark, className = "" }: { onDark: boolean; className?: string }) => {
    const c = onDark ? "#FFFFFF" : INK;
    const faint = onDark ? "rgba(255,255,255,0.45)" : "rgba(28,20,16,0.4)";
    const ln = onDark ? "rgba(255,255,255,0.28)" : "rgba(28,20,16,0.16)";
    return (
      <div className={`flex items-end justify-between gap-6 ${className}`}>
        <div className="flex items-center gap-2 flex-1 max-w-xs" role="tablist" aria-label="Slides">
          {slides.map((_, i) => (
            <button key={i} role="tab" aria-selected={i === current} aria-label={`Go to slide ${i + 1}`} onClick={() => go(i, i > current ? 1 : -1)} className="relative h-6 flex-1 group">
              <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] rounded-full overflow-hidden" style={{ background: ln }}>
                {i === current && (
                  <span
                    key={cycle}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: onDark ? "#FFFFFF" : GOLD.dark, animation: `vkc-hero-progress ${AUTOPLAY_MS}ms linear forwards`, animationPlayState: running ? "running" : "paused" }}
                  />
                )}
                {i < current && <span className="absolute inset-0" style={{ background: onDark ? "rgba(255,255,255,0.7)" : "rgba(28,20,16,0.45)" }} />}
              </span>
            </button>
          ))}
        </div>
        <div className="hidden sm:flex items-baseline gap-1 font-heading tabular-nums leading-none" style={{ color: c }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={current} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} style={{ fontSize: 30 }}>
              {String(current + 1).padStart(2, "0")}
            </motion.span>
          </AnimatePresence>
          <span style={{ fontSize: 13, color: faint }}>/ {String(count).padStart(2, "0")}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play slideshow" : "Pause slideshow"} className="grid place-items-center h-10 w-10 rounded-full backdrop-blur-sm" style={{ border: `1px solid ${ln}`, color: c, background: onDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.3)" }}>
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
          <button onClick={prev} aria-label="Previous slide" className="grid place-items-center h-10 w-10 rounded-full transition-transform duration-300 hover:scale-105 backdrop-blur-sm" style={{ border: `1px solid ${ln}`, color: c, background: onDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.3)" }}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={next} aria-label="Next slide" className="grid place-items-center h-10 w-10 rounded-full transition-transform duration-300 hover:scale-105" style={{ background: onDark ? "#FFFFFF" : INK, color: onDark ? INK : "#FBF8F3" }}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <section
      className="relative overflow-hidden select-none"
      style={{ background: s.bgColor }}
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

      {/* ── Stage ─────────────────────────────────────────────────────────────
          The stage takes its height from the slide's own image (an invisible
          in-flow copy), so the whole banner is always visible — nothing is
          cropped on any screen. Slides without an image fall back to a
          viewport-based height. */}
      <div className="relative">
        {/* Stage sizer.
            Image slides: the stage keeps the image's own aspect ratio (read
            from the file), so at full width the whole composition is shown.
            On desktop the height is capped at 90% of the viewport; only when
            that cap bites does object-fit: cover trim a thin band top and
            bottom — never the sides. Phones use the mobile crop's ratio when
            one is uploaded, otherwise the desktop image's, and show it whole
            with the copy stacked underneath.
            Video keeps a fixed cinematic height; colour-field slides a taller one. */}
        <div
          aria-hidden
          className={hasImage ? "vkc-hero-media-h" : s.videoUrl ? "vkc-hero-video-h" : "vkc-hero-plain-h"}
          style={hasImage ? ({
            "--vkc-ar-desktop": ratios[s.imageUrl as string] ?? 1.5,
            "--vkc-ar-mobile": ratios[(s.mobileImageUrl || s.imageUrl) as string] ?? (s.mobileImageUrl ? 0.8 : 1.5),
          } as React.CSSProperties) : undefined}
        />
        <style dangerouslySetInnerHTML={{ __html:
          ".vkc-hero-media-h{aspect-ratio:var(--vkc-ar-mobile,1.5);min-height:200px;max-height:70vh}" +
          "@media(min-width:768px){.vkc-hero-media-h{aspect-ratio:var(--vkc-ar-desktop,1.5);min-height:440px;max-height:90vh}}" +
          ".vkc-hero-video-h{height:clamp(420px,56vw,820px)}" +
          ".vkc-hero-plain-h{height:clamp(520px,80vh,880px)}"
        }} />
        {/* Hidden loaders that report each image's natural size. */}
        {hasImage && (
          <>
            <img src={s.imageUrl as string} alt="" aria-hidden className="hidden" onLoad={noteRatio(s.imageUrl as string)} />
            {s.mobileImageUrl && <img src={s.mobileImageUrl} alt="" aria-hidden className="hidden" onLoad={noteRatio(s.mobileImageUrl)} />}
          </>
        )}

        {/* Visual layers: crossfade, no zoom, so the image edges stay put. */}
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={current}
            className="absolute inset-0"
            initial={{ opacity: 0, x: reduced ? 0 : dir * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduced ? 0 : dir * -30 }}
            transition={{ duration: 0.9, ease: EASE }}
            style={{ background: hasMedia ? s.imageBg || s.bgColor : s.bgColor }}
          >
            {s.videoUrl ? (
              <video src={s.videoUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
            ) : s.imageUrl ? (
              <>
                {/* Full-bleed: the image covers the stage completely. */}
                <div className={s.mobileImageUrl ? "hidden md:block absolute inset-0" : "absolute inset-0"}>
                  <SmartImage src={s.imageUrl} alt={s.tag || s.heading} fill objectFit="cover" objectPosition="center" />
                </div>
                {s.mobileImageUrl && (
                  <div className="block md:hidden absolute inset-0">
                    <SmartImage src={s.mobileImageUrl} alt={s.tag || s.heading} fill objectFit="cover" objectPosition="center" />
                  </div>
                )}
              </>
            ) : (
              /* No media: a sculpted colour field so the slide still feels art-directed. */
              <>
                <div aria-hidden className="absolute -right-[12%] top-1/2 -translate-y-1/2 hidden md:block"
                  style={{ width: "min(58vw, 820px)", aspectRatio: "1 / 1.15", borderRadius: "48% 52% 44% 56% / 55% 42% 58% 45%", background: s.imageBg || `linear-gradient(135deg, ${GOLD.light}, ${GOLD.dark})`, boxShadow: "0 40px 120px rgba(28,20,16,0.18)" }} />
                <div aria-hidden className="absolute inset-0 md:hidden" style={{ background: `linear-gradient(180deg, ${s.bgColor} 30%, transparent 100%), ${s.imageBg || "none"}` }} />
                <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 50% at 20% 30%, rgba(255,255,255,0.55), transparent 70%)" }} />
              </>
            )}

            {/* Readability scrim — desktop only, where copy sits over the image.
                On phones the copy moves below the image so the artwork stays clean. */}
            {hasMedia && hasCopy && (
              /* The copy owns the left ~45% of the stage: a firm dark gradient
                 there keeps the headline off the product imagery. */
              <div className="absolute inset-0 hidden md:block" style={{ background: "linear-gradient(90deg, rgba(20,10,3,0.70) 0%, rgba(20,10,3,0.52) 28%, rgba(20,10,3,0.16) 48%, rgba(20,10,3,0) 60%)" }} />
            )}
          </motion.div>
        </AnimatePresence>

        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRAIN, opacity: hasMedia ? 0.1 : 0.08, mixBlendMode: "overlay" }} />

        {/* Desktop copy: overlaid on the stage. Slides without media show copy on all sizes. */}
        {hasCopy && (
          <div className={`${hasMedia ? "hidden md:flex" : "flex"} absolute inset-0 z-10 flex-col justify-center`}>
            <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-8 lg:px-8 pt-8 pb-24 md:pb-28">
              <AnimatePresence mode="wait" initial={true}>
                <motion.div key={current} exit={{ opacity: 0, transition: { duration: 0.35 } }}>
                  <SlideCopy s={s} onDark={hasMedia} reduced={reduced} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Desktop rail */}
        {count > 1 && (
          <div className={`${hasMedia ? "hidden md:block" : "block"} absolute bottom-0 left-0 right-0 z-20`}>
            <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pb-6 sm:pb-8">
              <Rail onDark={hasMedia} />
            </div>
          </div>
        )}

      </div>

      {/* ── Mobile copy + rail: below the full, uncropped image ───────────── */}
      {hasMedia && (hasCopy || count > 1) && (
        <div className="md:hidden relative z-10 px-6 pt-7 pb-6" style={{ background: s.bgColor, color: ink }}>
          {hasCopy && (
            <AnimatePresence mode="wait" initial={true}>
              <motion.div key={current} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
                <SlideCopy s={s} onDark={false} reduced={reduced} compact />
              </motion.div>
            </AnimatePresence>
          )}
          {count > 1 && <Rail onDark={false} className="mt-7" />}
        </div>
      )}
      {!hasImage && s.videoUrl && mobileSrc === null && null}
    </section>
  );
}
