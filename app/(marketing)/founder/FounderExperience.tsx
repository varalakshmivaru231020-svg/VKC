"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Atmosphere, C, Eyebrow, MILESTONES, Portrait, Reveal, SectionHeading, Words } from "@/components/about/heritage";

/* The founder's values, as the family names them. */
const VALUES = [
  { t: "Discipline", d: "A standard set by example, day after day." },
  { t: "Sincerity", d: "Honest effort in every dealing, with farmers and customers alike." },
  { t: "Purity", d: "Nothing added and nothing hidden — in the product and in the principle." },
  { t: "Trust", d: "Earned with a family, a community and a trade, and kept." },
];

export default function FounderExperience() {
  return (
    <div className="vkc-about" style={{ background: C.ivory }}>
      <style dangerouslySetInnerHTML={{ __html:
        ".marketing-layout .vkc-about p{text-align:left;hyphens:none;text-justify:auto}" +
        ".marketing-layout .vkc-about .text-center p{text-align:center}"
      }} />

      {/* ── 1 · IN REVERED MEMORY ────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: C.espresso }} aria-labelledby="founder-heading">
        <Atmosphere opacity={0.14} />
        <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 pt-24 pb-20 sm:pt-32 sm:pb-28 text-center">
          <Reveal y={16}><Eyebrow color={C.jaggeryLite}>Founder tribute</Eyebrow></Reveal>
          <h1 id="founder-heading" className="font-heading mt-7 mx-auto" style={{ fontSize: "clamp(2.4rem,6.4vw,5.4rem)", lineHeight: 1.02, letterSpacing: "-0.03em", color: C.ivory, maxWidth: 900 }}>
            <Words text="In Revered Memory of Our Founder" accent="Founder" />
          </h1>
          <Reveal delay={0.35}>
            <div className="mt-10 font-heading" style={{ fontSize: "clamp(1.5rem,2.6vw,2.2rem)", lineHeight: 1.15, color: C.jaggeryLite }}>Late Shri B Ramachandra</div>
            <p className="font-body mt-3 mx-auto" style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,251,244,0.72)", maxWidth: 520, textAlign: "center", fontStyle: "italic" }}>
              Founder and guiding inspiration behind our family legacy
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 2 · THE PHOTOGRAPH ───────────────────────────────────────────── */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <Reveal className="lg:col-span-5 max-w-[460px] w-full mx-auto lg:mx-0">
            <Portrait src="/images/team/ramachandra-b.webp" alt="Late Shri B Ramachandra" priority caption="Late Shri B Ramachandra · Founder" />
          </Reveal>
          <div className="lg:col-span-7">
            <Reveal delay={0.1}>
              <Eyebrow>The soul of our journey</Eyebrow>
              <p className="font-heading mt-6" style={{ fontSize: "clamp(1.5rem,2.6vw,2.2rem)", lineHeight: 1.3, color: C.ink }}>
                Late Shri B Ramachandra remains the soul of our journey. His values, work ethic, and commitment to purity gave direction not only to a business, but to a family identity built on trust.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 font-body font-semibold uppercase" style={{ fontSize: 11.5, letterSpacing: "0.2em", color: C.jaggeryDark }}>
                {VALUES.map((v, i) => (
                  <span key={v.t} className="inline-flex items-center gap-5">{i > 0 && <span aria-hidden style={{ color: C.jaggery }}>·</span>}{v.t}</span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 3 · HIS VALUES ───────────────────────────────────────────────── */}
      <section style={{ background: C.cream }}>
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <SectionHeading eyebrow="His values" title="The values he lived by" accent="lived" />
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12">
            {VALUES.map((v, i) => (
              <Reveal key={v.t} delay={i * 0.08}>
                <div className="pt-6" style={{ borderTop: `1px solid ${C.parchment}` }}>
                  <div className="font-heading" style={{ fontSize: "clamp(2.6rem,4.5vw,3.6rem)", lineHeight: 1, color: `${C.jaggery}99`, letterSpacing: "-0.02em" }}>0{i + 1}</div>
                  <h3 className="font-heading mt-5" style={{ fontSize: 26, lineHeight: 1.1, color: C.ink }}>{v.t}</h3>
                  <p className="font-body mt-3" style={{ fontSize: 15, lineHeight: 1.7, color: C.ink2 }}>{v.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 · HIS CONTRIBUTION ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${C.bark}, ${C.barkSoft})` }}>
        <Atmosphere />
        <div className="relative max-w-[1100px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <Reveal><Eyebrow color={C.jaggeryLite}>His contribution</Eyebrow></Reveal>
          <h2 className="font-heading mt-7" style={{ fontSize: "clamp(2rem,4.6vw,3.9rem)", lineHeight: 1.06, letterSpacing: "-0.02em", color: C.ivory, maxWidth: 900 }}>
            <Words text="His contribution cannot be measured only in years or milestones." accent="measured" />
          </h2>
          <Reveal delay={0.25}>
            <p className="font-body mt-8" style={{ fontSize: "clamp(1.05rem,1.4vw,1.25rem)", lineHeight: 1.75, color: "rgba(255,251,244,0.8)", maxWidth: 720 }}>
              It lives on in the standards we uphold, in the sincerity with which we approach our work, and in the relationships we continue to value.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 5 · LEGACY TIMELINE ──────────────────────────────────────────── */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <SectionHeading eyebrow="Legacy timeline" title="From a single crusher to a family legacy" accent="legacy" />
        <div className="mt-14 relative">
          <div aria-hidden className="hidden sm:block absolute top-3 bottom-3" style={{ left: 27, width: 1, background: `linear-gradient(${C.jaggery}, ${C.parchment} 80%, transparent)` }} />
          <ol className="space-y-6 list-none m-0 p-0">
            {MILESTONES.map((m, i) => (
              <Reveal key={m.t} delay={i * 0.08}>
                <li className="flex gap-5 sm:gap-8">
                  <div className="shrink-0 h-14 w-14 rounded-full grid place-items-center font-heading" style={{ fontSize: 12.5, background: C.ivory, border: `1.5px solid ${C.jaggery}`, color: C.jaggeryDark, boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}>{m.year}</div>
                  <div className="flex-1 rounded-lg p-6 sm:p-7" style={{ background: "white", border: `1px solid ${C.parchment}` }}>
                    <h3 className="font-heading" style={{ fontSize: 24, lineHeight: 1.12, color: C.ink }}>{m.t}</h3>
                    <p className="font-body mt-2" style={{ fontSize: 15, lineHeight: 1.7, color: C.ink2 }}>{m.d}</p>
                  </div>
                </li>
              </Reveal>
            ))}
            <Reveal delay={0.35}>
              <li className="flex gap-5 sm:gap-8">
                <div className="shrink-0 h-14 w-14 rounded-full grid place-items-center font-heading" style={{ fontSize: 12.5, background: C.bark, border: `1.5px solid ${C.bark}`, color: C.jaggeryLite }}>Today</div>
                <div className="flex-1 rounded-lg p-6 sm:p-7" style={{ background: C.cream, border: `1px solid ${C.parchment}` }}>
                  <h3 className="font-heading" style={{ fontSize: 24, lineHeight: 1.12, color: C.ink }}>The legacy carried forward</h3>
                  <p className="font-body mt-2" style={{ fontSize: 15, lineHeight: 1.7, color: C.ink2 }}>Naveenchandra B R leads the business today, with the same commitment to purity, trust and long-term growth.</p>
                  <Link href="/leadership" className="mt-4 inline-flex items-center gap-2 font-body font-semibold" style={{ fontSize: 13.5, color: C.jaggeryDark }}>
                    Meet the family today <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            </Reveal>
          </ol>
        </div>
      </section>

      {/* ── 6 · CLOSING TRIBUTE ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: C.espresso }}>
        <Atmosphere glow={false} opacity={0.14} />
        <div className="relative max-w-[1100px] mx-auto px-5 sm:px-8 py-28 sm:py-40 text-center">
          <h2 className="font-heading" style={{ fontSize: "clamp(2.2rem,5.6vw,4.8rem)", lineHeight: 1.04, letterSpacing: "-0.03em", color: C.ivory }}>
            <span className="block"><Words text="A legacy remembered." /></span>
            <span className="block mt-2"><Words text="A standard continued." accent="continued." /></span>
          </h2>
          <Reveal delay={0.4}>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <Link href="/about" className="group inline-flex items-center gap-3 pl-7 pr-2 rounded-full font-body font-semibold text-sm transition-transform duration-300 hover:-translate-y-0.5" style={{ height: 52, background: C.jaggery, color: C.bark }}>
                Our story
                <span className="grid place-items-center h-9 w-9 rounded-full transition-transform duration-300 group-hover:translate-x-1" style={{ background: C.bark, color: C.jaggeryLite }}><ArrowRight className="h-4 w-4" /></span>
              </Link>
              <Link href="/leadership" className="group inline-flex items-center gap-2 px-7 rounded-full font-body font-semibold text-sm" style={{ height: 52, border: "1px solid rgba(255,214,92,0.45)", color: C.jaggeryLite, background: "rgba(255,251,244,0.05)" }}>
                The family today <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
