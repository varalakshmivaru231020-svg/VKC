"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

/**
 * Kit for the About film (/about): one palette, three voices of type, and the
 * few moves the page is allowed to make — a masked line rising, a frame
 * opening, a photograph drifting behind its window. Everything here honours
 * prefers-reduced-motion, and the scroll-driven moves switch off on phones,
 * where they cost frames and the composition is different anyway.
 */

export const F = {
  forest: "#0D1B14",
  night: "#08110C",
  cream: "#EEE7D8",
  paper: "#F7F4EC",
  gold: "#C39A50",
  brown: "#7A4C2D",
  ink: "#16120C",
  onDark: "#F7F4EC",
  onDarkMuted: "rgba(247,244,236,0.66)",
  onDarkLine: "rgba(247,244,236,0.16)",
  onLightMuted: "rgba(22,18,12,0.62)",
  onLightLine: "rgba(22,18,12,0.16)",
};

export const EASE = [0.19, 1, 0.22, 1] as const;

/* Serif for statements, mono for metadata, sans for reading. The serif and
   mono families are set as CSS variables by the page (next/font). */
export const TYPE = {
  serif: "var(--film-serif), var(--font-heading), 'Cormorant Garamond', Georgia, serif",
  mono: "var(--film-mono), ui-monospace, 'SFMono-Regular', Menlo, monospace",
  sans: "var(--font-body), Inter, system-ui, sans-serif",
};

export const T = {
  colossal: { fontFamily: TYPE.serif, fontWeight: 400, fontSize: "clamp(3.1rem, 10.2vw, 10.5rem)", lineHeight: 0.92, letterSpacing: "-0.035em", textTransform: "uppercase" } as React.CSSProperties,
  display: { fontFamily: TYPE.serif, fontWeight: 400, fontSize: "clamp(2.7rem, 7.4vw, 7.2rem)", lineHeight: 0.96, letterSpacing: "-0.03em", textTransform: "uppercase" } as React.CSSProperties,
  title: { fontFamily: TYPE.serif, fontWeight: 400, fontSize: "clamp(2.2rem, 5vw, 4.6rem)", lineHeight: 1, letterSpacing: "-0.025em", textTransform: "uppercase" } as React.CSSProperties,
  lede: { fontFamily: TYPE.serif, fontWeight: 400, fontSize: "clamp(1.45rem, 2.3vw, 2.05rem)", lineHeight: 1.28, letterSpacing: "-0.01em" } as React.CSSProperties,
  body: { fontFamily: TYPE.sans, fontSize: "clamp(1rem, 1.08vw, 1.09rem)", lineHeight: 1.78, fontWeight: 400 } as React.CSSProperties,
  meta: { fontFamily: TYPE.mono, fontSize: 11, lineHeight: 1.5, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 400 } as React.CSSProperties,
};

/* Reduced motion, and "lite" for phones and small tablets. Lite starts false
   on the server and settles after mount; nothing that depends on it changes
   layout height, so there is no shift. */
export function useFilm() {
  const reduced = Boolean(useReducedMotion());
  const [lite, setLite] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const on = () => setLite(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return { reduced, lite, still: reduced || lite };
}

/* Film grain: one tiny SVG noise tile, static, never animated. */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function Grain({ opacity = 0.07, blend = "overlay" }: { opacity?: number; blend?: "overlay" | "multiply" | "soft-light" }) {
  return <div aria-hidden className="pointer-events-none absolute inset-0 z-[2]" style={{ backgroundImage: GRAIN, backgroundSize: "220px 220px", opacity, mixBlendMode: blend }} />;
}

/* Small mono line — dates, places, chapter marks. */
export function Meta({ children, color, className = "", style }: { children: React.ReactNode; color?: string; className?: string; style?: React.CSSProperties }) {
  return <span className={`block ${className}`} style={{ ...T.meta, color, ...style }}>{children}</span>;
}

/* Chapter mark: "03 — THE TIMELINE" with a hairline that draws itself. */
export function Chapter({ n, children, color = F.brown, line = F.onLightLine }: { n: string; children: React.ReactNode; color?: string; line?: string }) {
  const { reduced } = useFilm();
  return (
    <div className="flex items-center gap-4">
      <Meta color={color}>{n}</Meta>
      <motion.span aria-hidden className="block h-px w-14 origin-left" style={{ background: line }} initial={reduced ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 1.2, ease: EASE }} />
      <Meta color={color}>{children}</Meta>
    </div>
  );
}

/* A heading set as lines, each rising from behind its own mask. The wrapper
   is what is observed — never the moving line — so nothing can stick hidden. */
