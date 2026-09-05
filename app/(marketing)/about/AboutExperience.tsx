"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LegacyContinues, JourneyTimeline, BusinessIdentity, FounderTribute, HeritageToTechnology, MagneticLink, ScrollProgressBar } from "@/components/about/StoryChapters";
import { motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, Sprout, Handshake, Recycle, Cog, Heart, ShieldCheck,
  Sparkles, Globe2, Factory, BadgeCheck, MapPin, Phone,
  Mail, MessageCircle, Target, Eye, Wheat, Leaf, Scale, Quote,
} from "lucide-react";

/* ── Deep-green & jaggery-gold palette (layered on the site tokens) ───────── */
const C = {
  bark:        "#3A1F0A",
  barkSoft:    "#5A3210",
  green:       "#B85C12",
  greenLight:  "#D9781F",
  greenDeep:   "#8B3A05",
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

/* Subtle paper-grain overlay (inline SVG so no external asset is needed). */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

/* ── Scroll-reveal wrapper ────────────────────────────────────────────────── */
function Reveal({
  children, className = "", delay = 0, y = 28, style,
}: { children: React.ReactNode; className?: string; delay?: number; y?: number; style?: React.CSSProperties }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ── Word-by-word headline reveal ─────────────────────────────────────────── */
function Words({ text, accent, className = "", style }: { text: string; accent?: string; className?: string; style?: React.CSSProperties }) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  // Observe the (never-transformed) container, not the moving word. The word
  // starts translated below its overflow-hidden wrapper, so observing it
  // directly could report "never in view" at some zoom levels and leave the
  // heading permanently invisible.
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const shown = reduced || inView;
  return (
    <span ref={ref} className={className} style={style} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" style={{ paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
          <motion.span
            aria-hidden
            className="inline-block"
            initial={reduced ? false : { y: "110%", opacity: 0 }}
            animate={shown ? { y: 0, opacity: 1 } : { y: "110%", opacity: 0 }}
            transition={{ duration: 0.85, ease: EASE, delay: 0.08 + i * 0.06 }}
            style={accent && w.replace(/[^\w']/g, "").toLowerCase() === accent.toLowerCase() ? { color: C.jaggeryLite, fontStyle: "italic" } : undefined}
          >
            {w}
          </motion.span>
        </span>
      )).reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, " ", el] : [el]), [])}
    </span>
  );
}

/* ── Count-up stat ────────────────────────────────────────────────────────── */
function Stat({ value, suffix = "", label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const dur = 1500, t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(Math.round(eased * value));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return (
    <div ref={ref}>
      <div className="font-heading leading-none tabular-nums" style={{ fontSize: "clamp(2.6rem,5.5vw,4.2rem)", color: C.jaggeryLite, letterSpacing: "-0.02em" }}>
        {n}{suffix}
      </div>
      <div className="mt-2 font-body uppercase" style={{ fontSize: 11, letterSpacing: "0.2em", color: "rgba(255,251,244,0.6)" }}>
        {label}
      </div>
    </div>
  );
}

/* ── Small building blocks ────────────────────────────────────────────────── */
function Eyebrow({ children, color = C.jaggeryDark }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-3 font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.24em", color }}>
      <span style={{ width: 28, height: 1, background: color, display: "inline-block" }} />
      {children}
    </span>
  );
}

function SectionHeading({ eyebrow, title, sub, light = false, center = false, size = "md" }: {
  eyebrow: string; title: string; sub?: string; light?: boolean; center?: boolean; size?: "md" | "lg";
}) {
  return (
    <div className={center ? "text-center max-w-3xl mx-auto" : "max-w-3xl"}>
      <Eyebrow color={light ? C.jaggeryLite : C.jaggeryDark}>{eyebrow}</Eyebrow>
      <h2 className="font-heading mt-5" style={{
        fontSize: size === "lg" ? "clamp(2.4rem,5.2vw,4.4rem)" : "clamp(2.1rem,4.2vw,3.4rem)",
        lineHeight: 1.02, letterSpacing: "-0.02em", color: light ? C.ivory : C.ink,
      }}>
        <Words text={title} />
      </h2>
      {sub && (
        <p className="font-body mt-5" style={{ fontSize: 17, lineHeight: 1.7, color: light ? "rgba(255,251,244,0.72)" : C.ink2, maxWidth: 620, margin: center ? "1.25rem auto 0" : undefined }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Marquee({ items }: { items: string[] }) {
  const reduced = useReducedMotion();
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden py-5" style={{ background: C.ivory, borderTop: `1px solid ${C.parchment}`, borderBottom: `1px solid ${C.parchment}` }}>
      <motion.div
        className="flex whitespace-nowrap"
        animate={reduced ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 38, ease: "linear", repeat: Infinity }}
      >
        {row.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-6 pr-6 font-heading" style={{ fontSize: "clamp(1.25rem,2.2vw,1.8rem)", color: C.ink, letterSpacing: "-0.01em" }}>
            {t}
            <Wheat className="h-4 w-4 shrink-0" style={{ color: C.jaggery }} />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ── Floating card: idle bob + cursor tilt + glare + hover lift ───────────── */
function FloatCard({ children, index, dark = false, className = "" }: { children: React.ReactNode; index: number; dark?: boolean; className?: string }) {
  const reduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 150, damping: 16, mass: 0.5 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), spring);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), spring);
  const glare = useTransform([mx, my], ([x, y]) =>
    `radial-gradient(260px circle at ${50 + (x as number) * 100}% ${50 + (y as number) * 100}%, rgba(255,255,255,${dark ? 0.12 : 0.4}), transparent 65%)`);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 70 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1, ease: EASE, delay: index * 0.15 }}
      style={{ perspective: 1100 }}
    >
      {/* Idle float: each card bobs on its own period so they never move in unison. */}
      <motion.div
        animate={reduced ? undefined : { y: [0, -14, 0] }}
        transition={{ duration: 5.5 + index * 0.9, repeat: Infinity, ease: "easeInOut", delay: index * 0.7 }}
      >
        <motion.div
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          whileHover={reduced ? undefined : { scale: 1.03 }}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="group relative rounded-lg overflow-hidden transition-shadow duration-500 hover:shadow-[0_44px_80px_-24px_rgba(58,31,10,0.4)]"
        >
          <div className="absolute inset-0 rounded-lg" style={{ background: dark ? C.bark : C.ivory, border: `1px solid ${dark ? "rgba(255,214,92,0.28)" : C.parchment}` }} />
          {dark && <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.1, mixBlendMode: "overlay" }} />}
          <motion.div aria-hidden className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: glare }} />
          <div className="relative" style={{ transform: "translateZ(30px)" }}>{children}</div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ── Spotlight: a warm glow that follows the cursor across a panel ────────── */
