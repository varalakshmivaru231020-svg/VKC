"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button, C, Cta, Facts, Label, MILESTONES, NumberGrid, Photo, Reveal, Section, SectionHead, T, Timeline, Words } from "@/components/about/heritage";
import { PageBanner, type PageBannerProps } from "@/components/layout/PageBanner";

/**
 * About Us — who we are, in seven movements: hero, the story with its
 * milestones, the two people behind the name, what we stand for, vision and
 * mission, the formal foundation, and a closing call to action. Light and
 * flat throughout, with one dark movement (vision and mission) and a dark
 * close. Every word is the family's own; the photographs are real.
 */

const STAND_FOR = [
  { t: "Legacy-led Values", d: "Grounded in trust, discipline and authenticity — the standard set in 1988 and kept since." },
  { t: "Purity First", d: "Chemical-free, 100% natural production with nothing artificial added, from cane to pack." },
  { t: "Fair Pricing", d: "Honest, dependable rates paid directly to the farmers who grow our cane." },
  { t: "Transparent Dealings", d: "Clear, straightforward transactions that farmers and customers can trust. No middlemen, no surprises." },
  { t: "Forward-looking Leadership", d: "The next chapter built under Naveenchandra B R, with modern, energy-efficient processing true to our ancestral values." },
  { t: "Learning & Compliance", d: "Formal registrations, food-safety training and responsible business practice." },
];

const VISION = "To make VKC Gold Ikshu a trusted global brand representing Mandya’s heritage of purity, health, and sweetness.";

const CORE_VALUES = [
  "Purity and Quality First",
  "Support to Local Farmers",
  "Sustainable Manufacturing",
  "Innovation with Tradition",
  "Customer Trust and Satisfaction",
];

const MISSION = [
  { t: "Farmer Empowerment", d: "Fair prices and direct partnerships that strengthen rural communities around Mandya." },
  { t: "Chemical-Free Production", d: "100% natural processing with nothing artificial added, ever." },
  { t: "Innovation & Quality", d: "Modern machinery and consistent quality in every batch we make." },
  { t: "Sustainable Growth", d: "Eco-friendly manufacturing that reduces waste as we grow." },
  { t: "Global Expansion", d: "Taking Mandya’s natural sweetness to markets across India and beyond." },
];

