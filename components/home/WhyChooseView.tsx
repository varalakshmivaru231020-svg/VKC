"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Factory, Leaf, ShieldCheck, Tractor } from "lucide-react";

/* Brand palette, literal on purpose: the admin theme tokens can be set to
   anything and this block must always read as VKC green, sage and gold. */
const C = {
  green: "#14432F",
  greenDeep: "#0E3324",
  greenSoft: "#2F6B4A",
  leaf: "#4F8A3C",
  sage: "#DCE8CF",
  sageSoft: "#EEF3E4",
  gold: "#B9872A",
  goldBright: "#F2B632",
  goldLite: "#E9C46A",
  ivory: "#FBF6EA",
  paper: "#FFFDF8",
  ink: "#173526",
  ink2: "#55645A",
  line: "#E6DFCC",
};

const EASE = [0.22, 1, 0.36, 1] as const;

const REASONS = [
  { icon: Leaf, t: "100% Natural & Chemical-Free Products", d: "No chemicals, preservatives or artificial colours at any stage — just cane, heat and time." },
  { icon: Tractor, t: "Direct Farmer Partnerships", d: "We buy straight from Mandya growers at fair prices, so more of every rupee reaches the field." },
  { icon: Factory, t: "Sustainable & Modern Processing", d: "Energy-efficient, high-recovery machinery paired with time-honoured jaggery know-how." },
  { icon: ShieldCheck, t: "Trusted Since 1988", d: "Three decades of purity and integrity, one batch at a time." },
];

/* A line, a leaf, a line — the small divider used above the story and under 1988. */
function LeafRule({ width = 270 }: { width?: number }) {
  return (
    <div className="flex items-center gap-4" style={{ maxWidth: width }} aria-hidden>
      <span className="h-px flex-1" style={{ background: C.gold }} />
      <Leaf className="h-6 w-6 -rotate-12" style={{ color: C.green }} strokeWidth={1.6} />
      <span className="h-px flex-1" style={{ background: C.gold }} />
    </div>
  );
}

/* A filled leaf sprig, used beside the portrait. */
function Sprig({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  const leaf = (x: number, y: number, r: number, s = 1) => (
    <path transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} d="M0 0 C 14 -26, 44 -40, 78 -34 C 60 -8, 32 6, 0 0 Z" />
  );
  return (
    <svg viewBox="0 0 160 260" className={className} style={style} aria-hidden>
      <path d="M120 256 C 96 190, 74 120, 40 20" fill="none" stroke={C.greenSoft} strokeWidth={2} strokeLinecap="round" />
      <g fill={C.leaf}>
        {leaf(104, 214, -150)}{leaf(92, 176, -20, 0.95)}{leaf(80, 138, -155, 0.9)}{leaf(66, 100, -25, 0.85)}{leaf(54, 64, -160, 0.75)}{leaf(42, 30, -60, 0.7)}
      </g>
    </svg>
  );
}

/* Tall cane leaves in line art, tucked into the section's bottom-right corner. */
function CornerBotanical() {
  return (
    <svg viewBox="0 0 260 360" className="pointer-events-none absolute bottom-0 right-0 hidden h-[260px] w-auto lg:block" fill="none" stroke={C.goldLite} strokeWidth={1.3} strokeLinecap="round" opacity={0.7} aria-hidden>
      <path d="M250 360 C 236 270, 214 180, 150 60 C 196 150, 232 250, 250 360 Z" />
      <path d="M232 360 C 214 290, 176 220, 96 150 C 160 210, 206 280, 232 360 Z" />
      <path d="M214 360 C 190 310, 140 274, 40 250 C 124 276, 180 312, 214 360 Z" />
      <path d="M256 360 C 256 280, 252 200, 226 110 C 250 196, 260 280, 256 360 Z" />
      <path d="M196 360 C 176 336, 130 322, 70 322" />
    </svg>
  );
}

