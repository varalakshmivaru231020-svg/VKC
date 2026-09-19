"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Award, Cog, Handshake, Leaf } from "lucide-react";

/* Brand palette, literal on purpose: the admin theme tokens can be set to
   anything and this block must always read as VKC green, sage and gold. */
const C = {
  green: "#1F3D2B",
  greenSoft: "#2F5A40",
  sage: "#DDE7D3",
  sageSoft: "#EEF3E6",
  gold: "#C8962E",
  goldLite: "#E9C46A",
  ivory: "#FBF7EE",
  paper: "#FFFFFF",
  ink: "#1E2A20",
  ink2: "#4A5A4C",
  line: "#E4DFCF",
};

const EASE = [0.22, 1, 0.36, 1] as const;

const REASONS = [
  { icon: Leaf, short: "Natural", t: "100% Natural & Chemical-Free Products", d: "No chemicals, preservatives or artificial colours at any stage — just cane, heat and time." },
  { icon: Handshake, short: "Farmer Partnerships", t: "Direct Farmer Partnerships", d: "We buy straight from Mandya growers at fair prices, so more of every rupee reaches the field." },
  { icon: Cog, short: "Modern Processing", t: "Sustainable & Modern Processing", d: "Energy-efficient, high-recovery machinery paired with time-honoured jaggery know-how." },
  { icon: Award, short: "Since 1988", t: "Trusted Since 1988", d: "Three decades of purity and integrity, one batch at a time." },
];

/* Sugarcane, drawn: five jointed stalks and their blades. Stands in the arch
   until a photograph is uploaded, so the centre is never an empty box and
   never a stand-in person. */
function CaneArt() {
  const stalks = [
    { x: 122, top: 300, lean: -7, w: 16 },
    { x: 164, top: 248, lean: -3, w: 18 },
    { x: 205, top: 214, lean: 0, w: 19 },
    { x: 246, top: 256, lean: 4, w: 18 },
    { x: 288, top: 310, lean: 8, w: 16 },
  ];
  return (
    <svg viewBox="0 0 410 560" className="h-full w-full" role="img" aria-label="Sugarcane stalks" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="cane" x1="0" x2="1">
          <stop offset="0" stopColor="#B9C98E" /><stop offset="0.5" stopColor="#E3D9A0" /><stop offset="1" stopColor="#A9B77C" />
        </linearGradient>
      </defs>
      {/* blades, behind the stalks */}
      {stalks.map((s, i) => (
        <g key={`l${i}`} transform={`rotate(${s.lean} ${s.x} 560)`} fill={C.greenSoft} opacity={0.9}>
          <path d={`M${s.x} ${s.top + 22} C ${s.x - 30} ${s.top - 56}, ${s.x - 74} ${s.top - 78}, ${s.x - 112} ${s.top - 52} C ${s.x - 78} ${s.top - 60}, ${s.x - 38} ${s.top - 34}, ${s.x} ${s.top + 22} Z`} opacity={0.8} />
          <path d={`M${s.x} ${s.top + 22} C ${s.x + 30} ${s.top - 62}, ${s.x + 76} ${s.top - 86}, ${s.x + 114} ${s.top - 60} C ${s.x + 80} ${s.top - 68}, ${s.x + 38} ${s.top - 40}, ${s.x} ${s.top + 22} Z`} opacity={0.7} />
          <path d={`M${s.x} ${s.top + 28} C ${s.x - 10} ${s.top - 64}, ${s.x + 2} ${s.top - 118}, ${s.x + 22} ${s.top - 158} C ${s.x + 16} ${s.top - 104}, ${s.x + 12} ${s.top - 40}, ${s.x} ${s.top + 28} Z`} fill={C.green} opacity={0.85} />
        </g>
      ))}
      {stalks.map((s, i) => (
        <g key={`s${i}`} transform={`rotate(${s.lean} ${s.x} 560)`}>
          <rect x={s.x - s.w / 2} y={s.top} width={s.w} height={560 - s.top + 20} rx={s.w / 2} fill="url(#cane)" stroke={C.green} strokeWidth={1.4} />
          {Array.from({ length: 9 }).map((_, n) => {
            const y = s.top + 36 + n * 46;
            return y < 552 ? <path key={n} d={`M${s.x - s.w / 2} ${y} q ${s.w / 2} 5 ${s.w} 0`} fill="none" stroke={C.gold} strokeWidth={2} strokeLinecap="round" /> : null;
          })}
        </g>
      ))}
    </svg>
  );
}

