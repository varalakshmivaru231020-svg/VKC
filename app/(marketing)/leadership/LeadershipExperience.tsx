"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { C, Cta, Label, NumberGrid, Photo, Reveal, Section, SectionHead, T, Words } from "@/components/about/heritage";

/**
 * Leadership — who is carrying the legacy forward. Six movements, light and
 * flat: hero, the Managing Director as the featured profile, the supporting
 * leadership, what the leadership stands on, where we began and where we are
 * going, and a close. The founder's story lives on /founder and the company
 * story on /about; nothing here repeats them. Every photograph is real.
 */

const PEOPLE = {
  founder: { name: "Late Shri B Ramachandra", role: "Founder", photo: "/images/team/ramachandra-b.webp" },
  md: { name: "Naveenchandra B R", role: "Managing Director", photo: "/images/team/naveenchandra-b-r.webp" },
  director: { name: "Abhishek B R", role: "Director", photo: "/images/team/abhishek-b-r.webp", bio: "Contributes to the growth of the business with dedication, energy and a progressive approach — supporting the family legacy with commitment and operational focus." },
  promoter: { name: "Mrs. Pushpalatha", role: "Promoter Director", photo: "/images/team/pushpalatha.webp", bio: "A pillar of strength in our family journey, standing with unwavering support through every challenge and preserving the unity, resilience and values behind our legacy." },
};

const MD_PROFILE = [
  "Naveenchandra B R now leads the VKC legacy forward with a clear commitment to purity, trust and long-term growth. Carrying the values established by Late Shri B Ramachandra, he represents the next chapter of the business with a practical, disciplined and forward-looking approach. His leadership is focused on preserving what matters most — credibility, quality and relationships — while building a stronger and more structured future for the brand.",
  "Under his direction, the business continues to strengthen its foundation through formal registrations, quality awareness, and ongoing learning in food safety, compliance and product-related knowledge. This leadership style reflects both continuity and progress: loyal to the roots, but unafraid to modernise where needed.",
];

const VALUES = [
  { t: "Discipline", d: "The standard set in 1988 and kept since: a practical, disciplined approach to every decision, from the field to the finished pack." },
  { t: "Purity", d: "Chemical-free jaggery with nothing artificial added — the product, and the principle behind it." },
  { t: "Trust", d: "Credibility, quality and relationships come first: with the farmers who grow the cane, the customers who buy from us, and the family itself." },
  { t: "Responsibility", d: "Formal registrations, quality awareness and ongoing learning in food safety and compliance — loyal to the roots, unafraid to modernise where needed." },
];

const BEGAN = ["M/s Vairamudi Krupa Crusher, set up by Late Shri B Ramachandra", "Fair dealing with the farmers who grow the cane", "Purity as the standard, not a slogan"];
const GOING = ["VKC Jaggery & Beverages Private Limited, incorporated 2025", "A proposed 50 TCD automatic jaggery and cane-juice processing unit", "Ongoing learning in food safety, labelling and compliance"];

/* One half of Where we began / Where we're going. With an uploaded photo the
   image carries the panel; without one it is a clean typographic panel led by
   the year. */
