"use client";

import { Fragment, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";

/* Palette shared with the About page (literal — theme tokens are admin-set). */
const C = {
  bark:        "#3A1F0A",
  barkSoft:    "#5A3210",
  earth:       "#2A1606",
  green:       "#B85C12",
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
const EASE = [0.22, 1, 0.36, 1] as const;
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

/* ── Small helpers ───────────────────────────────────────────────────────── */

/** Fades/lifts a block in over a slice of a scroll progress value. */
function Stage({ progress, from, to, out, children, className = "", style }: {
  progress: MotionValue<number>; from: number; to: number; out?: [number, number];
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const inPts = out ? [from, to, out[0], out[1]] : [from, to];
  const opacity = useTransform(progress, inPts, out ? [0, 1, 1, 0] : [0, 1]);
  const y = useTransform(progress, inPts, out ? [28, 0, 0, -18] : [28, 0]);
  return <motion.div className={className} style={{ ...style, opacity, y }}>{children}</motion.div>;
}

/** Word-by-word progressive reveal driven by scroll progress. */
function ScrollWords({ text, progress, from, to, className = "", style, out }: {
  text: string; progress: MotionValue<number>; from: number; to: number; className?: string; style?: React.CSSProperties; out?: [number, number];
}) {
  const words = text.split(" ");
  const fade = useTransform(progress, out ? [out[0], out[1]] : [0, 1], out ? [1, 0] : [1, 1]);
  return (
    <motion.p className={className} style={{ ...style, opacity: fade }}>
      {words.map((w, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <ScrollWord word={w} progress={progress} from={from + ((to - from) * i) / words.length} to={from + ((to - from) * (i + 1)) / words.length} />
        </Fragment>
      ))}
    </motion.p>
  );
}
function ScrollWord({ word, progress, from, to }: { word: string; progress: MotionValue<number>; from: number; to: number }) {
  const opacity = useTransform(progress, [from, to], [0.12, 1]);
  return <motion.span className="inline-block" style={{ opacity }}>{word}</motion.span>;
}

/** Page-level reading progress, a hairline of gold at the very top. */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return <motion.div aria-hidden className="fixed left-0 top-0 z-[60] h-[2px] w-full origin-left pointer-events-none" style={{ scaleX, background: `linear-gradient(90deg, ${C.jaggery}, ${C.jaggeryLite})` }} />;
}

/** CTA that leans toward the cursor. */
export function MagneticLink({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  const mx = useMotionValue(0); const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 180, damping: 16 }); const y = useSpring(my, { stiffness: 180, damping: 16 });
  return (
    <motion.div className={`inline-block ${className}`} style={{ x, y }}
      onMouseMove={(e) => { if (reduced) return; const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - (r.left + r.width / 2)) * 0.28); my.set((e.clientY - (r.top + r.height / 2)) * 0.28); }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}>
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   01 · THE LEGACY CONTINUES
   Cream deepens to earth as you scroll; a gold line grows; THE / LEGACY /
   CONTINUES surfaces word by word; then the next generation appears with
   the photograph moving slower than the text.
   ══════════════════════════════════════════════════════════════════════════ */
export function LegacyContinues() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bg = useTransform(p, [0.05, 0.4], [C.ivory, C.earth]);
  const lineScale = useTransform(p, [0.08, 0.55], [0, 1]);
  const imgY = useTransform(p, [0.3, 1], [80, -80]);
  const imgScale = useTransform(p, [0.3, 1], [1.08, 1]);
  const words = ["THE", "LEGACY", "CONTINUES"];
  return (
    <motion.section ref={ref} className="relative overflow-hidden" style={{ background: reduced ? C.earth : bg }} aria-labelledby="legacy-continues-heading">
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRAIN, opacity: 0.08, mixBlendMode: "overlay" }} />
      {/* growing gold line */}
      <motion.div aria-hidden className="absolute left-5 sm:left-8 lg:left-1/2 top-0 w-px origin-top" style={{ height: "100%", scaleY: reduced ? 1 : lineScale, background: `linear-gradient(${C.jaggeryLite}, ${C.jaggery} 60%, transparent)` }} />

      <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 pt-28 pb-24 sm:pt-40 sm:pb-32 grid lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Oversized typography, revealed line by line */}
        <div className="lg:col-span-6 min-w-0">
          <h2 id="legacy-continues-heading" className="font-heading" style={{ fontSize: "clamp(3rem,6.2vw,6rem)", lineHeight: 0.92, letterSpacing: "-0.03em", color: C.ivory }}>
            {words.map((w, i) => (
              <LegacyWord key={w} word={w} progress={p} from={0.12 + i * 0.09} to={0.22 + i * 0.09} accent={i === 2} />
            ))}
          </h2>
        </div>

        {/* Next generation: photograph parallax + exact copy */}
        <div className="lg:col-span-6 grid sm:grid-cols-12 gap-8 items-start lg:pt-6">
          <Stage progress={p} from={0.38} to={0.5} className="sm:col-span-5">
            <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "3 / 4", background: C.barkSoft, border: `1px solid rgba(255,214,92,0.25)` }}>
              <motion.div className="absolute inset-0" style={{ y: reduced ? 0 : imgY, scale: reduced ? 1 : imgScale }}>
                <Image src="/images/team/naveenchandra-b-r.webp" alt="Naveenchandra B R" fill sizes="(max-width: 640px) 90vw, 28vw" className="object-cover object-top" />
              </motion.div>
              <div aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 55%, ${C.earth}CC 100%)` }} />
              <div className="absolute left-4 right-4 bottom-4">
                <div className="font-heading" style={{ fontSize: 20, color: C.ivory }}>Naveenchandra B R</div>
                <div className="font-body uppercase mt-1" style={{ fontSize: 10.5, letterSpacing: "0.16em", color: C.jaggeryLite }}>Managing Director</div>
              </div>
            </div>
          </Stage>
          <div className="sm:col-span-7">
            <Stage progress={p} from={0.42} to={0.52}>
              <span className="inline-flex items-center gap-3 font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.24em", color: C.jaggeryLite }}>
                <span className="inline-block h-px w-7" style={{ background: C.jaggeryLite }} /> The next generation
              </span>
            </Stage>
            <ScrollWords progress={p} from={0.45} to={0.72} className="font-body mt-5" style={{ fontSize: "clamp(1.05rem,1.35vw,1.25rem)", lineHeight: 1.75, color: "rgba(255,251,244,0.9)", textAlign: "left", hyphens: "none" }}
              text="Today, this legacy is carried forward by Naveenchandra B R, who leads with a forward-looking vision while preserving the principles that shaped the business from its roots. His focus is on strengthening the business through quality-minded growth, better systems, compliance awareness, and a deeper brand presence. Rather than moving away from tradition, the goal is to give tradition a stronger future." />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
function LegacyWord({ word, progress, from, to, accent }: { word: string; progress: MotionValue<number>; from: number; to: number; accent: boolean }) {
  const y = useTransform(progress, [from, to], ["60%", "0%"]);
  const opacity = useTransform(progress, [from, to], [0, 1]);
  return (
    <span className="block overflow-hidden" style={{ paddingBottom: "0.06em" }}>
      <motion.span className="block" style={{ y, opacity, color: accent ? C.jaggeryLite : undefined, fontStyle: accent ? "italic" : undefined }}>{word}</motion.span>
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   02 · 1988 → 2025 → THE FUTURE
   A pinned stage: the year grows large, the wash changes, a line travels
   down, and each milestone fades through as you scroll.
   ══════════════════════════════════════════════════════════════════════════ */
const MILESTONES = [
  { year: "1988", title: "M/s Vairamudi Krupa Crusher", body: "Late Shri B Ramachandra sets up a sugarcane crusher in Mandya — the proprietorship that remains the original and most important base of our business journey.", wash: "#FBF1DE" },
  { year: "Growth", title: "A trusted local name", body: "Over the decades the crusher earns a reputation for purity, hard work and fair dealing with farmers — the values that still shape everything we do.", wash: "#F6E7CC" },
  { year: "2025", title: "VKC JAGGERY & BEVERAGES PRIVATE LIMITED", body: "Incorporated on 12 December 2025 (CIN U10722KA2025PTC212254) to carry the next phase of structured growth, while the proprietorship stays central to our identity and operations.", wash: "#F0DCB6" },
  { year: "Present", title: "VKC Gold Ikshu", body: "The brand as it stands today — inspired by the legacy of Late Shri B Ramachandra, led by Naveenchandra B R, and rooted in Mandya.", wash: "#EAD2A4" },
];
export function JourneyTimeline() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(p, "change", (v) => { const i = Math.min(MILESTONES.length - 1, Math.floor(v * MILESTONES.length)); if (i !== active) setActive(i); });
  const line = useTransform(p, [0, 1], [0, 1]);
  const m = MILESTONES[active];
  return (
    <section ref={ref} className="relative" style={{ height: `${MILESTONES.length * 100 + 40}vh` }} aria-label="Our journey from 1988 to today">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div className="absolute inset-0" animate={{ background: m.wash }} transition={{ duration: 0.9, ease: EASE }} />
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.07, mixBlendMode: "multiply" }} />
        {/* ghost year */}
        <motion.div key={`ghost-${active}`} aria-hidden className="absolute right-[-2%] bottom-[-8%] font-heading select-none pointer-events-none hidden md:block" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, ease: EASE }} style={{ fontSize: "clamp(10rem,26vw,24rem)", lineHeight: 1, color: `${C.jaggery}1f`, letterSpacing: "-0.05em", fontStyle: "italic" }}>
          {m.year}
        </motion.div>

        <div className="relative h-full max-w-[1240px] mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-8 items-center">
          {/* travelling line + stops */}
          <div className="absolute left-5 sm:left-8 top-[12%] bottom-[12%] w-px hidden lg:block" style={{ background: `${C.jaggery}33` }}>
            <motion.div className="absolute left-0 top-0 w-px origin-top" style={{ height: "100%", scaleY: reduced ? 1 : line, background: `linear-gradient(${C.jaggery}, ${C.jaggeryDark})` }} />
            {MILESTONES.map((s, i) => (
              <div key={s.year} className="absolute -left-[5px] h-[11px] w-[11px] rounded-full transition-colors duration-500" style={{ top: `${(i / (MILESTONES.length - 1)) * 100}%`, background: i <= active ? C.jaggery : C.parchment, boxShadow: i === active ? `0 0 0 6px ${C.jaggery}33` : "none" }} />
            ))}
          </div>

          <div className="lg:col-span-5 lg:pl-12">
            <span className="inline-flex items-center gap-3 font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.24em", color: C.jaggeryDark }}>
              <span className="inline-block h-px w-7" style={{ background: C.jaggeryDark }} /> Our journey · {String(active + 1).padStart(2, "0")} / {String(MILESTONES.length).padStart(2, "0")}
            </span>
            <motion.div key={`year-${active}`} initial={reduced ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }} className="font-heading mt-4" style={{ fontSize: "clamp(4rem,10vw,9rem)", lineHeight: 0.9, letterSpacing: "-0.04em", color: C.ink }}>
              {m.year}
            </motion.div>
          </div>
          <div className="lg:col-span-7 lg:pl-8">
            <motion.div key={`copy-${active}`} initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.08 }}>
              <h3 className="font-heading" style={{ fontSize: "clamp(1.7rem,3.2vw,2.8rem)", lineHeight: 1.08, letterSpacing: "-0.015em", color: C.ink, maxWidth: 640 }}>{m.title}</h3>
              <p className="font-body mt-5" style={{ fontSize: "clamp(1rem,1.3vw,1.2rem)", lineHeight: 1.75, color: C.ink2, maxWidth: 560, textAlign: "left", hyphens: "none" }}>{m.body}</p>
            </motion.div>
            <div className="mt-8 flex items-center gap-2">
              {MILESTONES.map((s, i) => (
                <span key={s.year} className="h-1 rounded-full transition-all duration-500" style={{ width: i === active ? 40 : 14, background: i <= active ? C.jaggery : `${C.jaggery}44` }} />
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-body uppercase" style={{ fontSize: 10, letterSpacing: "0.3em", color: C.muted }}>Keep scrolling</div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   03 · BUSINESS IDENTITY
   An archive record rather than a dashboard: gold numbering, hairline rules,
   micro-labels, and the supplied legal wording revealed line by line.
   ══════════════════════════════════════════════════════════════════════════ */
function Line({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -8% 0px" }} transition={{ duration: 0.8, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}
export function BusinessIdentity() {
  const rows = [
    ["Entity", "VKC JAGGERY & BEVERAGES PRIVATE LIMITED"],
    ["Incorporated", "12 December 2025"],
    ["Corporate Identity Number", "U10722KA2025PTC212254"],
    ["Registered office", "Ballenahalli Village, Srirangapatna Taluk, Mandya District, Karnataka – 571807"],
  ];
  return (
    <section className="relative" style={{ background: C.ivory }} aria-labelledby="identity-heading">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
        <Line>
          <span className="inline-flex items-center gap-3 font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.24em", color: C.jaggeryDark }}>
            <span className="inline-block h-px w-7" style={{ background: C.jaggeryDark }} /> Formal business identity
          </span>
        </Line>
        <div className="mt-8 relative rounded-lg overflow-hidden" style={{ background: "white", border: `1px solid ${C.parchment}`, boxShadow: "0 30px 80px -50px rgba(58,31,10,0.35)" }}>
          <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRAIN, opacity: 0.05, mixBlendMode: "multiply" }} />
          <div className="relative grid lg:grid-cols-12">
            {/* Registry number */}
            <div className="lg:col-span-4 p-8 sm:p-10 lg:border-r" style={{ borderColor: C.parchment, background: C.cream }}>
              <Line><div className="font-body uppercase" style={{ fontSize: 10.5, letterSpacing: "0.22em", color: C.jaggeryDark }}>Record</div></Line>
              <Line delay={0.1}><div className="font-heading mt-2" style={{ fontSize: "clamp(5rem,12vw,9rem)", lineHeight: 0.9, letterSpacing: "-0.05em", color: C.jaggeryDark }}>2025</div></Line>
              <Line delay={0.2}><h2 id="identity-heading" className="font-heading mt-6" style={{ fontSize: "clamp(1.5rem,2.2vw,2rem)", lineHeight: 1.12, color: C.ink }}>VKC JAGGERY &amp; BEVERAGES PRIVATE LIMITED</h2></Line>
              <Line delay={0.3}><div className="mt-6 h-px w-16" style={{ background: C.jaggery }} /></Line>
            </div>
            {/* Registry lines */}
            <div className="lg:col-span-8 p-8 sm:p-10">
              <dl>
                {rows.map(([k, v], i) => (
                  <Line key={k} delay={0.1 + i * 0.08}>
                    <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[220px_1fr] gap-x-6 gap-y-1 py-4" style={{ borderTop: i ? `1px solid ${C.parchment}` : "none" }}>
                      <dt className="font-body uppercase flex items-start gap-3" style={{ fontSize: 10.5, letterSpacing: "0.18em", color: C.muted, lineHeight: 1.7 }}>
                        <span className="font-heading" style={{ fontSize: 13, color: C.jaggery, lineHeight: 1.6 }}>0{i + 1}</span>{k}
                      </dt>
                      <dd className="font-body break-words" style={{ fontSize: 15.5, lineHeight: 1.6, color: C.ink, fontWeight: 500 }}>{v}</dd>
                    </div>
                  </Line>
                ))}
              </dl>
              <Line delay={0.45}>
                <p className="font-body mt-6" style={{ fontSize: 15.5, lineHeight: 1.8, color: C.ink2, textAlign: "left", hyphens: "none" }}>
                  Our present legal business platform includes VKC JAGGERY &amp; BEVERAGES PRIVATE LIMITED, incorporated on 12 December 2025. The company’s Corporate Identity Number is U10722KA2025PTC212254. Prior to incorporation, the name approval stage referenced VKC CANE GOLD FOODS PRIVATE LIMITED, reflecting the evolution of the business identity into its present structure.
                </p>
              </Line>
              <Line delay={0.55}>
                <div className="mt-8 grid sm:grid-cols-[220px_1fr] gap-x-6 gap-y-2 pt-6" style={{ borderTop: `1px dashed ${C.parchment}` }}>
                  <div className="font-body uppercase flex items-start gap-3" style={{ fontSize: 10.5, letterSpacing: "0.18em", color: C.muted, lineHeight: 1.7 }}>
                    <span className="font-heading" style={{ fontSize: 13, color: C.jaggery, lineHeight: 1.6 }}>05</span>Udyam registration
                  </div>
                  <div>
                    <div className="font-body" style={{ fontSize: 15.5, lineHeight: 1.6, color: C.ink, fontWeight: 500 }}>VKC JAGGERY &amp; BEVERAGES PRIVATE LIMITED</div>
                    <div className="font-body mt-1" style={{ fontSize: 14, color: C.ink2 }}>Unit name: VKC CANE Gold Foods - Jaggery Manufacturing Unit</div>
                    <div className="font-body mt-1" style={{ fontSize: 13.5, color: C.muted }}>Udyam No. KR-21-0019065</div>
                  </div>
                </div>
              </Line>
              <Line delay={0.65}>
                <p className="font-body mt-6" style={{ fontSize: 15.5, lineHeight: 1.8, color: C.ink2, textAlign: "left", hyphens: "none" }}>
                  The business is also supported by formal Udyam registration under VKC JAGGERY &amp; BEVERAGES PRIVATE LIMITED, with the unit name recorded as VKC CANE Gold Foods - Jaggery Manufacturing Unit. This strengthens the business’s formal identity while preserving the emotional and cultural continuity of the family legacy behind it.
                </p>
              </Line>
              <Line delay={0.7}>
                <Link href="/credentials" className="mt-8 inline-flex items-center gap-2 font-body font-semibold text-sm" style={{ color: C.jaggeryDark }}>
                  Full registrations and compliance record <span aria-hidden>→</span>
                </Link>
              </Line>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   04 · FOUNDER TRIBUTE
   Full-screen, pinned. Archival portrait with a slow zoom and grain; text
   arrives in the given order and the memorial line closes alone.
   ══════════════════════════════════════════════════════════════════════════ */
export function FounderTribute() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Zoom from the top-right so the face (top of the portrait) never leaves the frame.
  const zoom = useTransform(p, [0, 1], [1.02, 1.1]);
  const drift = useTransform(p, [0, 1], ["0%", "-2%"]);
  const dim = useTransform(p, [0, 0.7, 0.85], [0.55, 0.7, 0.86]);
  const overlay = useTransform(dim, (d) => `linear-gradient(90deg, rgba(42,22,6,${Math.min(0.96, d + 0.25)}) 0%, rgba(42,22,6,${d}) 55%, rgba(42,22,6,${Math.max(0.2, d - 0.35)}) 100%)`);
  return (
    <section ref={ref} className="relative" style={{ height: "380vh", background: C.earth }} aria-labelledby="founder-heading">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* archival portrait */}
        <motion.div className="absolute inset-0" style={{ scale: reduced ? 1 : zoom, x: reduced ? 0 : drift, transformOrigin: "80% 0%" }}>
          <Image src="/images/team/ramachandra-b.webp" alt="Late Shri B Ramachandra" fill sizes="100vw" priority className="object-cover object-[65%_0%] md:object-[78%_0%]" />
        </motion.div>
        <motion.div aria-hidden className="absolute inset-0" style={{ background: overlay }} />
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRAIN, opacity: 0.16, mixBlendMode: "overlay" }} />
        {/* thin gold frame */}
        <div aria-hidden className="absolute inset-4 sm:inset-6 pointer-events-none" style={{ border: `1px solid rgba(255,214,92,0.28)` }} />

        <div className="relative h-full max-w-[1240px] mx-auto px-6 sm:px-10 flex items-center">
          <div className="max-w-2xl">
            <Stage progress={p} from={0.04} to={0.1} out={[0.72, 0.78]}>
              <span className="inline-flex items-center gap-3 font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.26em", color: C.jaggeryLite }}>
                <span className="inline-block h-px w-7" style={{ background: C.jaggeryLite }} /> Founder &amp; foundation
              </span>
            </Stage>
            <Stage progress={p} from={0.1} to={0.18} out={[0.72, 0.78]}>
              <h2 id="founder-heading" className="font-heading mt-6" style={{ fontSize: "clamp(2.2rem,4.6vw,4rem)", lineHeight: 1.04, letterSpacing: "-0.02em", color: C.ivory }}>
                In Revered Memory<br />of Our Founder
              </h2>
            </Stage>
            <Stage progress={p} from={0.18} to={0.26} out={[0.72, 0.78]}>
              <div className="font-heading mt-6" style={{ fontSize: "clamp(1.6rem,3vw,2.5rem)", lineHeight: 1.1, color: C.jaggeryLite, fontStyle: "italic" }}>Late Shri B Ramachandra</div>
            </Stage>
            <Stage progress={p} from={0.24} to={0.31} out={[0.72, 0.78]}>
              <div className="font-body mt-2" style={{ fontSize: 14, letterSpacing: "0.04em", color: "rgba(255,251,244,0.72)" }}>Founder and guiding inspiration behind our family legacy</div>
            </Stage>

            <ScrollWords progress={p} from={0.32} to={0.5} out={[0.72, 0.78]} className="font-body mt-8" style={{ fontSize: "clamp(1rem,1.25vw,1.15rem)", lineHeight: 1.8, color: "rgba(255,251,244,0.92)", textAlign: "left", hyphens: "none" }}
              text="Late Shri B Ramachandra remains the soul of our journey. His values, work ethic, and commitment to purity gave direction not only to a business, but to a family identity built on trust. He believed that what is made with honesty will always carry its own strength, and that belief continues to shape how we think, work, and grow." />
            <ScrollWords progress={p} from={0.5} to={0.68} out={[0.72, 0.78]} className="font-body mt-5" style={{ fontSize: "clamp(1rem,1.25vw,1.15rem)", lineHeight: 1.8, color: "rgba(255,251,244,0.92)", textAlign: "left", hyphens: "none" }}
              text="His contribution cannot be measured only in years or milestones. It lives on in the standards we uphold, in the sincerity with which we approach our work, and in the relationships we continue to value. Every new step we take carries the quiet strength of the foundation he created." />
            <Stage progress={p} from={0.62} to={0.7} out={[0.72, 0.78]}>
              <p className="font-heading mt-5" style={{ fontSize: "clamp(1.5rem,2.6vw,2.2rem)", lineHeight: 1.25, color: C.jaggeryLite, fontStyle: "italic" }}>
                His legacy is not behind us — it walks with us.
              </p>
            </Stage>
          </div>
        </div>

        {/* Memorial line, alone at the end */}
        <Stage progress={p} from={0.8} to={0.9} className="absolute inset-0 flex items-center justify-center text-center px-6 pointer-events-none">
          <div>
            <p className="font-heading" style={{ fontSize: "clamp(1.6rem,3.4vw,3rem)", lineHeight: 1.25, color: C.ivory }}>His values continue to guide us.</p>
            <p className="font-heading mt-2" style={{ fontSize: "clamp(1.6rem,3.4vw,3rem)", lineHeight: 1.25, color: C.jaggeryLite }}>His legacy continues to inspire us.</p>
            <div className="mx-auto mt-8 h-px w-20" style={{ background: C.jaggery }} />
          </div>
        </Stage>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   05 · HERITAGE → TECHNOLOGY
   A pinned split. The modern half wipes across the heritage half as you
   scroll; a hairline marks the moving boundary. Abstract textures only —
   no fabricated photography.
   ══════════════════════════════════════════════════════════════════════════ */
export function HeritageToTechnology() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const split = useTransform(p, [0.05, 0.85], [92, 18]); // % of width left to heritage
  const clip = useTransform(split, (s) => `inset(0 0 0 ${s}%)`);
  const dividerLeft = useTransform(split, (s) => `${s}%`);
  const heritageOpacity = useTransform(p, [0.5, 0.9], [1, 0.35]);
  return (
    <section ref={ref} className="relative" style={{ height: "220vh" }} aria-label="From heritage to technology">
      <div className="sticky top-0 h-screen overflow-hidden" style={{ background: C.earth }}>
        {/* Heritage half: warm cane texture */}
        <motion.div className="absolute inset-0" style={{ opacity: heritageOpacity, background: `linear-gradient(135deg, ${C.barkSoft} 0%, ${C.bark} 60%, ${C.earth} 100%)` }}>
          <div aria-hidden className="absolute inset-0" style={{ background: `repeating-linear-gradient(100deg, transparent 0 22px, rgba(255,214,92,0.06) 22px 24px)`, mixBlendMode: "screen" }} />
          <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.14, mixBlendMode: "overlay" }} />
          <div aria-hidden className="absolute left-[-2%] bottom-[-6%] font-heading select-none" style={{ fontSize: "clamp(9rem,24vw,22rem)", lineHeight: 1, color: "rgba(255,214,92,0.07)", letterSpacing: "-0.05em", fontStyle: "italic" }}>1988</div>
          <div className="absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 max-w-xs">
            <span className="font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.26em", color: C.jaggeryLite }}>Heritage</span>
            <div className="font-heading mt-3" style={{ fontSize: "clamp(1.8rem,3.4vw,3rem)", lineHeight: 1.05, color: C.ivory }}>Open pans,<br />patient hands</div>
          </div>
        </motion.div>

        {/* Technology half: cool steel texture, wiping in */}
        <motion.div className="absolute inset-0" style={{ clipPath: reduced ? "inset(0 0 0 50%)" : clip, background: `linear-gradient(135deg, #2B2F33 0%, #1A1D20 55%, #0F1113 100%)` }}>
          <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
          <div aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(60% 60% at 80% 40%, ${C.jaggery}22, transparent 70%)` }} />
          <div aria-hidden className="absolute right-[-2%] bottom-[-6%] font-heading select-none" style={{ fontSize: "clamp(9rem,24vw,22rem)", lineHeight: 1, color: "rgba(255,214,92,0.07)", letterSpacing: "-0.05em", fontStyle: "italic" }}>50 TCD</div>
          <div className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2 max-w-xs text-right">
            <span className="font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.26em", color: C.jaggeryLite }}>Technology</span>
            <div className="font-heading mt-3" style={{ fontSize: "clamp(1.8rem,3.4vw,3rem)", lineHeight: 1.05, color: C.ivory }}>Thermic fluid,<br />consistent batches</div>
          </div>
        </motion.div>

        {/* moving hairline divider */}
        <motion.div aria-hidden className="absolute top-0 bottom-0 w-px" style={{ left: reduced ? "50%" : dividerLeft, background: `linear-gradient(${C.jaggeryLite}, ${C.jaggery}, ${C.jaggeryLite})`, boxShadow: `0 0 24px ${C.jaggery}88` }}>
          <span className="absolute top-1/2 -translate-y-1/2 -left-[5px] h-[11px] w-[11px] rounded-full" style={{ background: C.jaggeryLite }} />
        </motion.div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-body uppercase" style={{ fontSize: 10, letterSpacing: "0.3em", color: "rgba(255,251,244,0.5)" }}>Old → New</div>
      </div>
    </section>
  );
}
