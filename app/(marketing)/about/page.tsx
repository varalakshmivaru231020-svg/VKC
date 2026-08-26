import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, ShieldCheck, Sparkles, Globe2, Phone, FileText, MapPin } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { db } from "@/lib/db";
import { getAboutContent } from "@/lib/settings/about";
import { PromoBanner } from "@/components/home/PromoBanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Us — Anjali's Vijaylakshmi Sarees",
  description: "For over a decade, Anjali's Vijaylakshmi Sarees has curated exquisite sarees blending India's rich textile traditions with contemporary sophistication.",
};

// Values cards are editable in Admin → Settings → About Page; only the icon
// artwork stays in code, looked up by the name stored against each card.
const VALUE_ICONS: Record<string, React.ElementType> = { Heart, ShieldCheck, Sparkles, Globe2 };

export default async function AboutPage() {
  const now = new Date();
  const [aboutBanners, settingRows] = await Promise.all([
    db.banner.findMany({
      where: {
        isActive: true,
        position: "about_banner",
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }).catch(() => []),
    db.siteSetting.findMany({
      where: { key: { in: ["store_phone", "whatsapp_number", "store_gst"] } },
    }).catch(() => []),
  ]);

  const about = await getAboutContent();
  const heroBannerUrl = aboutBanners[0]?.imageUrl ?? null;

  const s: Record<string, string> = {};
  settingRows.forEach((r) => { s[r.key] = r.value; });
  const phone     = s.store_phone     || "+91 98323 99399";
  const whatsapp  = s.whatsapp_number || "919832399399";
  const gst       = s.store_gst       || "29AAVFV5771G1ZA";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden py-24 lg:py-36"
        style={
          heroBannerUrl
            ? { backgroundImage: `url(${heroBannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: "var(--color-cream)" }
        }
      >
        {/* Dark overlay when banner image is active */}
        {heroBannerUrl && (
          <div className="absolute inset-0 bg-black/45 pointer-events-none" />
        )}

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-10" style={{ background: "var(--color-gold)" }} />
              <span
                className="text-xs font-semibold tracking-[0.18em] uppercase font-body"
                style={{ color: "var(--color-gold)" }}
              >
                {about.heroEyebrow}
              </span>
            </div>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-display)",
                fontWeight: "var(--weight-heading)",
                lineHeight: "var(--leading-display)",
                color: heroBannerUrl ? "white" : "var(--color-text-primary)",
              }}
            >
              {/* Newlines in the setting become line breaks, so the admin can
                  control where the headline wraps. */}
              <span className="whitespace-pre-line">{about.heroTitle}</span>
            </h1>
            <p
              className="mt-6 max-w-xl"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-body-xl)",
                lineHeight: "var(--leading-body)",
                color: heroBannerUrl ? "rgba(255,255,255,0.85)" : "var(--color-text-secondary)",
              }}
            >
              {about.heroSubtitle}
            </p>
          </div>
        </div>

        {/* Decorative gradient — only shown without banner */}
        {!heroBannerUrl && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1/3 opacity-30 pointer-events-none hidden lg:block"
            style={{
              background: "radial-gradient(ellipse at right center, var(--color-gold) 0%, transparent 70%)",
            }}
          />
        )}
      </section>

      {/* ── STORY ── */}
      <section className="py-20 lg:py-28" style={{ background: "var(--color-ivory)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            {/* Story image */}
            <div className="relative aspect-[4/5] max-w-[360px] mx-auto lg:mx-0 lg:col-span-2 rounded-2xl overflow-hidden">
              <SmartImage
                src="/uploads/Vijaylakshmi.png"
                alt="Anjali's Vijaylakshmi Sarees — Handcrafted Elegance"
                fill
                objectFit="cover"
                objectPosition="center top"
              />
              {/* Caption overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 space-y-0.5">
                <p className="text-[11px] font-body uppercase tracking-widest text-white/70">
                  Handcrafted Elegance
                </p>
                <p className="text-sm font-body text-white/80">
                  Every drape tells a story
                </p>
              </div>
            </div>

            <div className="space-y-8 lg:col-span-3">
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
                  {about.storyHeading}
                </h2>
                <div className="space-y-4" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", fontSize: "var(--text-body)", lineHeight: "var(--leading-body)" }}>
                  {/* Blank lines in the setting separate paragraphs. */}
                  {about.storyBody.split(/\n{2,}/).map((para) => para.trim()).filter(Boolean).map((para, i) => (
                    <p key={i}>{para}</p>
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
              {about.valuesEyebrow}
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
              {about.valuesHeading}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {about.values.map(({ icon, title, desc }) => {
              const Icon = VALUE_ICONS[icon] ?? Heart;
              return (
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
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CONTACT & REGISTERED OFFICES ── */}
      <section className="py-20" style={{ background: "var(--color-ivory)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-[0.18em] uppercase font-body" style={{ color: "var(--color-gold)" }}>
              {about.officesEyebrow}
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
              {about.officesHeading}
            </h2>
          </div>

          {/* Contact + GST strip */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl border text-sm font-body font-semibold transition-all hover:shadow-sm"
              style={{ background: "white", borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}
            >
              <Phone className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
              {phone}
            </a>
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl border text-sm font-body font-semibold transition-all hover:shadow-md"
              style={{ background: "white", borderColor: "#25D366", color: "var(--color-text-primary)" }}
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp: {phone}
            </a>
            <div
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl border text-sm font-body font-semibold"
              style={{ background: "white", borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}
            >
              <FileText className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
              GST: {gst}
            </div>
          </div>

          {/* Offices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {about.offices.map((office) => (
              <div
                key={office.label}
                className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                style={{ background: "white", border: "1px solid var(--color-parchment)", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
              >
                {/* Header band */}
                <div
                  className="flex items-center gap-3 px-6 py-4"
                  style={{ background: "var(--color-primary)" }}
                >
                  <MapPin className="h-4 w-4 shrink-0" style={{ color: "var(--color-gold-light)" }} />
                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: "var(--weight-heading)",
                      fontSize: "1.05rem",
                      color: "white",
                    }}
                  >
                    {office.label}
                  </h3>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                  {office.name && (
                    <p className="text-sm font-semibold font-body mb-3" style={{ color: "var(--color-text-primary)" }}>
                      {office.name}
                    </p>
                  )}
                  <div className="space-y-1">
                    {office.lines.map((line) => (
                      <p key={line} className="text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>
                        {line}
                      </p>
                    ))}
                  </div>

                  <a
                    href="tel:8904410112"
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold font-body transition-colors"
                    style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    8904410112
                  </a>
                </div>
              </div>
            ))}
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
            {about.ctaHeading}
          </h2>
          <p
            className="max-w-lg mx-auto"
            style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-xl)", color: "var(--color-text-secondary)" }}
          >
            {about.ctaText}
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
