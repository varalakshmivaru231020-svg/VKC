"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Atmosphere, C, Eyebrow, Reveal, SectionHeading, Words } from "@/components/about/heritage";

/**
 * Leadership — who is carrying the legacy forward. A heritage-brand editorial
 * rather than a team grid: a cinematic hero, the Managing Director as the
 * featured profile, the legacy passed hand to hand, two large portrait cards,
 * the values the leadership stands on, a heritage → future split, and a
 * closing line. The founder's story lives on /founder and the company story
 * on /about; nothing here repeats them.
 *
 * Every photograph is real. The hero and the two split-screen images are
 * admin banner slots; until they are uploaded, typographic panels stand in.
 */

const PEOPLE = {
  founder: { name: "Late Shri B Ramachandra", role: "Founder", photo: "/images/team/ramachandra-b.webp" },
  md: { name: "Naveenchandra B R", role: "Managing Director", photo: "/images/team/naveenchandra-b-r.webp" },
  director: { name: "Abhishek B R", role: "Director", photo: "/images/team/abhishek-b-r.webp", bio: "Contributes to the growth of the business with dedication, energy and a progressive approach — supporting the family legacy with commitment and operational focus." },
  promoter: { name: "Mrs. Pushpalatha", role: "Promoter Director", photo: "/images/team/pushpalatha.webp", bio: "A pillar of strength in our family journey, standing with unwavering support through every challenge and preserving the unity, resilience and values behind our legacy." },
};

const MD_PROFILE =
  "Naveenchandra B R now leads the VKC legacy forward with a clear commitment to purity, trust and long-term growth. Carrying the values established by Late Shri B Ramachandra, he represents the next chapter of the business with a practical, disciplined and forward-looking approach. His leadership is focused on preserving what matters most — credibility, quality and relationships — while building a stronger and more structured future for the brand.";

/* The values the leadership stands on, with what each means in practice. */
const VALUES = [
  { w: "Discipline", d: "The standard set in 1988 and kept since: a practical, disciplined approach to every decision, from the field to the finished pack." },
  { w: "Purity", d: "Chemical-free jaggery with nothing artificial added — the product, and the principle behind it." },
  { w: "Trust", d: "Credibility, quality and relationships come first: with the farmers who grow the cane, the customers who buy from us, and the family itself." },
  { w: "Responsibility", d: "Formal registrations, quality awareness and ongoing learning in food safety and compliance — loyal to the roots, unafraid to modernise where needed." },
];

/* A photograph on a quiet mount, anchored to the top so full-length portraits
   keep the face and lose only hem and shoes to the frame. */
function Photo({ src, alt, ratio = "3 / 4", priority = false, sizes = "(max-width: 1024px) 90vw, 45vw", className = "" }: { src: string; alt: string; ratio?: string; priority?: boolean; sizes?: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: ratio, background: C.cream }}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover object-top" />
    </div>
  );
}

/* Supporting leadership: large photography, the name always at the foot; on
   hover the photo eases in, a dark gradient rises and the role and a line
   about them fade up. */
