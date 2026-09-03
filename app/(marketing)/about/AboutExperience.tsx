"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, Sprout, Handshake, Recycle, Cog, Heart, ShieldCheck,
  Sparkles, Globe2, Factory, BadgeCheck, MapPin, Phone,
  Mail, MessageCircle, Target, Eye, Wheat, Leaf, Scale,
} from "lucide-react";

/* ── Deep-green & jaggery-gold palette (layered on the site tokens) ───────── */
const C = {
  bark:        "#122017",
  barkSoft:    "#1D3329",
  green:       "#1F6F5C",
  greenLight:  "#4F907A",
  greenDeep:   "#16483C",
  jaggery:     "#C98B2E",
  jaggeryDark: "#8A5B17",
  jaggeryLite: "#F0C96D",
  cream:       "#F3F0E8",
  ivory:       "#FCFBF7",
  parchment:   "#DED7CB",
  ink:         "#111827",
  ink2:        "#354052",
  muted:       "#667085",
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
  return (
    <span className={className} style={style} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" style={{ paddingBottom: "0.1em", marginBottom: "-0.1em" }}>
          <motion.span
            aria-hidden
            className="inline-block"
            initial={reduced ? false : { y: "110%", opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
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
      <div className="mt-2 font-body uppercase" style={{ fontSize: 11, letterSpacing: "0.2em", color: "rgba(252,251,247,0.6)" }}>
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
        <p className="font-body mt-5" style={{ fontSize: 17, lineHeight: 1.7, color: light ? "rgba(252,251,247,0.72)" : C.ink2, maxWidth: 620, margin: center ? "1.25rem auto 0" : undefined }}>
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

/* ── Team card: 3D tilt that follows the cursor, photo drifts the other way ── */
function TeamCard({ name, role, photo, bio, index }: { name: string; role: string; photo: string; bio: string; index: number }) {
  const reduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 160, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), spring);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-11, 11]), spring);
  const photoX = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), spring);
  const photoY = useSpring(useTransform(my, [-0.5, 0.5], [-12, 12]), spring);
  const glareX = useTransform(mx, [-0.5, 0.5], ["10%", "90%"]);
  const glareY = useTransform(my, [-0.5, 0.5], ["10%", "90%"]);
  const glare = useTransform([glareX, glareY], ([x, y]) => `radial-gradient(240px circle at ${x} ${y}, rgba(255,255,255,0.28), transparent 60%)`);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, ease: EASE, delay: index * 0.1 }}
      style={{ perspective: 1200 }}
      className="h-full"
    >
      <motion.div
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group relative h-full rounded-lg overflow-hidden"
      >
        <div className="absolute inset-0" style={{ background: "white", border: `1px solid ${C.parchment}`, borderRadius: 12 }} />

        {/* Photo */}
        <div className="relative m-3 rounded-lg overflow-hidden" style={{ aspectRatio: "4 / 5", background: C.cream, transform: "translateZ(30px)" }}>
          <motion.div
            className="absolute inset-0"
            style={{ x: photoX, y: photoY, scale: 1.12 }}
            animate={reduced ? undefined : { scale: [1.12, 1.18, 1.12] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: index * 0.7 }}
          >
            <Image src={photo} alt={name} fill sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw" className="object-cover object-top" />
          </motion.div>
          {/* Bottom fade + glare */}
          <div aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(0deg, ${C.bark}CC 0%, ${C.bark}22 35%, transparent 60%)` }} />
          <motion.div aria-hidden className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: glare, mixBlendMode: "soft-light" }} />
          {/* Gold ring corner */}
          <span aria-hidden className="absolute top-3 right-3 h-8 w-8 rounded-full grid place-items-center font-heading transition-transform duration-500 group-hover:rotate-[360deg]" style={{ fontSize: 12, background: C.jaggery, color: C.bark }}>
            0{index + 1}
          </span>
          <div className="absolute left-4 right-4 bottom-4" style={{ transform: "translateZ(40px)" }}>
            <div className="font-heading" style={{ fontSize: 22, lineHeight: 1.1, color: C.ivory }}>{name}</div>
            <div className="font-body mt-1 uppercase" style={{ fontSize: 10.5, letterSpacing: "0.16em", color: C.jaggeryLite }}>{role}</div>
          </div>
        </div>

        {/* Bio */}
        <div className="relative px-6 pb-6 pt-2" style={{ transform: "translateZ(20px)" }}>
          <p className="font-body" style={{ fontSize: 14.5, lineHeight: 1.65, color: C.ink2 }}>{bio}</p>
          <span className="block mt-4 h-[2px] w-8 origin-left transition-transform duration-500 group-hover:scale-x-[3]" style={{ background: C.jaggery }} />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Data ─────────────────────────────────────────────────────────────────── */
const TIMELINE = [
  { year: "1988", title: "Vairamudi Krupa Crusher", body: "Mr. Ramachandra B sets up a sugarcane crusher in Mandya, turning locally grown cane into honest, unrefined sweetness for the community around him." },
  { year: "Growth", title: "A trusted local name", body: "Over the decades the crusher earns a reputation for purity and fair dealing with farmers — the foundation everything else is built on." },
  { year: "Today", title: "VKC Cane Gold Foods Pvt. Ltd.", body: "The family enterprise is formalised as a natural food-processing company, combining traditional jaggery-making with modern, energy-efficient machinery." },
  { year: "Ahead", title: "From Mandya to the world", body: "A healthy, chemical-free alternative to refined sugar — carrying Mandya's jaggery heritage to new markets." },
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

const LEADERS = [
  { name: "Mr. Ramachandra B", role: "Founder & Chairman (Honorary)", photo: "/images/team/ramachandra-b.webp", bio: "Senior advisor and mentor ensuring traditional quality." },
  { name: "Mr. Naveenchandra B R", role: "Managing Director", photo: "/images/team/naveenchandra-b-r.webp", bio: "Leads operations, finance, and strategic growth." },
  { name: "Mr. Abhishek B R", role: "Director — Operations", photo: "/images/team/abhishek-b-r.webp", bio: "Oversees production, modernization, and vendor coordination." },
  { name: "Mrs. Pushpalatha", role: "Director — Quality & Administration", photo: "/images/team/pushpalatha.webp", bio: "Ensures hygiene, packaging, and internal audits." },
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
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "18%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 80]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.2]);

  const card = "rounded-lg border transition-all duration-500";

  return (
    <div className="vkc-about" style={{ background: C.ivory }}>
      {/* The storefront globally justifies every <p>. Reset to a clean left rag here. */}
      <style dangerouslySetInnerHTML={{ __html:
        ".marketing-layout .vkc-about p{text-align:left;hyphens:none;text-justify:auto}" +
        ".marketing-layout .vkc-about .text-center p{text-align:center}" +
        ".vkc-about .vkc-rail::-webkit-scrollbar{display:none}"
      }} />

      {/* ── 1 · HERO ─────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.bark} 0%, ${C.green} 100%)`, minHeight: "clamp(600px, calc(100svh - 120px), 980px)" }}>
        {desktopBanner && (
          <motion.div className="absolute inset-0" style={{ y: bgY, scale: 1.12 }}>
            <Image
              src={desktopBanner}
              alt=""
              fill
              priority
              sizes="100vw"
              className={`object-cover ${hasSeparateMobileBanner ? "hidden md:block" : "block"}`}
            />
            {hasSeparateMobileBanner && mobileBanner && (
              <Image src={mobileBanner} alt="" fill priority sizes="100vw" className="object-cover md:hidden" />
            )}
            <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(18,32,23,0.92) 0%, rgba(18,32,23,0.72) 48%, rgba(18,32,23,0.34) 100%), linear-gradient(0deg, rgba(18,32,23,0.8) 0%, transparent 40%)" }} />
          </motion.div>
        )}
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.12, mixBlendMode: "overlay" }} />
        {!hasBanner && (
          <>
            <motion.div aria-hidden className="absolute" animate={reduced ? undefined : { y: [0, -18, 0], x: [0, 10, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              style={{ top: -140, right: -60, width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle, ${C.jaggery}66, transparent 66%)`, filter: "blur(10px)" }} />
            <motion.div aria-hidden className="absolute" animate={reduced ? undefined : { y: [0, 16, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              style={{ bottom: -160, left: -120, width: 420, height: 420, borderRadius: "50%", background: `radial-gradient(circle, ${C.greenLight}66, transparent 70%)` }} />
            {/* Ghosted watermark */}
            <div aria-hidden className="absolute right-[-2%] bottom-[-6%] font-heading select-none pointer-events-none hidden lg:block"
              style={{ fontSize: "clamp(10rem,22vw,20rem)", lineHeight: 1, color: "rgba(240,201,109,0.05)", letterSpacing: "-0.04em", fontStyle: "italic" }}>
              1988
            </div>
          </>
        )}

        <motion.div className="relative w-full max-w-[1240px] mx-auto px-5 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-24 flex flex-col justify-end" style={{ y: copyY, opacity: copyOpacity, minHeight: "clamp(600px, calc(100svh - 120px), 980px)" }}>
          {bannerAlt && <span className="sr-only">{bannerAlt}</span>}
          <div className="grid lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <Reveal y={16}>
                <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-body font-medium backdrop-blur-sm" style={{ fontSize: 12.5, background: "rgba(252,251,247,0.08)", border: "1px solid rgba(240,201,109,0.3)", color: C.jaggeryLite }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.jaggeryLite, boxShadow: `0 0 0 4px ${C.jaggeryLite}33` }} />
                  Mandya's Pride · Since 1988
                </span>
              </Reveal>
              <h1 className="font-heading mt-7" style={{ fontSize: "clamp(3rem,8.4vw,7.4rem)", lineHeight: 0.96, letterSpacing: "-0.03em", color: C.ivory, maxWidth: 980 }}>
                <span className="block"><Words text="From Mandya's Heritage" /></span>
                <span className="block"><Words text="to the World" accent="World" /></span>
              </h1>
              <Reveal delay={0.35}>
                <p className="font-body mt-7" style={{ fontSize: "clamp(1.05rem,1.4vw,1.25rem)", lineHeight: 1.7, color: "rgba(252,251,247,0.8)", maxWidth: 600 }}>
                  VKC Cane Gold Foods crafts pure, chemical-free jaggery and cane products
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
                    style={{ height: 52, border: "1px solid rgba(240,201,109,0.45)", color: C.jaggeryLite, background: "rgba(252,251,247,0.05)" }}>
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
          <span className="relative block w-px h-12 overflow-hidden" style={{ background: "rgba(252,251,247,0.2)" }}>
            <motion.span className="absolute left-0 top-0 w-px h-5" animate={reduced ? undefined : { y: [-20, 48] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} style={{ background: C.jaggeryLite }} />
          </span>
        </div>
      </section>

      <Marquee items={["100% Natural", "Chemical-Free", "Farmer-First", "Made in Mandya", "Since 1988", "No Preservatives"]} />

      {/* ── 2 · OUR STORY (sticky split timeline) ────────────────────────── */}
      <section id="story" className="max-w-[1240px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <SectionHeading eyebrow="Our Story" size="lg"
                title="A crusher in 1988, a promise ever since"
                sub="What began as a single sugarcane crusher has grown into a natural food-processing enterprise — without ever losing the values it started with." />
              <Reveal delay={0.2}>
                <div className="mt-10 rounded-lg p-6 flex items-center gap-5" style={{ background: C.cream, border: `1px solid ${C.parchment}` }}>
                  <div className="h-14 w-14 rounded-full grid place-items-center shrink-0" style={{ background: C.bark, color: C.jaggeryLite }}>
                    <Wheat className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-heading" style={{ fontSize: 22, color: C.ink }}>Three generations of cane</div>
                    <div className="font-body mt-0.5" style={{ fontSize: 14, color: C.muted }}>One family, one district, one standard.</div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          <div className="lg:col-span-7 relative">
            <div aria-hidden className="hidden sm:block absolute top-4 bottom-4" style={{ left: 27, width: 1, background: `linear-gradient(${C.jaggery}, ${C.green} 70%, transparent)` }} />
            <div className="space-y-6">
              {TIMELINE.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.08}>
                  <div className="flex gap-5 sm:gap-8 group">
                    <div className="shrink-0 relative">
                      <div className="h-14 w-14 rounded-full grid place-items-center font-heading transition-transform duration-500 group-hover:scale-110"
                        style={{ fontSize: 13, background: C.ivory, border: `1.5px solid ${C.jaggery}`, color: C.jaggeryDark, boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                    </div>
                    <div className={`${card} flex-1 p-7 sm:p-8 group-hover:-translate-y-1 group-hover:shadow-lg`} style={{ background: "white", borderColor: C.parchment }}>
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-body font-bold uppercase" style={{ fontSize: 11, letterSpacing: "0.18em", color: C.jaggeryDark }}>{s.year}</span>
                        <span className="h-px flex-1" style={{ background: C.parchment }} />
                      </div>
                      <h3 className="font-heading mt-3" style={{ fontSize: 26, lineHeight: 1.1, color: C.ink }}>{s.title}</h3>
                      <p className="font-body mt-3" style={{ fontSize: 15.5, lineHeight: 1.75, color: C.ink2 }}>{s.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

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

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {PHILOSOPHY.map((p, i) => (
              <motion.div
                key={p.t}
                initial={reduced ? false : { opacity: 0, y: 40, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "0px 0px -12% 0px" }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.14 }}
                whileHover={reduced ? undefined : { y: -8 }}
                className="group relative rounded-lg overflow-hidden"
                style={{ background: C.ivory, border: `1px solid ${C.parchment}` }}
              >
                {/* Gold sweep on hover */}
                <motion.span
                  aria-hidden
                  className="absolute left-0 right-0 top-0 h-[3px] origin-left"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: EASE, delay: 0.4 + i * 0.14 }}
                  style={{ background: `linear-gradient(90deg, ${C.jaggery}, ${C.jaggeryLite})` }}
                />
                <div aria-hidden className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full transition-transform duration-700 group-hover:scale-150" style={{ background: `radial-gradient(circle, ${C.green}14, transparent 70%)` }} />
                <div className="relative p-8 sm:p-9">
                  <div className="flex items-start justify-between">
                    <motion.div
                      className="h-14 w-14 rounded-lg grid place-items-center"
                      initial={reduced ? false : { rotate: -8, scale: 0.8, opacity: 0 }}
                      whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: EASE, delay: 0.3 + i * 0.14 }}
                      style={{ background: C.bark, color: C.jaggeryLite }}
                    >
                      <p.icon className="h-7 w-7" />
                    </motion.div>
                    <span className="font-heading" style={{ fontSize: 40, lineHeight: 1, color: `${C.jaggery}44`, letterSpacing: "-0.03em" }}>0{i + 1}</span>
                  </div>
                  <h3 className="font-heading mt-8" style={{ fontSize: 26, lineHeight: 1.1, letterSpacing: "-0.01em", color: C.ink }}>{p.t}</h3>
                  <p className="font-body mt-3" style={{ fontSize: 15, lineHeight: 1.72, color: C.ink2 }}>{p.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 · WHO WE ARE ───────────────────────────────────────────────── */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <SectionHeading eyebrow="Who We Are" title="A Mandya family enterprise, rooted in the soil" />
            <Reveal delay={0.15}>
              <div className="mt-7 space-y-4 font-body" style={{ fontSize: 17, lineHeight: 1.8, color: C.ink2, maxWidth: 620 }}>
                <p>VKC Cane Gold Foods Pvt. Ltd. is a natural food-processing company from Ballenahalli, Srirangapatna Taluk, in the Mandya district of Karnataka — the heart of India's sugarcane country.</p>
                <p>As a registered MSME with GST compliance, we're proud to build in India and buy local — championing rural entrepreneurship and creating value close to where our cane is grown.</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2.5">
                {["Make in India", "Vocal for Local", "Rural Entrepreneurship", "MSME Registered"].map((t) => (
                  <span key={t} className="font-body font-medium rounded-full px-4 py-2 transition-colors duration-300 hover:text-white" style={{ fontSize: 13, border: `1px solid ${C.jaggery}55`, color: C.jaggeryDark }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.jaggeryDark; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    {t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: MapPin, k: "Location", v: "Ballenahalli, Srirangapatna Taluk, Mandya — Karnataka 571807" },
                { icon: BadgeCheck, k: "Registration", v: "MSME / Udyam & GST compliant" },
                { icon: Sprout, k: "Sourcing", v: "Sugarcane from local Mandya farmers" },
                { icon: Factory, k: "Production", v: "Chemical-free, modern processing" },
              ].map((b, i) => (
                <Reveal key={b.k} delay={i * 0.08} className={i % 2 === 1 ? "sm:translate-y-8" : ""}>
                  <div className={`${card} p-6 h-full hover:-translate-y-1 hover:shadow-lg`} style={{ background: "white", borderColor: C.parchment }}>
                    <div className="h-10 w-10 rounded-lg grid place-items-center" style={{ background: `${C.green}12`, color: C.green }}>
                      <b.icon className="h-5 w-5" />
                    </div>
                    <div className="font-body font-semibold mt-4 uppercase" style={{ fontSize: 11.5, letterSpacing: "0.12em", color: C.jaggeryDark }}>{b.k}</div>
                    <div className="font-body mt-1.5" style={{ fontSize: 14, lineHeight: 1.55, color: C.ink2 }}>{b.v}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5 · PROCESS + TECHNOLOGY ─────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.bark}, ${C.barkSoft})` }}>
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.1, mixBlendMode: "overlay" }} />
        <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <SectionHeading light eyebrow="Technology & Machinery" title="Modern engineering, traditional soul"
            sub="We pair heritage jaggery-making with modern, energy-efficient machinery — for cleaner processing and consistent quality in every batch." />

          {/* Process steps */}
          <div className="mt-14 grid gap-px sm:grid-cols-2 lg:grid-cols-4 rounded-lg overflow-hidden" style={{ background: "rgba(240,201,109,0.16)" }}>
            {PROCESS.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.08}>
                <div className="h-full p-7 sm:p-8 transition-colors duration-500 hover:bg-[rgba(252,251,247,0.06)]" style={{ background: C.bark }}>
                  <div className="font-heading" style={{ fontSize: 44, lineHeight: 1, color: C.jaggeryLite, letterSpacing: "-0.03em" }}>{p.n}</div>
                  <h3 className="font-heading mt-6" style={{ fontSize: 22, color: C.ivory }}>{p.t}</h3>
                  <p className="font-body mt-2" style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(252,251,247,0.66)" }}>{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Dealer card */}
          <Reveal delay={0.1}>
            <div className="mt-6 rounded-lg p-8 sm:p-10 grid lg:grid-cols-12 gap-8 items-center" style={{ background: "rgba(252,251,247,0.05)", border: "1px solid rgba(240,201,109,0.25)", backdropFilter: "blur(6px)" }}>
              <div className="lg:col-span-2">
                <div className="h-16 w-16 rounded-lg grid place-items-center" style={{ background: C.jaggery, color: C.bark, boxShadow: "0 16px 40px rgba(201,139,46,0.35)" }}>
                  <Cog className="h-8 w-8" />
                </div>
              </div>
              <div className="lg:col-span-7">
                <h3 className="font-heading" style={{ fontSize: "clamp(1.5rem,2.4vw,2rem)", lineHeight: 1.15, color: C.ivory }}>In partnership with Jagadish Engineering Works, Gujarat</h3>
                <p className="font-body mt-3" style={{ fontSize: 15.5, lineHeight: 1.75, color: "rgba(252,251,247,0.78)" }}>
                  Beyond our own production, VKC is the <strong style={{ color: C.jaggeryLite }}>authorized Karnataka dealer</strong> for
                  Jagadish Engineering Works — bringing proven, energy-efficient jaggery-processing machinery to producers across the state.
                </p>
              </div>
              <div className="lg:col-span-3 lg:text-right">
                <span className="inline-flex items-center gap-2 font-body font-semibold rounded-full px-4 py-2.5" style={{ fontSize: 13, background: "rgba(240,201,109,0.14)", color: C.jaggeryLite, border: "1px solid rgba(240,201,109,0.3)" }}>
                  <Factory className="h-4 w-4" /> Authorized Karnataka Dealer
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 6 · VISION & MISSION ─────────────────────────────────────────── */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
        <Reveal>
          <div className="relative rounded-lg p-10 sm:p-16 lg:p-20 overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenDeep})`, color: C.ivory }}>
            <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.12, mixBlendMode: "overlay" }} />
            <motion.div aria-hidden className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full" animate={reduced ? undefined : { scale: [1, 1.12, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              style={{ background: `radial-gradient(circle, ${C.jaggeryLite}44, transparent 66%)` }} />
            <div className="relative grid lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-3">
                <div className="inline-flex h-12 w-12 rounded-full items-center justify-center" style={{ background: "rgba(252,251,247,0.12)" }}>
                  <Eye className="h-6 w-6" style={{ color: C.jaggeryLite }} />
                </div>
                <div className="mt-4"><Eyebrow color={C.jaggeryLite}>Our Vision</Eyebrow></div>
              </div>
              <p className="lg:col-span-9 font-heading" style={{ fontSize: "clamp(1.8rem,3.6vw,3.1rem)", lineHeight: 1.12, letterSpacing: "-0.015em" }}>
                <Words text="To make VKC Cane Gold Foods Pvt Ltd a trusted global brand representing Mandya's heritage of purity, health, and sweetness." />
              </p>
            </div>
          </div>
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
            {MISSION.map((m, i) => (
              <Reveal key={m.t} delay={i * 0.05}>
                <div className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 sm:gap-8 py-6 sm:py-7" style={{ borderTop: `1px solid ${C.parchment}`, borderBottom: i === MISSION.length - 1 ? `1px solid ${C.parchment}` : "none" }}>
                  <span className="font-heading tabular-nums" style={{ fontSize: 15, color: C.muted, width: 28 }}>0{i + 1}</span>
                  <div>
                    <h3 className="font-heading transition-transform duration-300 group-hover:translate-x-1.5" style={{ fontSize: "clamp(1.35rem,2.2vw,1.85rem)", lineHeight: 1.1, color: C.ink }}>{m.t}</h3>
                    <p className="font-body mt-1.5" style={{ fontSize: 14.5, lineHeight: 1.65, color: C.ink2, maxWidth: 520 }}>{m.d}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full grid place-items-center transition-all duration-300 group-hover:rotate-12" style={{ background: `${C.jaggery}18`, color: C.jaggeryDark }}>
                    <m.icon className="h-5 w-5" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7 · CORE VALUES (snap rail on mobile) ────────────────────────── */}
      <section style={{ background: C.cream }} className="overflow-hidden">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <SectionHeading center eyebrow="Core Values" title="What guides every batch" />
          <div className="vkc-rail mt-14 flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory -mx-5 px-5 sm:mx-0 sm:px-0 pb-2" style={{ scrollbarWidth: "none" }}>
            {VALUES.map((v, i) => (
              <Reveal key={v.t} delay={i * 0.06} className="snap-start shrink-0 w-[78%] sm:w-[46%] lg:w-auto">
                <div className={`${card} h-full p-7 flex flex-col hover:-translate-y-1.5 hover:shadow-lg`} style={{ background: C.ivory, borderColor: C.parchment, minHeight: 260 }}>
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-lg grid place-items-center" style={{ background: `${C.green}12`, color: C.green }}>
                      <v.icon className="h-6 w-6" />
                    </div>
                    <span className="font-heading" style={{ fontSize: 34, lineHeight: 1, color: `${C.jaggery}55` }}>0{i + 1}</span>
                  </div>
                  <h3 className="font-heading mt-auto pt-8" style={{ fontSize: 21, lineHeight: 1.1, color: C.ink }}>{v.t}</h3>
                  <p className="font-body mt-2" style={{ fontSize: 14, lineHeight: 1.6, color: C.muted }}>{v.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8 · LEADERSHIP ───────────────────────────────────────────────── */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
        <SectionHeading eyebrow="Our Core Team" title="The family behind VKC Gold"
          sub="A close-knit team carrying a 1988 legacy forward — with the same care for farmers, quality and trust." />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LEADERS.map((l, i) => (
            <TeamCard key={l.name} index={i} {...l} />
          ))}
        </div>
      </section>

      {/* ── 10 · MANIFESTO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: `radial-gradient(120% 120% at 80% 0%, ${C.barkSoft}, ${C.bark})` }}>
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.1, mixBlendMode: "overlay" }} />
        <div className="relative max-w-[1100px] mx-auto px-5 sm:px-8 py-28 sm:py-36 text-center">
          <Reveal><Wheat className="h-8 w-8 mx-auto" style={{ color: C.jaggeryLite }} /></Reveal>
          <h2 className="font-heading mx-auto mt-7" style={{ fontSize: "clamp(2.3rem,5.6vw,4.4rem)", lineHeight: 1.04, letterSpacing: "-0.025em", color: C.ivory, maxWidth: 900 }}>
            <span className="block"><Words text="No chemicals. No shortcuts." /></span>
            <span className="block" style={{ color: C.jaggeryLite, fontStyle: "italic" }}><Words text="Just natural sweetness." /></span>
          </h2>
          <div className="mt-14 grid sm:grid-cols-3 gap-4">
            {[
              { icon: Sprout, t: "Farmer Support", d: "Fair prices, direct partnerships." },
              { icon: Recycle, t: "Sustainability", d: "Cleaner, lower-waste processing." },
              { icon: Heart, t: "Quality & Trust", d: "Earned in every single batch." },
            ].map((x, i) => (
              <Reveal key={x.t} delay={i * 0.08}>
                <div className="rounded-lg p-7 text-center transition-colors duration-500 hover:bg-[rgba(252,251,247,0.08)]" style={{ background: "rgba(252,251,247,0.04)", border: "1px solid rgba(240,201,109,0.2)" }}>
                  <x.icon className="h-6 w-6 mx-auto" style={{ color: C.jaggeryLite }} />
                  <h3 className="font-heading mt-4" style={{ fontSize: 21, color: C.ivory }}>{x.t}</h3>
                  <p className="font-body mt-1.5" style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(252,251,247,0.68)" }}>{x.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11 · LOOKING AHEAD ───────────────────────────────────────────── */}
      <section className="max-w-[1100px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
        <SectionHeading center eyebrow="Looking Ahead" title="Carrying Mandya's sweetness forward"
          sub="As we grow into new markets, our purpose stays the same: a healthy, natural alternative to refined sugar — made with people and the planet in mind." />
        <Reveal delay={0.1}>
          <figure className="mt-14 relative rounded-lg p-10 sm:p-16 text-center overflow-hidden" style={{ background: C.cream, border: `1px solid ${C.parchment}` }}>
            <span aria-hidden className="absolute left-6 top-2 font-heading select-none" style={{ fontSize: 180, lineHeight: 1, color: `${C.jaggery}22` }}>"</span>
            <blockquote className="relative font-heading mx-auto" style={{ fontSize: "clamp(1.6rem,3.2vw,2.5rem)", lineHeight: 1.25, letterSpacing: "-0.01em", color: C.ink, maxWidth: 800 }}>
              With every batch, we deliver more than sweetness — we deliver a story of purity, people and progress.
            </blockquote>
            <figcaption className="relative font-body mt-7 inline-flex items-center gap-3" style={{ fontSize: 12.5, letterSpacing: "0.16em", textTransform: "uppercase", color: C.jaggeryDark }}>
              <span className="h-px w-8" style={{ background: C.jaggery }} /> VKC Cane Gold Foods <span className="h-px w-8" style={{ background: C.jaggery }} />
            </figcaption>
          </figure>
        </Reveal>
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
                <p className="font-body mt-5" style={{ fontSize: 16.5, lineHeight: 1.7, color: "rgba(18,32,23,0.78)", maxWidth: 480 }}>
                  Questions about our jaggery, bulk orders, or machinery? We'd love to hear from you.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Link href="/contact" className="group inline-flex items-center gap-3 pl-7 pr-2 rounded-full font-body font-semibold text-sm transition-transform duration-300 hover:-translate-y-0.5"
                    style={{ height: 52, background: C.bark, color: C.ivory }}>
                    Talk to Us
                    <span className="grid place-items-center h-9 w-9 rounded-full transition-transform duration-300 group-hover:rotate-45" style={{ background: C.jaggery, color: C.bark }}>
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Link>
                  <a href={whatsappHref} target={whatsappDigits ? "_blank" : undefined} rel={whatsappDigits ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-2 px-7 rounded-full font-body font-semibold text-sm transition-colors duration-300"
                    style={{ height: 52, border: `1px solid ${C.bark}66`, color: C.bark, background: "rgba(252,251,247,0.25)" }}>
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.1} className="lg:col-span-6">
              <div className="rounded-lg p-7 sm:p-9 space-y-1 backdrop-blur-sm" style={{ background: "rgba(252,251,247,0.92)", boxShadow: "0 30px 80px rgba(18,32,23,0.25)" }}>
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
