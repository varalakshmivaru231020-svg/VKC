import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, ShieldCheck, Sparkles, Globe2, Phone, MessageCircle, FileText, Building2 } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { db } from "@/lib/db";
import { PromoBanner } from "@/components/home/PromoBanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Us — Anjali's Vijaylakshmi Sarees",
  description: "For over a decade, Anjali's Vijaylakshmi Sarees has curated exquisite sarees blending India's rich textile traditions with contemporary sophistication.",
};

const values = [
  {
    icon: Heart,
    title: "Heritage & Craftsmanship",
    desc: "From intricate Aari work to exclusive handcrafted designs, every saree reflects our passion for perfection and India's rich textile traditions.",
  },
  {
    icon: ShieldCheck,
    title: "Trust & Authenticity",
    desc: "Our journey has been built on trust, authenticity, and an unwavering commitment to quality — earning the love of customers across India and around the world.",
  },
  {
    icon: Sparkles,
    title: "Premium Quality",
    desc: "Premium fabrics, refined finishes, and meticulous attention to detail — because every drape should tell a story of grace and enduring beauty.",
  },
  {
    icon: Globe2,
    title: "Accessible to Every Woman",
    desc: "Through exhibitions, online live sales, and our digital presence, we continue to make exceptional sarees accessible to every woman, everywhere.",
  },
];

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
                Over a Decade of Trust
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
              Where Tradition<br />Meets Luxury.
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
              At Anjali's Vijaylakshmi Sarees, every saree is a celebration of heritage,
              elegance, and timeless craftsmanship.
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Story image */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
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
                  About Us
                </h2>
                <div className="space-y-4" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", fontSize: "var(--text-body)", lineHeight: "var(--leading-body)" }}>
                  <p>
                    At Anjali's Vijaylakshmi Sarees, every saree is a celebration of heritage,
                    elegance, and timeless craftsmanship. For over a decade, we have been
                    curating exquisite collections that beautifully blend India's rich
                    textile traditions with contemporary sophistication.
                  </p>
                  <p>
                    From intricate Aari work and exclusive handcrafted designs to premium
                    fabrics and refined finishes, each creation reflects our passion for
                    perfection. Our journey has been built on trust, authenticity, and an
                    unwavering commitment to quality, earning the love of customers across
                    India and around the world.
                  </p>
                  <p>
                    Through exhibitions, online live sales, and our digital presence, we
                    continue to make exceptional sarees accessible to every woman. More than
                    a brand, Anjali's Vijaylakshmi Sarees is a destination where tradition
                    meets luxury, and every drape tells a story of grace, confidence and
                    enduring beauty.
                  </p>
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

      {/* ── CONTACT & REGISTERED OFFICES ── */}
      <section className="py-20" style={{ background: "var(--color-ivory)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-[0.18em] uppercase font-body" style={{ color: "var(--color-gold)" }}>
              Reach Us
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
              Contact &amp; Registered Offices
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
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-body font-semibold transition-all hover:shadow-md"
              style={{ background: "#25D366", color: "white" }}
            >
              <MessageCircle className="h-4 w-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl p-7" style={{ background: "white", border: "1px solid var(--color-parchment)" }}>
              <div className="flex items-center gap-2.5 mb-4">
                <Building2 className="h-4.5 w-4.5" style={{ color: "var(--color-primary)" }} />
                <h3 className="text-sm font-semibold font-body uppercase tracking-wide" style={{ color: "var(--color-text-primary)" }}>
                  Registered Office
                </h3>
              </div>
              <p className="text-sm font-body leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                VL Group<br />
                36/11, CHB Colony<br />
                Street No. 04<br />
                Vellur Road<br />
                Tiruchengode – 637211<br />
                Namakkal Dt., Tamil Nadu
              </p>
              <p className="text-xs font-body mt-3" style={{ color: "var(--color-text-muted)" }}>
                Contact: 8904410112
              </p>
            </div>

            <div className="rounded-2xl p-7" style={{ background: "white", border: "1px solid var(--color-parchment)" }}>
              <div className="flex items-center gap-2.5 mb-4">
                <Building2 className="h-4.5 w-4.5" style={{ color: "var(--color-primary)" }} />
                <h3 className="text-sm font-semibold font-body uppercase tracking-wide" style={{ color: "var(--color-text-primary)" }}>
                  Karnataka Office
                </h3>
              </div>
              <p className="text-sm font-body leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Anjali's Vijaylakshmi Sarees — VL Group<br />
                D. No. 4/397/A1 to 4/397/A8<br />
                Chantar Gram Panchayat<br />
                Brahmavar Hebri Road<br />
                Chantar, Udupi<br />
                Brahmavar – 576213, Karnataka
              </p>
              <p className="text-xs font-body mt-3" style={{ color: "var(--color-text-muted)" }}>
                Contact: 8904410112
              </p>
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
            skill, intention, and a decade of passion.
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
