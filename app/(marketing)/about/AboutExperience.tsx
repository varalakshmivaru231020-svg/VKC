"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import type { AboutSlotKey, ResolvedMedia } from "@/lib/about-media";
import { ArrowLink, Chapter, EASE, F, Frame, Grain, Lines, Meta, Picture, Rise, T, TYPE, useBeat, useFilm, usePinned } from "@/components/about/film";

/**
 * About — "From Cane to Legacy". A brand film told in scroll: cane, land,
 * 1988, the founder, Mandya, the farmer, the philosophy, the craft, the
 * company today, and what comes next. Fourteen scenes, no two composed alike.
 *
 * Every fact here is the family's own, carried over from the previous About,
 * Founder and Credentials pages. Nothing is counted, certified or claimed that
 * those pages did not already state, and the proposed 50 TCD unit is labelled
 * as proposed wherever it appears. Photographs are slots (lib/about-media.ts).
 */

/* The project compiles with Babel, which rules out next/font; the two faces
   load from the Google Fonts stylesheet instead (the root layout already
   preconnects to it) and are named here for components/about/film.tsx. */
const FONTS_HREF = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Mono:wght@400&display=swap";
const FONT_VARS = { "--film-serif": "'Cormorant Garamond'", "--film-mono": "'DM Mono'" } as React.CSSProperties;

export interface AboutProduct { name: string; slug: string; category: string | null; image: string }

const TIMELINE = [
  { year: "1988", kicker: "The beginning", t: "M/s Vairamudi Krupa Crusher", d: "Late Shri B Ramachandra sets up a sugarcane crusher in Mandya. The proprietorship remains the base of the business to this day." },
  { year: "Since", kicker: "The years between", t: "A trusted local name", d: "Decades of purity, hard work and fair dealing with the farmers who grow the cane." },
  { year: "Today", kicker: "The name", t: "VKC Gold Ikshu", d: "The family’s jaggery and cane products, carried forward under Naveenchandra B R as Managing Director." },
  { year: "2025", kicker: "A new structure", t: "VKC Jaggery & Beverages Pvt. Ltd.", d: "Incorporated on 12 December 2025 for the next phase of structured growth. The proprietorship stays central." },
  { year: "Ahead", kicker: "Proposed", t: "Technology upgradation", d: "A proposed 50 TCD fully automatic, thermic-fluid-based jaggery and cane-juice processing unit.", proposed: true },
];

const VALUES = ["Discipline", "Sincerity", "Purity", "Trust"];

const FARMER_PROMISES = [
  { t: "Fair pricing", d: "Honest, dependable rates paid directly to the farmers who grow our cane." },
  { t: "Transparent dealings", d: "Clear, straightforward transactions. No middlemen, no surprises." },
  { t: "Direct partnerships", d: "Working alongside the same farming families, season after season." },
];

const CREDENTIALS = ["Company incorporation · MCA", "Udyam · MSME", "GST", "Import–Export Code", "Trademark"];

const wrap = "mx-auto w-full max-w-[1560px] px-5 sm:px-8 lg:px-14";

export default function AboutExperience({ media, products, phone, whatsapp, email }: {
  media: Record<AboutSlotKey, ResolvedMedia>;
  products: AboutProduct[];
  phone: string;
  whatsapp: string;
  email: string;
}) {
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
  const whatsappDigits = whatsapp.replace(/\D/g, "");
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : "/contact";

  // Credit line for whichever placeholder photographs are still in use.
  const credits = Array.from(
    new Map(Object.values(media).filter((m) => m.placeholder && m.credit).map((m) => [m.credit!.author, m.credit!])).values(),
  );

  return (
    <div className="vkc-film" style={{ ...FONT_VARS, background: F.forest, color: F.onDark }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={FONTS_HREF} />
      <style dangerouslySetInnerHTML={{ __html:
        ".marketing-layout .vkc-film p{text-align:left;hyphens:none;text-justify:auto}" +
        ".vkc-film ::selection{background:#C39A50;color:#0D1B14}" +
        ".vkc-film .no-bar{scrollbar-width:none}.vkc-film .no-bar::-webkit-scrollbar{display:none}" +
        "@keyframes filmZoom{from{transform:scale(1.04)}to{transform:scale(1.16)}}" +
        "@keyframes filmCue{0%{transform:scaleY(0);transform-origin:top}45%{transform:scaleY(1);transform-origin:top}55%{transform:scaleY(1);transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}" +
        "@media (prefers-reduced-motion: reduce){.vkc-film .film-zoom,.vkc-film .film-cue{animation:none!important}}" +
        // The shared footer keeps every link and form; while the film is on
        // screen its theme tokens are re-pointed so it closes in the same key.
        ".marketing-layout:has(.vkc-film)>footer{--color-cream:#0D1B14;--color-primary:#C39A50;--color-gold:#C39A50;--color-gold-dark:#C39A50;--color-text-primary:#F7F4EC;--color-text-secondary:rgba(247,244,236,.72);--color-text-muted:rgba(247,244,236,.55);--color-parchment:rgba(247,244,236,.16);border-top:1px solid rgba(247,244,236,.12)}" +
        ".marketing-layout:has(.vkc-film)>footer>div:first-child{--color-primary:#08110C;border-bottom:1px solid rgba(247,244,236,.12)}" +
        ".marketing-layout:has(.vkc-film)>footer [style*='background: white'],.marketing-layout:has(.vkc-film)>footer [style*='background:white']{background:transparent!important}" +
        ".marketing-layout:has(.vkc-film)>footer button[type=submit]{color:#0D1B14!important}" +
        // The header floats over the hero here, so the announcement strip would sit under it.
        "body:has(.vkc-film) .announcement-bar{display:none}" +
        // The seal on the Tradition × Technology seam is split the way the panels meet.
        ".vkc-film .tt-seal{background:linear-gradient(180deg,#EEE7D8 50%,#0D1B14 50%)}@media (min-width:900px){.vkc-film .tt-seal{background:linear-gradient(90deg,#EEE7D8 50%,#0D1B14 50%)}}"
      }} />

      <Progress />
      <Hero m={media.hero} />
      <Story m={media.story} />
      <Year1988 m={media.year1988} />
      <Timeline />
      <Founder />
      <Mandya m={media.mandya} />
      <Farmer m={media.farmer} />
      <Philosophy />
      <TraditionTechnology />
      <FieldToSweetness field={media.field} harvest={media.harvest} craft={media.craft} sweetness={media.sweetness} />
      <Today products={products} />
      <Credentials />
      <Future m={media.future} />
      <Closing phone={phone} phoneHref={phoneHref} whatsappHref={whatsappHref} email={email} credits={credits} />
    </div>
  );
}

/* ── A hairline down the right edge that fills as the film plays ─────────── */
function Progress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  return (
    <div aria-hidden className="pointer-events-none fixed right-5 top-1/2 z-40 hidden h-40 w-px -translate-y-1/2 mix-blend-difference min-[900px]:block motion-reduce:hidden" style={{ background: "rgba(255,255,255,0.25)" }}>
      <motion.div className="h-full w-full origin-top" style={{ scaleY, background: "#fff" }} />
    </div>
  );
}