export default function AboutExperience({
  phone = "+91 95916 08382",
  whatsapp = "919591608382",
  email = "info@vkccanegold.co.in",
  banner,
  ctaImage = null,
  ctaImageMobile = null,
  introImage = null,
  introImageMobile = null,
  introAlt = "",
  visionImage = null,
  visionImageMobile = null,
}: {
  phone?: string;
  whatsapp?: string;
  email?: string;
  /** The standard inner-page banner: words from lib/page-banners.ts, photograph from Admin → Banners ("about_banner"). */
  banner: PageBannerProps;
  /** Admin → Banners, position "cta_background" — shared by every closing CTA. */
  ctaImage?: string | null;
  ctaImageMobile?: string | null;
  /** Admin → Banners, position "about_intro" — the photograph beside the introduction. */
  introImage?: string | null;
  introImageMobile?: string | null;
  introAlt?: string;
  /** Admin → Banners, position "about_vision_bg" — the picture behind Vision and Mission. */
  visionImage?: string | null;
  visionImageMobile?: string | null;
}) {

  return (
    <div className="vkc-about" style={{ background: C.ivory }}>
      <style dangerouslySetInnerHTML={{ __html:
        ".marketing-layout .vkc-about p{text-align:left;hyphens:none;text-justify:auto}" +
        ".marketing-layout .vkc-about .text-center p{text-align:center}"
      }} />

      {/* ── 1 · BANNER — the standard inner-page banner (components/layout/PageBanner) ── */}
      <PageBanner {...banner} />

      {/* ── 1b · INTRODUCTION, WITH ITS PHOTOGRAPH ───────────────────────── */}
      {/* The opening statement beside a photograph from Admin → Banners
          ("about_intro"). The picture is shown whole at its own proportions —
          never cropped — so a portrait, a landscape or a finished poster all
          sit correctly. Until one is uploaded the words take the full width. */}
      <section aria-labelledby="intro-heading" style={{ background: C.ivory }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14 sm:py-20">
          <div className={`grid gap-10 lg:gap-16 items-center ${introImage ? "lg:grid-cols-12" : ""}`}>
            <div className={introImage ? "lg:col-span-6" : "max-w-3xl"}>
              <Label>About VKC Gold Ikshu</Label>
              <h2 id="intro-heading" className="mt-5" style={{ ...T.display, fontSize: "clamp(2.3rem,4.6vw,3.9rem)", color: C.ink }}>
                <span className="block"><Words text="Rooted in Legacy." /></span>
                <span className="block"><Words text="Guided by Purpose." /></span>
              </h2>
              <Reveal delay={0.2}>
                <p className="font-body mt-6" style={{ ...T.lede, color: C.ink2, maxWidth: 520 }}>
                  A family journey shaped by discipline, sincerity, purity, and a lasting connection with agriculture.
                </p>
                <div className="mt-7 flex flex-wrap gap-x-3 gap-y-1 font-body" style={{ ...T.label, color: C.muted, letterSpacing: "0.16em", fontSize: 10.5 }}>
                  {["Legacy", "Integrity", "Natural Sweeteners", "Future-Ready Growth"].map((t, i) => (
                    <span key={t} className="inline-flex items-center gap-3">{i > 0 && <span aria-hidden style={{ color: C.gold }}>·</span>}{t}</span>
                  ))}
                </div>
              </Reveal>
            </div>
            {introImage && (
              <Reveal delay={0.15} className="lg:col-span-6">
                <figure className="m-0 overflow-hidden" style={{ borderRadius: 6, background: C.cream, boxShadow: "0 18px 50px -24px rgba(43,23,8,0.35)" }}>
                  <picture>
                    {introImageMobile && introImageMobile !== introImage && <source media="(max-width: 767px)" srcSet={introImageMobile} />}
                    <img src={introImage} alt={introAlt || "VKC Gold Ikshu"} loading="lazy" decoding="async" className="block w-full h-auto" style={{ maxHeight: 620, objectFit: "contain" }} />
                  </picture>
                </figure>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* ── 2 · THE STORY, WITH ITS MILESTONES ───────────────────────────── */}
      <Section bg="white" id="story" ariaLabelledby="story-heading">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7">
            <SectionHead id="story-heading" label="Our story" title="A legacy that continues to grow" />
            <Reveal delay={0.1}>
              <div className="mt-8 space-y-5 font-body" style={{ ...T.body, color: C.ink2, maxWidth: 600 }}>
                <p>Our journey is inspired by the vision of <strong style={{ color: C.ink, fontWeight: 600 }}>Late Shri B Ramachandra</strong>, whose values of discipline, sincerity, and purity laid the foundation for our family’s jaggery tradition.</p>
                <p>What began as a legacy rooted in honest effort and agricultural connection continues today through a new generation of leadership.</p>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.2} className="lg:col-span-5 lg:pt-16">
            <blockquote className="m-0 pl-6" style={{ borderLeft: `2px solid ${C.gold}` }}>
              <p style={{ ...T.quote, color: C.ink }}>
                We do not see tradition as something old and static; we see it as a living promise that must stay genuine while growing stronger with time.
              </p>
            </blockquote>
          </Reveal>
        </div>
        <div className="mt-20">
          <Timeline items={MILESTONES} />
        </div>
      </Section>

      {/* ── 3 · THE PEOPLE BEHIND THE NAME ───────────────────────────────── */}
      <Section ariaLabelledby="people-heading">
        <SectionHead id="people-heading" label="Founder & leadership" title="The people behind the name" lede="Where the values began, and who carries them forward." />
        <div className="mt-14 grid md:grid-cols-2 gap-10 lg:gap-14">
          <Reveal>
            <Photo src="/images/team/ramachandra-b.webp" alt="Late Shri B Ramachandra" priority name="Late Shri B Ramachandra" role="Founder" />
            <p className="font-body mt-6" style={{ ...T.body, color: C.ink2 }}>
              Late Shri B Ramachandra remains the soul of our journey. His values, work ethic, and commitment to purity gave direction not only to a business, but to a family identity built on trust.
            </p>
            <div className="mt-4 font-body" style={{ ...T.label, color: C.gold, letterSpacing: "0.18em" }}>Discipline · Sincerity · Purity · Trust</div>
            <div className="mt-6"><Button href="/founder" variant="outline">Discover his legacy</Button></div>
          </Reveal>
          <Reveal delay={0.12}>
            <Photo src="/images/team/naveenchandra-b-r.webp" alt="Naveenchandra B R" priority name="Naveenchandra B R" role="Managing Director" />
            <p className="font-body mt-6" style={{ ...T.body, color: C.ink2 }}>
              Today, Naveenchandra B R carries this legacy forward with a clear focus on quality, compliance, and long-term brand building. The aim is simple but powerful: preserve the trust earned through values, while building a future-ready business in natural sweeteners and jaggery-based products.
            </p>
            <div className="mt-4 font-body" style={{ ...T.label, color: C.gold, letterSpacing: "0.18em" }}>Heritage · Quality · Direction</div>
            <div className="mt-6"><Button href="/leadership" variant="outline">Meet the leadership</Button></div>
          </Reveal>
        </div>
      </Section>

      {/* ── 4 · WHAT WE STAND FOR ────────────────────────────────────────── */}
      <Section bg="white" ariaLabelledby="standfor-heading">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end">
          <div className="lg:col-span-7">
            <SectionHead id="standfor-heading" label="What we stand for" title="Sustainability begins at the roots — with farmers." />
          </div>
          <Reveal delay={0.15} className="lg:col-span-5">
            <p className="font-body" style={{ ...T.body, color: C.ink2 }}>
              Our mission is to empower rural communities by ensuring fair pricing, transparent transactions, and access to modern, chemical-free production systems.
            </p>
          </Reveal>
        </div>
        <div className="mt-14"><NumberGrid items={STAND_FOR} cols={3} /></div>
      </Section>

      {/* ── 5 · VISION & MISSION ─────────────────────────────────────────── */}
      {/* Deep-brown two-column panel — pale-gold headings, white reading text.
          The colour itself is the backdrop — no photograph sits behind the
          words unless one is uploaded, in which case it sits under the same
          brown tint so the white text stays legible over any image. */}
      <section aria-labelledby="vision-heading" style={{ background: C.ivory }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <Reveal>
            <div
              className="relative overflow-hidden rounded-md px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16"
              style={{ background: "var(--color-text-primary)", color: "#FFFFFF" }}
            >
              {visionImage && (
                <div aria-hidden className="absolute inset-0">
                  <picture>
                    {visionImageMobile && visionImageMobile !== visionImage && <source media="(max-width: 767px)" srcSet={visionImageMobile} />}
                    <img src={visionImage} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </picture>
                  <div className="absolute inset-0" style={{ background: "var(--color-text-primary)", opacity: 0.84 }} />
                </div>
              )}
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 90% at 100% 0%, rgba(255,214,92,0.22) 0%, rgba(255,214,92,0) 60%)" }} />
              <div className="relative grid lg:grid-cols-2 gap-x-14 gap-y-12">
                <div>
                  <h2 id="vision-heading" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "clamp(2rem,3.4vw,2.8rem)", lineHeight: 1.05, color: "#FFE27A", margin: 0 }}>Our Vision</h2>
                  <p className="font-body mt-5" style={{ fontSize: 17.5, lineHeight: 1.75, color: "#FFFFFF", maxWidth: 520 }}>{VISION}</p>

                  <h3 className="mt-9" style={{ fontFamily: "var(--font-body)", fontSize: 17.5, fontWeight: 600, letterSpacing: 0, color: "#FFFFFF", margin: "2.25rem 0 0" }}>Core Values</h3>
                  <ul className="m-0 mt-3 p-0 list-none space-y-2.5">
                    {CORE_VALUES.map((v) => (
                      <li key={v} className="font-body flex gap-3" style={{ fontSize: 17, lineHeight: 1.6, color: "#FFFFFF" }}>
                        <span aria-hidden className="mt-[0.62em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#FFE27A" }} />
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "clamp(2rem,3.4vw,2.8rem)", lineHeight: 1.05, color: "#FFE27A", margin: 0 }}>Our Mission</h2>
                  <p className="font-body mt-5" style={{ fontSize: 17.5, lineHeight: 1.75, color: "#FFFFFF" }}>We are committed to:</p>
                  <ul className="m-0 mt-3 p-0 list-none space-y-3">
                    {MISSION.map((m) => (
                      <li key={m.t} className="font-body flex gap-3" style={{ fontSize: 17, lineHeight: 1.65, color: "#FFFFFF" }}>
                        <span aria-hidden className="mt-[0.62em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#FFE27A" }} />
                        <span><strong style={{ fontWeight: 700 }}>{m.t}:</strong> {m.d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 6 · A FORMAL FOUNDATION ──────────────────────────────────────── */}
      <Section ariaLabelledby="formal-heading">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-6">
            <SectionHead id="formal-heading" label="Formal foundation" title="A legacy with a formal foundation" />
            <Reveal delay={0.1}>
              {/* Names exactly as on the Udyam Registration Certificate and the GST
                  certificate — reviewers (SMS/DLT, payments) compare them with the site. */}
              <p className="font-body mt-7" style={{ ...T.body, color: C.ink2, maxWidth: 520 }}>
                The business is formally registered under Udyam as <strong style={{ color: C.ink, fontWeight: 600 }}>VKC CANEGOLD IKSHU ZUCKER PURE</strong> — a proprietorship of Naveenchandra B R, classified as a micro manufacturing enterprise. For the next phase of structured growth, <strong style={{ color: C.ink, fontWeight: 600 }}>VKC JAGGERY &amp; BEVERAGES PRIVATE LIMITED</strong> was incorporated in December 2025.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.15} className="lg:col-span-6 lg:pt-14">
            <Facts rows={[["Enterprise", "VKC CANEGOLD IKSHU ZUCKER PURE"], ["Constitution", "Proprietorship — Naveenchandra B R"], ["Udyam No.", "UDYAM-KR-21-0019065 · Micro · Manufacturing"], ["GST trade name", "Vairamudi Krupa Crusher"]]} />
            <div className="pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
              <Link href="/credentials" className="group inline-flex items-center gap-2 font-body font-semibold" style={{ fontSize: 14.5, color: C.gold }}>
                View credentials <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── 7 · CLOSE ────────────────────────────────────────────────────── */}
      <Cta
        label="Taste the difference"
        title="Discover the products this legacy stands behind."
        lede="Pure, chemical-free jaggery and cane products from Mandya — made the way the family always has."
        primary={{ href: "/shop", label: "Shop the range" }}
        secondary={{ href: "/contact", label: "Contact us" }}
        image={ctaImage}
        mobileImage={ctaImageMobile}
      />
    </div>
  );
}