export function WhyChooseView({ image = null, mobileImage = null, imageAlt = "" }: { image?: string | null; mobileImage?: string | null; imageAlt?: string }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const rise = (delay = 0) => ({
    initial: reduced ? false : ({ opacity: 0, y: 22 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "0px 0px -8% 0px" },
    transition: { duration: 0.8, ease: EASE, delay },
  });
  // A cut-out (PNG/WebP/AVIF with transparency) stands free over the circle,
  // as in the design. A plain JPEG has a rectangular background, so it is
  // held inside the circle instead of spilling over it.
  const cutOut = Boolean(image && !/\.jpe?g(\?.*)?$/i.test(image));

  return (
    <section aria-labelledby="why-heading" className="relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${C.paper} 0%, ${C.ivory} 100%)` }}>
      <CornerBotanical />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid items-center gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.82fr)_minmax(0,0.9fr)] lg:grid-rows-[auto_auto] xl:gap-x-10">
          {/* heading */}
          <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
            {/* Same type as the home page's other section heads ("From the Blog"):
                the gold eyebrow and the theme's h2 size, weight and text colour. */}
            <motion.span {...rise()} className="block text-xs font-semibold tracking-[0.18em] uppercase" style={{ fontFamily: "var(--font-body)", color: "var(--color-gold)" }}>
              Why VKC
            </motion.span>
            <motion.h2 {...rise(0.08)} id="why-heading" className="mt-2" style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h2)", fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)" }}>
              Why choose <span style={{ fontStyle: "italic" }}>vkcgoldikshu</span>
            </motion.h2>
          </div>

          {/* centre. By default this is the composition supplied with the design —
              farmer, watercolour circle, leaves and brush stroke in one picture,
              on white, multiplied into the page so no rectangle shows. An image
              uploaded in Admin → Banners ("home_why_image") replaces it and is set
              over the drawn circle, stroke and sprigs instead. */}
          <motion.div {...rise(0.15)} className="relative mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:max-w-none lg:col-start-2 lg:row-span-2 lg:row-start-1" style={{ aspectRatio: image ? "10 / 13" : "584 / 804" }}>
            {image ? (
              <>
                <svg viewBox="0 0 500 650" className="absolute inset-0 h-full w-full" aria-hidden>
                  <defs>
                    <filter id="why-rough" x="-10%" y="-10%" width="120%" height="120%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" />
                      <feDisplacementMap in="SourceGraphic" scale="26" />
                    </filter>
                    <radialGradient id="why-wash" cx="50%" cy="42%" r="60%">
                      <stop offset="0" stopColor="#EEF4E2" /><stop offset="0.65" stopColor="#D6E5C6" /><stop offset="1" stopColor="#BDD3A6" />
                    </radialGradient>
                  </defs>
                  <g filter="url(#why-rough)">
                    <circle cx="250" cy="350" r="246" fill="none" stroke="#C3D8AE" strokeWidth="9" opacity="0.75" />
                    <circle cx="250" cy="350" r="226" fill="url(#why-wash)" />
                    <path d="M300 590 C 360 560, 420 500, 462 420" fill="none" stroke={C.goldBright} strokeWidth="46" strokeLinecap="round" />
                    <path d="M120 600 C 150 590, 180 575, 205 556" fill="none" stroke={C.goldBright} strokeWidth="14" strokeLinecap="round" opacity="0.9" />
                  </g>
                </svg>
                <Sprig className="absolute left-[-3%] top-[24%] h-[34%] w-auto" />
                <Sprig className="absolute left-[-1%] bottom-[8%] h-[30%] w-auto" style={{ transform: "rotate(-18deg) scaleY(-1)" }} />
                <picture>
                  {mobileImage && mobileImage !== image && <source media="(max-width: 767px)" srcSet={mobileImage} />}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={imageAlt}
                    loading="lazy"
                    decoding="async"
                    className={cutOut ? "absolute inset-0 h-full w-full object-contain object-bottom" : "absolute object-cover"}
                    style={cutOut ? { filter: "drop-shadow(0 18px 26px rgba(20,67,47,0.22))" } : { left: "8%", top: "20%", width: "84%", height: "66%", borderRadius: "50%", objectPosition: "center top" }}
                  />
                </picture>
              </>
            ) : (
              <Image
                src="/images/home/why-farmer.webp"
                alt="A Mandya sugarcane farmer holding freshly cut cane"
                fill
                sizes="(max-width: 1023px) 400px, 34vw"
                quality={92}
                className="object-contain"
                style={{ mixBlendMode: "multiply" }}
              />
            )}
          </motion.div>

          {/* benefits */}
          <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
            <ul className="m-0 list-none space-y-2.5 p-0">
              {REASONS.map((r, i) => {
                const on = i === active;
                return (
                  <motion.li key={r.t} {...rise(0.1 + i * 0.07)}>
                    <Link
                      href="/about"
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      className="group flex items-center gap-3 sm:gap-4 rounded-[999px] py-2 pl-4 pr-3 sm:py-2.5 sm:pl-6 sm:pr-4 outline-none transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 focus-visible:-translate-y-1"
                      style={{
                        background: on ? `linear-gradient(100deg, ${C.green} 0%, ${C.greenDeep} 100%)` : "rgba(255,253,248,0.9)",
                        border: `1px solid ${on ? C.green : C.line}`,
                        boxShadow: on ? "0 22px 40px -22px rgba(14,51,36,0.75)" : "0 10px 26px -22px rgba(20,67,47,0.45)",
                      }}
                    >
                      <span className="font-body tabular-nums shrink-0" style={{ fontSize: 15, width: 24, color: on ? C.goldLite : C.gold }}>0{i + 1}</span>
                      <span className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-full transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6" style={{ background: on ? "rgba(255,255,255,0.13)" : "#EFEBDD", color: on ? "#F4F7EE" : C.green }}>
                        <r.icon className="h-5 w-5" strokeWidth={1.6} />
                      </span>
                      <span aria-hidden className="h-9 w-px shrink-0" style={{ background: on ? "rgba(255,255,255,0.28)" : C.line }} />
                      <span className="min-w-0 flex-1 pl-1">
                        <span className="block font-body" style={{ fontSize: "clamp(0.92rem,1.05vw,1rem)", lineHeight: 1.22, fontWeight: 600, color: on ? "#FFFFFF" : C.ink }}>{r.t}</span>
                        <span className="mt-0.5 block font-body" style={{ fontSize: 12, lineHeight: 1.45, color: on ? "rgba(255,255,255,0.82)" : C.ink2 }}>{r.d}</span>
                      </span>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform duration-500 ease-out group-hover:translate-x-1" style={{ border: `1.5px solid ${on ? C.goldLite : C.gold}`, color: on ? "#FFFFFF" : C.gold }}>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>

            <motion.div {...rise(0.4)}>
              <Link href="/about" className="group mt-5 inline-flex items-center gap-3 font-body text-sm" style={{ color: C.gold }}>
                <span className="underline underline-offset-4 decoration-1">Read our story</span>
                <span className="grid h-9 w-9 place-items-center rounded-full transition-transform duration-300 group-hover:translate-x-1" style={{ border: `1.5px solid ${C.gold}` }}>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </motion.div>
          </div>

          {/* right: from the cane fields to your family, and the year it began */}
          <motion.div {...rise(0.25)} className="relative lg:col-start-3 lg:row-span-2 lg:row-start-1">
            <LeafRule />
            <h3 className="mt-4" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem,2.1vw,1.95rem)", lineHeight: 1.15, fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)" }}>
              From the Cane Fields to Your Family.
            </h3>
            <p className="font-body mt-3" style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text-muted)", textAlign: "left", hyphens: "none", maxWidth: 380 }}>
              At VKC Gold Ikshu, we preserve the goodness of naturally grown sugarcane through careful processing and time-honoured craftsmanship. From our roots in Mandya to your home, every product is created with purity, care and consistency.
            </p>

            <div className="relative mt-6 lg:mt-8" style={{ maxWidth: 300 }}>
              <div aria-hidden className="select-none text-center" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "clamp(4.4rem,6.6vw,6.2rem)", lineHeight: 0.9, letterSpacing: "-0.03em", color: C.goldLite, opacity: 0.4 }}>1988</div>
              <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-3 font-body uppercase" style={{ fontSize: 13, letterSpacing: "0.28em", color: "var(--color-text-primary)" }}>
                <span className="h-px w-5" style={{ background: C.gold }} /> Trusted since <span className="h-px w-5" style={{ background: C.gold }} />
              </div>
              <div className="mx-auto mt-2 w-[58%]"><LeafRule width={200} /></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
