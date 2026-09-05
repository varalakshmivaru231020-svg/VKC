"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Award, Leaf, ShieldCheck, Sprout } from "lucide-react";

/* Brand palette, literal on purpose (theme tokens are admin-configurable). */
const C = {
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
const EASE = [0.22, 1, 0.36, 1] as const;

const POINTS = [
  { icon: ShieldCheck, t: "Legacy-led values", d: "Grounded in trust, discipline and authenticity." },
  { icon: Leaf, t: "Natural product focus", d: "Shaped by purity-first thinking, from cane to pack." },
  { icon: Sprout, t: "Forward-looking leadership", d: "Under Naveenchandra B R, building for the long term." },
  { icon: Award, t: "Compliance and learning", d: "Food-safety and industry training, certificate courses completed." },
];

function Reveal({ children, className = "", delay = 0, y = 28 }: { children: React.ReactNode; className?: string; delay?: number; y?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={className} initial={reduced ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -10% 0px" }} transition={{ duration: 0.9, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

export function Legacy() {
  const reduced = useReducedMotion();
  return (
    <section className="relative overflow-hidden" style={{ background: C.ivory }} aria-labelledby="legacy-heading">
      {/* soft warm glow */}
      <motion.div aria-hidden className="absolute -left-40 top-10 h-[520px] w-[520px] rounded-full pointer-events-none" animate={reduced ? undefined : { y: [0, 18, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} style={{ background: `radial-gradient(circle, ${C.jaggery}22, transparent 66%)`, filter: "blur(24px)" }} />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">

          {/* Left: heading, pull quote, portraits */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <Reveal>
                <span className="inline-flex items-center gap-3 font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.24em", color: C.jaggeryDark }}>
                  <span className="inline-block h-px w-7" style={{ background: C.jaggeryDark }} /> Our Legacy
                </span>
                <h2 id="legacy-heading" className="mt-5" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.2rem,4.4vw,3.6rem)", lineHeight: 1.04, letterSpacing: "-0.02em", color: C.ink, fontWeight: 500 }}>
                  A Legacy Built on <span style={{ color: C.jaggeryDark, fontStyle: "italic" }}>Purity and Trust</span>
                </h2>
              </Reveal>

              <Reveal delay={0.15}>
                <figure className="mt-8 relative rounded-lg p-7 overflow-hidden" style={{ background: C.bark, color: C.ivory }}>
                  <span aria-hidden className="absolute -top-4 left-5 font-heading select-none" style={{ fontSize: 120, lineHeight: 1, color: "rgba(255,214,92,0.16)" }}>“</span>
                  <blockquote className="relative" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.15rem,1.6vw,1.35rem)", lineHeight: 1.5 }}>
                    Trust is not a marketing word — it is the base of everything we do. We are guided by legacy, strengthened by discipline, and driven by a desire to build something lasting.
                  </blockquote>
                  <figcaption className="relative mt-4 font-body uppercase" style={{ fontSize: 10.5, letterSpacing: "0.18em", color: C.jaggeryLite }}>VKC Gold Ikshu</figcaption>
                </figure>
              </Reveal>

              {/* Legacy → today */}
              <Reveal delay={0.25}>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {[
                    { src: "/images/team/ramachandra-b.webp", name: "Late Shri B Ramachandra", role: "Founder · the legacy" },
                    { src: "/images/team/naveenchandra-b-r.webp", name: "Naveenchandra B R", role: "Managing Director · today" },
                  ].map((p) => (
                    <Link key={p.name} href="/leadership" className="group rounded-lg overflow-hidden" style={{ background: "white", border: `1px solid ${C.parchment}` }}>
                      <div className="relative m-2 rounded-md overflow-hidden" style={{ aspectRatio: "3 / 4", background: C.cream }}>
                        <Image src={p.src} alt={p.name} fill sizes="(max-width: 1024px) 45vw, 18vw" className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.03]" />
                      </div>
                      <div className="px-3 pb-3">
                        <div className="font-body font-semibold" style={{ fontSize: 13, color: C.ink }}>{p.name}</div>
                        <div className="font-body uppercase mt-0.5" style={{ fontSize: 9.5, letterSpacing: "0.14em", color: C.jaggeryDark }}>{p.role}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>

          {/* Right: story + points */}
          <div className="lg:col-span-7">
            <Reveal delay={0.1}>
              <div className="space-y-5 font-body" style={{ fontSize: 17, lineHeight: 1.8, color: C.ink2, textAlign: "left", hyphens: "none" }}>
                <p>
                  Our journey is inspired by the vision of Late Shri B Ramachandra, whose values of discipline, sincerity and purity laid the foundation for our family’s jaggery tradition. What began as a legacy rooted in honest effort and agricultural connection continues today through a new generation of leadership. At VKC Gold Ikshu, we do not see tradition as something old and static; we see it as a living promise that must stay genuine while growing stronger with time.
                </p>
                <p>
                  Today, Naveenchandra B R carries this legacy forward with a clear focus on quality, compliance and long-term brand building. The aim is simple but powerful: preserve the trust earned through values, while building a future-ready business in natural sweeteners and jaggery-based products. That blend of heritage and direction is what gives VKC Gold Ikshu its identity.
                </p>
              </div>
            </Reveal>

            <div className="mt-10 grid sm:grid-cols-2 gap-4">
              {POINTS.map((pt, i) => (
                <Reveal key={pt.t} delay={0.15 + i * 0.08}>
                  <div className="group h-full rounded-lg p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ background: C.cream, border: `1px solid ${C.parchment}` }}>
                    <div className="flex items-center justify-between">
                      <span className="h-11 w-11 rounded-full grid place-items-center transition-colors duration-300 group-hover:bg-[#3A1F0A] group-hover:text-[#FFD65C]" style={{ background: `${C.jaggery}22`, color: C.jaggeryDark }}>
                        <pt.icon className="h-5 w-5" />
                      </span>
                      <span className="font-heading" style={{ fontSize: 26, lineHeight: 1, color: `${C.jaggery}66` }}>0{i + 1}</span>
                    </div>
                    <h3 className="mt-5" style={{ fontFamily: "var(--font-heading)", fontSize: 21, lineHeight: 1.15, color: C.ink, fontWeight: 500 }}>{pt.t}</h3>
                    <p className="font-body mt-2" style={{ fontSize: 14.5, lineHeight: 1.65, color: C.ink2, textAlign: "left", hyphens: "none" }}>{pt.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.3}>
              <p className="font-body mt-8" style={{ fontSize: 15.5, lineHeight: 1.75, color: C.ink2, textAlign: "left", hyphens: "none" }}>
                Our identity comes from a rare balance: respect for traditional values, paired with a modern commitment to quality systems, compliance awareness and responsible growth.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/about" className="group relative inline-flex items-center gap-3 pl-6 pr-2 rounded-full font-body font-semibold text-sm overflow-hidden" style={{ height: 48, background: C.bark, color: C.ivory }}>
                  <span aria-hidden className="absolute inset-0 -translate-x-full transition-transform duration-500 ease-out group-hover:translate-x-0" style={{ background: C.jaggery }} />
                  <span className="relative transition-colors duration-500 group-hover:text-[#3A1F0A]">Our story</span>
                  <span className="relative grid place-items-center h-8 w-8 rounded-full transition-all duration-500 group-hover:translate-x-1 group-hover:bg-[#3A1F0A] group-hover:text-[#FFD65C]" style={{ background: C.jaggery, color: C.bark }}><ArrowRight className="h-4 w-4" /></span>
                </Link>
                <Link href="/credentials" className="group relative inline-flex items-center gap-2 px-6 rounded-full font-body font-semibold text-sm overflow-hidden" style={{ height: 48, border: `1px solid ${C.jaggery}88`, color: C.jaggeryDark }}>
                  <span aria-hidden className="absolute inset-0 -translate-x-full transition-transform duration-500 ease-out group-hover:translate-x-0" style={{ background: C.jaggeryDark }} />
                  <span className="relative transition-colors duration-500 group-hover:text-[#FFFBF4]">Our credentials</span>
                  <ArrowRight className="relative h-4 w-4 transition-all duration-500 group-hover:translate-x-1 group-hover:text-[#FFFBF4]" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
