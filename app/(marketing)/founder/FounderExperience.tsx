"use client";

import { Button, C, Label, MILESTONES, NumberGrid, Photo, Reveal, Section, SectionHead, T, Timeline, Words } from "@/components/about/heritage";

/**
 * Founder — where the values began. A tribute in six quiet movements: the
 * dedication, the photograph, his values, his contribution, the legacy on one
 * rule, and a closing line. Light and flat, with one dark movement (his
 * contribution). Only the family's own words; only the real photograph.
 */

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
      <section aria-labelledby="founder-heading" style={{ background: C.ivory }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-24 pb-16 sm:pt-32 sm:pb-20 text-center">
          <Label>Founder tribute</Label>
          <h1 id="founder-heading" className="mt-5 mx-auto" style={{ ...T.display, color: C.ink, maxWidth: 900 }}>
            <Words text="In Revered Memory of Our Founder" />
          </h1>
          <Reveal delay={0.3}>
            <div className="mt-8" style={{ ...T.h3, color: C.ink }}>Late Shri B Ramachandra</div>
            <p className="font-body mt-2 mx-auto" style={{ ...T.small, color: C.muted, textAlign: "center", fontStyle: "italic" }}>
              Founder and guiding inspiration behind our family legacy
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 2 · THE PHOTOGRAPH ───────────────────────────────────────────── */}
      <Section bg="white">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <Reveal className="lg:col-span-5 max-w-[480px] w-full mx-auto lg:mx-0">
            <Photo src="/images/team/ramachandra-b.webp" alt="Late Shri B Ramachandra" priority />
          </Reveal>
          <div className="lg:col-span-7">
            <Reveal delay={0.1}>
              <Label>The soul of our journey</Label>
              <p className="mt-6" style={{ ...T.quote, color: C.ink, maxWidth: 640 }}>
                Late Shri B Ramachandra remains the soul of our journey. His values, work ethic, and commitment to purity gave direction not only to a business, but to a family identity built on trust.
              </p>
              <div className="mt-7 font-body" style={{ ...T.label, color: C.gold, letterSpacing: "0.18em" }}>Discipline · Sincerity · Purity · Trust</div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ── 3 · HIS VALUES ───────────────────────────────────────────────── */}
      <Section ariaLabelledby="values-heading">
        <SectionHead id="values-heading" label="His values" title="The values he lived by" />
        <div className="mt-14"><NumberGrid items={VALUES} cols={4} /></div>
      </Section>

      {/* ── 4 · HIS CONTRIBUTION — the one dark movement ─────────────────── */}
      <Section bg="dark" ariaLabelledby="contribution-heading">
        <div className="max-w-3xl">
          <Label light>His contribution</Label>
          <h2 id="contribution-heading" className="mt-5" style={{ ...T.h2, color: C.onDark }}>
            <Words text="His contribution cannot be measured only in years or milestones." />
          </h2>
          <Reveal delay={0.2}>
            <p className="font-body mt-7" style={{ ...T.lede, color: C.onDarkMuted, maxWidth: 640 }}>
              It lives on in the standards we uphold, in the sincerity with which we approach our work, and in the relationships we continue to value.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* ── 5 · THE LEGACY ON ONE RULE ───────────────────────────────────── */}
      <Section bg="white" ariaLabelledby="timeline-heading">
        <SectionHead id="timeline-heading" label="Legacy timeline" title="From a single crusher to a family legacy" />
        <div className="mt-14">
          <Timeline items={[...MILESTONES.slice(0, 3), { year: "Today", t: "The legacy carried forward", d: "Naveenchandra B R leads the business today, with the same commitment to purity, trust and long-term growth.", href: "/leadership", cta: "Meet the family today" }]} />
        </div>
      </Section>

      {/* ── 6 · CLOSING TRIBUTE ──────────────────────────────────────────── */}
      <Section ariaLabelledby="closing-heading">
        <div className="text-center max-w-3xl mx-auto py-6 sm:py-10">
          <h2 id="closing-heading" style={{ ...T.display, color: C.ink }}>
            <span className="block"><Words text="A legacy remembered." /></span>
            <span className="block"><Words text="A standard continued." /></span>
          </h2>
          <Reveal delay={0.35}>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button href="/about">Our story</Button>
              <Button href="/leadership" variant="outline">The family today</Button>
            </div>
          </Reveal>
        </div>
      </Section>
    </div>
  );
}