/* ── 00 · HERO ───────────────────────────────────────────────────────────── */
function Hero({ m }: { m: ResolvedMedia }) {
  const { still, lite } = useFilm();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-28%"]);
  const copyO = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  // Video only on larger screens, and never for reduced motion: phones get the still.
  const playVideo = m.isVideo && !still;

  return (
    <section ref={ref} aria-labelledby="film-title" className="relative isolate flex min-h-[100svh] items-end overflow-hidden" style={{ background: F.night }}>
      <motion.div className="absolute inset-0" style={{ y: still ? 0 : imgY }}>
        <div className="film-zoom absolute inset-0" style={{ animation: "filmZoom 26s ease-out forwards" }}>
          {playVideo ? (
            <video className="absolute inset-0 h-full w-full object-cover" src={m.src} poster={m.mobileSrc ?? undefined} autoPlay muted loop playsInline preload="metadata" aria-label={m.alt} />
          ) : (
            <Picture src={m.isVideo ? (m.mobileSrc ?? "") : m.src} mobileSrc={m.mobileSrc} alt={m.alt} priority sizes="100vw" position={lite ? "60% center" : "center"} />
          )}
        </div>
      </motion.div>
      {/* The grade: dark at the head for the navigation, darker at the foot for the title. */}
      <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(8,17,12,0.78) 0%, rgba(8,17,12,0.18) 28%, rgba(8,17,12,0.46) 56%, rgba(8,17,12,0.95) 100%)" }} />
      <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "radial-gradient(120% 90% at 50% 40%, rgba(8,17,12,0) 40%, rgba(8,17,12,0.55) 100%)" }} />
      <Grain opacity={0.1} />

      <motion.div className={`${wrap} relative z-10 pb-24 pt-44 sm:pb-16 lg:pb-20`} style={{ y: still ? 0 : copyY, opacity: still ? 1 : copyO }}>
        <Rise delay={0.2} y={14}>
          <div className="flex items-center gap-4">
            <span aria-hidden className="block h-px w-10" style={{ background: F.gold }} />
            <Meta color={F.onDark} style={{ fontSize: 12, textShadow: "0 1px 14px rgba(8,17,12,0.7)" }}>Since 1988 <span style={{ color: F.gold }}>·</span> Mandya, Karnataka</Meta>
          </div>
        </Rise>
        <Lines as="h1" id="film-title" className="mt-6 sm:mt-8" delay={0.35} stagger={0.16} lines={["Some legacies", "are grown."]} style={{ ...T.colossal, color: F.onDark }} lineStyles={[undefined, { fontStyle: "italic", color: F.cream }]} />
        <div className="mt-10 flex items-end justify-between gap-8 sm:mt-14">
          <Rise delay={0.9} y={14}>
            <p className="max-w-[30ch]" style={{ ...T.body, color: F.onDarkMuted, margin: 0 }}>
              The story of VKC Gold Ikshu, told from the cane up.
            </p>
          </Rise>
          <Rise delay={1.1} y={0} className="hidden shrink-0 items-center gap-4 sm:flex">
            <Meta color={F.onDarkMuted}>Scroll</Meta>
            <span aria-hidden className="relative block h-14 w-px overflow-hidden" style={{ background: F.onDarkLine }}>
              <span className="film-cue absolute inset-0 block" style={{ background: F.gold, animation: "filmCue 2.6s cubic-bezier(.65,0,.35,1) infinite" }} />
            </span>
          </Rise>
        </div>
        {m.caption && <Meta className="mt-10 sm:absolute sm:bottom-6 sm:right-14 sm:mt-0" color="rgba(247,244,236,0.38)" style={{ fontSize: 9.5 }}>{m.caption}</Meta>}
      </motion.div>
    </section>
  );
}

