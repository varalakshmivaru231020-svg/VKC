"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BadgeCheck, Mail, MessageCircle, Phone } from "lucide-react";
import { Atmosphere, C, Eyebrow, MILESTONES, Portrait, Reveal, SectionHeading, Words } from "@/components/about/heritage";

/**
 * About Us — who we are. A heritage story told in eight movements, each on its
 * own ground (deep brown → ivory → dark brown → cream → ivory → dark brown →
 * ivory → deep brown), so the page reads as a journey rather than one flat
 * panel. The founder has his own page (/founder) and the family today has
 * theirs (/leadership); this page introduces both without repeating them.
 */

/* The four principles — the family's own words. */
const PRINCIPLES = [
  { n: "01", t: "Legacy-led Values", d: "Grounded in trust, discipline, and authenticity." },
  { n: "02", t: "Purity-first Thinking", d: "A natural product focus shaped by our commitment to genuine quality." },
  { n: "03", t: "Forward-looking Leadership", d: "Building the next chapter under the leadership of Naveenchandra B R." },
  { n: "04", t: "Learning & Compliance", d: "Strengthening our knowledge through food safety, industry training, and responsible business practices." },
];

const EQUATION = ["Traditional Values", "Modern Quality Systems", "Compliance Awareness", "Responsible Growth"];

