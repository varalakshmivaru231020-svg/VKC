"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Shared kit for the heritage pages (About, Founder): the brown-and-gold
 * palette, the paper grain, scroll reveals, the word-by-word headline, and the
 * portrait frame. Kept together so the two pages read as one editorial family
 * while each keeps its own words.
 */

export const C = {
  espresso:    "#1B0E05",
  bark:        "#3A1F0A",
  barkSoft:    "#5A3210",
  jaggery:     "#E0961C",
  jaggeryDark: "#9A5B0B",
  jaggeryLite: "#FFD65C",
  cream:       "#FBF1DE",
  ivory:       "#FFFBF4",
  parchment:   "#F0DCB6",
  ink:         "#2B1708",
  ink2:        "#5C3A1E",
  muted:       "#8A6A4E",
};

export const EASE = [0.22, 1, 0.36, 1] as const;

/* Subtle paper-grain overlay (inline SVG so no external asset is needed). */
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

/* The milestones both pages draw on — the facts, once. */
export const MILESTONES = [
  { year: "1988", t: "M/s Vairamudi Krupa Crusher", d: "Late Shri B Ramachandra sets up a sugarcane crusher in Mandya — the proprietorship that remains the original and most important base of the business." },
  { year: "Since", t: "A trusted local name", d: "Over the decades the crusher earns a reputation for purity, hard work and fair dealing with farmers." },
  { year: "2025", t: "VKC Jaggery & Beverages Pvt. Ltd.", d: "Incorporated on 12 December 2025 to carry the next phase of structured growth, while the proprietorship stays central to identity and operations." },
  { year: "Ahead", t: "Technology upgradation", d: "A proposed 50 TCD fully automatic, thermic-fluid-based jaggery and sugarcane juice processing project." },
];

/* Grain + optional slow glow, for the dark sections. */
export function Atmosphere({ glow = true, opacity = 0.12 }: { glow?: boolean; opacity?: number }) {
  const reduced = useReducedMotion();
  return (
    <>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRAIN, opacity, mixBlendMode: "overlay" }} />
      {glow && (
        <motion.div aria-hidden className="absolute pointer-events-none" animate={reduced ? undefined : { y: [0, -18, 0], x: [0, 12, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: -160, right: -80, width: 560, height: 560, borderRadius: "50%", background: `radial-gradient(circle, ${C.jaggery}40, transparent 66%)`, filter: "blur(12px)" }} />
      )}
    </>
  );
}

export function Reveal({ children, className = "", delay = 0, y = 28, style }: { children: React.ReactNode; className?: string; delay?: number; y?: number; style?: React.CSSProperties }) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={className} style={style} initial={reduced ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -10% 0px" }} transition={{ duration: 0.9, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

/* Word-by-word headline reveal. The (never-transformed) container is observed,
   not the moving words, so the heading can't get stuck invisible. */
export function Words({ text, accent, accentColor = C.jaggeryLite, className = "", style }: { text: string; accent?: string; accentColor?: string; className?: string; style?: React.CSSProperties }) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const shown = reduced || inView;
  return (
    <span ref={ref} className={className} style={style} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" style={{ paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
          <motion.span aria-hidden className="inline-block"
            initial={reduced ? false : { y: "110%", opacity: 0 }}
            animate={shown ? { y: 0, opacity: 1 } : { y: "110%", opacity: 0 }}
            transition={{ duration: 0.85, ease: EASE, delay: 0.08 + i * 0.06 }}
            style={accent && w.replace(/[^\w']/g, "").toLowerCase() === accent.toLowerCase() ? { color: accentColor, fontStyle: "italic" } : undefined}>
            {w}
          </motion.span>
        </span>
      )).reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, " ", el] : [el]), [])}
    </span>
  );
}

export function Eyebrow({ children, color = C.jaggeryDark }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-3 font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.24em", color }}>
      <span style={{ width: 28, height: 1, background: color, display: "inline-block" }} />
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, accent, sub, light = false, center = false, size = "md" }: {
  eyebrow: string; title: string; accent?: string; sub?: string; light?: boolean; center?: boolean; size?: "md" | "lg";
}) {
  return (
    <div className={center ? "text-center max-w-3xl mx-auto" : "max-w-3xl"}>
      <Eyebrow color={light ? C.jaggeryLite : C.jaggeryDark}>{eyebrow}</Eyebrow>
      <h2 className="font-heading mt-5" style={{ fontSize: size === "lg" ? "clamp(2.4rem,5.2vw,4.4rem)" : "clamp(2.1rem,4.2vw,3.4rem)", lineHeight: 1.04, letterSpacing: "-0.02em", color: light ? C.ivory : C.ink }}>
        <Words text={title} accent={accent} accentColor={light ? C.jaggeryLite : C.jaggeryDark} />
      </h2>
      {sub && (
        <p className="font-body mt-5" style={{ fontSize: 17, lineHeight: 1.7, color: light ? "rgba(255,251,244,0.74)" : C.ink2, maxWidth: 640, margin: center ? "1.25rem auto 0" : undefined, textAlign: center ? "center" : undefined }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* The portrait frame: the whole photograph, never cropped, on a quiet mount.
   Real photographs only — these are family, and one is a memorial. */
export function Portrait({ src, alt, dark = false, priority = false, caption }: { src: string; alt: string; dark?: boolean; priority?: boolean; caption?: string }) {
  return (
    <figure className="m-0">
      <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: "3 / 4", background: dark ? "rgba(255,251,244,0.06)" : `linear-gradient(180deg, ${C.cream}, ${C.ivory})`, border: `1px solid ${dark ? "rgba(255,214,92,0.22)" : C.parchment}`, boxShadow: dark ? "0 40px 80px -40px rgba(0,0,0,0.6)" : "0 30px 60px -40px rgba(58,31,10,0.35)" }}>
        <div className="absolute inset-[10px]">
          <Image src={src} alt={alt} fill sizes="(max-width: 1024px) 90vw, 40vw" className="object-contain object-center" priority={priority} />
        </div>
      </div>
      {caption && (
        <figcaption className="mt-4 font-body uppercase" style={{ fontSize: 10.5, letterSpacing: "0.18em", color: dark ? "rgba(255,251,244,0.6)" : C.muted }}>{caption}</figcaption>
      )}
    </figure>
  );
}
