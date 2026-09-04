"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Leaf, Handshake, Cog, BadgeCheck, Award, ArrowUpRight } from "lucide-react";
import Link from "next/link";

/* Brand palette, literal on purpose: the admin theme tokens default to a
   monochrome palette and this block must always read as VKC green and gold. */
const C = {
  bark:        "#3A1F0A",
  barkSoft:    "#5A3210",
  green:       "#B85C12",
  jaggery:     "#E0961C",
  jaggeryLite: "#FFD65C",
  ivory:       "#FFFBF4",
  ink:         "#2B1708",
  ink2:        "#5C3A1E",
  muted:       "#8A6A4E",
  parchment:   "#F0DCB6",
};

const EASE = [0.22, 1, 0.36, 1] as const;

const REASONS = [
  { icon: Leaf, t: "100% Natural & Chemical-Free Products", d: "No chemicals, preservatives or artificial colours at any stage — just cane, heat and time." },
  { icon: Handshake, t: "Direct Farmer Partnerships", d: "We buy straight from Mandya growers at fair prices, so more of every rupee reaches the field." },
  { icon: Cog, t: "Sustainable & Modern Processing", d: "Energy-efficient, high-recovery machinery paired with time-honoured jaggery know-how." },
  { icon: BadgeCheck, t: "Certified & MSME Registered", d: "A registered, GST-compliant enterprise.", tag: "Udyam No. KR-21-0019065" },
  { icon: Award, t: "Trusted Since 1988", d: "Three decades of purity and integrity, one batch at a time." },
];

export function WhyChoose() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const Active = REASONS[active].icon;

  return (
    <section className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${C.bark} 0%, ${C.barkSoft} 60%, ${C.green} 140%)` }}>
      {/* soft glow + ghost year */}
      <div aria-hidden className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${C.jaggery}33, transparent 66%)`, filter: "blur(20px)" }} />
      <div aria-hidden className="absolute right-[-3%] bottom-[-10%] font-heading select-none pointer-events-none hidden lg:block" style={{ fontSize: "clamp(9rem,20vw,18rem)", lineHeight: 1, color: "rgba(255,214,92,0.05)", letterSpacing: "-0.05em", fontStyle: "italic" }}>1988</div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left: heading + live preview tile */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-40">
              <motion.span
                initial={reduced ? false : { opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
                className="inline-flex items-center gap-3 font-body font-semibold uppercase"
                style={{ fontSize: 11, letterSpacing: "0.24em", color: C.jaggeryLite }}
              >
                <span className="inline-block h-px w-7" style={{ background: C.jaggeryLite }} /> Why VKC
              </motion.span>
              <motion.h2
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
                className="mt-5"
                style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.2rem,4.6vw,3.9rem)", lineHeight: 1.02, letterSpacing: "-0.02em", color: C.ivory, fontWeight: 500 }}
              >
                Why choose <span style={{ color: C.jaggeryLite, fontStyle: "italic" }}>vkcgoldikshu</span>
              </motion.h2>

              {/* Preview tile mirrors whichever reason is hovered */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}
                className="mt-10 rounded-lg p-7 relative overflow-hidden hidden lg:block"
                style={{ background: "rgba(255,251,244,0.05)", border: "1px solid rgba(255,214,92,0.25)", backdropFilter: "blur(6px)" }}
              >
                <motion.div key={active} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
                  <div className="flex items-center justify-between">
                    <div className="h-14 w-14 rounded-full grid place-items-center" style={{ background: C.jaggery, color: C.bark }}>
                      <Active className="h-6 w-6" />
                    </div>
                    <span className="font-heading" style={{ fontSize: 46, lineHeight: 1, color: "rgba(255,214,92,0.35)", letterSpacing: "-0.04em" }}>0{active + 1}</span>
                  </div>
                  <div className="font-heading mt-6" style={{ fontSize: 24, lineHeight: 1.12, color: C.ivory }}>{REASONS[active].t}</div>
                  <p className="font-body mt-2" style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,251,244,0.72)", textAlign: "left", hyphens: "none" }}>{REASONS[active].d}</p>
                  {REASONS[active].tag && (
                    <span className="inline-block mt-4 font-body font-semibold rounded-full px-3 py-1.5" style={{ fontSize: 12, letterSpacing: "0.06em", background: "rgba(255,214,92,0.14)", color: C.jaggeryLite, border: "1px solid rgba(255,214,92,0.3)" }}>
                      {REASONS[active].tag}
                    </span>
                  )}
                </motion.div>
              </motion.div>

              <Link href="/about" className="group mt-7 inline-flex items-center gap-2 font-body font-semibold text-sm" style={{ color: C.jaggeryLite }}>
                Read our story
                <span className="grid place-items-center h-8 w-8 rounded-full transition-transform duration-300 group-hover:rotate-45" style={{ border: "1px solid rgba(255,214,92,0.45)" }}>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          </div>

          {/* Right: the five reasons as an index that lights up on hover/focus */}
          <ul className="lg:col-span-7 list-none m-0 p-0" style={{ borderTop: "1px solid rgba(255,214,92,0.16)" }}>
            {REASONS.map((r, i) => {
              const on = i === active;
              return (
                <motion.li
                  key={r.t}
                  initial={reduced ? false : { opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                  transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  tabIndex={0}
                  className="relative grid grid-cols-[auto_1fr_auto] items-center gap-5 sm:gap-8 py-6 sm:py-7 px-3 -mx-3 rounded-md cursor-default outline-none"
                  style={{ borderBottom: "1px solid rgba(255,214,92,0.16)" }}
                >
                  {/* sweep */}
                  <motion.span aria-hidden className="absolute inset-0 rounded-md origin-left" animate={{ scaleX: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: 0.5, ease: EASE }}
                    style={{ background: "linear-gradient(90deg, rgba(255,214,92,0.12), transparent 70%)" }} />
                  <motion.span className="relative font-heading tabular-nums" animate={{ scale: on ? 1.5 : 1, color: on ? C.jaggeryLite : "rgba(255,251,244,0.4)" }} transition={{ duration: 0.4, ease: EASE }}
                    style={{ fontSize: 15, width: 30, transformOrigin: "left center" }}>0{i + 1}</motion.span>
                  <div className="relative">
                    <motion.h3 animate={{ x: on ? 8 : 0 }} transition={{ duration: 0.4, ease: EASE }}
                      style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.3rem,2.2vw,1.85rem)", lineHeight: 1.1, color: C.ivory, fontWeight: 500 }}>
                      {r.t}
                    </motion.h3>
                    <motion.p animate={{ x: on ? 8 : 0, opacity: on ? 1 : 0.6 }} transition={{ duration: 0.4, ease: EASE }}
                      className="font-body mt-1.5" style={{ fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,251,244,0.75)", maxWidth: 560, textAlign: "left", hyphens: "none" }}>
                      {r.d}{r.tag ? ` ${r.tag}.` : ""}
                    </motion.p>
                  </div>
                  <motion.div className="relative h-12 w-12 rounded-full grid place-items-center" animate={{ background: on ? C.jaggery : "rgba(255,214,92,0.08)", color: on ? C.bark : C.jaggeryLite, rotate: on ? 12 : 0 }} transition={{ duration: 0.4, ease: EASE }}
                    style={{ border: "1px solid rgba(255,214,92,0.3)" }}>
                    <r.icon className="h-5 w-5" />
                  </motion.div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
