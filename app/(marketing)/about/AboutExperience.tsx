"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Sprout, Handshake, Recycle, Cog, Heart, ShieldCheck,
  Sparkles, Globe2, Factory, Award, BadgeCheck, Clock3, MapPin, Phone,
  Mail, Quote, Target, Eye, Wheat, Leaf, TrendingUp,
} from "lucide-react";

/* ── Earthy agro-food palette (layered on the site tokens) ────────────────── */
const C = {
  bark:        "#241708",
  barkSoft:    "#3A2916",
  green:       "#2E6B47",
  greenLight:  "#4E8C63",
  jaggery:     "#C4922A",
  jaggeryDark: "#8B6318",
  jaggeryLite: "#E8C97A",
  cream:       "#F2EBE0",
  ivory:       "#FBF8F3",
  parchment:   "#E8DDD0",
  ink:         "#1C1410",
  ink2:        "#4A3F38",
  muted:       "#8A7B72",
};

/* Subtle paper-grain overlay (inline SVG so no external asset is needed). */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

/* ── Scroll-reveal wrapper ────────────────────────────────────────────────── */
function Reveal({
  children, className = "", delay = 0, as: Tag = "div",
}: { children: React.ReactNode; className?: string; delay?: number; as?: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(26px)",
        transition: `opacity .7s cubic-bezier(.2,.6,.2,1) ${delay}ms, transform .7s cubic-bezier(.2,.6,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}

/* ── Count-up stat ────────────────────────────────────────────────────────── */
function Stat({ value, suffix = "", label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const dur = 1400, t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(Math.round(eased * value));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return (
    <div ref={ref} className="text-center">
      <div className="font-heading leading-none" style={{ fontSize: "clamp(2.4rem,5vw,3.6rem)", color: C.jaggeryLite }}>
        {n}{suffix}
      </div>
      <div className="mt-2 font-body uppercase" style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(251,248,243,0.66)" }}>
        {label}
      </div>
    </div>
  );
}

/* ── Small building blocks ────────────────────────────────────────────────── */
function Eyebrow({ children, color = C.jaggeryDark }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-body font-semibold uppercase"
      style={{ fontSize: 11, letterSpacing: "0.22em", color }}>
      <span style={{ width: 22, height: 1, background: color, display: "inline-block" }} />
      {children}
    </span>
  );
}

function SectionHeading({ eyebrow, title, sub, light = false, center = false }: {
  eyebrow: string; title: React.ReactNode; sub?: string; light?: boolean; center?: boolean;
}) {
  return (
    <div className={center ? "text-center max-w-2xl mx-auto" : "max-w-2xl"}>
      <Eyebrow color={light ? C.jaggeryLite : C.jaggeryDark}>{eyebrow}</Eyebrow>
      <h2 className="font-heading mt-4" style={{ fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.08, color: light ? C.ivory : C.ink }}>
        {title}
      </h2>
      {sub && (
        <p className="font-body mt-4" style={{ fontSize: 16, lineHeight: 1.75, color: light ? "rgba(251,248,243,0.75)" : C.ink2 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ── Data ─────────────────────────────────────────────────────────────────── */
const TIMELINE = [
  { year: "1988", title: "Vairamudi Krupa Crusher", body: "Mr. Ramachandra B sets up a sugarcane crusher in Mandya, turning locally grown cane into honest, unrefined sweetness for the community around him." },
  { year: "Growth", title: "A trusted local name", body: "Over the decades the crusher earns a reputation for purity and fair dealing with farmers — the foundation everything else is built on." },
  { year: "Today", title: "VKC Cane Gold Foods Pvt. Ltd.", body: "The family enterprise is formalised as a natural food-processing company, combining traditional jaggery-making with modern, energy-efficient machinery." },
  { year: "Ahead", title: "From Mandya to the world", body: "A healthy, chemical-free alternative to refined sugar — carrying Mandya's jaggery heritage to new markets." },
];

const PHILOSOPHY = [
  { icon: Handshake, t: "Farmer-First", d: "We work directly with the farmers who grow the cane — no middlemen between the field and the finished product." },
  { icon: TrendingUp, t: "Fair Pricing", d: "Honest, dependable rates paid directly to growers, so rural livelihoods share in the value they create." },
  { icon: ShieldCheck, t: "Transparent Dealing", d: "Clear, straightforward transactions that farmers and customers can trust, every single time." },
  { icon: Leaf, t: "Chemical-Free", d: "No artificial colours, no flavours, no chemicals — at any stage of production." },
  { icon: Cog, t: "Tradition + Technology", d: "Time-honoured know-how paired with modern, hygienic, energy-efficient processing." },
];

const MISSION = [
  { icon: Handshake, t: "Farmer Empowerment", d: "Fair prices and direct partnerships that strengthen rural communities around Mandya." },
  { icon: Leaf, t: "Chemical-Free Production", d: "100% natural processing with nothing artificial added, ever." },
  { icon: Sparkles, t: "Innovation & Quality", d: "Modern machinery and consistent quality in every batch we make." },
  { icon: Recycle, t: "Sustainable Growth", d: "Eco-friendly manufacturing that reduces waste as we grow." },
  { icon: Globe2, t: "Global Expansion", d: "Taking Mandya's natural sweetness to markets across India and beyond." },
];

const VALUES = [
  { icon: ShieldCheck, t: "Purity & Quality", d: "Uncompromising standards from cane to carton." },
  { icon: Handshake, t: "Farmer Support", d: "Growers are partners, not suppliers." },
  { icon: Recycle, t: "Sustainable Manufacturing", d: "Cleaner processing, less waste." },
  { icon: Cog, t: "Innovation with Tradition", d: "Modern tools, time-honoured methods." },
  { icon: Heart, t: "Customer Trust", d: "Earned batch after batch, year after year." },
];

const LEADERS = [
  { name: "Mr. Ramachandra B", role: "Founder & Chairman (Honorary)", initials: "RB" },
  { name: "Mr. Naveenchandra B R", role: "Managing Director", initials: "NB" },
  { name: "Mr. Abhishek B R", role: "Director — Operations", initials: "AB" },
  { name: "Mrs. Pushpalatha", role: "Director — Quality & Administration", initials: "P" },
];

const CERTS_DONE = [
  { t: "MSME / Udyam", d: "Registered micro-enterprise" },
  { t: "GST", d: "Registered & compliant" },
  { t: "IEC", d: "Import–Export Code" },
  { t: "Trademark", d: "Brand registered" },
];
const CERTS_PROGRESS = [
  { t: "FSSAI", d: "In process" },
  { t: "Lean MSME", d: "Under process" },
  { t: "Enterprise Membership — IID", d: "In progress" },
];

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function AboutExperience({
  phone = "+91 95916 08382",
  whatsapp = "919591608382",
  email = "info@vkccanegold.co.in",
}: { phone?: string; whatsapp?: string; email?: string }) {
  const cardBase = "rounded-2xl border transition-all duration-300";
  return (
    <div className="vkc-about" style={{ background: C.ivory }}>
      {/* The storefront globally justifies every <p> (.marketing-layout p).
          That wrecks this page's short, card-based copy — reset it to a clean
          left rag here, while still honouring centred sections. */}
      <style dangerouslySetInnerHTML={{ __html:
        ".marketing-layout .vkc-about p{text-align:left;hyphens:none;text-justify:auto}" +
        ".marketing-layout .vkc-about .text-center p{text-align:center}"
      }} />

      {/* ── 1 · HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: `radial-gradient(120% 120% at 15% 0%, ${C.barkSoft} 0%, ${C.bark} 55%, #17100A 100%)` }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, opacity: 0.12, mixBlendMode: "overlay" }} />
        {/* glowing cane orbs */}
        <div aria-hidden style={{ position: "absolute", top: -120, right: -80, width: 420, height: 420, borderRadius: "50%", background: `radial-gradient(circle, ${C.jaggery}55, transparent 68%)`, filter: "blur(8px)" }} />
        <div aria-hidden style={{ position: "absolute", bottom: -140, left: -100, width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${C.green}44, transparent 70%)` }} />

        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8 pt-24 pb-16 sm:pt-32 sm:pb-24">
          <Reveal><Eyebrow color={C.jaggeryLite}>Mandya's Pride · Since 1988</Eyebrow></Reveal>
          <Reveal delay={80}>
            <h1 className="font-heading mt-5" style={{ fontSize: "clamp(2.8rem,7vw,5.5rem)", lineHeight: 1.02, color: C.ivory, maxWidth: 900 }}>
              From Mandya's Heritage<br />
              <span style={{ color: C.jaggeryLite }}>to the World</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="font-body mt-6" style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(251,248,243,0.82)", maxWidth: 620 }}>
              VKC Cane Gold Foods crafts pure, chemical-free jaggery and cane products
              straight from the sugarcane fields of Mandya, Karnataka — rooted in a
              farmer-first tradition that began in 1988.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#story" className="inline-flex items-center gap-2 h-12 px-7 rounded-full font-body font-semibold text-sm transition-transform hover:-translate-y-0.5"
                style={{ background: C.jaggery, color: C.bark }}>
                Our Story <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/contact" className="inline-flex items-center gap-2 h-12 px-7 rounded-full font-body font-semibold text-sm transition-colors"
                style={{ border: "1px solid rgba(232,201,122,0.5)", color: C.jaggeryLite }}>
                Contact Us
              </Link>
            </div>
          </Reveal>

          {/* stat strip */}
          <Reveal delay={320}>
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 pt-10" style={{ borderTop: "1px solid rgba(232,221,208,0.16)" }}>
              <Stat value={1988} label="Founded" />
              <Stat value={38} suffix="+" label="Years of Trust" />
              <Stat value={100} suffix="%" label="Natural" />
              <Stat value={0} label="Chemicals Added" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 2 · OUR STORY (timeline) ─────────────────────────────────────── */}
      <section id="story" className="max-w-[1200px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <Reveal><SectionHeading eyebrow="Our Story"
          title={<>A crusher in 1988,<br />a promise ever since</>}
          sub="What began as a single sugarcane crusher has grown into a natural food-processing enterprise — without ever losing the values it started with." /></Reveal>

        <div className="mt-14 relative">
          <div aria-hidden className="hidden sm:block absolute top-2 bottom-2" style={{ left: 19, width: 2, background: `linear-gradient(${C.jaggery}, ${C.green})` }} />
          <div className="space-y-8">
            {TIMELINE.map((s, i) => (
              <Reveal key={s.title} delay={i * 90}>
                <div className="flex gap-5 sm:gap-8">
                  <div className="shrink-0 relative">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center font-heading text-sm"
                      style={{ background: C.ivory, border: `2px solid ${C.jaggery}`, color: C.jaggeryDark, boxShadow: "0 4px 14px rgba(28,20,16,0.08)" }}>
                      <Wheat className="h-4 w-4" />
                    </div>
                  </div>
                  <div className={`${cardBase} flex-1 p-6 sm:p-7`} style={{ background: "white", borderColor: C.parchment }}>
                    <span className="font-body font-bold uppercase" style={{ fontSize: 11, letterSpacing: "0.16em", color: C.jaggeryDark }}>{s.year}</span>
                    <h3 className="font-heading mt-1.5" style={{ fontSize: 24, color: C.ink }}>{s.title}</h3>
                    <p className="font-body mt-2" style={{ fontSize: 15, lineHeight: 1.7, color: C.ink2 }}>{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 · PHILOSOPHY ───────────────────────────────────────────────── */}
      <section style={{ background: C.cream }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <Reveal><SectionHeading eyebrow="Our Philosophy" title="Sweetness with a conscience"
            sub="Everything we make rests on five commitments — to the land, the farmer, and the people who choose VKC Gold." /></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PHILOSOPHY.map((p, i) => (
              <Reveal key={p.t} delay={i * 70}>
                <div className={`${cardBase} h-full p-7 hover:-translate-y-1`} style={{ background: C.ivory, borderColor: C.parchment }}>
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: `${C.green}14`, color: C.green }}>
                    <p.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading mt-5" style={{ fontSize: 22, color: C.ink }}>{p.t}</h3>
                  <p className="font-body mt-2" style={{ fontSize: 14.5, lineHeight: 1.7, color: C.ink2 }}>{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 · WHO WE ARE ───────────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <Reveal>
            <SectionHeading eyebrow="Who We Are" title="A Mandya family enterprise, rooted in the soil" />
            <div className="mt-6 space-y-4 font-body" style={{ fontSize: 16, lineHeight: 1.8, color: C.ink2 }}>
              <p>VKC Cane Gold Foods Pvt. Ltd. is a natural food-processing company from Ballenahalli, Srirangapatna Taluk, in the Mandya district of Karnataka — the heart of India's sugarcane country.</p>
              <p>As a registered MSME with GST compliance, we're proud to build in India and buy local — championing rural entrepreneurship and creating value close to where our cane is grown.</p>
            </div>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {["Make in India", "Vocal for Local", "Rural Entrepreneurship", "MSME Registered"].map((t) => (
                <span key={t} className="font-body font-medium rounded-full px-4 py-2" style={{ fontSize: 13, background: `${C.jaggery}18`, color: C.jaggeryDark }}>{t}</span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: MapPin, k: "Location", v: "Ballenahalli, Srirangapatna Taluk, Mandya — Karnataka 571807" },
                { icon: BadgeCheck, k: "Registration", v: "MSME / Udyam & GST compliant" },
                { icon: Sprout, k: "Sourcing", v: "Sugarcane from local Mandya farmers" },
                { icon: Factory, k: "Production", v: "Chemical-free, modern processing" },
              ].map((b) => (
                <div key={b.k} className={`${cardBase} p-5`} style={{ background: "white", borderColor: C.parchment }}>
                  <b.icon className="h-5 w-5" style={{ color: C.green }} />
                  <div className="font-body font-semibold mt-3" style={{ fontSize: 12.5, letterSpacing: "0.06em", textTransform: "uppercase", color: C.jaggeryDark }}>{b.k}</div>
                  <div className="font-body mt-1" style={{ fontSize: 14, lineHeight: 1.55, color: C.ink2 }}>{b.v}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 5 · TECHNOLOGY & MACHINERY ───────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.bark}, ${C.barkSoft})` }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, opacity: 0.1, mixBlendMode: "overlay" }} />
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <SectionHeading light eyebrow="Technology & Machinery"
                title={<>Modern engineering,<br />traditional soul</>}
                sub="We pair heritage jaggery-making with modern, energy-efficient machinery — for cleaner processing and consistent quality in every batch." />
              <div className="mt-8 space-y-4">
                {[
                  "Energy-efficient sugarcane crushing, juice extraction, filtration and boiling",
                  "Hygienic, food-grade processing from field to pack",
                  "Consistent batch quality with modern controls",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <BadgeCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: C.jaggeryLite }} />
                    <span className="font-body" style={{ fontSize: 15.5, lineHeight: 1.6, color: "rgba(251,248,243,0.85)" }}>{t}</span>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="rounded-2xl p-8" style={{ background: "rgba(251,248,243,0.06)", border: "1px solid rgba(232,201,122,0.25)" }}>
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: C.jaggery, color: C.bark }}>
                  <Cog className="h-7 w-7" />
                </div>
                <h3 className="font-heading mt-5" style={{ fontSize: 26, color: C.ivory }}>In partnership with Jagadish Engineering Works, Gujarat</h3>
                <p className="font-body mt-3" style={{ fontSize: 15.5, lineHeight: 1.75, color: "rgba(251,248,243,0.8)" }}>
                  Beyond our own production, VKC is the <strong style={{ color: C.jaggeryLite }}>authorized Karnataka dealer</strong> for
                  Jagadish Engineering Works — bringing proven, energy-efficient jaggery-processing
                  machinery to producers across the state.
                </p>
                <span className="inline-flex items-center gap-2 mt-6 font-body font-semibold rounded-full px-4 py-2" style={{ fontSize: 13, background: "rgba(232,201,122,0.16)", color: C.jaggeryLite }}>
                  <Factory className="h-4 w-4" /> Authorized Karnataka Dealer
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 6 · VISION & MISSION ─────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <Reveal>
          <div className="rounded-3xl p-9 sm:p-14 text-center" style={{ background: `linear-gradient(135deg, ${C.green}, #1F4E33)`, color: C.ivory }}>
            <div className="inline-flex h-12 w-12 rounded-full items-center justify-center mx-auto" style={{ background: "rgba(251,248,243,0.12)" }}>
              <Eye className="h-6 w-6" style={{ color: C.jaggeryLite }} />
            </div>
            <Eyebrow color={C.jaggeryLite}>Our Vision</Eyebrow>
            <p className="font-heading mx-auto mt-4" style={{ fontSize: "clamp(1.7rem,3.4vw,2.7rem)", lineHeight: 1.2, maxWidth: 900 }}>
              To become a trusted global brand for Mandya's natural sweetness — a healthy,
              chemical-free alternative to refined sugar, made by empowering the farmers who grow it.
            </p>
          </div>
        </Reveal>

        <div className="mt-14">
          <Reveal><div className="flex items-center gap-3 justify-center">
            <Target className="h-5 w-5" style={{ color: C.jaggeryDark }} />
            <Eyebrow>Our Mission</Eyebrow>
          </div></Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MISSION.map((m, i) => (
              <Reveal key={m.t} delay={i * 70}>
                <div className={`${cardBase} h-full p-7 hover:-translate-y-1`} style={{ background: "white", borderColor: C.parchment }}>
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: `${C.jaggery}18`, color: C.jaggeryDark }}>
                    <m.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading mt-5" style={{ fontSize: 21, color: C.ink }}>{m.t}</h3>
                  <p className="font-body mt-2" style={{ fontSize: 14.5, lineHeight: 1.7, color: C.ink2 }}>{m.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7 · CORE VALUES ──────────────────────────────────────────────── */}
      <section style={{ background: C.cream }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <Reveal><SectionHeading center eyebrow="Core Values" title="What guides every batch" /></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {VALUES.map((v, i) => (
              <Reveal key={v.t} delay={i * 60}>
                <div className={`${cardBase} h-full p-6 text-center hover:-translate-y-1`} style={{ background: C.ivory, borderColor: C.parchment }}>
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: `${C.green}12`, color: C.green }}>
                    <v.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-heading mt-4" style={{ fontSize: 18.5, color: C.ink }}>{v.t}</h3>
                  <p className="font-body mt-1.5" style={{ fontSize: 13.5, lineHeight: 1.6, color: C.muted }}>{v.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8 · LEADERSHIP ───────────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <Reveal><SectionHeading eyebrow="Leadership" title="The family behind VKC Gold"
          sub="A close-knit team carrying a 1988 legacy forward — with the same care for farmers, quality and trust." /></Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LEADERS.map((l, i) => (
            <Reveal key={l.name} delay={i * 80}>
              <div className={`${cardBase} h-full p-7 text-center hover:-translate-y-1`} style={{ background: "white", borderColor: C.parchment }}>
                <div className="h-20 w-20 rounded-full flex items-center justify-center mx-auto font-heading"
                  style={{ fontSize: 26, background: `linear-gradient(135deg, ${C.jaggery}, ${C.jaggeryDark})`, color: C.ivory, boxShadow: "0 8px 22px rgba(139,99,24,0.28)" }}>
                  {l.initials}
                </div>
                <h3 className="font-heading mt-5" style={{ fontSize: 20, color: C.ink }}>{l.name}</h3>
                <p className="font-body mt-1" style={{ fontSize: 13.5, lineHeight: 1.5, color: C.jaggeryDark }}>{l.role}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 9 · CERTIFICATIONS ───────────────────────────────────────────── */}
      <section style={{ background: C.cream }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <Reveal><SectionHeading eyebrow="Certifications & Recognition" title="Credentials you can count on"
            sub="Registered, compliant, and continually raising the bar — here's exactly where we stand." /></Reveal>

          <div className="mt-12 grid lg:grid-cols-2 gap-8">
            <Reveal>
              <div className="flex items-center gap-2 mb-5">
                <BadgeCheck className="h-5 w-5" style={{ color: C.green }} />
                <span className="font-body font-semibold uppercase" style={{ fontSize: 12, letterSpacing: "0.14em", color: C.green }}>Completed</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {CERTS_DONE.map((c) => (
                  <div key={c.t} className={`${cardBase} p-5 flex items-start gap-3`} style={{ background: C.ivory, borderColor: `${C.green}33` }}>
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${C.green}14`, color: C.green }}>
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-body font-semibold" style={{ fontSize: 15, color: C.ink }}>{c.t}</div>
                      <div className="font-body" style={{ fontSize: 13, color: C.muted }}>{c.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="flex items-center gap-2 mb-5">
                <Clock3 className="h-5 w-5" style={{ color: C.jaggeryDark }} />
                <span className="font-body font-semibold uppercase" style={{ fontSize: 12, letterSpacing: "0.14em", color: C.jaggeryDark }}>In Progress</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {CERTS_PROGRESS.map((c) => (
                  <div key={c.t} className={`${cardBase} p-5 flex items-start gap-3`} style={{ background: C.ivory, borderColor: C.parchment, borderStyle: "dashed" }}>
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${C.jaggery}18`, color: C.jaggeryDark }}>
                      <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-body font-semibold" style={{ fontSize: 15, color: C.ink }}>{c.t}</div>
                      <div className="font-body" style={{ fontSize: 13, color: C.muted }}>{c.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 10 · WHAT WE STAND FOR ───────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: `radial-gradient(120% 120% at 80% 0%, ${C.barkSoft}, ${C.bark})` }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, opacity: 0.1, mixBlendMode: "overlay" }} />
        <div className="relative max-w-[1000px] mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center">
          <Reveal>
            <Wheat className="h-8 w-8 mx-auto" style={{ color: C.jaggeryLite }} />
            <h2 className="font-heading mx-auto mt-6" style={{ fontSize: "clamp(2.1rem,5vw,3.6rem)", lineHeight: 1.12, color: C.ivory, maxWidth: 820 }}>
              No chemicals. No shortcuts.<br /><span style={{ color: C.jaggeryLite }}>Just natural sweetness.</span>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-12 grid sm:grid-cols-3 gap-6">
              {[
                { icon: Sprout, t: "Farmer Support", d: "Fair prices, direct partnerships." },
                { icon: Recycle, t: "Sustainability", d: "Cleaner, lower-waste processing." },
                { icon: Heart, t: "Quality & Trust", d: "Earned in every single batch." },
              ].map((x) => (
                <div key={x.t} className="rounded-2xl p-7 text-center" style={{ background: "rgba(251,248,243,0.05)", border: "1px solid rgba(232,201,122,0.2)" }}>
                  <x.icon className="h-6 w-6 mx-auto" style={{ color: C.jaggeryLite }} />
                  <h3 className="font-heading mt-4" style={{ fontSize: 20, color: C.ivory }}>{x.t}</h3>
                  <p className="font-body mt-1.5" style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(251,248,243,0.72)" }}>{x.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 11 · LOOKING AHEAD ───────────────────────────────────────────── */}
      <section className="max-w-[1100px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <Reveal><SectionHeading center eyebrow="Looking Ahead" title="Carrying Mandya's sweetness forward"
          sub="As we grow into new markets, our purpose stays the same: a healthy, natural alternative to refined sugar — made with people and the planet in mind." /></Reveal>
        <Reveal delay={120}>
          <figure className="mt-12 rounded-3xl p-9 sm:p-14 text-center relative overflow-hidden" style={{ background: C.cream, border: `1px solid ${C.parchment}` }}>
            <Quote className="h-9 w-9 mx-auto" style={{ color: C.jaggery }} />
            <blockquote className="font-heading mx-auto mt-5" style={{ fontSize: "clamp(1.5rem,3vw,2.3rem)", lineHeight: 1.3, color: C.ink, maxWidth: 780 }}>
              "With every batch, we deliver more than sweetness — we deliver a story of
              purity, people and progress."
            </blockquote>
            <figcaption className="font-body mt-6" style={{ fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase", color: C.jaggeryDark }}>
              — VKC Cane Gold Foods
            </figcaption>
          </figure>
        </Reveal>
      </section>

      {/* ── 12 · CONTACT / CTA ───────────────────────────────────────────── */}
      <section style={{ background: `linear-gradient(135deg, ${C.jaggeryDark}, ${C.jaggery})` }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-20 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <Eyebrow color={C.bark}>Get in Touch</Eyebrow>
              <h2 className="font-heading mt-4" style={{ fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.1, color: C.bark }}>
                Let's talk sweetness — the natural way
              </h2>
              <p className="font-body mt-4" style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(36,23,8,0.78)", maxWidth: 480 }}>
                Questions about our jaggery, bulk orders, or machinery? We'd love to hear from you.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/contact" className="inline-flex items-center gap-2 h-12 px-7 rounded-full font-body font-semibold text-sm transition-transform hover:-translate-y-0.5"
                  style={{ background: C.bark, color: C.ivory }}>
                  Talk to Us <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/shop" className="inline-flex items-center gap-2 h-12 px-7 rounded-full font-body font-semibold text-sm"
                  style={{ border: "1px solid rgba(36,23,8,0.35)", color: C.bark }}>
                  Shop Products
                </Link>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-2xl p-7 sm:p-8 space-y-1" style={{ background: "rgba(251,248,243,0.92)" }}>
                {[
                  { icon: MapPin, k: "Visit", v: "Ballenahalli Village, Srirangapatna Taluk, Mandya District, Karnataka – 571807" },
                  { icon: Phone, k: "Call", v: phone, href: `tel:${phone.replace(/\s/g, "")}` },
                  { icon: Mail, k: "Email", v: email, href: `mailto:${email}` },
                ].map((r, idx) => (
                  <div key={r.k} className="flex items-start gap-4 py-4" style={{ borderTop: idx ? `1px solid ${C.parchment}` : "none" }}>
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${C.jaggery}1f`, color: C.jaggeryDark }}>
                      <r.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.14em", color: C.jaggeryDark }}>{r.k}</div>
                      {r.href
                        ? <a href={r.href} className="font-body block mt-1 hover:underline" style={{ fontSize: 15.5, color: C.ink }}>{r.v}</a>
                        : <div className="font-body mt-1" style={{ fontSize: 15, lineHeight: 1.55, color: C.ink2 }}>{r.v}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