function Spotlight({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const rawX = useMotionValue(30);
  const rawY = useMotionValue(40);
  const x = useSpring(rawX, { stiffness: 80, damping: 20 });
  const y = useSpring(rawY, { stiffness: 80, damping: 20 });
  const bg = useTransform([x, y], ([px, py]) => `radial-gradient(460px circle at ${px}% ${py}%, rgba(255,214,92,0.32), transparent 62%)`);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    rawX.set(((e.clientX - r.left) / r.width) * 100);
    rawY.set(((e.clientY - r.top) / r.height) * 100);
  };
  return (
    <div onMouseMove={onMove} className={`relative overflow-hidden ${className}`} style={style}>
      <motion.div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: bg }} />
      {children}
    </div>
  );
}

/* ── Scroll-highlight text: words brighten as the reader scrolls past ─────── */
function ScrollWord({ word, progress, start, end, accent }: { word: string; progress: MotionValue<number>; start: number; end: number; accent: boolean }) {
  const opacity = useTransform(progress, [start, end], [0.14, 1]);
  return (
    <motion.span className="inline-block mr-[0.26em]" style={{ opacity, color: accent ? C.jaggeryLite : undefined, fontStyle: accent ? "italic" : undefined }}>
      {word}
    </motion.span>
  );
}
function ScrollText({ text, accentFrom = Infinity, className = "", style }: { text: string; accentFrom?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.5"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className} style={style}>
      {words.map((w, i) => (
        <ScrollWord key={i} word={w} progress={scrollYProgress} start={i / words.length} end={(i + 1) / words.length} accent={i >= accentFrom} />
      ))}
    </p>
  );
}