/* Primary and secondary buttons, dark and light variants. */
function ButtonPrimary({ href, children, dark = true }: { href: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-3 pl-7 pr-2 rounded-full font-body font-semibold text-sm transition-transform duration-300 hover:-translate-y-0.5"
      style={{ height: 52, background: dark ? C.jaggery : C.bark, color: dark ? C.bark : C.ivory, boxShadow: dark ? "0 12px 32px rgba(201,139,46,0.35)" : "0 12px 32px rgba(58,31,10,0.25)" }}>
      {children}
      <span className="grid place-items-center h-9 w-9 rounded-full transition-transform duration-300 group-hover:translate-x-1" style={{ background: dark ? C.bark : C.jaggery, color: dark ? C.jaggeryLite : C.bark }}>
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function ButtonGhost({ href, children, dark = true }: { href: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 px-7 rounded-full font-body font-semibold text-sm transition-colors duration-300"
      style={{ height: 52, border: `1px solid ${dark ? "rgba(255,214,92,0.45)" : `${C.jaggery}88`}`, color: dark ? C.jaggeryLite : C.jaggeryDark, background: dark ? "rgba(255,251,244,0.05)" : "transparent" }}>
      {children} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

export default function AboutExperience({
  phone = "+91 95916 08382",
  whatsapp = "919591608382",
  email = "info@vkccanegold.co.in",
  bannerImage = null,
  bannerImageMobile = null,
  bannerAlt = "",
}: {
  phone?: string;
  whatsapp?: string;
  email?: string;
  /** Admin → Banners, position "about_banner". Sits behind the hero copy, dimmed. */
  bannerImage?: string | null;
  bannerImageMobile?: string | null;
  bannerAlt?: string;
}) {
  const reduced = useReducedMotion();

  const desktopBanner = bannerImage?.trim() || bannerImageMobile?.trim() || null;
  const mobileBanner = bannerImageMobile?.trim() || desktopBanner;
  const hasSeparateMobileBanner = Boolean(bannerImageMobile?.trim() && bannerImageMobile.trim() !== desktopBanner);

  const phoneHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
  const whatsappDigits = whatsapp.replace(/\D/g, "");
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : "/contact";

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 80]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.2]);

  const heroMin = "clamp(560px, 88svh, 900px)";

  return (
    <div className="vkc-about" style={{ background: C.ivory }}>
      {/* The storefront globally justifies every <p>. Reset to a clean left rag here. */}
      <style dangerouslySetInnerHTML={{ __html:
        ".marketing-layout .vkc-about p{text-align:left;hyphens:none;text-justify:auto}" +
        ".marketing-layout .vkc-about .text-center p{text-align:center}"
      }} />

      {/* ── 01 · HERO — deep brown ───────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden" style={{ background: C.espresso, minHeight: heroMin }} aria-labelledby="about-heading">
        {desktopBanner && (
          <>
            <img src={desktopBanner} alt="" aria-hidden className={`absolute inset-0 h-full w-full object-cover ${hasSeparateMobileBanner ? "hidden md:block" : ""}`} />
            {hasSeparateMobileBanner && mobileBanner && <img src={mobileBanner} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover md:hidden" />}
            <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(27,14,5,0.82) 0%, rgba(27,14,5,0.7) 55%, rgba(27,14,5,0.9) 100%)" }} />
          </>
        )}
        <Atmosphere opacity={0.14} />
        {bannerAlt && <span className="sr-only">{bannerAlt}</span>}

        <motion.div className="relative w-full max-w-[1240px] mx-auto px-5 sm:px-8 pt-24 pb-20 sm:pt-28 sm:pb-24 flex flex-col justify-end" style={{ y: copyY, opacity: copyOpacity, minHeight: heroMin }}>
          <Reveal y={16}><Eyebrow color={C.jaggeryLite}>About VKC Gold Ikshu</Eyebrow></Reveal>
          <h1 id="about-heading" className="font-heading mt-7" style={{ fontSize: "clamp(2.8rem,7.6vw,6.6rem)", lineHeight: 0.98, letterSpacing: "-0.03em", color: C.ivory, maxWidth: 960 }}>
            <span className="block"><Words text="Rooted in Legacy." /></span>
            <span className="block"><Words text="Guided by Purpose." accent="Purpose" /></span>
          </h1>
          <Reveal delay={0.35}>
            <p className="font-heading mt-8" style={{ fontSize: "clamp(1.2rem,1.9vw,1.6rem)", lineHeight: 1.45, color: "rgba(255,251,244,0.84)", maxWidth: 680, fontStyle: "italic" }}>
              A family journey shaped by discipline, sincerity, purity, and a lasting connection with agriculture.
            </p>
          </Reveal>
          <Reveal delay={0.45}>
            <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-2 font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.22em", color: C.jaggeryLite }}>
              {["Legacy", "Integrity", "Natural Sweeteners", "Future-Ready Growth"].map((t, i) => (
                <span key={t} className="inline-flex items-center gap-4">
                  {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full" style={{ background: C.jaggery }} />}
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </motion.div>

        {/* Scroll cue */}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 pointer-events-none">
          <span className="relative block w-px h-12 overflow-hidden" style={{ background: "rgba(255,251,244,0.2)" }}>
            <motion.span className="absolute left-0 top-0 w-px h-5" animate={reduced ? undefined : { y: [-20, 48] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} style={{ background: C.jaggeryLite }} />
          </span>
        </div>
      </section>

      {/* ── 02 · A LEGACY THAT CONTINUES — warm ivory ────────────────────── */}
      <section id="story" className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7">
            <SectionHeading eyebrow="Our story" title="A legacy that continues to grow" accent="grow" size="lg" />
            <Reveal delay={0.15}>
              <div className="mt-8 space-y-5 font-body" style={{ fontSize: 17.5, lineHeight: 1.8, color: C.ink2, maxWidth: 640 }}>
                <p>
                  Our journey is inspired by the vision of <strong style={{ color: C.ink, fontWeight: 600 }}>Late Shri B Ramachandra</strong>, whose values of discipline, sincerity, and purity laid the foundation for our family’s jaggery tradition.
                </p>
                <p>
                  What began as a legacy rooted in honest effort and agricultural connection continues today through a new generation of leadership.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Milestones: the dates behind the story, kept slim. */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Reveal delay={0.2}>
                <div className="rounded-lg p-7 sm:p-8" style={{ background: C.cream, border: `1px solid ${C.parchment}` }}>
                  <Eyebrow>Milestones</Eyebrow>
                  <ol className="mt-5 list-none m-0 p-0">
                    {MILESTONES.map((m, i) => (
                      <li key={m.t} className="flex gap-5 py-4" style={{ borderTop: i ? `1px solid ${C.parchment}` : undefined }}>
                        <span className="shrink-0 w-14 font-heading" style={{ fontSize: 15, color: C.jaggeryDark }}>{m.year}</span>
                        <span>
                          <span className="block font-body font-semibold" style={{ fontSize: 14.5, color: C.ink }}>{m.t}</span>
                          <span className="block font-body mt-1" style={{ fontSize: 13.5, lineHeight: 1.6, color: C.muted }}>{m.d}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        {/* The line that carries the page. */}
        <Reveal delay={0.1} className="mt-20 sm:mt-24">
          <figure className="m-0 max-w-[1000px]">
            <span aria-hidden className="block h-[2px] w-16 mb-8" style={{ background: C.jaggery }} />
            <blockquote className="font-heading" style={{ fontSize: "clamp(1.7rem,3.6vw,3rem)", lineHeight: 1.18, letterSpacing: "-0.015em", color: C.ink }}>
              <Words text="“We do not see tradition as something old and static; we see it as a living promise that must stay genuine while growing stronger with time.”" accent="living" accentColor={C.jaggeryDark} />
            </blockquote>
          </figure>
        </Reveal>
      </section>

      {/* ── 03 · THE FOUNDER — dark brown ────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${C.bark}, ${C.barkSoft})` }}>
        <Atmosphere />
        <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <Reveal className="lg:col-span-5 max-w-[440px] w-full mx-auto lg:mx-0">
              <Portrait src="/images/team/ramachandra-b.webp" alt="Late Shri B Ramachandra" dark caption="Late Shri B Ramachandra" />
            </Reveal>
            <div className="lg:col-span-7">
              <SectionHeading light eyebrow="The founder" title="The foundation of our journey" accent="foundation" />
              <Reveal delay={0.15}>
                <div className="mt-8">
                  <div className="font-heading" style={{ fontSize: "clamp(1.5rem,2.4vw,2rem)", lineHeight: 1.15, color: C.jaggeryLite }}>Late Shri B Ramachandra</div>
                  <div className="font-body mt-2" style={{ fontSize: 14.5, color: "rgba(255,251,244,0.66)", fontStyle: "italic" }}>Founder &amp; guiding inspiration behind our family legacy</div>
                </div>
                <p className="font-body mt-6" style={{ fontSize: 17, lineHeight: 1.8, color: "rgba(255,251,244,0.82)", maxWidth: 600 }}>
                  Late Shri B Ramachandra remains the soul of our journey. His values, work ethic, and commitment to purity gave direction not only to a business, but to a family identity built on trust.
                </p>
              </Reveal>
              <Reveal delay={0.25}>
                <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2 font-body font-semibold uppercase" style={{ fontSize: 11.5, letterSpacing: "0.2em", color: C.jaggeryLite }}>
                  {["Discipline", "Sincerity", "Purity", "Trust"].map((t, i) => (
                    <span key={t} className="inline-flex items-center gap-4">{i > 0 && <span aria-hidden style={{ color: C.jaggery }}>·</span>}{t}</span>
                  ))}
                </div>
                <div className="mt-9">
                  <ButtonPrimary href="/founder">Discover His Legacy</ButtonPrimary>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── 04 · CARRYING THE LEGACY FORWARD — warm cream ────────────────── */}
      <section style={{ background: C.cream }}>
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1">
              <SectionHeading eyebrow="Present leadership" title="Carrying the legacy forward" accent="forward" />
              <Reveal delay={0.15}>
                <div className="mt-8 space-y-5 font-body" style={{ fontSize: 17, lineHeight: 1.8, color: C.ink2, maxWidth: 600 }}>
                  <p>Today, <strong style={{ color: C.ink, fontWeight: 600 }}>Naveenchandra B R</strong> carries this legacy forward with a clear focus on quality, compliance, and long-term brand building.</p>
                  <p>The aim is simple but powerful: preserve the trust earned through values, while building a future-ready business in natural sweeteners and jaggery-based products.</p>
                </div>
              </Reveal>
              <Reveal delay={0.25}>
                <div className="mt-9 font-heading flex flex-wrap items-baseline gap-x-4 gap-y-1" style={{ fontSize: "clamp(1.6rem,3.2vw,2.6rem)", lineHeight: 1.1, letterSpacing: "-0.015em", color: C.ink }}>
                  {["Heritage", "Quality", "Direction"].map((t, i) => (
                    <span key={t} className="inline-flex items-baseline gap-4">
                      {i > 0 && <span aria-hidden style={{ color: C.jaggery, fontStyle: "italic" }}>×</span>}
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-9">
                  <ButtonGhost href="/leadership" dark={false}>Meet the leadership</ButtonGhost>
                </div>
              </Reveal>
            </div>
            <Reveal className="lg:col-span-5 order-1 lg:order-2 max-w-[440px] w-full mx-auto lg:mx-0 lg:justify-self-end" delay={0.1}>
              <Portrait src="/images/team/naveenchandra-b-r.webp" alt="Naveenchandra B R" caption="Naveenchandra B R · Managing Director" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 05 · WHAT GUIDES US — ivory ──────────────────────────────────── */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <SectionHeading eyebrow="Our principles" title="What guides us" accent="guides" />
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.08}>
              <div className="pt-6 h-full" style={{ borderTop: `1px solid ${C.parchment}` }}>
                <div className="font-heading" style={{ fontSize: "clamp(3rem,5.5vw,4.4rem)", lineHeight: 1, color: `${C.jaggery}99`, letterSpacing: "-0.03em" }}>{p.n}</div>
                <h3 className="font-heading mt-6" style={{ fontSize: 25, lineHeight: 1.12, color: C.ink }}>{p.t}</h3>
                <p className="font-body mt-3" style={{ fontSize: 15, lineHeight: 1.7, color: C.ink2 }}>{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 06 · TRADITION × MODERN BUSINESS — dark brown ────────────────── */}
      <section className="relative overflow-hidden" style={{ background: `radial-gradient(120% 120% at 80% 0%, ${C.barkSoft}, ${C.bark})` }}>
        <Atmosphere glow={false} opacity={0.1} />
        <div className="relative max-w-[1100px] mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center">
          <SectionHeading light center eyebrow="Tradition × modern business" title="Tradition gives us our roots. Discipline shapes our future." accent="Discipline" />
          <Reveal delay={0.2}>
            <div className="mt-8 mx-auto space-y-4 font-body" style={{ fontSize: "clamp(1.05rem,1.4vw,1.2rem)", lineHeight: 1.75, color: "rgba(255,251,244,0.8)", maxWidth: 640 }}>
              <p style={{ textAlign: "center" }}>At VKC Gold Ikshu, trust is not a marketing word — it is the base of everything we do.</p>
              <p style={{ textAlign: "center" }}>We are guided by legacy, strengthened by discipline, and driven by a desire to build something lasting.</p>
            </div>
          </Reveal>

          {/* The equation. */}
          <Reveal delay={0.3}>
            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-5 gap-y-4">
              {EQUATION.map((t, i) => (
                <span key={t} className="inline-flex items-center gap-5">
                  {i > 0 && <span aria-hidden className="font-heading" style={{ fontSize: 26, color: C.jaggery }}>×</span>}
                  <span className="font-body font-semibold uppercase rounded-full px-5 py-3" style={{ fontSize: 12, letterSpacing: "0.16em", color: C.jaggeryLite, border: "1px solid rgba(255,214,92,0.3)", background: "rgba(255,251,244,0.05)" }}>{t}</span>
                </span>
              ))}
            </div>
            <div aria-hidden className="mt-8 font-heading" style={{ fontSize: 34, lineHeight: 1, color: C.jaggery }}>=</div>
            <div className="mt-5 font-heading" style={{ fontSize: "clamp(2.4rem,6vw,5rem)", lineHeight: 1, letterSpacing: "-0.03em", color: C.ivory }}>
              VKC Gold <span style={{ color: C.jaggeryLite, fontStyle: "italic" }}>Ikshu</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 07 · A FORMAL FOUNDATION — clean ivory ───────────────────────── */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <SectionHeading eyebrow="Formal foundation" title="A legacy with a formal foundation" accent="formal" />
            <Reveal delay={0.15}>
              <p className="font-body mt-8" style={{ fontSize: 17, lineHeight: 1.8, color: C.ink2, maxWidth: 600 }}>
                The business is also supported by formal Udyam registration under <strong style={{ color: C.ink, fontWeight: 600 }}>VKC JAGGERY &amp; BEVERAGES PRIVATE LIMITED</strong>, with the unit name recorded as <strong style={{ color: C.ink, fontWeight: 600 }}>VKC CANE Gold Foods – Jaggery Manufacturing Unit</strong>.
              </p>
            </Reveal>
          </div>
          <Reveal className="lg:col-span-5" delay={0.2}>
            <div className="rounded-lg p-7 sm:p-8" style={{ background: "white", border: `1px solid ${C.parchment}`, boxShadow: "0 30px 60px -44px rgba(58,31,10,0.35)" }}>
              <div className="flex items-center gap-3">
                <span className="grid place-items-center h-10 w-10 rounded-full" style={{ background: `${C.jaggery}22`, color: C.jaggeryDark }}><BadgeCheck className="h-5 w-5" /></span>
                <Eyebrow>Registered enterprise</Eyebrow>
              </div>
              <div className="font-heading mt-5" style={{ fontSize: 22, lineHeight: 1.2, color: C.ink }}>VKC JAGGERY &amp; BEVERAGES PRIVATE LIMITED</div>
              <dl className="mt-5 space-y-3 font-body" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
                <div className="flex gap-4" style={{ borderTop: `1px solid ${C.parchment}`, paddingTop: 12 }}>
                  <dt className="shrink-0 w-16 uppercase" style={{ fontSize: 10.5, letterSpacing: "0.16em", color: C.muted, paddingTop: 3 }}>Unit</dt>
                  <dd className="m-0" style={{ color: C.ink2 }}>VKC CANE Gold Foods – Jaggery Manufacturing Unit</dd>
                </div>
                <div className="flex gap-4" style={{ borderTop: `1px solid ${C.parchment}`, paddingTop: 12 }}>
                  <dt className="shrink-0 w-16 uppercase" style={{ fontSize: 10.5, letterSpacing: "0.16em", color: C.muted, paddingTop: 3 }}>Status</dt>
                  <dd className="m-0 font-semibold" style={{ color: C.jaggeryDark }}>Udyam Registered</dd>
                </div>
              </dl>
              <Link href="/credentials" className="group mt-6 inline-flex items-center gap-2 font-body font-semibold" style={{ fontSize: 13.5, color: C.jaggeryDark }}>
                View Credentials <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 08 · FINAL CTA — deep brown ──────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: C.espresso }}>
        <Atmosphere opacity={0.14} />
        <div className="relative max-w-[1100px] mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center">
          <SectionHeading light center size="lg" eyebrow="Taste the difference" title="Discover the products this legacy stands behind." accent="legacy"
            sub="Pure, chemical-free jaggery and cane products from Mandya — made the way the family always has." />
          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <ButtonPrimary href="/shop">Shop the range</ButtonPrimary>
              <ButtonGhost href="/contact">Contact us</ButtonGhost>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 font-body" style={{ fontSize: 14, color: "rgba(255,251,244,0.7)" }}>
              <a href={phoneHref} className="inline-flex items-center gap-2 transition-colors hover:text-[#FFD65C]"><Phone className="h-4 w-4" /> {phone}</a>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-[#FFD65C]"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
              <a href={`mailto:${email}`} className="inline-flex items-center gap-2 transition-colors hover:text-[#FFD65C]"><Mail className="h-4 w-4" /> {email}</a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
