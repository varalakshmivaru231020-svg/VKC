"use client";

import Link from "next/link";
import { ArrowRight, Mail, MessageCircle, Phone } from "lucide-react";
import { Button, C, Cta, Facts, Label, MILESTONES, NumberGrid, Photo, Reveal, Section, SectionHead, T, Timeline, Words } from "@/components/about/heritage";

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
  bannerImage = null,
  bannerImageMobile = null,
  bannerAlt = "",
  ctaImage = null,
  ctaImageMobile = null,
}: {
  phone?: string;
  whatsapp?: string;
  email?: string;
  /** Admin → Banners, position "about_banner". Shown whole, above the title. */
  bannerImage?: string | null;
  bannerImageMobile?: string | null;
  bannerAlt?: string;
  /** Admin → Banners, position "cta_background" — shared by every closing CTA. */
  ctaImage?: string | null;
  ctaImageMobile?: string | null;
}) {
  const desktopBanner = bannerImage?.trim() || bannerImageMobile?.trim() || null;
  const mobileBanner = bannerImageMobile?.trim() || desktopBanner;
  const separateMobile = Boolean(desktopBanner && mobileBanner && mobileBanner !== desktopBanner);

  const phoneHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
  const whatsappDigits = whatsapp.replace(/\D/g, "");
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : "/contact";

  return (
    <div className="vkc-about" style={{ background: C.ivory }}>
      <style dangerouslySetInnerHTML={{ __html:
        ".marketing-layout .vkc-about p{text-align:left;hyphens:none;text-justify:auto}" +
        ".marketing-layout .vkc-about .text-center p{text-align:center}"
      }} />

      {/* ── 1 · HERO ─────────────────────────────────────────────────────── */}
      {/* One hero. With an uploaded banner the artwork leads, shown whole at its
          own aspect ratio, and the title band sits beneath it. Without one, the
          title band carries the page on its own with more room to breathe. */}
      {desktopBanner && (
        <div style={{ background: C.cream }} aria-label={bannerAlt || undefined}>
          <img src={desktopBanner} alt={bannerAlt} className={`block w-full h-auto ${separateMobile ? "hidden md:block" : ""}`} />
          {separateMobile && mobileBanner && <img src={mobileBanner} alt={bannerAlt} className="block w-full h-auto md:hidden" />}
        </div>
      )}
      <section aria-labelledby="about-heading" style={{ background: C.ivory }}>
        <div className={`max-w-[1200px] mx-auto px-5 sm:px-8 ${desktopBanner ? "py-16 sm:py-20" : "pt-24 pb-20 sm:pt-32 sm:pb-28"}`}>
          <div className="grid lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <Label>About VKC Gold Ikshu</Label>
              <h1 id="about-heading" className="mt-5" style={{ ...T.display, color: C.ink }}>
                <span className="block"><Words text="Rooted in Legacy." /></span>
                <span className="block"><Words text="Guided by Purpose." /></span>
              </h1>
            </div>
            <Reveal delay={0.25} className="lg:col-span-4 lg:pb-2">
              <p className="font-body" style={{ ...T.lede, color: C.ink2 }}>
                A family journey shaped by discipline, sincerity, purity, and a lasting connection with agriculture.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-3 gap-y-1 font-body" style={{ ...T.label, color: C.muted, letterSpacing: "0.16em", fontSize: 10.5 }}>
                {["Legacy", "Integrity", "Natural Sweeteners", "Future-Ready Growth"].map((t, i) => (
                  <span key={t} className="inline-flex items-center gap-3">{i > 0 && <span aria-hidden style={{ color: C.gold }}>·</span>}{t}</span>
                ))}
              </div>
            </Reveal>
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

      {/* ── 5 · VISION & MISSION — the one dark movement ─────────────────── */}
      <Section bg="dark" ariaLabelledby="vision-heading">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <Label light>Our vision</Label>
            <h2 id="vision-heading" className="mt-5" style={{ ...T.h2, color: C.onDark }}>
              <Words text={VISION} />
            </h2>
          </div>
          <div className="lg:col-span-7 lg:pt-1">
            <Label light>Our mission</Label>
            <ol className="list-none m-0 p-0 mt-5">
              {MISSION.map((m, i) => (
                <Reveal key={m.t} delay={i * 0.05}>
                  <li className="grid grid-cols-[36px_1fr] gap-4 py-5" style={{ borderTop: `1px solid ${C.onDarkLine}` }}>
                    <span className="font-body tabular-nums pt-1" style={{ ...T.label, color: C.jaggery }}>0{i + 1}</span>
                    <div>
                      <h3 style={{ ...T.h3, color: C.onDark }}>{m.t}</h3>
                      <p className="font-body mt-1.5" style={{ ...T.small, color: C.onDarkMuted, maxWidth: 520 }}>{m.d}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* ── 6 · A FORMAL FOUNDATION ──────────────────────────────────────── */}
      <Section ariaLabelledby="formal-heading">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-6">
            <SectionHead id="formal-heading" label="Formal foundation" title="A legacy with a formal foundation" />
            <Reveal delay={0.1}>
              <p className="font-body mt-7" style={{ ...T.body, color: C.ink2, maxWidth: 520 }}>
                The business is also supported by formal Udyam registration under <strong style={{ color: C.ink, fontWeight: 600 }}>VKC JAGGERY &amp; BEVERAGES PRIVATE LIMITED</strong>, with the unit name recorded as <strong style={{ color: C.ink, fontWeight: 600 }}>VKC CANE Gold Foods – Jaggery Manufacturing Unit</strong>.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.15} className="lg:col-span-6 lg:pt-14">
            <Facts rows={[["Company", "VKC JAGGERY & BEVERAGES PRIVATE LIMITED"], ["Unit", "VKC CANE Gold Foods – Jaggery Manufacturing Unit"], ["Status", "Udyam Registered"]]} />
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
      >
        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 font-body" style={{ fontSize: 14, color: C.onDarkMuted }}>
          <a href={phoneHref} className="inline-flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4" style={{ color: C.jaggery }} />{phone}</a>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white"><MessageCircle className="h-4 w-4" style={{ color: C.jaggery }} />WhatsApp</a>
          <a href={`mailto:${email}`} className="inline-flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4" style={{ color: C.jaggery }} />{email}</a>
        </div>
      </Cta>
    </div>
  );
}