/* ── 01 · THE STORY ──────────────────────────────────────────────────────── */
function Story({ m }: { m: ResolvedMedia }) {
  return (
    <section aria-labelledby="story-heading" className="relative" style={{ background: F.cream, color: F.ink }}>
      <Grain opacity={0.05} blend="multiply" />
      <div className={`${wrap} relative z-10 py-24 sm:py-32 lg:py-44`}>
        <div className="grid grid-cols-12 gap-x-6 gap-y-12">
          {/* Historical metadata, set like a film slate. */}
          <div className="col-span-12 lg:col-span-2">
            <Chapter n="01">The story</Chapter>
            <dl className="m-0 mt-10 grid grid-cols-3 gap-4 lg:mt-16 lg:grid-cols-1 lg:gap-0">
              {[["Year", "1988"], ["Place", "Mandya"], ["State", "Karnataka"]].map(([k, v], i) => (
                <Rise key={k} delay={0.15 + i * 0.18} y={16}>
                  <div className="py-4 lg:py-5" style={{ borderTop: `1px solid ${F.onLightLine}` }}>
                    <dt><Meta color={F.onLightMuted} style={{ fontSize: 9.5 }}>{k}</Meta></dt>
                    <dd className="m-0 mt-1.5" style={{ ...T.meta, fontSize: 13, letterSpacing: "0.14em", color: F.ink }}>{v}</dd>
                  </div>
                </Rise>
              ))}
            </dl>
          </div>

          <div className="col-span-12 lg:col-span-10">
            <Lines id="story-heading" lines={["Not just", "a sweetener.", "A legacy."]} style={{ ...T.display, color: F.ink }} lineStyles={[undefined, undefined, { fontStyle: "italic", color: F.brown }]} />
          </div>

          <div className="col-span-12 lg:col-span-5 lg:col-start-3 lg:pt-10">
            <Rise>
              <p style={{ ...T.lede, color: F.ink, margin: 0 }}>
                It began with sugarcane. In 1988, in Mandya, one man set up a crusher — and with it, a way of working.
              </p>
            </Rise>
            <Rise delay={0.12}>
              <div className="mt-8 space-y-5" style={{ ...T.body, color: F.onLightMuted, maxWidth: "54ch" }}>
                <p style={{ margin: 0 }}>Our journey is inspired by the vision of <strong style={{ color: F.ink, fontWeight: 600 }}>Late Shri B Ramachandra</strong>, whose values of discipline, sincerity and purity laid the foundation for our family’s jaggery tradition.</p>
                <p style={{ margin: 0 }}>What began as a legacy rooted in honest effort and agricultural connection continues today through a new generation of leadership.</p>
              </div>
            </Rise>
          </div>

          <div className="col-span-9 col-start-4 sm:col-span-6 sm:col-start-7 lg:col-span-4 lg:col-start-9 lg:-mt-40">
            <Frame src={m.src} mobileSrc={m.mobileSrc} alt={m.alt} ratio="3 / 4" sizes="(max-width: 1024px) 70vw, 30vw" drift={9} />
          </div>

          <div className="col-span-12 lg:col-span-8 lg:col-start-3 lg:pt-16">
            <Rise>
              <blockquote className="m-0 pl-6 sm:pl-10" style={{ borderLeft: `1px solid ${F.gold}` }}>
                <p style={{ ...T.lede, fontStyle: "italic", fontSize: "clamp(1.6rem, 3vw, 2.7rem)", lineHeight: 1.2, color: F.ink, margin: 0 }}>
                  We do not see tradition as something old and static; we see it as a living promise that must stay genuine while growing stronger with time.
                </p>
              </blockquote>
            </Rise>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 02 · 1988 ───────────────────────────────────────────────────────────── */
const Y88_LINES = ["A crusher.", "A family.", "A beginning."];
const Y88_COPY =
  "In 1988, Late Shri B Ramachandra set up a sugarcane crusher in Mandya — M/s Vairamudi Krupa Crusher. It was a proprietorship, a family’s work, and the first chapter of everything that carries the VKC name. It remains the base of the business today.";

function Year1988({ m }: { m: ResolvedMedia }) {
  return (
    <section aria-labelledby="y88-heading" style={{ background: F.night }}>
      <h2 id="y88-heading" className="sr-only">1988 — a crusher, a family, a beginning</h2>
      <div className="hidden min-[900px]:block motion-reduce:!hidden"><Year1988Pinned m={m} /></div>
      <div className="min-[900px]:hidden motion-reduce:!block"><Year1988Still m={m} /></div>
    </section>
  );
}

/* Desktop: a title sequence. The year arrives over the photograph, the three
   statements follow one by one, then the year recedes and the account reads. */
function Year1988Pinned({ m }: { m: ResolvedMedia }) {
  const { ref, progress } = usePinned();
  const imgScale = useTransform(progress, [0, 1], [1.22, 1.02]);
  const imgO = useTransform(progress, [0, 0.14], [0.55, 0.85]);
  const yearO = useTransform(progress, [0.06, 0.26, 0.58, 0.72], [0, 1, 1, 0.13]);
  const yearScale = useTransform(progress, [0.06, 0.5], [1.22, 1]);
  const yearLS = useTransform(progress, [0.06, 0.5], ["0.04em", "-0.055em"]);
  const copyO = useTransform(progress, [0.66, 0.8], [0, 1]);
  const copyY = useTransform(progress, [0.66, 0.8], [36, 0]);
  const l0 = useTransform(progress, [0.3, 0.38], [0, 1]);
  const l1 = useTransform(progress, [0.4, 0.48], [0, 1]);
  const l2 = useTransform(progress, [0.5, 0.58], [0, 1]);
  const ly0 = useTransform(progress, [0.3, 0.38], ["100%", "0%"]);
  const ly1 = useTransform(progress, [0.4, 0.48], ["100%", "0%"]);
  const ly2 = useTransform(progress, [0.5, 0.58], ["100%", "0%"]);
  const lines = [{ o: l0, y: ly0 }, { o: l1, y: ly1 }, { o: l2, y: ly2 }];

  return (
    <div ref={ref} className="relative" style={{ height: "300vh" }}>
      <div className="sticky top-0 flex h-screen items-end overflow-hidden">
        <motion.div aria-hidden className="absolute inset-0" style={{ scale: imgScale, opacity: imgO }}>
          <Picture src={m.src} mobileSrc={m.mobileSrc} alt="" sizes="100vw" />
        </motion.div>
        <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(8,17,12,0.55) 0%, rgba(8,17,12,0.25) 40%, rgba(8,17,12,0.92) 100%)" }} />
        <Grain opacity={0.11} />

        <motion.div aria-hidden className="absolute inset-0 z-[3] flex items-center justify-center" style={{ opacity: yearO, scale: yearScale }}>
          <motion.span style={{ fontFamily: TYPE.serif, fontWeight: 400, fontSize: "clamp(10rem, 36vw, 40rem)", lineHeight: 0.8, color: F.cream, letterSpacing: yearLS }}>1988</motion.span>
        </motion.div>

        <div className={`${wrap} relative z-10 grid grid-cols-12 items-end gap-x-6 pb-16 lg:pb-20`}>
          <div className="col-span-7">
            <Meta color={F.gold}>02 — Mandya, 1988</Meta>
            <div className="mt-6" aria-hidden>
              {Y88_LINES.map((l, i) => (
                <span key={l} className="block overflow-hidden" style={{ paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
                  <motion.span className="block" style={{ ...T.title, color: F.onDark, opacity: lines[i].o, y: lines[i].y, fontStyle: i === 2 ? "italic" : undefined }}>{l}</motion.span>
                </span>
              ))}
            </div>
          </div>
          <motion.div className="col-span-4 col-start-9" style={{ opacity: copyO, y: copyY }}>
            <p style={{ ...T.body, color: "rgba(247,244,236,0.82)", margin: 0 }}>{Y88_COPY}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* Phones and reduced motion: the same scene as a single held frame. */
function Year1988Still({ m }: { m: ResolvedMedia }) {
  return (
    <div className="relative isolate overflow-hidden">
      <div aria-hidden className="absolute inset-0"><Picture src={m.src} mobileSrc={m.mobileSrc} alt="" sizes="100vw" /></div>
      <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(8,17,12,0.72) 0%, rgba(8,17,12,0.5) 35%, rgba(8,17,12,0.95) 78%)" }} />
      <Grain opacity={0.1} />
      <div className={`${wrap} relative z-10 flex min-h-[100svh] flex-col justify-end pb-20 pt-28`}>
        <Meta color={F.gold}>02 — Mandya, 1988</Meta>
        <Lines as="p" lines={["1988"]} className="mt-4" style={{ fontFamily: TYPE.serif, fontSize: "clamp(7.5rem, 40vw, 16rem)", lineHeight: 1, letterSpacing: "-0.055em", color: F.cream }} />
        <Lines as="p" lines={Y88_LINES} className="mt-6" stagger={0.2} style={{ ...T.title, color: F.onDark }} lineStyles={[undefined, undefined, { fontStyle: "italic" }]} />
        <Rise className="mt-8"><p style={{ ...T.body, color: "rgba(247,244,236,0.82)", margin: 0, maxWidth: "46ch" }}>{Y88_COPY}</p></Rise>
      </div>
    </div>
  );
}

/* ── 03 · THE TIMELINE ───────────────────────────────────────────────────── */
function Timeline() {
  const { still } = useFilm();
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 80, damping: 26 });

  return (
    <section aria-labelledby="timeline-heading" className="relative" style={{ background: F.paper, color: F.ink }}>
      <div className={`${wrap} py-24 sm:py-32 lg:py-44`}>
        <div className="grid grid-cols-12 gap-x-6 gap-y-14">
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-40">
              <Chapter n="03">The timeline</Chapter>
              <Lines id="timeline-heading" className="mt-8" lines={["One line,", "still being", "drawn."]} style={{ ...T.title, color: F.ink }} lineStyles={[undefined, undefined, { fontStyle: "italic", color: F.brown }]} />
            </div>
          </div>

          <ol ref={ref} className="relative col-span-12 m-0 list-none p-0 lg:col-span-7 lg:col-start-6">
            {/* The line itself: a hairline, filled in gold as the years pass. */}
            <span aria-hidden className="absolute bottom-0 left-0 top-0 w-px" style={{ background: F.onLightLine }} />
            <motion.span aria-hidden className="absolute bottom-0 left-0 top-0 w-px origin-top" style={{ background: F.gold, scaleY: still ? 1 : fill }} />
            {TIMELINE.map((it, i) => (
              <li key={it.year} className="group relative pl-8 sm:pl-14">
                <span aria-hidden className="absolute left-[-3px] top-[3.35rem] h-[7px] w-[7px] rounded-full transition-colors duration-700 sm:top-[4.4rem]" style={{ background: F.paper, border: `1px solid ${F.brown}` }} />
                <Rise delay={0.05} className="grid grid-cols-1 gap-x-10 gap-y-3 py-10 transition-transform duration-700 ease-out group-hover:translate-x-2 sm:grid-cols-[minmax(0,15rem)_1fr] sm:py-14" style={{ borderTop: i ? `1px solid ${F.onLightLine}` : undefined }}>
                  <div>
                    <div className="transition-colors duration-700 group-hover:text-[#7A4C2D]" style={{ fontFamily: TYPE.serif, fontSize: "clamp(3.2rem, 6.4vw, 6rem)", lineHeight: 0.9, letterSpacing: "-0.04em", fontStyle: /^\d/.test(it.year) ? undefined : "italic" }}>{it.year}</div>
                  </div>
                  <div className="sm:pt-3">
                    <Meta color={it.proposed ? F.brown : F.onLightMuted}>
                      {it.proposed ? <span className="inline-block px-2 py-1" style={{ border: `1px solid ${F.brown}` }}>Proposed · Future vision</span> : it.kicker}
                    </Meta>
                    <h3 className="mt-4" style={{ fontFamily: TYPE.serif, fontWeight: 500, fontSize: "clamp(1.5rem, 2.3vw, 2.1rem)", lineHeight: 1.1, letterSpacing: "-0.01em", color: F.ink, margin: "1rem 0 0" }}>{it.t}</h3>
                    <p className="mt-3" style={{ ...T.body, color: F.onLightMuted, maxWidth: "48ch", margin: "0.75rem 0 0" }}>{it.d}</p>
                  </div>
                </Rise>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ── 04 · THE FOUNDER ────────────────────────────────────────────────────── */
function Founder() {
  return (
    <section aria-labelledby="founder-heading" className="relative" style={{ background: F.forest, color: F.onDark }}>
      <div className="grid min-[900px]:grid-cols-2">
        {/* The portrait holds while the text passes — a documentary two-shot. */}
        <div className="relative min-[900px]:sticky min-[900px]:top-[68px] min-[900px]:h-[calc(100vh-68px)] lg:top-[100px] lg:h-[calc(100vh-100px)]">
          <Frame src="/images/about/founder-portrait.webp" alt="Late Shri B Ramachandra, founder" className="h-[118vw] max-h-[92svh] w-full min-[900px]:h-full min-[900px]:max-h-none" sizes="(max-width: 899px) 100vw, 50vw" position="50% 12%" drift={3} reveal="left" grade="saturate-[.82] contrast-[1.04]" style={{ background: "#1a2a21" }}>
            <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(13,27,20,0.10) 45%, rgba(13,27,20,0.86) 100%)", mixBlendMode: "multiply" }} />
            <Grain opacity={0.12} />
            <figcaption className="absolute bottom-6 left-5 z-10 sm:left-8 lg:bottom-10 lg:left-14">
              <Meta color={F.onDarkMuted} style={{ fontSize: 9.5 }}>Founder</Meta>
              <Meta color={F.onDark} style={{ marginTop: 4 }}>Late Shri B Ramachandra</Meta>
            </figcaption>
          </Frame>
        </div>

        <div className="relative">
          <Grain opacity={0.06} />
          <div className="relative z-10 px-5 py-24 sm:px-8 sm:py-28 lg:px-16 lg:py-44 xl:px-24">
            <Chapter n="04" color={F.gold} line={F.onDarkLine}>The founder</Chapter>
            <Rise className="mt-14"><Meta color={F.onDarkMuted}>The man behind the beginning</Meta></Rise>
            <Lines id="founder-heading" className="mt-5" lines={["Late Shri", "B Ramachandra"]} style={{ ...T.title, fontSize: "clamp(2.1rem, 3.7vw, 4.2rem)", whiteSpace: "nowrap", color: F.onDark }} lineStyles={[{ fontStyle: "italic", color: F.cream }, undefined]} />

            <Rise className="mt-12">
              <p style={{ ...T.lede, color: F.onDark, margin: 0, maxWidth: "30ch" }}>He remains the soul of our journey.</p>
            </Rise>
            <Rise delay={0.1} className="mt-7">
              <p style={{ ...T.body, color: F.onDarkMuted, margin: 0, maxWidth: "50ch" }}>
                His values, work ethic and commitment to purity gave direction not only to a business, but to a family identity built on trust. The crusher he set up in 1988 is where the work began; the way he ran it is what the family kept.
              </p>
            </Rise>

            {/* The four values, set as type and nothing else. */}
            <ol className="m-0 mt-20 list-none p-0 lg:mt-28">
              {VALUES.map((v, i) => (
                <li key={v} className="group flex items-baseline gap-6 py-5 sm:py-6" style={{ borderTop: `1px solid ${F.onDarkLine}`, borderBottom: i === VALUES.length - 1 ? `1px solid ${F.onDarkLine}` : undefined }}>
                  <Meta color={F.gold} className="w-8 shrink-0">0{i + 1}</Meta>
                  <Lines as="p" lines={[v]} delay={i * 0.08} className="transition-transform duration-700 ease-out group-hover:translate-x-3" style={{ fontFamily: TYPE.serif, fontSize: "clamp(2.2rem, 4.4vw, 4.2rem)", lineHeight: 1, letterSpacing: "-0.02em", textTransform: "uppercase", color: F.onDark }} />
                </li>
              ))}
            </ol>

            <Rise className="mt-20 lg:mt-28">
              <blockquote className="m-0">
                <p style={{ fontFamily: TYPE.serif, fontStyle: "italic", fontSize: "clamp(2rem, 3.6vw, 3.4rem)", lineHeight: 1.1, color: F.gold, margin: 0 }}>“The values remain.”</p>
              </blockquote>
            </Rise>
            <Rise className="mt-12"><ArrowLink href="/founder" color={F.onDark}>Discover his legacy</ArrowLink></Rise>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 05 · MANDYA ─────────────────────────────────────────────────────────── */
function Mandya({ m }: { m: ResolvedMedia }) {
  const { still } = useFilm();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1.14, 1]);

  return (
    <section ref={ref} aria-labelledby="mandya-heading" className="relative isolate overflow-hidden" style={{ background: F.night }}>
      <motion.div aria-hidden={!m.alt} className="absolute inset-x-0" style={{ top: "-12%", bottom: "-12%", y: still ? 0 : y, scale: still ? 1 : scale }}>
        <Picture src={m.src} mobileSrc={m.mobileSrc} alt={m.alt} sizes="100vw" />
      </motion.div>
      <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(8,17,12,0.62) 0%, rgba(8,17,12,0.08) 38%, rgba(8,17,12,0.42) 62%, rgba(8,17,12,0.96) 100%)" }} />
      <Grain opacity={0.1} />

      <div className={`${wrap} relative z-10 flex min-h-[120svh] flex-col justify-between pb-20 pt-32 lg:min-h-[135vh] lg:pb-28 lg:pt-44`}>
        {/* Where, exactly — set like a location card. */}
        <div className="flex items-start justify-between gap-8">
          <Chapter n="05" color={F.gold} line={F.onDarkLine}>The land</Chapter>
          <div className="text-right">
            {["Mandya", "Karnataka", "India"].map((l, i) => (
              <Rise key={l} delay={0.2 + i * 0.22} y={12}><Meta color={i === 0 ? F.onDark : F.onDarkMuted} style={{ fontSize: 12.5, letterSpacing: "0.34em", lineHeight: 2.1 }}>{l}</Meta></Rise>
            ))}
            <Rise delay={0.95} y={12}><Meta color={F.gold} style={{ marginTop: 10, fontSize: 10 }}>12.52° N · 76.90° E</Meta></Rise>
          </div>
        </div>

        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-10">
          <div className="col-span-12 lg:col-span-7">
            <Lines id="mandya-heading" lines={["Born from", "Mandya."]} style={{ ...T.colossal, color: F.onDark }} lineStyles={[undefined, { fontStyle: "italic", color: F.cream }]} />
          </div>
          <div className="col-span-12 lg:col-span-4 lg:col-start-9 lg:pb-4">
            <Rise>
              <p style={{ ...T.body, color: "rgba(247,244,236,0.84)", margin: 0 }}>
                Fed by the Kaveri and its canals, Mandya’s fields have grown sugarcane for generations — so much of it that Karnataka calls the district <em>Sakkare Nadu</em>, the land of sugar.
              </p>
            </Rise>
            <Rise delay={0.12}>
              <p className="mt-5" style={{ ...T.body, color: F.onDarkMuted, margin: "1.25rem 0 0" }}>
                Our unit stands in Ballenahalli, Srirangapatna Taluk. The cane does not travel far, and neither have we.
              </p>
            </Rise>
            {m.caption && <Meta className="mt-8" color="rgba(247,244,236,0.4)" style={{ fontSize: 9.5 }}>{m.caption}</Meta>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 06 · THE FARMER ─────────────────────────────────────────────────────── */
function Farmer({ m }: { m: ResolvedMedia }) {
  return (
    <section aria-labelledby="farmer-heading" className="relative overflow-hidden" style={{ background: F.cream, color: F.ink }}>
      <Grain opacity={0.05} blend="multiply" />
      <div className="relative z-10 py-24 sm:py-32 lg:py-44">
        <div className={wrap}><Chapter n="06">The farmer</Chapter></div>

        {/* The heading stands on the left; the photograph runs off the right
            edge and tucks up beside its last lines. */}
        <div className={`${wrap} relative z-10 mt-12 lg:mt-16`}>
          <Lines id="farmer-heading" lines={["Every sweetness", "starts with", "a farmer."]} style={{ ...T.display, color: F.ink }} lineStyles={[undefined, undefined, { fontStyle: "italic", color: F.brown }]} />
        </div>
        <div className="ml-auto mt-10 w-[92%] lg:-mt-[9vw] lg:w-[62%]">
          <Frame src={m.src} mobileSrc={m.mobileSrc} alt={m.alt} ratio="16 / 10" className="max-lg:!aspect-[4/5]" sizes="(max-width: 1024px) 92vw, 62vw" drift={8} reveal="left" />
          {m.caption && <Meta className="mt-3 pr-5 text-right lg:pr-14" color={F.onLightMuted} style={{ fontSize: 9.5 }}>{m.caption}</Meta>}
        </div>

        <div className={`${wrap} mt-16 grid grid-cols-12 gap-x-6 gap-y-14 lg:mt-24`}>
          <div className="col-span-12 lg:col-span-5">
            <Rise>
              <p style={{ ...T.lede, color: F.ink, margin: 0 }}>
                Every product begins in the sugarcane fields of Mandya, with farmers we have worked alongside for decades.
              </p>
            </Rise>
            <Rise delay={0.1}>
              <p className="mt-7" style={{ ...T.body, color: F.onLightMuted, margin: "1.75rem 0 0", maxWidth: "52ch" }}>
                We pay fairly, process without chemicals, and let the cane speak for itself. Sustainability begins at the roots — with farmers — through fair pricing, transparent transactions and access to modern, chemical-free production.
              </p>
            </Rise>
          </div>

          <ul className="col-span-12 m-0 list-none p-0 lg:col-span-6 lg:col-start-7">
            {FARMER_PROMISES.map((p, i) => (
              <Rise key={p.t} delay={i * 0.1}>
                <li className="grid grid-cols-[2.5rem_1fr] gap-x-4 py-7 sm:grid-cols-[2.5rem_14rem_1fr]" style={{ borderTop: `1px solid ${F.onLightLine}`, borderBottom: i === FARMER_PROMISES.length - 1 ? `1px solid ${F.onLightLine}` : undefined }}>
                  <Meta color={F.brown} style={{ paddingTop: 6 }}>0{i + 1}</Meta>
                  <h3 style={{ fontFamily: TYPE.serif, fontWeight: 500, fontSize: "1.6rem", lineHeight: 1.1, color: F.ink, margin: 0 }}>{p.t}</h3>
                  <p className="col-start-2 sm:col-start-3" style={{ ...T.body, fontSize: "0.98rem", color: F.onLightMuted, margin: "0.4rem 0 0" }}>{p.d}</p>
                </li>
              </Rise>
            ))}
          </ul>

          <div className="col-span-12 lg:col-span-9 lg:col-start-3 lg:pt-10">
            <Rise>
              <blockquote className="m-0">
                <p style={{ fontFamily: TYPE.serif, fontStyle: "italic", fontSize: "clamp(1.7rem, 3.2vw, 3rem)", lineHeight: 1.18, color: F.ink, margin: 0 }}>
                  “When you choose VKC Gold Ikshu, you are not just choosing sweetness — you are supporting the farmer who grew it.”
                </p>
              </blockquote>
            </Rise>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 07 · THE PHILOSOPHY ─────────────────────────────────────────────────── */
const CREED = ["No shortcuts.", "No compromise.", "Purity first."];

function Philosophy() {
  return (
    <section aria-labelledby="creed-heading" style={{ background: F.night, color: F.onDark }}>
      <h2 id="creed-heading" className="sr-only">Our philosophy: no shortcuts, no compromise, purity first</h2>
      <div className="hidden min-[900px]:block motion-reduce:!hidden"><PhilosophyPinned /></div>
      <div className="min-[900px]:hidden motion-reduce:!block"><PhilosophyStill /></div>
    </section>
  );
}

/* Desktop: one statement holds the screen at a time. */
function PhilosophyPinned() {
  const { ref, progress } = usePinned();
  const a = useBeat(progress, -0.02, -0.01, 0.27, 0.35);
  const b = useBeat(progress, 0.36, 0.46, 0.6, 0.68);
  const c = useBeat(progress, 0.69, 0.8, 1, 1.01);
  const beats = [a, b, c];
  const rule = useTransform(progress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className="relative" style={{ height: "380vh" }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <Grain opacity={0.09} />
        <div className={`${wrap} relative z-10`}>
          <div className="absolute left-5 top-[-34vh] sm:left-8 lg:left-14"><Meta color={F.gold}>07 — The philosophy</Meta></div>
          <div aria-hidden className="relative" style={{ height: "1.1em", fontSize: "clamp(3.4rem, 11vw, 12rem)" }}>
            {CREED.map((l, i) => (
              <motion.p key={l} className="absolute inset-x-0 top-0" style={{ ...T.colossal, fontSize: "1em", margin: 0, color: i === 2 ? F.gold : F.onDark, fontStyle: i === 2 ? "italic" : undefined, ...beats[i] }}>{l}</motion.p>
            ))}
          </div>
          <div className="absolute inset-x-5 bottom-[-34vh] flex items-center gap-5 sm:inset-x-8 lg:inset-x-14">
            <Meta color={F.onDarkMuted}>I</Meta>
            <span className="relative block h-px flex-1" style={{ background: F.onDarkLine }}>
              <motion.span className="absolute inset-0 block origin-left" style={{ background: F.gold, scaleX: rule }} />
            </span>
            <Meta color={F.onDarkMuted}>III</Meta>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhilosophyStill() {
  return (
    <div className="relative isolate">
      <Grain opacity={0.09} />
      <div className={`${wrap} relative z-10 py-28`}>
        <Meta color={F.gold}>07 — The philosophy</Meta>
        {CREED.map((l, i) => (
          <div key={l} className="flex min-h-[46svh] items-center" style={{ borderBottom: i < 2 ? `1px solid ${F.onDarkLine}` : undefined }}>
            <Lines as="p" lines={l.split(" ")} stagger={0.18} style={{ ...T.colossal, fontSize: "clamp(3rem, 13.4vw, 8rem)", color: i === 2 ? F.gold : F.onDark, fontStyle: i === 2 ? "italic" : undefined }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 08 · TRADITION × TECHNOLOGY ─────────────────────────────────────────── */
function TraditionTechnology() {
  const { reduced } = useFilm();
  const side = (dir: 1 | -1) => (reduced ? false : { opacity: 0, x: 60 * dir });
  return (
    <section aria-labelledby="tt-heading" className="relative">
      <h2 id="tt-heading" className="sr-only">Tradition and technology</h2>
      <div className="relative grid min-[900px]:min-h-screen min-[900px]:grid-cols-2">
        {/* Tradition: warm, serif, handwritten in spirit. */}
        <div className="relative flex items-center overflow-hidden" style={{ background: F.cream, color: F.ink }}>
          <Grain opacity={0.06} blend="multiply" />
          <motion.div className="relative z-10 w-full px-5 py-24 sm:px-8 lg:px-14 lg:py-32 min-[900px]:pr-24" initial={side(-1)} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1.4, ease: EASE }}>
            <Meta color={F.brown}>08 — What we keep</Meta>
            <p className="mt-8" style={{ ...T.display, fontSize: "clamp(2.6rem, 5.6vw, 5.6rem)", fontStyle: "italic", color: F.ink, margin: "2rem 0 0" }}>Tradition</p>
            <ul className="m-0 mt-12 list-none p-0">
              {["Family knowledge", "Agricultural roots", "Traditional expertise", "Heritage"].map((t) => (
                <li key={t} className="py-4" style={{ borderTop: `1px solid ${F.onLightLine}`, fontFamily: TYPE.serif, fontSize: "clamp(1.4rem, 2.1vw, 1.9rem)", lineHeight: 1.2 }}>{t}</li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Technology: cool, mono, measured. */}
        <div className="relative flex items-center overflow-hidden" style={{ background: F.forest, color: F.onDark }}>
          <Grain opacity={0.07} />
          <motion.div className="relative z-10 w-full px-5 py-24 sm:px-8 lg:px-14 lg:py-32 min-[900px]:pl-24" initial={side(1)} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1.4, ease: EASE }}>
            <Meta color={F.gold}>What we build</Meta>
            <p className="mt-8" style={{ ...T.display, fontSize: "clamp(2.6rem, 5.6vw, 5.6rem)", color: F.onDark, margin: "2rem 0 0" }}>Technology</p>
            <ul className="m-0 mt-12 list-none p-0">
              {["Modern processing", "Quality systems", "Efficiency", "Future-ready manufacturing"].map((t) => (
                <li key={t} className="py-[1.35rem]" style={{ borderTop: `1px solid ${F.onDarkLine}`, ...T.meta, fontSize: 13, letterSpacing: "0.18em", color: F.onDark }}>{t}</li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* The seam: a gold hairline draws down it and the × settles on top. */}
        <motion.span aria-hidden className="absolute left-1/2 top-0 hidden h-full w-px origin-top min-[900px]:block" style={{ background: F.gold, opacity: 0.55 }} initial={reduced ? false : { scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 2, ease: EASE }} />
        <motion.div aria-hidden className="tt-seal absolute left-1/2 top-1/2 z-20 flex h-24 w-24 items-center justify-center rounded-full sm:h-28 sm:w-28" style={{ x: "-50%", y: "-50%", border: `1px solid ${F.gold}` }}
          initial={reduced ? false : { opacity: 0, scale: 0.6, rotate: -45 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 1.6, ease: EASE, delay: 0.3 }}>
          <span style={{ fontFamily: TYPE.serif, fontSize: "4rem", lineHeight: 1, color: F.gold, transform: "translateY(-4%)" }}>×</span>
        </motion.div>
      </div>

      <div className="relative overflow-hidden" style={{ background: F.forest, borderTop: `1px solid ${F.onDarkLine}` }}>
        <div className={`${wrap} py-16 text-center lg:py-20`}>
          <Rise>
            <p className="mx-auto text-center" style={{ ...T.lede, fontStyle: "italic", color: F.onDark, margin: "0 auto", maxWidth: "34ch", textAlign: "center" }}>
              Modern, energy-efficient processing — true to our ancestral values.
            </p>
          </Rise>
        </div>
      </div>
    </section>
  );
}

/* ── 09 · FROM FIELD TO SWEETNESS ────────────────────────────────────────── */
function Numeral({ n, color }: { n: string; color: string }) {
  return <span aria-hidden className="block select-none" style={{ fontFamily: TYPE.serif, fontStyle: "italic", fontSize: "clamp(4.5rem, 9vw, 9rem)", lineHeight: 0.8, letterSpacing: "-0.04em", color: "transparent", WebkitTextStroke: `1px ${color}` }}>{n}</span>;
}

function ChapterText({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <Rise><Numeral n={n} color={F.brown} /></Rise>
      <Lines as="h3" className="mt-8 lg:mt-10" lines={[title]} style={{ ...T.title, fontSize: "clamp(2rem, 3.6vw, 3.5rem)", color: F.ink }} />
      <Rise delay={0.1}><p className="mt-5" style={{ ...T.body, color: F.onLightMuted, margin: "1.25rem 0 0", maxWidth: "40ch" }}>{children}</p></Rise>
    </div>
  );
}

function FieldToSweetness({ field, harvest, craft, sweetness }: { field: ResolvedMedia; harvest: ResolvedMedia; craft: ResolvedMedia; sweetness: ResolvedMedia }) {
  return (
    <section aria-labelledby="fts-heading" className="relative overflow-hidden" style={{ background: F.paper, color: F.ink }}>
      <div className="py-24 sm:py-32 lg:py-44">
        <div className={`${wrap} grid grid-cols-12 gap-x-6`}>
          <div className="col-span-12 lg:col-span-8">
            <Chapter n="09">The making</Chapter>
            <Lines id="fts-heading" className="mt-8" lines={["From field", "to sweetness."]} style={{ ...T.display, color: F.ink }} lineStyles={[undefined, { fontStyle: "italic", color: F.brown }]} />
          </div>
        </div>

        {/* 01 — wide frame left, text low on the right. */}
        <div className={`${wrap} mt-20 grid grid-cols-12 items-end gap-x-6 gap-y-10 lg:mt-28`}>
          <div className="col-span-12 max-lg:-mx-5 max-sm:w-[calc(100%+2.5rem)] sm:max-lg:-mx-8 sm:max-lg:w-[calc(100%+4rem)] lg:col-span-8">
            <Frame src={field.src} mobileSrc={field.mobileSrc} alt={field.alt} ratio="16 / 10" sizes="(max-width: 1024px) 100vw, 62vw" />
            {field.caption && <Meta className="mt-3 max-lg:px-5" color={F.onLightMuted} style={{ fontSize: 9.5 }}>{field.caption}</Meta>}
          </div>
          <div className="col-span-12 lg:col-span-4 lg:pb-10 lg:pl-8">
            <ChapterText n="01" title="The field">It starts in the ground. Mandya’s soil, the Kaveri’s water, and cane grown by farmers who know both.</ChapterText>
          </div>
        </div>

        {/* 02 — tall frame right, pulled up into the scene above. */}
        <div className={`${wrap} mt-24 grid grid-cols-12 items-center gap-x-6 gap-y-10 lg:mt-10`}>
          <div className="order-2 col-span-12 lg:order-1 lg:col-span-4 lg:col-start-2">
            <ChapterText n="02" title="The harvest">Mature cane is cut and carried to the crusher. The shorter that journey, the truer the sweetness.</ChapterText>
          </div>
          <div className="order-1 col-span-10 col-start-3 lg:order-2 lg:col-span-5 lg:col-start-8">
            <Frame src={harvest.src} mobileSrc={harvest.mobileSrc} alt={harvest.alt} ratio="4 / 5" sizes="(max-width: 1024px) 82vw, 40vw" drift={10} />
          </div>
        </div>

        {/* 03 — full bleed, the text hanging beneath on the right. */}
        <div className="mt-24 lg:mt-40">
          <div className="lg:ml-[12%]">
            <Frame src={craft.src} mobileSrc={craft.mobileSrc} alt={craft.alt} className="h-[78vw] max-h-[82vh] w-full lg:h-[40vw]" sizes="(max-width: 1024px) 100vw, 88vw" drift={9} position="50% 40%" />
          </div>
          <div className={`${wrap} mt-10 grid grid-cols-12 gap-x-6 lg:mt-16`}>
            <div className="col-span-12 lg:col-span-5 lg:col-start-7">
              <ChapterText n="03" title="The craft">The juice is boiled down and set, the way it has always been done — chemical-free, 100% natural, with nothing artificial added from cane to pack.</ChapterText>
            </div>
          </div>
        </div>

        {/* 04 — the products themselves, offset right. */}
        <div className={`${wrap} mt-24 grid grid-cols-12 items-end gap-x-6 gap-y-10 lg:mt-36`}>
          <div className="order-2 col-span-12 lg:order-1 lg:col-span-4 lg:pb-8">
            <ChapterText n="04" title="The sweetness">Traditional jaggery, jaggery syrup, jaggery chocolate, and the gift and combo boxes — what leaves Mandya with our name on it.</ChapterText>
            <Rise className="mt-8"><ArrowLink href="/shop">See the collection</ArrowLink></Rise>
          </div>
          {sweetness.src && (
            <div className="order-1 col-span-12 lg:order-2 lg:col-span-7 lg:col-start-6">
              <Frame src={sweetness.src} mobileSrc={sweetness.mobileSrc} alt={sweetness.alt} ratio="16 / 9" sizes="(max-width: 1024px) 100vw, 56vw" reveal="left" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── 10 · VKC TODAY ──────────────────────────────────────────────────────── */
function Today({ products }: { products: AboutProduct[] }) {
  return (
    <section aria-labelledby="today-heading" className="relative overflow-hidden" style={{ background: F.cream, color: F.ink }}>
      <Grain opacity={0.05} blend="multiply" />
      <div className="relative z-10 py-24 sm:py-32 lg:py-44">
        <div className={`${wrap} grid grid-cols-12 gap-x-6 gap-y-12`}>
          <div className="col-span-12"><Chapter n="10">VKC today</Chapter></div>
          <div className="col-span-12 lg:col-span-9">
            <Lines id="today-heading" lines={["A family legacy.", "A modern chapter."]} style={{ ...T.display, color: F.ink }} lineStyles={[undefined, { fontStyle: "italic", color: F.brown }]} />
          </div>
          <div className="col-span-12 lg:col-span-5 lg:col-start-2">
            <Rise>
              <p style={{ ...T.lede, color: F.ink, margin: 0 }}>
                Today, Naveenchandra B R carries this legacy forward as Managing Director — with a clear focus on quality, compliance and long-term brand building.
              </p>
            </Rise>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:col-start-8">
            <Rise delay={0.1}>
              <p style={{ ...T.body, color: F.onLightMuted, margin: 0 }}>
                The aim is simple: preserve the trust earned through values, while building a future-ready business in natural sweeteners and jaggery-based products. In December 2025 the family incorporated VKC Jaggery &amp; Beverages Private Limited for that next phase; M/s Vairamudi Krupa Crusher remains its base.
              </p>
            </Rise>
            <Rise delay={0.2} className="mt-8"><ArrowLink href="/leadership">Meet the leadership</ArrowLink></Rise>
          </div>
        </div>

        {/* The range, as a reel you pull sideways. */}
        {products.length > 0 && (
          <div className="mt-20 lg:mt-28">
            <div className={`${wrap} flex items-end justify-between`}>
              <Meta color={F.onLightMuted}>The range · {String(products.length).padStart(2, "0")}</Meta>
              <Meta color={F.onLightMuted} className="hidden sm:block">Drag →</Meta>
            </div>
            <div className="no-bar mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:gap-7 sm:px-8 lg:px-14" style={{ scrollPaddingLeft: "1.25rem" }} tabIndex={0} role="list" aria-label="VKC Gold Ikshu products">
              {products.map((p, i) => (
                <Link key={p.slug} role="listitem" href={`/shop/${p.slug}`} className="group block shrink-0 snap-start" style={{ width: "clamp(230px, 25vw, 380px)", marginTop: i % 2 ? "clamp(1.5rem, 4vw, 4.5rem)" : 0 }}>
                  <div className="relative overflow-hidden" style={{ aspectRatio: "4 / 5", background: "#E4DAC5" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.06]" />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <Meta color={F.onLightMuted} style={{ fontSize: 9.5 }}>{String(i + 1).padStart(2, "0")}{p.category ? ` · ${p.category}` : ""}</Meta>
                    <span aria-hidden className="translate-x-[-6px] opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" style={{ color: F.brown }}>→</span>
                  </div>
                  <div className="mt-1.5" style={{ fontFamily: TYPE.serif, fontSize: "1.45rem", lineHeight: 1.15, color: F.ink }}>{p.name}</div>
                </Link>
              ))}
              <div aria-hidden className="w-1 shrink-0" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── 11 · CREDENTIALS ────────────────────────────────────────────────────── */
function Credentials() {
  return (
    <section aria-labelledby="cred-heading" style={{ background: F.paper, color: F.ink, borderTop: `1px solid ${F.onLightLine}`, borderBottom: `1px solid ${F.onLightLine}` }}>
      <div className={`${wrap} py-14 lg:py-16`}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <h2 id="cred-heading" className="shrink-0" style={{ ...T.meta, color: F.brown, margin: 0 }}>11 — On record</h2>
          <Rise className="flex-1">
            <ul className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-3 p-0 lg:justify-center">
              {CREDENTIALS.map((c, i) => (
                <li key={c} className="flex items-center gap-5" style={{ ...T.meta, fontSize: 11.5, color: F.ink }}>
                  {i > 0 && <span aria-hidden style={{ color: F.gold }}>·</span>}{c}
                </li>
              ))}
            </ul>
          </Rise>
          <ArrowLink href="/credentials" className="shrink-0">View credentials</ArrowLink>
        </div>
        <Meta className="mt-8 lg:text-center" color={F.onLightMuted} style={{ fontSize: 9.5 }}>FSSAI licence — in process. Details and reference numbers are on the credentials page.</Meta>
      </div>
    </section>
  );
}

/* ── 12 · THE FUTURE ─────────────────────────────────────────────────────── */
function Future({ m }: { m: ResolvedMedia }) {
  const { reduced } = useFilm();
  const stops = [
    { k: "1988", d: "A crusher in Mandya" },
    { k: "Today", d: "VKC Gold Ikshu" },
    { k: "Tomorrow", d: "Proposed processing unit", gold: true },
  ];
  return (
    <section aria-labelledby="future-heading" className="relative isolate overflow-hidden" style={{ background: F.forest, color: F.onDark }}>
      {m.src && <div aria-hidden className="absolute inset-0 opacity-25"><Picture src={m.src} mobileSrc={m.mobileSrc} alt="" sizes="100vw" /></div>}
      <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, #0D1B14 0%, rgba(13,27,20,0.72) 45%, #0D1B14 100%)" }} />
      <Grain opacity={0.1} />

      <div className={`${wrap} relative z-10 flex min-h-[100svh] flex-col justify-center py-28 lg:py-40`}>
        <Chapter n="12" color={F.gold} line={F.onDarkLine}>The future</Chapter>
        <Lines id="future-heading" className="mt-10" lines={["Built for", "tomorrow."]} style={{ ...T.colossal, color: F.onDark }} lineStyles={[undefined, { fontStyle: "italic", color: F.gold }]} />

        {/* 1988 → today → tomorrow, on one drawn line. */}
        <div className="relative mt-20 lg:mt-28">
          <motion.span aria-hidden className="absolute left-0 right-0 top-[5px] block h-px origin-left max-sm:hidden" style={{ background: F.onDarkLine }} initial={reduced ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 2.4, ease: EASE }} />
          <ol className="m-0 grid list-none gap-y-8 p-0 sm:grid-cols-3">
            {stops.map((s, i) => (
              <Rise key={s.k} delay={0.3 + i * 0.35}>
                <li className="relative max-sm:border-l max-sm:pl-6 sm:pr-8" style={{ borderColor: F.onDarkLine }}>
                  <span aria-hidden className="absolute left-0 top-0 block h-[11px] w-[11px] rounded-full max-sm:left-[-6px]" style={{ background: s.gold ? F.gold : F.forest, border: `1px solid ${s.gold ? F.gold : F.onDarkMuted}` }} />
                  <div className="sm:pt-10" style={{ fontFamily: TYPE.serif, fontSize: "clamp(2rem, 3.6vw, 3.4rem)", lineHeight: 1, fontStyle: s.gold ? "italic" : undefined, color: s.gold ? F.gold : F.onDark }}>{s.k}</div>
                  <Meta className="mt-3" color={F.onDarkMuted}>{s.d}</Meta>
                </li>
              </Rise>
            ))}
          </ol>
        </div>

        <div className="mt-20 grid grid-cols-12 gap-x-6 gap-y-12 lg:mt-28">
          <div className="col-span-12 lg:col-span-6">
            <Rise><Meta color={F.gold}>Our vision</Meta></Rise>
            <Rise delay={0.1}>
              <p className="mt-5" style={{ ...T.lede, color: F.onDark, margin: "1.25rem 0 0" }}>
                To make VKC Gold Ikshu a trusted global brand representing Mandya’s heritage of purity, health, and sweetness.
              </p>
            </Rise>
          </div>
          <div className="col-span-12 lg:col-span-5 lg:col-start-8">
            <Rise delay={0.15}>
              <span className="inline-block px-2.5 py-1.5" style={{ ...T.meta, fontSize: 10, color: F.gold, border: `1px solid ${F.gold}` }}>Proposed · Future vision</span>
              <p className="mt-5" style={{ ...T.body, color: "rgba(247,244,236,0.84)", margin: "1.25rem 0 0" }}>
                A 50 TCD fully automatic, thermic-fluid-based jaggery and cane-juice processing unit. It is a plan, not yet a plant — the next step in technology upgradation, and the reason the company was given a new structure.
              </p>
            </Rise>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── THE CLOSING SHOT ────────────────────────────────────────────────────── */
function Closing({ phone, phoneHref, whatsappHref, email, credits }: {
  phone: string; phoneHref: string; whatsappHref: string; email: string; credits: { author: string; licence: string; source: string }[];
}) {
  return (
    <section aria-labelledby="closing-heading" className="relative" style={{ background: F.cream, color: F.ink }}>
      <Grain opacity={0.05} blend="multiply" />
      <div className={`${wrap} relative z-10 flex min-h-[100svh] flex-col justify-between py-24 lg:py-32`}>
        <Meta color={F.brown}>VKC Gold Ikshu · Since 1988</Meta>

        <div className="py-16">
          <Lines id="closing-heading" lines={["Rooted in", "legacy."]} stagger={0.2} style={{ ...T.colossal, fontSize: "clamp(3.6rem, 15.2vw, 15rem)", color: F.ink }} lineStyles={[undefined, { fontStyle: "italic", color: F.brown }]} />
          <div className="mt-12 lg:mt-16">
            <Rise delay={0.3}><Meta color={F.ink} style={{ fontSize: 13, letterSpacing: "0.3em" }}>Led with purpose.</Meta></Rise>
            <Rise delay={0.5}><Meta color={F.ink} style={{ fontSize: 13, letterSpacing: "0.3em", marginTop: 10 }}>Built for tomorrow.</Meta></Rise>
          </div>
          <Rise delay={0.75} className="mt-14 lg:mt-20">
            <Link href="/shop" className="group inline-flex items-center gap-6 py-5 pl-8 pr-7 transition-colors duration-700" style={{ background: F.forest, color: F.onDark }}>
              <span style={{ ...T.meta, fontSize: 12 }}>Explore the collection</span>
              <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-700 ease-out group-hover:translate-x-2" style={{ border: `1px solid ${F.gold}`, color: F.gold }}>→</span>
            </Link>
          </Rise>
        </div>

        <div>
          <div className="flex flex-wrap gap-x-10 gap-y-3 pt-6" style={{ borderTop: `1px solid ${F.onLightLine}`, ...T.meta, fontSize: 10.5, color: F.onLightMuted }}>
            <a href={phoneHref} className="transition-colors duration-500 hover:text-[#16120C]">{phone}</a>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="transition-colors duration-500 hover:text-[#16120C]">WhatsApp</a>
            <a href={`mailto:${email}`} className="transition-colors duration-500 hover:text-[#16120C]" style={{ textTransform: "none", letterSpacing: "0.06em" }}>{email}</a>
            <Link href="/contact" className="transition-colors duration-500 hover:text-[#16120C]">Contact</Link>
          </div>
          {credits.length > 0 && (
            <p className="mt-6" style={{ fontFamily: TYPE.sans, fontSize: 10.5, lineHeight: 1.6, color: "rgba(22,18,12,0.45)", margin: "1.5rem 0 0", maxWidth: "110ch" }}>
              Landscape photography on this page:{" "}
              {credits.map((c, i) => (
                <span key={c.author}>{i > 0 && ", "}<a href={c.source} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2">{c.author}</a> ({c.licence})</span>
              ))}
              , via Wikimedia Commons; colour-graded and cropped.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