/* A single leaf in line art, reused around the arch. */
function LeafLine({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 220" className={className} style={style} fill="none" stroke={C.greenSoft} strokeWidth={1.4} strokeLinecap="round" aria-hidden>
      <path d="M60 214 C 58 150, 40 80, 14 10 C 70 50, 96 130, 60 214 Z" />
      <path d="M60 214 C 54 150, 40 90, 14 10" />
      <path d="M52 170 C 66 160, 76 148, 82 134 M46 132 C 60 122, 70 108, 74 94 M38 94 C 50 86, 58 74, 60 62" opacity={0.7} />
    </svg>
  );
}

export function WhyChooseView({ image = null, mobileImage = null, imageAlt = "" }: { image?: string | null; mobileImage?: string | null; imageAlt?: string }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const Active = REASONS[active].icon;
  const rise = (delay = 0) => ({
    initial: reduced ? false : ({ opacity: 0, y: 22 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "0px 0px -8% 0px" },
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <section aria-labelledby="why-heading" className="relative overflow-hidden" style={{ background: C.ivory }}>
      {/* soft organic ground: two sage washes and a gold breath */}
      <div aria-hidden className="pointer-events-none absolute -left-40 top-10 h-[460px] w-[460px] rounded-full" style={{ background: `radial-gradient(circle, ${C.sage}, transparent 68%)`, opacity: 0.7 }} />
      <div aria-hidden className="pointer-events-none absolute right-[-10%] bottom-[-18%] h-[560px] w-[560px] rounded-full" style={{ background: `radial-gradient(circle, ${C.sageSoft}, transparent 66%)` }} />
      <div aria-hidden className="pointer-events-none absolute left-[46%] top-[-12%] h-[380px] w-[380px] rounded-full" style={{ background: "radial-gradient(circle, rgba(233,196,106,0.22), transparent 66%)" }} />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="grid gap-x-10 gap-y-10 lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
          {/* heading */}
          <div className="lg:col-span-5 lg:row-start-1">
            <motion.span {...rise()} className="inline-flex items-center gap-3 font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.24em", color: C.gold }}>
              <span className="inline-block h-px w-7" style={{ background: C.gold }} /> Why VKC
            </motion.span>
            <motion.h2 {...rise(0.08)} id="why-heading" className="mt-4" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.3rem,4.4vw,3.7rem)", lineHeight: 1.02, letterSpacing: "-0.02em", color: C.green, fontWeight: 500 }}>
              <span className="block">Why choose</span>
              <span className="block" style={{ fontStyle: "italic", color: C.gold }}>vkcgoldikshu</span>
            </motion.h2>
          </div>

          {/* centre: the farmer photograph (or the cane illustration) in an arch */}
          <motion.div {...rise(0.15)} className="relative mx-auto w-full max-w-[380px] lg:max-w-none lg:col-span-4 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:self-end">
            <LeafLine className="absolute -left-9 top-10 h-40 w-auto -rotate-[18deg] hidden sm:block" />
            <LeafLine className="absolute -right-8 top-28 h-32 w-auto rotate-[24deg] scale-x-[-1] hidden sm:block" />
            {/* gold brush ring, offset behind the arch */}
            <div aria-hidden className="absolute inset-x-3 top-3 bottom-0 translate-x-3 -translate-y-3" style={{ border: `1.5px solid ${C.goldLite}`, borderRadius: "999px 999px 28px 28px", opacity: 0.8 }} />
            <div className="relative overflow-hidden" style={{ aspectRatio: "4 / 5.2", borderRadius: "999px 999px 28px 28px", background: `linear-gradient(180deg, ${C.sageSoft} 0%, ${C.sage} 62%, #C9D8BB 100%)`, boxShadow: "0 30px 70px -34px rgba(31,61,43,0.45)" }}>
              {image ? (
                <picture>
                  {mobileImage && mobileImage !== image && <source media="(max-width: 767px)" srcSet={mobileImage} />}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={imageAlt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "center top" }} />
                </picture>
              ) : (
                <div className="absolute inset-0"><CaneArt /></div>
              )}
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: "linear-gradient(180deg, rgba(31,61,43,0) 0%, rgba(31,61,43,0.28) 100%)" }} />
            </div>

            {/* floating chip mirrors whichever benefit is active */}
            <motion.div key={active} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}
              className="absolute left-0 top-[18%] -translate-x-2 sm:-translate-x-6 flex items-center gap-3 rounded-2xl py-2.5 pl-2.5 pr-4"
              style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", border: `1px solid ${C.line}`, boxShadow: "0 14px 34px -18px rgba(31,61,43,0.5)" }}>
              <span className="grid h-9 w-9 place-items-center rounded-full" style={{ background: C.green, color: C.goldLite }}><Active className="h-4 w-4" /></span>
              <span>
                <span className="block font-heading" style={{ fontSize: 12, lineHeight: 1, color: C.gold, letterSpacing: "0.08em" }}>0{active + 1}</span>
                <span className="block font-body font-semibold" style={{ fontSize: 13, lineHeight: 1.3, color: C.green }}>{REASONS[active].short}</span>
              </span>
            </motion.div>
          </motion.div>

          {/* benefits */}
          <div className="lg:col-span-5 lg:row-start-2">
            <ul className="m-0 list-none space-y-3 p-0">
              {REASONS.map((r, i) => {
                const on = i === active;
                return (
                  <motion.li key={r.t} {...rise(0.1 + i * 0.07)}>
                    <Link
                      href="/about"
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      className="group flex items-center gap-3.5 sm:gap-4 rounded-[28px] py-3.5 pl-4 pr-3.5 sm:py-4 sm:pl-5 sm:pr-4 outline-none transition-[transform,box-shadow,background-color,border-color] duration-500 ease-out hover:-translate-y-1 focus-visible:-translate-y-1"
                      style={{
                        background: on ? C.green : C.paper,
                        border: `1px solid ${on ? C.green : C.line}`,
                        boxShadow: on ? "0 22px 44px -26px rgba(31,61,43,0.7)" : "0 8px 22px -20px rgba(31,61,43,0.35)",
                      }}
                    >
                      <span className="font-heading tabular-nums shrink-0" style={{ fontSize: 17, width: 26, color: on ? C.goldLite : C.gold }}>0{i + 1}</span>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-transform duration-500 ease-out group-hover:rotate-[10deg] group-hover:scale-110" style={{ background: on ? "rgba(233,196,106,0.16)" : C.sageSoft, color: on ? C.goldLite : C.green }}>
                        <r.icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.08rem,1.35vw,1.28rem)", lineHeight: 1.15, fontWeight: 600, color: on ? C.ivory : C.ink }}>{r.t}</span>
                        <span className="mt-1 block font-body" style={{ fontSize: 13.5, lineHeight: 1.55, color: on ? "rgba(251,247,238,0.78)" : C.ink2 }}>{r.d}</span>
                      </span>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform duration-500 ease-out group-hover:translate-x-1" style={{ border: `1px solid ${on ? "rgba(233,196,106,0.5)" : C.line}`, color: on ? C.goldLite : C.green }}>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>

            <motion.div {...rise(0.4)}>
              <Link href="/about" className="group mt-8 inline-flex items-center gap-3 font-body font-semibold text-sm" style={{ color: C.green }}>
                Read our story
                <span className="grid h-9 w-9 place-items-center rounded-full transition-transform duration-300 group-hover:rotate-45" style={{ background: C.green, color: C.goldLite }}>
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            </motion.div>
          </div>

          {/* right: the 1988 heritage story, told in type */}
          <motion.div {...rise(0.25)} className="relative hidden lg:col-span-3 lg:col-start-10 lg:row-span-2 lg:row-start-1 lg:flex lg:flex-col lg:justify-between">
            <div className="relative pt-2">
              <div aria-hidden className="font-heading select-none" style={{ fontSize: "clamp(5.5rem,9.4vw,9.5rem)", lineHeight: 0.86, letterSpacing: "-0.05em", fontStyle: "italic", color: "transparent", WebkitTextStroke: `1px ${C.goldLite}`, opacity: 0.85 }}>1988</div>
              <div className="mt-5 flex items-center gap-3 font-body font-semibold uppercase" style={{ fontSize: 10.5, letterSpacing: "0.28em", color: C.gold }}>
                <span className="inline-block h-px w-7" style={{ background: C.gold }} /> Trusted since
              </div>
            </div>
            <div className="pb-2">
              <LeafLine className="mb-6 h-24 w-auto" />
              <div className="font-heading" style={{ fontSize: "clamp(1.7rem,2.3vw,2.2rem)", lineHeight: 1.08, color: C.green, fontWeight: 500 }}>Trusted Since <span style={{ fontStyle: "italic", color: C.gold }}>1988</span></div>
              <p className="font-body mt-3" style={{ fontSize: 14.5, lineHeight: 1.7, color: C.ink2, textAlign: "left", hyphens: "none", maxWidth: 280 }}>
                Three decades of purity and integrity, one batch at a time.
              </p>
              <div className="mt-6 h-px w-full" style={{ background: `linear-gradient(90deg, ${C.gold}, transparent)` }} />
              <div className="mt-4 font-body font-semibold uppercase" style={{ fontSize: 10, letterSpacing: "0.24em", color: C.ink2 }}>Mandya · Karnataka</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