/* ── Process: a gold line draws itself across the steps as you scroll ─────── */
function ProcessStep({ step, index, total, progress }: { step: { n: string; t: string; d: string }; index: number; total: number; progress: MotionValue<number> }) {
  const t = (index + 0.5) / total;
  const active = useTransform(progress, [Math.max(0, t - 0.14), t], [0, 1]);
  const scale = useTransform(active, [0, 1], [0.82, 1]);
  const bg = useTransform(active, [0, 1], [C.bark, C.jaggery]);
  const fg = useTransform(active, [0, 1], [C.jaggeryLite, C.bark]);
  const textOpacity = useTransform(active, [0, 1], [0.45, 1]);
  return (
    <div className="relative flex lg:block gap-6">
      <motion.div
        className="relative z-10 shrink-0 h-[72px] w-[72px] rounded-full grid place-items-center font-heading"
        style={{ scale, background: bg, color: fg, border: "1px solid rgba(255,214,92,0.5)", fontSize: 24, boxShadow: "0 0 0 10px rgba(58,31,10,1)" }}
      >
        {step.n}
      </motion.div>
      <motion.div style={{ opacity: textOpacity }} className="lg:mt-7">
        <h3 className="font-heading" style={{ fontSize: 23, lineHeight: 1.1, color: C.ivory }}>{step.t}</h3>
        <p className="font-body mt-2" style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,251,244,0.66)", maxWidth: 260 }}>{step.d}</p>
      </motion.div>
    </div>
  );
}
function ProcessSteps({ steps }: { steps: { n: string; t: string; d: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.55"] });
  const pathLength = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  return (
    <div ref={ref} className="relative mt-16">
      {/* Desktop: horizontal rail through the step badges. Mobile: vertical rail. */}
      <svg aria-hidden className="hidden lg:block absolute left-0 top-[36px] w-full h-[2px]" viewBox="0 0 100 2" preserveAspectRatio="none">
        <line x1="0" y1="1" x2="100" y2="1" stroke="rgba(255,214,92,0.18)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <motion.line x1="0" y1="1" x2="100" y2="1" stroke={C.jaggeryLite} strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ pathLength }} />
      </svg>
      <svg aria-hidden className="lg:hidden absolute left-[35px] top-0 h-full w-[2px]" viewBox="0 0 2 100" preserveAspectRatio="none">
        <line x1="1" y1="0" x2="1" y2="100" stroke="rgba(255,214,92,0.18)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <motion.line x1="1" y1="0" x2="1" y2="100" stroke={C.jaggeryLite} strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ pathLength }} />
      </svg>
      <div className="grid gap-12 lg:gap-6 lg:grid-cols-4">
        {steps.map((p, i) => <ProcessStep key={p.n} step={p} index={i} total={steps.length} progress={scrollYProgress} />)}
      </div>
    </div>
  );
}

/* ── Stacking cards: each value pins under the last and settles back ──────── */
const STACK_THEMES = [
  { bg: "#FFFBF4", fg: "#2B1708", accent: "#9A5B0B", sub: "#5C3A1E" },
  { bg: "#B85C12", fg: "#FFFBF4", accent: "#FFD65C", sub: "rgba(255,251,244,0.75)" },
  { bg: "#FFD65C", fg: "#3A1F0A", accent: "#9A5B0B", sub: "rgba(58,31,10,0.75)" },
  { bg: "#3A1F0A", fg: "#FFFBF4", accent: "#FFD65C", sub: "rgba(255,251,244,0.72)" },
  { bg: "#FBF1DE", fg: "#2B1708", accent: "#B85C12", sub: "#5C3A1E" },
];
function StackCard({ value, index, total, progress }: { value: { icon: any; t: string; d: string }; index: number; total: number; progress: MotionValue<number> }) {
  const theme = STACK_THEMES[index % STACK_THEMES.length];
  const start = index / total;
  const scale = useTransform(progress, [start, 1], [1, 1 - (total - 1 - index) * 0.045]);
  const Icon = value.icon;
  return (
    <motion.div
      className="sticky rounded-lg overflow-hidden"
      style={{ top: `calc(148px + ${index * 16}px)`, scale, transformOrigin: "top center", background: theme.bg, color: theme.fg, boxShadow: "0 -12px 40px rgba(58,31,10,0.14)", border: `1px solid ${index === 2 || index === 4 || index === 0 ? "rgba(17,24,39,0.08)" : "rgba(255,214,92,0.2)"}` }}
    >
      <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.08, mixBlendMode: "overlay" }} />
      <div className="relative grid lg:grid-cols-12 gap-8 items-end p-8 sm:p-12 lg:p-14" style={{ minHeight: "clamp(360px, 52vh, 520px)" }}>
        <div className="lg:col-span-2 font-heading" style={{ fontSize: "clamp(4rem,9vw,8rem)", lineHeight: 0.85, letterSpacing: "-0.05em", color: theme.accent }}>0{index + 1}</div>
        <div className="lg:col-span-7">
          <h3 className="font-heading" style={{ fontSize: "clamp(2rem,4.2vw,3.6rem)", lineHeight: 1.02, letterSpacing: "-0.02em", color: theme.fg }}>{value.t}</h3>
          <p className="font-body mt-4" style={{ fontSize: 17, lineHeight: 1.7, color: theme.sub, maxWidth: 520 }}>{value.d}</p>
        </div>
        <div className="lg:col-span-3 lg:justify-self-end">
          <div className="h-20 w-20 rounded-full grid place-items-center" style={{ border: `1px solid ${theme.accent}66`, color: theme.accent }}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
function StackCards({ values }: { values: { icon: any; t: string; d: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <div ref={ref} className="relative space-y-6">
      {values.map((v, i) => <StackCard key={v.t} value={v} index={i} total={values.length} progress={scrollYProgress} />)}
    </div>
  );
}

/* ── Seal: slowly rotating circular text around a still emblem ────────────── */
function Seal({ text, size = 150, color = C.jaggeryDark, children }: { text: string; size?: number; color?: string; children?: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 100 100" width={size} height={size} className="absolute inset-0"
        animate={reduced ? undefined : { rotate: 360 }} transition={{ duration: 26, repeat: Infinity, ease: "linear" }}>
        <defs><path id={`seal-${size}`} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
        <text fontSize="8" letterSpacing="1.9" fill={color} fontFamily="Inter, system-ui, sans-serif" fontWeight="600">
          <textPath href={`#seal-${size}`}>{text}</textPath>
        </text>
      </motion.svg>
      <div className="relative">{children}</div>
    </div>
  );
}

/* ── Data ─────────────────────────────────────────────────────────────────── */
const TIMELINE = [
  { year: "1988", title: "M/s Vairamudi Krupa Crusher", body: "Late Shri B Ramachandra sets up a sugarcane crusher in Mandya — the proprietorship that remains the original and most important base of our business journey." },
  { year: "Growth", title: "A trusted local name", body: "Over the decades the crusher earns a reputation for purity, hard work and fair dealing with farmers — the values that still shape everything we do." },
  { year: "2025", title: "VKC JAGGERY & BEVERAGES PRIVATE LIMITED", body: "Incorporated on 12 December 2025 (CIN U10722KA2025PTC212254) to carry the next phase of structured growth, while the proprietorship stays central to our identity and operations." },
  { year: "Ahead", title: "Technology upgradation", body: "A proposed 50 TCD fully automatic, thermic-fluid-based jaggery and sugarcane juice processing project — for production efficiency, process consistency and future-ready manufacturing standards." },
];

/* Philosophy: three pillars, straight from the mission statement. */
const PHILOSOPHY = [
  { icon: Scale, t: "Fair Pricing", d: "Honest, dependable rates paid directly to the farmers who grow our cane — so rural livelihoods share in the value they create." },
  { icon: Handshake, t: "Transparent Transactions", d: "Clear, straightforward dealings that farmers and customers can trust, every single time. No middlemen, no surprises." },
  { icon: Leaf, t: "Modern, Chemical-Free Production", d: "Energy-efficient, high-recovery systems built with Jagadish Machinery (Gujarat) — modernised, yet true to our ancestral values." },
];

const MISSION = [
  { icon: Handshake, t: "Farmer Empowerment", d: "Fair prices and direct partnerships that strengthen rural communities around Mandya." },
  { icon: Leaf, t: "Chemical-Free Production", d: "100% natural processing with nothing artificial added, ever." },
  { icon: Sparkles, t: "Innovation & Quality", d: "Modern machinery and consistent quality in every batch we make." },
  { icon: Recycle, t: "Sustainable Growth", d: "Eco-friendly manufacturing that reduces waste as we grow." },
  { icon: Globe2, t: "Global Expansion", d: "Taking Mandya's natural sweetness to markets across India and beyond." },
];

const VALUES = [
  { icon: ShieldCheck, t: "Purity and Quality First", d: "Uncompromising standards from cane to carton." },
  { icon: Handshake, t: "Support to Local Farmers", d: "Growers are partners, not suppliers." },
  { icon: Recycle, t: "Sustainable Manufacturing", d: "Cleaner processing, less waste." },
  { icon: Cog, t: "Innovation with Tradition", d: "Modern tools, time-honoured methods." },
  { icon: Heart, t: "Customer Trust and Satisfaction", d: "Earned batch after batch, year after year." },
];

const PROCESS = [
  { n: "01", t: "Crushing", d: "Fresh cane from local farms, crushed within hours of harvest." },
  { n: "02", t: "Extraction & Filtration", d: "Juice is clarified naturally — no bleaching agents, no chemicals." },
  { n: "03", t: "Boiling", d: "Slow-boiled in controlled batches to lock in colour, aroma and minerals." },
  { n: "04", t: "Packing", d: "Hygienic, food-grade packaging straight off the line." },
];

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function AboutExperience({
  phone = "+91 95916 08382",
  whatsapp = "919591608382",
  email = "info@vkccanegold.co.in",
  bannerImage = null,
  bannerImageMobile = null,
  bannerAlt = "",
}: {
  phone?: string;
  whatsapp?: string;
  email?: string;
  /** Admin → Banners, position "about_banner". Becomes the hero background. */
  bannerImage?: string | null;
  bannerImageMobile?: string | null;
  bannerAlt?: string;
}) {
  const reduced = useReducedMotion();

  /* Banner: desktop image always; the mobile crop swaps in below md only when
     it is a different file. URLs are already restricted to /uploads and the
     hosts in next.config, so next/image is safe here. */
  const desktopBanner = bannerImage?.trim() || bannerImageMobile?.trim() || null;
  const mobileBanner = bannerImageMobile?.trim() || desktopBanner;
  const hasBanner = Boolean(desktopBanner);
  const hasSeparateMobileBanner = Boolean(bannerImageMobile?.trim() && bannerImageMobile.trim() !== desktopBanner);

  const phoneHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
  const whatsappDigits = whatsapp.replace(/\D/g, "");
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : "/contact";

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 80]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.2]);

  const card = "rounded-lg border transition-all duration-500";

  return (
    <div className="vkc-about" style={{ background: C.ivory }}>
      <ScrollProgressBar />
      {/* The storefront globally justifies every <p>. Reset to a clean left rag here. */}
      <style dangerouslySetInnerHTML={{ __html:
        ".marketing-layout .vkc-about p{text-align:left;hyphens:none;text-justify:auto}" +
        ".marketing-layout .vkc-about .text-center p{text-align:center}" +
        ".vkc-about .vkc-rail::-webkit-scrollbar{display:none}"
      }} />

      {/* ── 1 · HERO ─────────────────────────────────────────────────────── */}
      {/* With an uploaded banner (Admin → Banners → "About Us — Hero Banner")
          the banner IS the hero: shown full-width at its own aspect ratio,
          never cropped, with no static copy over it — the artwork carries
          whatever message the team designs into it. The mobile crop swaps in
          below md when one was uploaded. Without a banner, the designed hero
          below takes over. */}
      {hasBanner && desktopBanner && (
        <section ref={heroRef} className="relative" style={{ background: C.bark }} aria-label={bannerAlt || "About VKC Gold Ikshu"}>
          <img
            src={desktopBanner}
            alt={bannerAlt}
            className={`block w-full h-auto ${hasSeparateMobileBanner ? "hidden md:block" : ""}`}
          />
          {hasSeparateMobileBanner && mobileBanner && (
            <img src={mobileBanner} alt={bannerAlt} className="block w-full h-auto md:hidden" />
          )}
        </section>
      )}
      {!hasBanner && (
      <section ref={heroRef} className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.bark} 0%, ${C.green} 100%)`, minHeight: "clamp(600px, calc(100svh - 120px), 980px)" }}>
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.12, mixBlendMode: "overlay" }} />
        {!hasBanner && (
          <>
            <motion.div aria-hidden className="absolute" animate={reduced ? undefined : { y: [0, -18, 0], x: [0, 10, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              style={{ top: -140, right: -60, width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle, ${C.jaggery}66, transparent 66%)`, filter: "blur(10px)" }} />
            <motion.div aria-hidden className="absolute" animate={reduced ? undefined : { y: [0, 16, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              style={{ bottom: -160, left: -120, width: 420, height: 420, borderRadius: "50%", background: `radial-gradient(circle, ${C.greenLight}66, transparent 70%)` }} />
            {/* Ghosted watermark */}
            <div aria-hidden className="absolute right-[-2%] bottom-[-6%] font-heading select-none pointer-events-none hidden lg:block"
              style={{ fontSize: "clamp(10rem,22vw,20rem)", lineHeight: 1, color: "rgba(255,214,92,0.05)", letterSpacing: "-0.04em", fontStyle: "italic" }}>
              1988
            </div>
          </>
        )}

        <motion.div className="relative w-full max-w-[1240px] mx-auto px-5 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-24 flex flex-col justify-end" style={{ y: copyY, opacity: copyOpacity, minHeight: "clamp(600px, calc(100svh - 120px), 980px)" }}>
          {bannerAlt && <span className="sr-only">{bannerAlt}</span>}
          <div className="grid lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <Reveal y={16}>
                <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-body font-medium backdrop-blur-sm" style={{ fontSize: 12.5, background: "rgba(255,251,244,0.08)", border: "1px solid rgba(255,214,92,0.3)", color: C.jaggeryLite }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.jaggeryLite, boxShadow: `0 0 0 4px ${C.jaggeryLite}33` }} />
                  Mandya's Pride · Since 1988
                </span>
              </Reveal>
              <h1 className="font-heading mt-7" style={{ fontSize: "clamp(3rem,8.4vw,7.4rem)", lineHeight: 0.96, letterSpacing: "-0.03em", color: C.ivory, maxWidth: 980 }}>
                <span className="block"><Words text="From Mandya's Heritage" /></span>
                <span className="block"><Words text="to the World" accent="World" /></span>
              </h1>
              <Reveal delay={0.35}>
                <p className="font-body mt-7" style={{ fontSize: "clamp(1.05rem,1.4vw,1.25rem)", lineHeight: 1.7, color: "rgba(255,251,244,0.8)", maxWidth: 600 }}>
                  VKC Gold Ikshu crafts pure, chemical-free jaggery and cane products
                  straight from the sugarcane fields of Mandya, Karnataka — rooted in a
                  farmer-first tradition that began in 1988.
                </p>
              </Reveal>
              <Reveal delay={0.45}>
                <div className="mt-10 flex flex-wrap gap-3">
                  <a href="#story" className="group inline-flex items-center gap-3 pl-7 pr-2 rounded-full font-body font-semibold text-sm transition-transform duration-300 hover:-translate-y-0.5"
                    style={{ height: 52, background: C.jaggery, color: C.bark, boxShadow: "0 12px 32px rgba(201,139,46,0.35)" }}>
                    Our Story
                    <span className="grid place-items-center h-9 w-9 rounded-full transition-transform duration-300 group-hover:rotate-45" style={{ background: C.bark, color: C.jaggeryLite }}>
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </a>
                  <Link href="/contact" className="group inline-flex items-center gap-2 px-7 rounded-full font-body font-semibold text-sm transition-colors duration-300 backdrop-blur-sm"
                    style={{ height: 52, border: "1px solid rgba(255,214,92,0.45)", color: C.jaggeryLite, background: "rgba(255,251,244,0.05)" }}>
                    Contact Us <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* Stat rail */}
            <Reveal delay={0.5} className="lg:col-span-4">
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-6 lg:gap-7 lg:pl-10" style={{ borderLeft: "1px solid rgba(222,215,203,0.16)" }}>
                <div className="pl-5 lg:pl-0"><Stat value={38} suffix="+" label="Years of Trust" /></div>
                <div className="pl-5 lg:pl-0"><Stat value={100} suffix="%" label="Natural" /></div>
                <div className="pl-5 lg:pl-0"><Stat value={0} label="Chemicals Added" /></div>
              </div>
            </Reveal>
          </div>
        </motion.div>

        {/* Scroll cue */}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 pointer-events-none">
          <span className="relative block w-px h-12 overflow-hidden" style={{ background: "rgba(255,251,244,0.2)" }}>
            <motion.span className="absolute left-0 top-0 w-px h-5" animate={reduced ? undefined : { y: [-20, 48] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} style={{ background: C.jaggeryLite }} />
          </span>
        </div>
      </section>
      )}

      <Marquee items={["100% Natural", "Chemical-Free", "Farmer-First", "Made in Mandya", "Since 1988", "No Preservatives"]} />

      {/* ── 2 · THE LEGACY CONTINUES + JOURNEY (scroll-driven chapters) ──── */}
      <LegacyContinues />
      <JourneyTimeline />

      {/* ── 3 · OUR PHILOSOPHY ───────────────────────────────────────────── */}
      <section style={{ background: C.cream }}>
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-6">
              <SectionHeading eyebrow="Our Philosophy" title="Sustainability begins at the roots — with farmers." />
            </div>
            <Reveal delay={0.15} className="lg:col-span-6">
              <div className="space-y-4 font-body" style={{ fontSize: 16.5, lineHeight: 1.8, color: C.ink2 }}>
                <p>
                  Our mission is to empower rural communities by ensuring fair pricing, transparent
                  transactions, and access to modern, chemical-free production systems.
                </p>
                <p>
                  By collaborating with Jagadish Machinery (Gujarat) and adopting energy-efficient,
                  high-recovery systems, we've modernised our process while staying true to our
                  ancestral values.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Floating trio: the middle card sits higher and dark, the outer two
              drift on their own periods. Cursor tilts and lights each card. */}
          <div className="relative mt-16 md:mt-24 grid gap-6 md:gap-7 md:grid-cols-3 md:items-start">
            <div aria-hidden className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[120%] w-[70%] rounded-full pointer-events-none"
              style={{ background: `radial-gradient(ellipse at center, ${C.jaggery}22, transparent 65%)`, filter: "blur(30px)" }} />
            {PHILOSOPHY.map((p, i) => {
              const dark = i === 1;
              return (
                <FloatCard key={p.t} index={i} dark={dark} className={i === 1 ? "md:-mt-12" : "md:mt-6"}>
                  <div className="p-8 sm:p-9" style={{ minHeight: 320 }}>
                    <div className="flex items-start justify-between">
                      <div className="relative h-16 w-16">
                        <span aria-hidden className="absolute inset-0 rounded-full transition-transform duration-700 group-hover:rotate-180" style={{ border: `1px dashed ${dark ? "rgba(255,214,92,0.55)" : `${C.jaggery}77`}` }} />
                        <div className="absolute inset-[6px] rounded-full grid place-items-center" style={{ background: dark ? C.jaggery : C.bark, color: dark ? C.bark : C.jaggeryLite }}>
                          <p.icon className="h-6 w-6" />
                        </div>
                      </div>
                      <span className="font-heading" style={{ fontSize: 44, lineHeight: 1, color: dark ? "rgba(255,214,92,0.35)" : `${C.jaggery}55`, letterSpacing: "-0.03em" }}>0{i + 1}</span>
                    </div>
                    <h3 className="font-heading mt-9" style={{ fontSize: 27, lineHeight: 1.08, letterSpacing: "-0.01em", color: dark ? C.ivory : C.ink }}>{p.t}</h3>
                    <p className="font-body mt-3" style={{ fontSize: 15, lineHeight: 1.72, color: dark ? "rgba(255,251,244,0.74)" : C.ink2 }}>{p.d}</p>
                    <span className="block mt-7 h-[2px] w-10 origin-left transition-transform duration-500 group-hover:scale-x-[2.6]" style={{ background: dark ? C.jaggeryLite : C.jaggery }} />
                  </div>
                </FloatCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4 · BUSINESS IDENTITY (archive record) ───────────────────────── */}
      <BusinessIdentity />

      {/* ── 4b · FOUNDER TRIBUTE → HERITAGE / TECHNOLOGY TRANSITION ───────── */}
      <FounderTribute />
      <HeritageToTechnology />

      {/* ── 5 · PROCESS + TECHNOLOGY ─────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.bark}, ${C.barkSoft})` }}>
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.1, mixBlendMode: "overlay" }} />
        <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <SectionHeading light eyebrow="Technology & Machinery" title="Modern engineering, traditional soul"
            sub="We pair heritage jaggery-making with modern, energy-efficient machinery — for cleaner processing and consistent quality in every batch." />

          {/* Process rail: a gold line draws across the four steps as the
              reader scrolls, lighting each badge as it passes. */}
          <ProcessSteps steps={PROCESS} />

          {/* Dealer "ticket": perforated edge and a slowly turning cog. */}
          <Reveal delay={0.1}>
            <div className="mt-20 relative grid lg:grid-cols-12 rounded-lg overflow-hidden" style={{ background: "rgba(255,251,244,0.05)", border: "1px solid rgba(255,214,92,0.25)", backdropFilter: "blur(6px)" }}>
              <div className="lg:col-span-3 relative p-8 sm:p-10 grid place-items-center" style={{ background: "rgba(255,214,92,0.08)" }}>
                <motion.div animate={reduced ? undefined : { rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                  className="h-20 w-20 rounded-full grid place-items-center" style={{ background: C.jaggery, color: C.bark, boxShadow: "0 16px 40px rgba(201,139,46,0.35)" }}>
                  <Cog className="h-9 w-9" />
                </motion.div>
                {/* perforation */}
                <div aria-hidden className="hidden lg:block absolute right-0 top-0 bottom-0 w-px" style={{ borderRight: "2px dashed rgba(255,214,92,0.35)" }} />
                <span aria-hidden className="hidden lg:block absolute -right-3 -top-3 h-6 w-6 rounded-full" style={{ background: C.bark }} />
                <span aria-hidden className="hidden lg:block absolute -right-3 -bottom-3 h-6 w-6 rounded-full" style={{ background: C.bark }} />
              </div>
              <div className="lg:col-span-9 p-8 sm:p-10 grid lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8">
                  <div className="font-body font-semibold uppercase" style={{ fontSize: 10.5, letterSpacing: "0.24em", color: C.jaggeryLite }}>Machinery partnership</div>
                  <h3 className="font-heading mt-3" style={{ fontSize: "clamp(1.5rem,2.4vw,2rem)", lineHeight: 1.15, color: C.ivory }}>Jagadish Engineering Works, Gujarat</h3>
                  <p className="font-body mt-3" style={{ fontSize: 15.5, lineHeight: 1.75, color: "rgba(255,251,244,0.78)" }}>
                    Beyond our own production, VKC is the <strong style={{ color: C.jaggeryLite }}>authorized Karnataka dealer</strong> for
                    Jagadish Engineering Works — bringing proven, energy-efficient jaggery-processing machinery to producers across the state.
                  </p>
                </div>
                <div className="lg:col-span-4 lg:justify-self-end">
                  <span className="inline-flex items-center gap-2 font-body font-semibold rounded-full px-4 py-2.5" style={{ fontSize: 13, background: "rgba(255,214,92,0.14)", color: C.jaggeryLite, border: "1px solid rgba(255,214,92,0.3)" }}>
                    <Factory className="h-4 w-4" /> Authorized Karnataka Dealer
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 6 · VISION & MISSION ─────────────────────────────────────────── */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
        {/* Vision: a cursor-following spotlight over the green panel. */}
        <Reveal>
          <Spotlight className="rounded-lg p-10 sm:p-16 lg:p-20" style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenDeep})`, color: C.ivory }}>
            <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.12, mixBlendMode: "overlay" }} />
            <div className="relative grid lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-3">
                <motion.div className="inline-flex h-12 w-12 rounded-full items-center justify-center" style={{ background: "rgba(255,251,244,0.12)" }}
                  animate={reduced ? undefined : { boxShadow: ["0 0 0 0 rgba(255,214,92,0.5)", "0 0 0 18px rgba(255,214,92,0)"] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}>
                  <Eye className="h-6 w-6" style={{ color: C.jaggeryLite }} />
                </motion.div>
                <div className="mt-4"><Eyebrow color={C.jaggeryLite}>Our Vision</Eyebrow></div>
              </div>
              <p className="lg:col-span-9 font-heading" style={{ fontSize: "clamp(1.8rem,3.6vw,3.1rem)", lineHeight: 1.12, letterSpacing: "-0.015em" }}>
                <Words text="To make VKC Gold Ikshu a trusted global brand representing Mandya's heritage of purity, health, and sweetness." />
              </p>
            </div>
          </Spotlight>
        </Reveal>

        <div className="mt-20 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <div className="flex items-center gap-3"><Target className="h-5 w-5" style={{ color: C.jaggeryDark }} /><Eyebrow>Our Mission</Eyebrow></div>
              <h2 className="font-heading mt-5" style={{ fontSize: "clamp(2rem,3.6vw,3rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: C.ink }}>
                <Words text="Five things we get up for" />
              </h2>
            </div>
          </div>
          <div className="lg:col-span-8">
            {/* Mission ledger: hovering a row sweeps a gold wash in from the
                left and swells its number — an index, not a card grid. */}
            {MISSION.map((m, i) => (
              <Reveal key={m.t} delay={i * 0.05}>
                <div className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-5 sm:gap-8 py-6 sm:py-7 px-3 -mx-3 overflow-hidden" style={{ borderTop: `1px solid ${C.parchment}`, borderBottom: i === MISSION.length - 1 ? `1px solid ${C.parchment}` : "none" }}>
                  <span aria-hidden className="absolute inset-0 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" style={{ background: `linear-gradient(90deg, ${C.jaggery}1f, transparent)` }} />
                  <span className="relative font-heading tabular-nums transition-all duration-500 group-hover:scale-150 group-hover:text-[#9A5B0B]" style={{ fontSize: 15, color: C.muted, width: 28, transformOrigin: "left center" }}>0{i + 1}</span>
                  <div className="relative">
                    <h3 className="font-heading transition-transform duration-500 group-hover:translate-x-2" style={{ fontSize: "clamp(1.35rem,2.2vw,1.85rem)", lineHeight: 1.1, color: C.ink }}>{m.t}</h3>
                    <p className="font-body mt-1.5 transition-transform duration-500 group-hover:translate-x-2" style={{ fontSize: 14.5, lineHeight: 1.65, color: C.ink2, maxWidth: 520 }}>{m.d}</p>
                  </div>
                  <div className="relative h-12 w-12 rounded-full grid place-items-center transition-all duration-500 group-hover:rotate-[20deg] group-hover:bg-[#3A1F0A] group-hover:text-[#FFD65C]" style={{ background: `${C.jaggery}18`, color: C.jaggeryDark }}>
                    <m.icon className="h-5 w-5" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7 · CORE VALUES (stacking cards) ─────────────────────────────── */}
      <section style={{ background: C.cream }}>
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 pt-24 sm:pt-32 pb-24 sm:pb-40">
          <SectionHeading center eyebrow="Core Values" title="What guides every batch"
            sub="Five commitments, one on top of the other. Keep scrolling — each one settles beneath the next." />
          <div className="mt-16">
            <StackCards values={VALUES} />
          </div>
        </div>
      </section>

      {/* ── 8 · LEADERSHIP — lives on /leadership; a pointer keeps the story flowing ── */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <Reveal>
          <Link href="/leadership" className="group grid lg:grid-cols-12 gap-8 items-center rounded-lg p-8 sm:p-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ background: C.cream, border: `1px solid ${C.parchment}` }}>
            <div className="lg:col-span-8">
              <Eyebrow>Our Core Team</Eyebrow>
              <h2 className="font-heading mt-4" style={{ fontSize: "clamp(1.8rem,3.4vw,2.8rem)", lineHeight: 1.08, letterSpacing: "-0.015em", color: C.ink }}>The family behind VKC Gold Ikshu</h2>
              <p className="font-body mt-3" style={{ fontSize: 16, lineHeight: 1.7, color: C.ink2, maxWidth: 620 }}>Founded in legacy by Late Shri B Ramachandra. Now led by Naveenchandra B R — meet the people carrying the values forward.</p>
            </div>
            <div className="lg:col-span-4 lg:justify-self-end">
              <span className="inline-flex items-center gap-3 pl-6 pr-2 rounded-full font-body font-semibold text-sm" style={{ height: 50, background: C.bark, color: C.ivory }}>
                Meet the leadership
                <span className="grid place-items-center h-8 w-8 rounded-full transition-transform duration-300 group-hover:translate-x-1" style={{ background: C.jaggery, color: C.bark }}><ArrowRight className="h-4 w-4" /></span>
              </span>
            </div>
          </Link>
        </Reveal>
      </section>

      {/* ── 10 · MANIFESTO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: `radial-gradient(120% 120% at 80% 0%, ${C.barkSoft}, ${C.bark})` }}>
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.1, mixBlendMode: "overlay" }} />
        {/* Manifesto: one long line that brightens word by word as you scroll —
            no cards, no grid, just the statement. */}
        <div className="relative max-w-[1100px] mx-auto px-5 sm:px-8 py-28 sm:py-40">
          <Reveal><Eyebrow color={C.jaggeryLite}>Our Promise</Eyebrow></Reveal>
          <ScrollText
            text="No chemicals. No shortcuts. We pay the farmer fairly, we process without a single additive, we waste less every year, and we earn your trust one batch at a time. Just natural sweetness."
            accentFrom={33}
            className="font-heading mt-8"
            style={{ fontSize: "clamp(2rem,4.8vw,4rem)", lineHeight: 1.12, letterSpacing: "-0.02em", color: C.ivory, maxWidth: 1000 }}
          />
          <div className="mt-14 flex flex-wrap gap-x-10 gap-y-4">
            {[
              { icon: Sprout, t: "Farmer Support" },
              { icon: Recycle, t: "Sustainability" },
              { icon: Heart, t: "Quality & Trust" },
            ].map((x, i) => (
              <Reveal key={x.t} delay={i * 0.1}>
                <span className="inline-flex items-center gap-3 font-body font-semibold uppercase" style={{ fontSize: 12, letterSpacing: "0.2em", color: "rgba(255,251,244,0.7)" }}>
                  <span className="h-9 w-9 rounded-full grid place-items-center" style={{ border: "1px solid rgba(255,214,92,0.4)", color: C.jaggeryLite }}><x.icon className="h-4 w-4" /></span>
                  {x.t}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12 · CONTACT / CTA ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.jaggeryDark}, ${C.jaggery})` }}>
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.14, mixBlendMode: "overlay" }} />
        <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 py-24 sm:py-28">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <Eyebrow color={C.bark}>Get in Touch</Eyebrow>
              <h2 className="font-heading mt-5" style={{ fontSize: "clamp(2.2rem,4.6vw,3.8rem)", lineHeight: 1.02, letterSpacing: "-0.02em", color: C.bark }}>
                <Words text="Let's talk sweetness — the natural way" />
              </h2>
              <Reveal delay={0.15}>
                <p className="font-body mt-5" style={{ fontSize: 16.5, lineHeight: 1.7, color: "rgba(58,31,10,0.78)", maxWidth: 480 }}>
                  Questions about our jaggery, bulk orders, or machinery? We'd love to hear from you.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <MagneticLink><Link href="/contact" className="group inline-flex items-center gap-3 pl-7 pr-2 rounded-full font-body font-semibold text-sm"
                    style={{ height: 52, background: C.bark, color: C.ivory }}>
                    Talk to Us
                    <span className="grid place-items-center h-9 w-9 rounded-full transition-transform duration-300 group-hover:rotate-45" style={{ background: C.jaggery, color: C.bark }}>
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Link></MagneticLink>
                  <a href={whatsappHref} target={whatsappDigits ? "_blank" : undefined} rel={whatsappDigits ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-2 px-7 rounded-full font-body font-semibold text-sm transition-colors duration-300"
                    style={{ height: 52, border: `1px solid ${C.bark}66`, color: C.bark, background: "rgba(255,251,244,0.25)" }}>
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.1} className="lg:col-span-6">
              <div className="rounded-lg p-7 sm:p-9 space-y-1 backdrop-blur-sm" style={{ background: "rgba(255,251,244,0.92)", boxShadow: "0 30px 80px rgba(58,31,10,0.25)" }}>
                {[
                  { icon: MapPin, k: "Visit", v: "Ballenahalli Village, Srirangapatna Taluk, Mandya District, Karnataka – 571807" },
                  { icon: Phone, k: "Call", v: phone, href: phoneHref },
                  { icon: MessageCircle, k: "WhatsApp", v: whatsappDigits ? `+${whatsappDigits}` : "Chat with us", href: whatsappHref },
                  { icon: Mail, k: "Email", v: email, href: `mailto:${email}` },
                ].map((r, idx) => (
                  <div key={r.k} className="flex items-start gap-4 py-4" style={{ borderTop: idx ? `1px solid ${C.parchment}` : "none" }}>
                    <div className="h-11 w-11 rounded-lg grid place-items-center shrink-0" style={{ background: `${C.jaggery}1f`, color: C.jaggeryDark }}>
                      <r.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.16em", color: C.jaggeryDark }}>{r.k}</div>
                      {r.href
                        ? <a href={r.href} className="font-body block mt-1 hover:underline" style={{ fontSize: 15.5, color: C.ink }}>{r.v}</a>
                        : <div className="font-body mt-1" style={{ fontSize: 15, lineHeight: 1.55, color: C.ink2 }}>{r.v}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
