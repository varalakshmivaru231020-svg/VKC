"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, Award, BadgeCheck, Building2, Clock3, Factory, FileCheck2, GraduationCap,
  Landmark, ScrollText, ShieldCheck, Sprout, Tag, Globe2,
} from "lucide-react";

/* Palette shared with the About and Leadership pages. */
const C = {
  bark:        "#3A1F0A",
  barkSoft:    "#5A3210",
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

/* ── Content ─────────────────────────────────────────────────────────────── */
const ENTITIES = [
  {
    icon: Factory,
    label: "Proprietorship · since 1988",
    name: "M/s Vairamudi Krupa Crusher",
    desc: "The long-standing proprietorship concern founded by Late Shri B Ramachandra — the original and most important base of our business journey, and still central to our operations and identity.",
    facts: [["Established", "1988"], ["Location", "Ballenahalli, Srirangapatna Taluk, Mandya"]],
  },
  {
    icon: Building2,
    label: "Private limited company",
    name: "VKC JAGGERY & BEVERAGES PRIVATE LIMITED",
    desc: "Incorporated to carry forward the next phase of structured growth — technology upgradation, formal systems and responsible expansion — while the proprietorship remains the operating base.",
    facts: [["Incorporated", "12 December 2025"], ["CIN", "U10722KA2025PTC212254"]],
  },
];

const REGISTRATIONS_DONE = [
  { icon: Landmark, t: "Company incorporation", d: "Ministry of Corporate Affairs", ref: "CIN U10722KA2025PTC212254" },
  { icon: BadgeCheck, t: "MSME / Udyam registration", d: "Registered micro enterprise", ref: "Udyam No. KR-21-0019065" },
  { icon: FileCheck2, t: "GST registration", d: "Registered and compliant", ref: null },
  { icon: Globe2, t: "Import–Export Code (IEC)", d: "Directorate General of Foreign Trade", ref: null },
  { icon: Tag, t: "Trademark", d: "Brand registered", ref: null },
];

const REGISTRATIONS_PROGRESS = [
  { icon: ShieldCheck, t: "FSSAI licence", d: "Food safety licensing — in process" },
  { icon: Award, t: "Lean MSME certification", d: "Under process" },
  { icon: ScrollText, t: "Enterprise membership — IID", d: "In progress" },
];

const COURSES = [
  "FSSAI regulations",
  "Food labelling",
  "Food business licensing and registration",
  "Food acts",
  "FSSC awareness",
  "Jaggery business development",
];

/* ── Primitives ──────────────────────────────────────────────────────────── */
function Reveal({ children, className = "", delay = 0, y = 28 }: { children: React.ReactNode; className?: string; delay?: number; y?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={className} initial={reduced ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -10% 0px" }} transition={{ duration: 0.9, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

function Eyebrow({ children, color = C.jaggeryDark }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-3 font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.24em", color }}>
      <span style={{ width: 28, height: 1, background: color, display: "inline-block" }} />
      {children}
    </span>
  );
}

function SectionHeading({ eyebrow, title, sub, light = false }: { eyebrow: string; title: string; sub?: string; light?: boolean }) {
  return (
    <Reveal>
      <div className="max-w-3xl">
        <Eyebrow color={light ? C.jaggeryLite : C.jaggeryDark}>{eyebrow}</Eyebrow>
        <h2 className="font-heading mt-5" style={{ fontSize: "clamp(2rem,4vw,3.2rem)", lineHeight: 1.04, letterSpacing: "-0.02em", color: light ? C.ivory : C.ink }}>{title}</h2>
        {sub && <p className="font-body mt-4" style={{ fontSize: 16.5, lineHeight: 1.7, color: light ? "rgba(255,251,244,0.74)" : C.ink2, maxWidth: 640 }}>{sub}</p>}
      </div>
    </Reveal>
  );
}

/* Animated check that draws itself when scrolled into view. */
function DrawnCheck({ delay = 0 }: { delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <motion.path d="M4 12.5l5 5L20 7" initial={reduced ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE, delay }} />
    </svg>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function CredentialsExperience() {
  const reduced = useReducedMotion();
  return (
    <div className="vkc-about" style={{ background: C.ivory }}>
      <style dangerouslySetInnerHTML={{ __html: ".marketing-layout .vkc-about p{text-align:left;hyphens:none;text-justify:auto}" }} />

      {/* Hero band */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.bark} 0%, ${C.barkSoft} 100%)` }}>
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.1, mixBlendMode: "overlay" }} />
        <motion.div aria-hidden className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full" animate={reduced ? undefined : { scale: [1, 1.1, 1] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} style={{ background: `radial-gradient(circle, ${C.jaggery}55, transparent 66%)`, filter: "blur(10px)" }} />
        <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 pt-16 pb-16 sm:pt-20 sm:pb-20 grid lg:grid-cols-12 gap-10 items-end">
          <Reveal className="lg:col-span-8">
            <Eyebrow color={C.jaggeryLite}>Credentials</Eyebrow>
            <h1 className="font-heading mt-5" style={{ fontSize: "clamp(2.4rem,5.6vw,4.6rem)", lineHeight: 1.02, letterSpacing: "-0.02em", color: C.ivory, maxWidth: 900 }}>
              Registrations, compliance <span style={{ color: C.jaggeryLite, fontStyle: "italic" }}>and continuous learning</span>
            </h1>
            <p className="font-body mt-5" style={{ fontSize: 17, lineHeight: 1.7, color: "rgba(255,251,244,0.78)", maxWidth: 640 }}>
              We believe trust grows stronger when business values are supported by proper structure and compliance. Here is exactly where we stand — registrations, records and the learning behind them.
            </p>
          </Reveal>
          <Reveal delay={0.15} className="lg:col-span-4">
            <div className="grid grid-cols-3 gap-4 lg:pl-8" style={{ borderLeft: "1px solid rgba(240,201,109,0.2)" }}>
              {[["2", "Entities"], ["5", "Registrations"], ["6", "Courses"]].map(([n, l]) => (
                <div key={l} className="pl-4 lg:pl-0">
                  <div className="font-heading" style={{ fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1, color: C.jaggeryLite }}>{n}</div>
                  <div className="font-body mt-1.5 uppercase" style={{ fontSize: 10.5, letterSpacing: "0.18em", color: "rgba(255,251,244,0.6)" }}>{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Entities */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-24">
        <SectionHeading eyebrow="Business entities" title="Two entities, one family, one standard"
          sub="The proprietorship is where we come from and where we still operate. The private limited company is how we grow." />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {ENTITIES.map((e, i) => (
            <Reveal key={e.name} delay={i * 0.1}>
              <motion.div whileHover={reduced ? undefined : { y: -6 }} className="relative h-full rounded-lg p-8 sm:p-9 overflow-hidden" style={{ background: i === 1 ? C.bark : "white", color: i === 1 ? C.ivory : C.ink, border: `1px solid ${i === 1 ? "rgba(240,201,109,0.28)" : C.parchment}`, boxShadow: "0 24px 60px -32px rgba(58,31,10,0.35)" }}>
                {i === 1 && <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.1, mixBlendMode: "overlay" }} />}
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="h-14 w-14 rounded-lg grid place-items-center" style={{ background: i === 1 ? C.jaggery : `${C.jaggery}1f`, color: i === 1 ? C.bark : C.jaggeryDark }}>
                      <e.icon className="h-7 w-7" />
                    </div>
                    <span className="font-body font-semibold uppercase rounded-full px-3 py-1.5" style={{ fontSize: 10.5, letterSpacing: "0.14em", background: i === 1 ? "rgba(240,201,109,0.14)" : C.cream, color: i === 1 ? C.jaggeryLite : C.jaggeryDark, border: `1px solid ${i === 1 ? "rgba(240,201,109,0.3)" : C.parchment}` }}>{e.label}</span>
                  </div>
                  <h3 className="font-heading mt-7" style={{ fontSize: "clamp(1.5rem,2.4vw,2rem)", lineHeight: 1.12, color: i === 1 ? C.ivory : C.ink }}>{e.name}</h3>
                  <p className="font-body mt-3" style={{ fontSize: 15, lineHeight: 1.72, color: i === 1 ? "rgba(255,251,244,0.78)" : C.ink2 }}>{e.desc}</p>
                  <dl className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {e.facts.map(([k, v]) => (
                      <div key={k} className="rounded-lg p-4" style={{ background: i === 1 ? "rgba(255,251,244,0.06)" : C.cream, border: `1px solid ${i === 1 ? "rgba(240,201,109,0.2)" : C.parchment}` }}>
                        <dt className="font-body uppercase" style={{ fontSize: 10.5, letterSpacing: "0.16em", color: i === 1 ? C.jaggeryLite : C.jaggeryDark }}>{k}</dt>
                        <dd className="font-body mt-1 font-semibold break-words" style={{ fontSize: 14.5, color: i === 1 ? C.ivory : C.ink }}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Registrations */}
      <section id="registrations" style={{ background: C.cream }}>
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-24">
          <SectionHeading eyebrow="Registrations & compliance" title="What is in place, and what is under way"
            sub="Completed registrations on the left, applications in progress on the right — stated plainly." />
          <div className="mt-12 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2 mb-5" style={{ color: C.green }}>
                <BadgeCheck className="h-5 w-5" />
                <span className="font-body font-semibold uppercase" style={{ fontSize: 12, letterSpacing: "0.16em" }}>Completed</span>
              </div>
              <ul className="space-y-3 list-none m-0 p-0">
                {REGISTRATIONS_DONE.map((r, i) => (
                  <Reveal key={r.t} delay={i * 0.06}>
                    <li className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md" style={{ background: C.ivory, border: `1px solid ${C.parchment}` }}>
                      <span className="h-11 w-11 rounded-full grid place-items-center" style={{ background: `${C.green}14`, color: C.green }}><r.icon className="h-5 w-5" /></span>
                      <div>
                        <div className="font-heading" style={{ fontSize: 20, lineHeight: 1.15, color: C.ink }}>{r.t}</div>
                        <div className="font-body mt-0.5" style={{ fontSize: 13.5, color: C.muted }}>{r.d}{r.ref ? <> · <span style={{ color: C.jaggeryDark, fontWeight: 600 }}>{r.ref}</span></> : null}</div>
                      </div>
                      <span className="h-9 w-9 rounded-full grid place-items-center" style={{ background: C.green, color: C.ivory }}><DrawnCheck delay={0.2 + i * 0.08} /></span>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2 mb-5" style={{ color: C.jaggeryDark }}>
                <Clock3 className="h-5 w-5" />
                <span className="font-body font-semibold uppercase" style={{ fontSize: 12, letterSpacing: "0.16em" }}>In progress</span>
              </div>
              <ul className="space-y-3 list-none m-0 p-0">
                {REGISTRATIONS_PROGRESS.map((r, i) => (
                  <Reveal key={r.t} delay={0.1 + i * 0.06}>
                    <li className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-lg p-5" style={{ background: C.ivory, border: `1px dashed ${C.jaggery}77` }}>
                      <span className="relative h-11 w-11 rounded-full grid place-items-center" style={{ background: `${C.jaggery}1f`, color: C.jaggeryDark }}>
                        <r.icon className="h-5 w-5" />
                        <motion.span aria-hidden className="absolute inset-0 rounded-full" style={{ border: `1.5px dashed ${C.jaggery}` }} animate={reduced ? undefined : { rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} />
                      </span>
                      <div>
                        <div className="font-heading" style={{ fontSize: 19, lineHeight: 1.15, color: C.ink }}>{r.t}</div>
                        <div className="font-body mt-0.5" style={{ fontSize: 13.5, color: C.muted }}>{r.d}</div>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ul>
              <Reveal delay={0.3}>
                <p className="font-body mt-6 rounded-lg p-5" style={{ fontSize: 13.5, lineHeight: 1.65, color: C.ink2, background: `${C.jaggery}14`, border: `1px solid ${C.parchment}` }}>
                  Items listed as in progress are applications or processes not yet granted. We update this page as each is completed.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Learning */}
      <section id="learning" className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.bark}, ${C.barkSoft})` }}>
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.1, mixBlendMode: "overlay" }} />
        <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-24 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <SectionHeading light eyebrow="Quality, learning & compliance" title="Quality is a continuous responsibility, not a checklist"
              sub="To support this mindset, our leadership remains actively engaged in learning related to food safety, food business compliance, product systems and industry-specific development." />
            <Reveal delay={0.2}>
              <div className="mt-8 rounded-lg p-6 flex items-start gap-4" style={{ background: "rgba(255,251,244,0.06)", border: "1px solid rgba(240,201,109,0.25)" }}>
                <GraduationCap className="h-6 w-6 shrink-0 mt-0.5" style={{ color: C.jaggeryLite }} />
                <p className="font-body" style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,251,244,0.8)" }}>
                  Training and course completion records are held in the name of <strong style={{ color: C.jaggeryLite }}>Naveenchandra B R</strong>, Managing Director.
                </p>
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            <ul className="grid sm:grid-cols-2 gap-4 list-none m-0 p-0">
              {COURSES.map((c, i) => (
                <Reveal key={c} delay={i * 0.07}>
                  <li className="group rounded-lg p-6 h-full transition-colors duration-500 hover:bg-[rgba(255,251,244,0.1)]" style={{ background: "rgba(255,251,244,0.05)", border: "1px solid rgba(240,201,109,0.22)" }}>
                    <div className="flex items-center justify-between">
                      <span className="font-heading" style={{ fontSize: 30, lineHeight: 1, color: `${C.jaggeryLite}66` }}>0{i + 1}</span>
                      <span className="h-8 w-8 rounded-full grid place-items-center" style={{ border: "1px solid rgba(240,201,109,0.45)", color: C.jaggeryLite }}><DrawnCheck delay={0.3 + i * 0.08} /></span>
                    </div>
                    <div className="font-heading mt-5" style={{ fontSize: 21, lineHeight: 1.15, color: C.ivory }}>{c}</div>
                    <div className="font-body mt-1.5 uppercase" style={{ fontSize: 10.5, letterSpacing: "0.16em", color: "rgba(255,251,244,0.55)" }}>Course completed</div>
                  </li>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={0.3}>
              <div className="mt-6 rounded-lg p-6 sm:p-7" style={{ background: C.jaggery, color: C.bark }}>
                <div className="font-body font-semibold uppercase" style={{ fontSize: 10.5, letterSpacing: "0.18em" }}>A clear distinction</div>
                <p className="font-body mt-2" style={{ fontSize: 15, lineHeight: 1.7 }}>
                  These course completions support knowledge, training and preparedness. They are <strong>not statutory licences</strong> in themselves, and we do not describe them as such. Respecting both learning and legal accuracy is part of how we earn trust.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Growth note + CTA */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-24">
        <Reveal>
          <div className="rounded-lg p-8 sm:p-12" style={{ background: C.cream, border: `1px solid ${C.parchment}` }}>
            <Eyebrow>Next phase</Eyebrow>
            <h2 className="font-heading mt-4" style={{ fontSize: "clamp(1.7rem,3vw,2.5rem)", lineHeight: 1.1, color: C.ink }}>Technology upgradation and modernisation</h2>
            <p className="font-body mt-4" style={{ fontSize: 15.5, lineHeight: 1.75, color: C.ink2, maxWidth: 760 }}>
              VKC Gold Ikshu is progressing toward the proposed 50 TCD fully automatic, thermic-fluid-based jaggery and sugarcane juice processing project — strengthening production efficiency, process consistency, product quality and infrastructure capability, in line with future-ready manufacturing standards.
            </p>
            {/* Buttons below the copy. On hover a gold fill sweeps in from the left. */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="group relative inline-flex items-center gap-3 pl-6 pr-2 rounded-full font-body font-semibold text-sm overflow-hidden" style={{ height: 50, background: C.bark, color: C.ivory }}>
                <span aria-hidden className="absolute inset-0 -translate-x-full transition-transform duration-500 ease-out group-hover:translate-x-0" style={{ background: C.jaggery }} />
                <span className="relative transition-colors duration-500 group-hover:text-[#3A1F0A]">Business enquiries</span>
                <span className="relative grid place-items-center h-8 w-8 rounded-full transition-all duration-500 group-hover:translate-x-1 group-hover:bg-[#3A1F0A] group-hover:text-[#FFD65C]" style={{ background: C.jaggery, color: C.bark }}><ArrowRight className="h-4 w-4" /></span>
              </Link>
              <Link href="/leadership" className="group relative inline-flex items-center gap-2 px-6 rounded-full font-body font-semibold text-sm overflow-hidden" style={{ height: 50, border: `1px solid ${C.jaggery}88`, color: C.jaggeryDark }}>
                <span aria-hidden className="absolute inset-0 -translate-x-full transition-transform duration-500 ease-out group-hover:translate-x-0" style={{ background: C.jaggeryDark }} />
                <span className="relative transition-colors duration-500 group-hover:text-[#FFFBF4]">Meet the leadership</span>
                <ArrowRight className="relative h-4 w-4 transition-all duration-500 group-hover:translate-x-1 group-hover:text-[#FFFBF4]" />
              </Link>
            </div>
          </div>
        </Reveal>
        <div className="mt-8 flex items-center gap-3 font-body" style={{ fontSize: 12.5, color: C.muted }}>
          <Sprout className="h-4 w-4" style={{ color: C.green }} />
          Registered office: Ballenahalli Village, Srirangapatna Taluk, Mandya District, Karnataka – 571807
        </div>
      </section>
    </div>
  );
}