function Panel({ image, year, label, title, facts, tint, link }: { image: string | null; year: string; label: string; title: string; facts: string[]; tint: "cream" | "white"; link?: { href: string; label: string } }) {
  const dark = Boolean(image);
  return (
    <div className="relative overflow-hidden flex items-end" style={{ background: tint === "cream" ? C.cream : C.white, minHeight: image ? "clamp(420px, 40vw, 560px)" : undefined, borderRadius: 4 }}>
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
          <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(43,23,8,0) 35%, rgba(43,23,8,0.8) 100%)" }} />
        </>
      )}
      <div className="relative p-8 sm:p-10 lg:p-12 w-full">
        {!image && <div style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(3rem,6vw,5rem)", lineHeight: 1, color: "rgba(43,23,8,0.14)", letterSpacing: "-0.03em" }} aria-hidden>{year}</div>}
        <div className={image ? "" : "mt-6"}><Label light={dark}>{label}</Label></div>
        <h3 className="mt-4" style={{ ...T.h2, fontSize: "clamp(1.6rem,2.8vw,2.3rem)", color: dark ? C.onDark : C.ink }}>{title}</h3>
        <ul className="mt-5 space-y-2.5 list-none m-0 p-0 font-body" style={{ ...T.small, color: dark ? C.onDarkMuted : C.ink2 }}>
          {facts.map((f) => (
            <li key={f} className="flex gap-3"><span aria-hidden className="mt-[0.75em] h-px w-4 shrink-0" style={{ background: C.gold }} />{f}</li>
          ))}
        </ul>
        {link && (
          <Link href={link.href} className="group mt-6 inline-flex items-center gap-2 font-body font-semibold" style={{ fontSize: 14, color: dark ? C.jaggery : C.gold }}>
            {link.label} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function LeadershipExperience({ bannerImage = null, bannerAlt = "", heritageImage = null, futureImage = null, ctaImage = null, ctaImageMobile = null }: {
  bannerImage?: string | null; bannerAlt?: string; heritageImage?: string | null; futureImage?: string | null;
  /** Admin → Banners, position "cta_background" — shared by every closing CTA. */
  ctaImage?: string | null; ctaImageMobile?: string | null;
}) {
  return (
    <div className="vkc-about" style={{ background: C.ivory }}>
      <style dangerouslySetInnerHTML={{ __html:
        ".marketing-layout .vkc-about p{text-align:left;hyphens:none;text-justify:auto}" +
        ".marketing-layout .vkc-about .text-center p{text-align:center}"
      }} />

      {/* ── 1 · HERO ─────────────────────────────────────────────────────── */}
      {bannerImage && (
        <div style={{ background: C.cream }} aria-label={bannerAlt || undefined}>
          <img src={bannerImage} alt={bannerAlt} className="block w-full h-auto" />
        </div>
      )}
      <section aria-labelledby="leadership-heading" style={{ background: C.ivory }}>
        <div className={`max-w-[1200px] mx-auto px-5 sm:px-8 ${bannerImage ? "py-16 sm:py-20" : "pt-24 pb-20 sm:pt-32 sm:pb-28"}`}>
          <div className="grid lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <Label>The people behind the legacy</Label>
              <h1 id="leadership-heading" className="mt-5" style={{ ...T.display, color: C.ink }}>
                <Words text="Carrying a legacy forward." />
              </h1>
            </div>
            <Reveal delay={0.25} className="lg:col-span-4 lg:pb-2">
              <p className="font-body" style={{ ...T.lede, color: C.ink2 }}>
                From the values established by Late Shri B Ramachandra to the vision shaping VKC Gold Ikshu today, our leadership combines heritage, discipline and a forward-looking approach.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 2 · MANAGING DIRECTOR ────────────────────────────────────────── */}
      <Section bg="white" ariaLabelledby="md-heading">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <Reveal className="lg:col-span-5">
            <Photo src={PEOPLE.md.photo} alt={PEOPLE.md.name} priority />
          </Reveal>
          <div className="lg:col-span-7 lg:pt-4">
            <Label>Managing Director</Label>
            <h2 id="md-heading" className="mt-5" style={{ ...T.h2, color: C.ink }}><Words text={PEOPLE.md.name} /></h2>
            <Reveal delay={0.1}>
              <p className="mt-6" style={{ ...T.quote, color: C.ink, maxWidth: 560 }}>
                Carrying the family legacy forward with a focus on quality, compliance and long-term brand building.
              </p>
              <div className="mt-6 space-y-4 font-body" style={{ ...T.body, color: C.ink2, maxWidth: 600 }}>
                {MD_PROFILE.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
              </div>
              <div className="mt-8 grid grid-cols-3 gap-6 max-w-md" style={{ borderTop: `1px solid ${C.line}` }}>
                {["Quality", "Compliance", "Long-term vision"].map((t) => (
                  <div key={t} className="pt-4 font-body" style={{ ...T.label, color: C.ink, letterSpacing: "0.16em", fontSize: 10.5 }}>{t}</div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/credentials#learning" className="group inline-flex items-center gap-2 font-body font-semibold" style={{ fontSize: 14.5, color: C.gold }}>
                  Registrations, learning and compliance <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ── 3 · SUPPORTING LEADERSHIP ────────────────────────────────────── */}
      <Section ariaLabelledby="team-heading">
        <SectionHead id="team-heading" label="Supporting leadership" title="The team behind the vision" />
        <div className="mt-14 grid md:grid-cols-2 gap-10 lg:gap-14">
          {[PEOPLE.director, PEOPLE.promoter].map((p, i) => (
            <Reveal key={p.name} delay={i * 0.12}>
              <Photo src={p.photo} alt={p.name} name={p.name} role={p.role} />
              <p className="font-body mt-6" style={{ ...T.body, color: C.ink2 }}>{p.bio}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── 4 · WHAT THE LEADERSHIP STANDS ON ────────────────────────────── */}
      <Section bg="white" ariaLabelledby="values-heading">
        <SectionHead id="values-heading" label="What the leadership stands on" title="Leadership rooted in values." />
        <div className="mt-14"><NumberGrid items={VALUES} cols={4} /></div>
      </Section>

      {/* ── 5 · WHERE WE BEGAN / WHERE WE'RE GOING ───────────────────────── */}
      <Section ariaLabelledby="heritage-future-heading">
        <SectionHead id="heritage-future-heading" label="Heritage → future" title="Honouring where we began. Building where we're going." center />
        <div className="mt-14 grid md:grid-cols-2 gap-4">
          <Panel image={heritageImage} year="1988" label="Where we began" title="A crusher in Mandya." facts={BEGAN} tint="cream" link={{ href: "/founder", label: "The founder tribute" }} />
          <Panel image={futureImage} year="2025" label="Where we're going" title="A structured, future-ready business." facts={GOING} tint="white" link={{ href: "/credentials#registrations", label: "Registrations and compliance" }} />
        </div>
      </Section>

      {/* ── 6 · CLOSE ────────────────────────────────────────────────────── */}
      <Cta
        title="The legacy continues."
        lede="Built on values. Guided by experience. Focused on the future."
        primary={{ href: "/about", label: "Explore our story" }}
        secondary={{ href: "/shop", label: "Discover our products" }}
        image={ctaImage}
        mobileImage={ctaImageMobile}
      />
    </div>
  );
}