function PortraitCard({ name, role, photo, bio, index }: { name: string; role: string; photo: string; bio: string; index: number }) {
  return (
    <Reveal delay={index * 0.1}>
      <article className="group relative overflow-hidden rounded-lg" style={{ aspectRatio: "3 / 4", background: C.cream, border: `1px solid ${C.parchment}` }} aria-label={`${name}, ${role}`}>
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <Image src={photo} alt={name} fill sizes="(max-width: 640px) 90vw, 40vw" className="object-cover object-top" />
        </div>
        {/* Foot gradient: light enough at rest to leave the portrait alone,
            deeper on hover so the description reads. */}
        <div aria-hidden className="absolute inset-0 transition-opacity duration-500" style={{ background: "linear-gradient(180deg, rgba(27,14,5,0) 45%, rgba(27,14,5,0.72) 100%)" }} />
        <div aria-hidden className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "linear-gradient(180deg, rgba(27,14,5,0) 25%, rgba(27,14,5,0.88) 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
          <div className="font-heading" style={{ fontSize: "clamp(1.5rem,2.4vw,2rem)", lineHeight: 1.1, color: C.ivory }}>{name}</div>
          <div className="font-body mt-1.5 uppercase" style={{ fontSize: 10.5, letterSpacing: "0.18em", color: C.jaggeryLite }}>{role}</div>
          <div className="overflow-hidden max-h-0 opacity-0 transition-all duration-500 ease-out group-hover:max-h-56 group-hover:opacity-100 group-focus-within:max-h-56 group-focus-within:opacity-100">
            <p className="font-body pt-3" style={{ fontSize: 14, lineHeight: 1.65, color: "rgba(255,251,244,0.86)" }}>{bio}</p>
            <span aria-hidden className="mt-3 inline-flex items-center gap-2 font-body font-semibold uppercase" style={{ fontSize: 10.5, letterSpacing: "0.16em", color: C.jaggeryLite }}>
              The family legacy <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

/* The legacy, hand to hand: three stops on a gold line that draws itself as
   the section scrolls into view. Roles and eras only — the confirmed
   relationships, not assumed generations. */
function Handover() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 55%"] });
  const line = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const stops = [
    { era: "1988", ...PEOPLE.founder, note: "Sets up the sugarcane crusher in Mandya that the business still stands on." },
    { era: "Today", ...PEOPLE.md, note: "Leads the proprietorship and the private limited company with a focus on continuity, growth and modernisation." },
    { era: "Next chapter", ...PEOPLE.director, note: "Brings dedication, energy and a progressive approach to the growth of the business." },
  ];
  return (
    <div ref={ref} className="relative mt-14">
      {/* Desktop: a horizontal rail through the three portraits. Mobile: vertical. */}
      <div aria-hidden className="hidden md:block absolute left-0 right-0" style={{ top: 92, height: 1, background: `${C.parchment}` }} />
      <motion.div aria-hidden className="hidden md:block absolute left-0 right-0 origin-left" style={{ top: 92, height: 1, background: C.jaggery, scaleX: reduced ? 1 : line }} />
      <ol className="grid md:grid-cols-3 gap-10 md:gap-8 list-none m-0 p-0">
        {stops.map((s, i) => (
          <Reveal key={s.era} delay={i * 0.12}>
            <li className="relative">
              <div className="flex items-center gap-4">
                <span className="grid place-items-center h-[72px] w-[72px] shrink-0 font-heading" style={{ fontSize: 13, background: C.ivory, border: `1.5px solid ${C.jaggery}`, color: C.jaggeryDark, letterSpacing: "0.02em" }}>{s.era}</span>
                <div className="relative w-[84px] shrink-0 overflow-hidden" style={{ aspectRatio: "3 / 4", background: C.cream, border: `1px solid ${C.parchment}` }}>
                  <Image src={s.photo} alt={s.name} fill sizes="84px" className="object-cover object-top" />
                </div>
              </div>
              <div className="mt-6 font-heading" style={{ fontSize: 24, lineHeight: 1.1, color: C.ink }}>{s.name}</div>
              <div className="font-body mt-1.5 uppercase" style={{ fontSize: 10.5, letterSpacing: "0.18em", color: C.jaggeryDark }}>{s.role}</div>
              <p className="font-body mt-3" style={{ fontSize: 14.5, lineHeight: 1.65, color: C.ink2, maxWidth: 320 }}>{s.note}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

/* Four words. Each row lights up — and its meaning slides in — while it is
   the row in view, and dims again as the reader moves on, so the page reads
   one value at a time without any scroll-jacking. */
function ValueRow({ index, word, meaning }: { index: number; word: string; meaning: string }) {
  const ref = useRef<HTMLLIElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.6, margin: "-10% 0px -10% 0px" });
  const on = reduced || inView;
  return (
    <li ref={ref} className="grid lg:grid-cols-12 gap-4 lg:gap-10 items-start py-8 sm:py-10" style={{ borderTop: "1px solid rgba(255,214,92,0.16)" }}>
      <div className="lg:col-span-5 flex items-baseline gap-5 transition-colors duration-500" style={{ color: on ? C.ivory : "rgba(255,251,244,0.3)" }}>
        <span className="font-body tabular-nums" style={{ fontSize: 12, letterSpacing: "0.16em", color: on ? C.sage : "rgba(255,251,244,0.3)" }}>0{index + 1}</span>
        <span className="font-heading uppercase" style={{ fontSize: "clamp(2rem,4.6vw,4rem)", lineHeight: 1, letterSpacing: "-0.02em" }}>{word}</span>
      </div>
      <motion.p className="lg:col-span-7 font-body m-0 lg:pt-3" initial={false} animate={{ opacity: on ? 1 : 0.35, x: on || reduced ? 0 : 14 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ fontSize: "clamp(1rem,1.35vw,1.25rem)", lineHeight: 1.7, color: "rgba(255,251,244,0.84)", maxWidth: 560 }}>
        {meaning}
      </motion.p>
    </li>
  );
}

function ValuesList() {
  return (
    <ol className="list-none m-0 p-0 mt-4" style={{ borderBottom: "1px solid rgba(255,214,92,0.16)" }}>
      {VALUES.map((v, i) => <ValueRow key={v.w} index={i} word={v.w} meaning={v.d} />)}
    </ol>
  );
}

/* One half of the Heritage → Future split: a real photograph when the admin
   has uploaded one, otherwise a typographic panel with the facts. */
function SplitPanel({ image, dark, label, title, facts }: { image: string | null; dark: boolean; label: string; title: string; facts: string[] }) {
  return (
    <div className="relative overflow-hidden flex items-end" style={{ background: dark ? C.bark : C.cream, minHeight: "clamp(420px, 42vw, 600px)" }}>
      {image ? (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(27,14,5,0.05) 30%, rgba(27,14,5,0.85) 100%)" }} />
        </>
      ) : (
        dark && <Atmosphere glow={false} opacity={0.1} />
      )}
      <div className="relative p-8 sm:p-12">
        <Eyebrow color={image || dark ? C.jaggeryLite : C.jaggeryDark}>{label}</Eyebrow>
        <h3 className="font-heading mt-4" style={{ fontSize: "clamp(1.8rem,3.2vw,2.8rem)", lineHeight: 1.08, letterSpacing: "-0.02em", color: image || dark ? C.ivory : C.ink }}>{title}</h3>
        <ul className="mt-5 space-y-2 list-none m-0 p-0 font-body" style={{ fontSize: 14.5, lineHeight: 1.6, color: image || dark ? "rgba(255,251,244,0.8)" : C.ink2 }}>
          {facts.map((f) => (
            <li key={f} className="flex gap-3"><span aria-hidden className="mt-[0.7em] h-px w-4 shrink-0" style={{ background: C.jaggery }} />{f}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function LeadershipExperience({ bannerImage = null, bannerAlt = "", heritageImage = null, futureImage = null }: {
  bannerImage?: string | null; bannerAlt?: string; heritageImage?: string | null; futureImage?: string | null;
}) {
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "18%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 60]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.25]);

  return (
    <div className="vkc-about" style={{ background: C.ivory }}>
      <style dangerouslySetInnerHTML={{ __html:
        ".marketing-layout .vkc-about p{text-align:left;hyphens:none;text-justify:auto}" +
        ".marketing-layout .vkc-about .text-center p{text-align:center}"
      }} />

      {/* ── 1 · CINEMATIC HERO ───────────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden" style={{ background: C.espresso, minHeight: "clamp(540px, 84svh, 860px)" }} aria-labelledby="leadership-heading">
        {bannerImage && (
          <motion.div aria-hidden className="absolute inset-0" style={{ y: imageY, scale: 1.12 }}>
            <img src={bannerImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </motion.div>
        )}
        <div aria-hidden className="absolute inset-0" style={{ background: bannerImage ? "linear-gradient(180deg, rgba(27,14,5,0.72) 0%, rgba(27,14,5,0.55) 50%, rgba(27,14,5,0.92) 100%)" : `linear-gradient(160deg, ${C.espresso} 0%, ${C.bark} 70%, ${C.barkSoft} 100%)` }} />
        <Atmosphere opacity={0.14} glow={!bannerImage} />
        {bannerAlt && <span className="sr-only">{bannerAlt}</span>}
        <motion.div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 pt-24 pb-20 sm:pt-28 sm:pb-24 flex flex-col justify-end" style={{ y: copyY, opacity: copyOpacity, minHeight: "clamp(540px, 84svh, 860px)" }}>
          <Reveal y={16}><Eyebrow color={C.jaggeryLite}>The people behind the legacy</Eyebrow></Reveal>
          <h1 id="leadership-heading" className="font-heading mt-7" style={{ fontSize: "clamp(2.8rem,7.4vw,6.4rem)", lineHeight: 0.98, letterSpacing: "-0.03em", color: C.ivory, maxWidth: 940 }}>
            <Words text="Carrying a Legacy Forward." accent="Forward." />
          </h1>
          <Reveal delay={0.35}>
            <p className="font-body mt-8" style={{ fontSize: "clamp(1.05rem,1.4vw,1.25rem)", lineHeight: 1.7, color: "rgba(255,251,244,0.8)", maxWidth: 640 }}>
              From the values established by Late Shri B Ramachandra to the vision shaping VKC Gold Ikshu today, our leadership combines heritage, discipline and a forward-looking approach.
            </p>
          </Reveal>
        </motion.div>
      </section>

      {/* ── 2 · FEATURED: MANAGING DIRECTOR ──────────────────────────────── */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <Reveal className="lg:col-span-6">
            <div className="relative">
              {/* An offset gold rule gives the portrait an editorial mount. */}
              <span aria-hidden className="absolute -left-3 -top-3 right-6 bottom-6 hidden sm:block" style={{ border: `1px solid ${C.jaggery}55` }} />
              <Photo src={PEOPLE.md.photo} alt={PEOPLE.md.name} ratio="4 / 5" priority sizes="(max-width: 1024px) 90vw, 50vw" className="rounded-lg" />
            </div>
          </Reveal>
          <div className="lg:col-span-6">
            <Reveal delay={0.1}>
              <Eyebrow>Managing Director</Eyebrow>
              <h2 className="font-heading mt-5 uppercase" style={{ fontSize: "clamp(2rem,3.8vw,3.2rem)", lineHeight: 1.02, letterSpacing: "0.02em", color: C.ink }}>{PEOPLE.md.name}</h2>
              <div className="font-heading mt-2" style={{ fontSize: 18, color: C.muted, fontStyle: "italic" }}>{PEOPLE.md.role}</div>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="font-heading mt-8" style={{ fontSize: "clamp(1.35rem,2vw,1.7rem)", lineHeight: 1.35, color: C.ink }}>
                Carrying the family legacy forward with a focus on quality, compliance and long-term brand building.
              </p>
              <p className="font-body mt-6" style={{ fontSize: 16.5, lineHeight: 1.8, color: C.ink2, maxWidth: 560 }}>{MD_PROFILE}</p>
            </Reveal>
            <Reveal delay={0.3}>
              <dl className="mt-9 grid grid-cols-3 gap-4 m-0">
                {["Quality", "Compliance", "Long-term vision"].map((a) => (
                  <div key={a} className="pt-4" style={{ borderTop: `1px solid ${C.jaggery}` }}>
                    <dt className="font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.18em", color: C.ink }}>{a}</dt>
                    <dd className="m-0" />
                  </div>
                ))}
              </dl>
              <Link href="/credentials" className="group mt-8 inline-flex items-center gap-2 font-body font-semibold" style={{ fontSize: 13.5, color: C.jaggeryDark }}>
                Registrations, learning and compliance <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 3 · THE LEGACY, HAND TO HAND ─────────────────────────────────── */}
      <section style={{ background: C.cream }}>
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <SectionHeading eyebrow="One legacy" title="From the founder to the next chapter." accent="next" />
          <Handover />
        </div>
      </section>

      {/* ── 4 · THE TEAM BEHIND THE VISION ───────────────────────────────── */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <SectionHeading eyebrow="Supporting leadership" title="The team behind the vision." accent="vision." />
        <div className="mt-12 grid sm:grid-cols-2 gap-6 lg:gap-8 max-w-[900px]">
          <PortraitCard index={0} {...PEOPLE.director} />
          <PortraitCard index={1} {...PEOPLE.promoter} />
        </div>
      </section>

      {/* ── 5 · VALUES ───────────────────────────────────────────────────── */}
      <section className="relative" style={{ background: `linear-gradient(160deg, ${C.bark}, ${C.barkSoft})` }} aria-labelledby="values-heading">
        <Atmosphere glow={false} opacity={0.1} />
        <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <Reveal><Eyebrow color={C.sage}>What the leadership stands on</Eyebrow></Reveal>
          <h2 id="values-heading" className="font-heading mt-5" style={{ fontSize: "clamp(2.1rem,4.4vw,3.6rem)", lineHeight: 1.04, letterSpacing: "-0.02em", color: C.ivory }}>
            <Words text="Leadership rooted in values." accent="values." />
          </h2>
          <ValuesList />
        </div>
      </section>

      {/* ── 6 · HERITAGE → FUTURE ────────────────────────────────────────── */}
      <section aria-labelledby="heritage-future-heading">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-12">
          <SectionHeading center eyebrow="Heritage → future" title="Honouring where we began. Building where we're going." accent="Building" />
        </div>
        <h2 id="heritage-future-heading" className="sr-only">Heritage and future</h2>
        <div className="grid lg:grid-cols-2">
          <SplitPanel dark image={heritageImage} label="Where we began" title="1988. A crusher in Mandya."
            facts={["M/s Vairamudi Krupa Crusher, set up by Late Shri B Ramachandra", "Fair dealing with the farmers who grow the cane", "Purity as the standard, not a slogan"]} />
          <SplitPanel dark={false} image={futureImage} label="Where we're going" title="A structured, future-ready business."
            facts={["VKC Jaggery & Beverages Private Limited, incorporated 2025", "A proposed 50 TCD automatic jaggery and cane-juice processing unit", "Ongoing learning in food safety, labelling and compliance"]} />
        </div>
      </section>

      {/* ── 7 · THE LEGACY CONTINUES ─────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: C.espresso }}>
        <Atmosphere opacity={0.14} />
        <div className="relative max-w-[1100px] mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center">
          <h2 className="font-heading" style={{ fontSize: "clamp(2.4rem,6vw,5.2rem)", lineHeight: 1.02, letterSpacing: "-0.03em", color: C.ivory }}>
            <Words text="The legacy continues." accent="continues." />
          </h2>
          <Reveal delay={0.3}>
            <p className="font-heading mt-6 mx-auto" style={{ fontSize: "clamp(1.15rem,1.8vw,1.5rem)", lineHeight: 1.4, color: "rgba(255,251,244,0.8)", maxWidth: 640, textAlign: "center", fontStyle: "italic" }}>
              Built on values. Guided by experience. Focused on the future.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/about" className="group inline-flex items-center gap-3 pl-7 pr-2 rounded-full font-body font-semibold text-sm transition-transform duration-300 hover:-translate-y-0.5" style={{ height: 52, background: C.jaggery, color: C.bark, boxShadow: "0 12px 32px rgba(201,139,46,0.35)" }}>
                Explore Our Story
                <span className="grid place-items-center h-9 w-9 rounded-full transition-transform duration-300 group-hover:translate-x-1" style={{ background: C.bark, color: C.jaggeryLite }}><ArrowRight className="h-4 w-4" /></span>
              </Link>
              <Link href="/shop" className="group inline-flex items-center gap-2 px-7 rounded-full font-body font-semibold text-sm" style={{ height: 52, border: "1px solid rgba(255,214,92,0.45)", color: C.jaggeryLite, background: "rgba(255,251,244,0.05)" }}>
                Discover Our Products <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
