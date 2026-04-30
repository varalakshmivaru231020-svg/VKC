import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, Users, MapPin, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Story — Vijaylakshmi Sarees",
  description: "Discover the heritage behind Vijaylakshmi Sarees — six decades of celebrating India's master weavers.",
};

const values = [
  {
    icon: Heart,
    title: "Crafted with Love",
    desc: "Every saree is chosen by hand — not by algorithm. We visit looms, meet weavers, and only carry what moves us.",
  },
  {
    icon: Users,
    title: "Weaver First",
    desc: "We pay weavers directly at fair prices. No middlemen. No exploitation. The artisan who made your saree is paid what they deserve.",
  },
  {
    icon: MapPin,
    title: "Rooted in India",
    desc: "From Kanchipuram to Varanasi, Patan to Bhubaneswar — we work with master weavers across 15 states.",
  },
  {
    icon: Award,
    title: "Uncompromising Quality",
    desc: "Each saree passes a 12-point quality check before it reaches you. We reject over 30% of what we see at the loom.",
  },
];

const milestones = [
  { year: "1968", event: "Founded in Chennai by Vijaylakshmi Subramaniam — a single shop, a passion for silk." },
  { year: "1985", event: "Expanded to source directly from Kanjivaram weavers, cutting out traders entirely." },
  { year: "2003", event: "Opened buyer visits to loom clusters — customers could meet the weavers who made their sarees." },
  { year: "2018", event: "Launched the Weaver Welfare Fund — providing healthcare and education support to artisan families." },
  { year: "2024", event: "Went online, bringing 2,000+ heritage sarees to customers across India and the world." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden py-24 lg:py-36"
        style={{ background: "var(--color-cream)" }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-10" style={{ background: "var(--color-gold)" }} />
              <span className="text-xs font-semibold tracking-[0.18em] uppercase font-body" style={{ color: "var(--color-gold)" }}>
                Est. 1968
              </span>
            </div>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-display)",
                fontWeight: "var(--weight-heading)",
                lineHeight: "var(--leading-display)",
                color: "var(--color-text-primary)",
              }}
            >
              More Than a Saree.<br />A Living Tradition.
            </h1>
            <p
              className="mt-6 max-w-xl"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-body-xl)",
                lineHeight: "var(--leading-body)",
                color: "var(--color-text-secondary)",
              }}
            >
              For over five decades, Vijaylakshmi Sarees has been a bridge between India's
              most gifted weavers and the women who cherish their art. We don't just sell
              sarees — we carry stories.
            </p>
          </div>
        </div>

        {/* Decorative element */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 opacity-30 pointer-events-none hidden lg:block"
          style={{
            background: "radial-gradient(ellipse at right center, var(--color-gold) 0%, transparent 70%)",
          }}
        />
      </section>

      {/* ── STORY ── */}
      <section className="py-20 lg:py-28" style={{ background: "var(--color-ivory)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image placeholder */}
            <div
              className="aspect-[4/5] rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(145deg, var(--color-parchment) 0%, var(--color-sand) 100%)" }}
            >
              <div className="h-full flex items-end p-8">
                <div className="space-y-1">
                  <p className="text-xs font-body uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.4)" }}>
                    Kanchipuram, Tamil Nadu
                  </p>
                  <p className="text-sm font-body" style={{ color: "rgba(0,0,0,0.5)" }}>
                    A master weaver at work — 1974
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h2
                  className="mb-5"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--text-h2)",
                    fontWeight: "var(--weight-heading)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Born from a Love of Weaves
                </h2>
                <div className="space-y-4" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", fontSize: "var(--text-body)", lineHeight: "var(--leading-body)" }}>
                  <p>
                    In 1968, Vijaylakshmi Subramaniam opened a small shop in Chennai's
                    T. Nagar with a single mission: to bring the finest handwoven sarees
                    directly from the weaver's hands to the woman who wears them.
                  </p>
                  <p>
                    What began as one woman's passion became a movement. By the 1980s, we
                    were travelling to loom clusters across South India, building
                    relationships with master craftsmen whose families had woven silk
                    for generations.
                  </p>
                  <p>
                    Today, we work with over 50 weaver families across 15 states — from the
                    silk looms of Kanchipuram to the brocade workshops of Varanasi, from the
                    double-ikat ateliers of Patan to the sambalpuri villages of Odisha.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: "var(--color-parchment)" }}>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: "55+", label: "Years of heritage" },
                    { value: "50+", label: "Weaver families" },
                    { value: "2k+", label: "Sarees catalogued" },
                  ].map(({ value, label }) => (
                    <div key={label}>
                      <p
                        className="text-3xl font-medium"
                        style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
                      >
                        {value}
                      </p>
                      <p className="text-xs font-body mt-1" style={{ color: "var(--color-text-muted)" }}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="py-20" style={{ background: "var(--color-cream)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-[0.18em] uppercase font-body" style={{ color: "var(--color-gold)" }}>
              What We Stand For
            </span>
            <h2
              className="mt-3"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-h2)",
                fontWeight: "var(--weight-heading)",
                color: "var(--color-text-primary)",
              }}
            >
              Our Values
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl p-7 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                style={{ background: "white", border: "1px solid var(--color-parchment)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300 group-hover:bg-primary"
                  style={{ background: "var(--color-primary-50)" }}
                >
                  <Icon
                    className="h-5 w-5 transition-colors duration-300 group-hover:text-white"
                    style={{ color: "var(--color-primary)" }}
                  />
                </div>
                <h3
                  className="text-base font-semibold font-body mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {title}
                </h3>
                <p className="text-sm font-body leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="py-20" style={{ background: "var(--color-ivory)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-h2)",
                fontWeight: "var(--weight-heading)",
                color: "var(--color-text-primary)",
              }}
            >
              Our Journey
            </h2>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              {/* Vertical line */}
              <div
                className="absolute left-[72px] top-2 bottom-2 w-px"
                style={{ background: "var(--color-parchment)" }}
              />
              <div className="space-y-10">
                {milestones.map(({ year, event }, i) => (
                  <div key={year} className="flex items-start gap-8">
                    <div className="shrink-0 w-16 text-right">
                      <span
                        className="text-sm font-bold font-body"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {year}
                      </span>
                    </div>
                    {/* Dot */}
                    <div
                      className="shrink-0 w-3 h-3 rounded-full mt-1 relative z-10"
                      style={{
                        background: "var(--color-primary)",
                        boxShadow: "0 0 0 4px var(--color-ivory), 0 0 0 5px var(--color-parchment)",
                      }}
                    />
                    <p className="text-sm font-body leading-relaxed pt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                      {event}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="py-20"
        style={{ background: "var(--color-cream)", borderTop: "1px solid var(--color-parchment)" }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-h2)",
              fontWeight: "var(--weight-heading)",
              color: "var(--color-text-primary)",
            }}
          >
            Wear a Story
          </h2>
          <p
            className="max-w-lg mx-auto"
            style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-xl)", color: "var(--color-text-secondary)" }}
          >
            Browse our collection and find the saree that speaks to you — woven with
            skill, intention, and fifty years of love.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xs text-sm font-semibold font-body transition-all hover:gap-3.5 hover:shadow-md"
              style={{ background: "var(--color-primary)", color: "white" }}
            >
              Shop All Sarees <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xs text-sm font-semibold font-body border transition-colors hover:bg-primary-50"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