export function Lines({ lines, as = "h2", style, className = "", id, delay = 0, stagger = 0.12, lineStyles }: {
  lines: string[]; as?: "h1" | "h2" | "h3" | "p"; style?: React.CSSProperties; className?: string; id?: string; delay?: number; stagger?: number;
  /** Per-line overrides, e.g. italic or a colour on the last line. */
  lineStyles?: (React.CSSProperties | undefined)[];
}) {
  const { reduced } = useFilm();
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const shown = reduced || inView;
  const Tag = motion[as] as typeof motion.h2;
  return (
    <Tag ref={ref} id={id} className={className} style={{ margin: 0, ...style }} aria-label={lines.join(" ")}>
      {lines.map((l, i) => (
        <span key={i} aria-hidden className="block overflow-hidden" style={{ paddingBottom: "0.14em", marginBottom: "-0.14em", paddingRight: "0.06em" }}>
          <motion.span className="block" style={{ willChange: "transform", ...lineStyles?.[i] }} initial={reduced ? false : { y: "108%" }} animate={shown ? { y: 0 } : { y: "108%" }} transition={{ duration: 1.25, ease: EASE, delay: delay + i * stagger }}>
            {l}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/* Quiet fade-and-rise for reading text. */
export function Rise({ children, className = "", delay = 0, y = 26, style }: { children: React.ReactNode; className?: string; delay?: number; y?: number; style?: React.CSSProperties }) {
  const { reduced } = useFilm();
  return (
    <motion.div className={className} style={style} initial={reduced ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -10% 0px" }} transition={{ duration: 1.1, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

/* The raw picture. Bundled files (/images/…) go through next/image for AVIF
   and responsive sizes; uploads are served as they are, like the rest of the
   site does, with a separate phone source when the admin supplied one. */
export function Picture({ src, mobileSrc, alt, sizes = "100vw", priority = false, position = "center", className = "" }: {
  src: string; mobileSrc?: string | null; alt: string; sizes?: string; priority?: boolean; position?: string; className?: string;
}) {
  if (!src) return null;
  if (src.startsWith("/images/")) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} quality={72} className={`object-cover ${className}`} style={{ objectPosition: position }} />;
  }
  return (
    <picture>
      {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" fetchPriority={priority ? "high" : undefined} className={`absolute inset-0 h-full w-full object-cover ${className}`} style={{ objectPosition: position }} />
    </picture>
  );
}

/* A photograph behind a window: the frame opens (clip-path), the picture
   settles from a slight blur and scale, then drifts as the page scrolls. */
export function Frame({ src, mobileSrc, alt, ratio, className = "", sizes, priority = false, position, drift = 7, reveal = "up", children, style, grade = "" }: {
  src: string; mobileSrc?: string | null; alt: string; ratio?: string; className?: string; sizes?: string; priority?: boolean; position?: string;
  /** Parallax travel, in percent of the frame's height. */
  drift?: number; reveal?: "up" | "left" | "none"; children?: React.ReactNode; style?: React.CSSProperties;
  /** Tailwind filter classes for the photograph, e.g. a quieter saturation. */
  grade?: string;
}) {
  const { reduced, still } = useFilm();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${drift}%`, `${drift}%`]);
  const open = reduced || reveal === "none" || inView;
  const closed = reveal === "left" ? "inset(0% 100% 0% 0%)" : "inset(100% 0% 0% 0%)";
  // The unclipped wrapper is what is observed and measured: a box clipped to
  // nothing never reports as in view, so the window would never open.
  return (
    <div ref={ref} className={`relative ${className}`} style={{ aspectRatio: ratio, ...style }}>
      <motion.div className="absolute inset-0 overflow-hidden" style={{ background: "rgba(122,76,45,0.12)" }} initial={false} animate={{ clipPath: open ? "inset(0% 0% 0% 0%)" : closed }} transition={{ duration: 1.5, ease: EASE }}>
        <motion.div className="absolute" style={{ inset: still ? 0 : `-${drift + 2}% 0`, y: still ? 0 : y }}>
          <motion.div className="absolute inset-0" initial={false} animate={open ? { scale: 1, filter: "blur(0px)" } : { scale: 1.12, filter: "blur(10px)" }} transition={{ duration: 1.9, ease: EASE }}>
            <Picture src={src} mobileSrc={mobileSrc} alt={alt} sizes={sizes} priority={priority} position={position} className={grade} />
          </motion.div>
        </motion.div>
        {children}
      </motion.div>
    </div>
  );
}

/* Scroll progress through a tall block, for the pinned sequences. */
export function usePinned() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return { ref, progress: scrollYProgress };
}

/* Opacity and rise for one beat of a pinned sequence: in over [a,b], held,
   out over [c,d]. Pass d = 1.01 to keep the last beat on screen. */
export function useBeat(progress: MotionValue<number>, a: number, b: number, c: number, d: number) {
  const opacity = useTransform(progress, [a, b, c, d], [0, 1, 1, 0]);
  const y = useTransform(progress, [a, b, c, d], [44, 0, 0, -44]);
  const blur = useTransform(progress, [a, b, c, d], ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)"]);
  return { opacity, y, filter: blur };
}

/* Underlined text link with an arrow that leans forward on hover. */
export function ArrowLink({ href, children, color = F.ink, className = "" }: { href: string; children: React.ReactNode; color?: string; className?: string }) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-3 ${className}`} style={{ ...T.meta, fontSize: 11.5, color }}>
      <span className="relative pb-1.5">
        {children}
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px origin-left transition-transform duration-700 ease-out group-hover:scale-x-0" style={{ background: "currentColor", opacity: 0.5 }} />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px origin-right scale-x-0 transition-transform delay-150 duration-700 ease-out group-hover:origin-left group-hover:scale-x-100" style={{ background: F.gold }} />
      </span>
      <span aria-hidden className="transition-transform duration-500 ease-out group-hover:translate-x-1.5">→</span>
    </Link>
  );
}
