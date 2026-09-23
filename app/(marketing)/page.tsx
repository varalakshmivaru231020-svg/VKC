import Link from "next/link";
import { ArrowRight, Shield, RefreshCw, Truck, Sparkles, Facebook, CheckCircle2 } from "lucide-react";
import { getThemeSettings } from "@/lib/theme/server";
import { getReturnsDays } from "@/lib/settings/returns";
import { getAboutContent } from "@/lib/settings/about";
import { getFeaturedProducts } from "@/lib/db/products";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";
import HeroSlider from "@/components/home/HeroSlider";
import { PopupBanner } from "@/components/home/PopupBanner";
import { SmartImage } from "@/components/ui/SmartImage";
import { PromoBanner } from "@/components/home/PromoBanner";
import { WhyChoose } from "@/components/home/WhyChoose";
import { Testimonials, type TestimonialItem } from "@/components/home/Testimonials";
import { ShopByCategories } from "@/components/home/ShopByCategories";
import { getActiveGalleryItems } from "@/lib/db/gallery";
import { EventGallery } from "@/components/events/EventGallery";
import { BlogCard } from "@/components/blog/BlogCard";

export const dynamic = "force-dynamic";

const CAT_GRADIENTS = [
  "linear-gradient(135deg, #F2EBE0, #D4A76A)",
  "linear-gradient(135deg, #EDE3D5, #B8860B)",
  "linear-gradient(135deg, #EAE8E2, #9DB5A0)",
  "linear-gradient(135deg, #FDF0F2, #C9748A)",
  "linear-gradient(135deg, #EDE8F5, #7C5CBF)",
  "linear-gradient(135deg, #E8F4EF, #3A8C6E)",
  "linear-gradient(135deg, #FEF5E7, #C97B2A)",
  "linear-gradient(135deg, #F0F4FF, #4B6FD4)",
];

// A single, cinematic hero — not a carousel of competing products. Shown only
// when Admin → Hero Slides has nothing active; real photography is set there.
const FALLBACK_SLIDES = [
  {
    tag: "VKC Gold Ikshu",
    heading: "Rooted in Legacy.\nCrafted from Mandya.",
    subtext: "Authentic jaggery, naturally made and rooted in generations of tradition.",
    caption: "Pure  ·  Natural  ·  Traditional",
    ctaLabel: "Shop Now",
    ctaHref: "/shop",
    ctaSecLabel: "Discover Our Story",
    ctaSecHref: "/about",
    bgColor: "#F7F0E3",
    imageBg: "linear-gradient(135deg, #DDA83B 0%, #8F6A10 55%, #241A12 100%)",
    imageUrl: null,
  },
];

// Returns window comes from the `returns_days` setting so this badge, checkout
// and the invoice always quote the same number.
const buildTrustBadges = (returnsDays: number) => [
  { Icon: Sparkles, title: "100% Natural",     desc: "No chemicals, preservatives or artificial colours" },
  { Icon: Truck,    title: "Free Shipping",    desc: "All over India" },
  { Icon: RefreshCw,title: `${returnsDays}-Day Returns`, desc: "No questions asked return policy" },
  { Icon: Shield,   title: "Secure Payment",   desc: "100% safe & encrypted checkout" },
];

export default async function HomePage() {
  const now = new Date();
  const [, featuredProducts, dbSlides, activePopup, latestBlogs, homepageCatSetting, activeBanners, galleryItems, facebookSetting, facebookVideos] = await Promise.all([
    getThemeSettings(),
    getFeaturedProducts(4).catch(() => []),
    db.heroSlide.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }).catch(() => []),
    Promise.resolve().then(() => db.popup.findFirst({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, imageUrl: true, linkUrl: true },
    })).catch(() => null),
    Promise.resolve().then(() => db.blog.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { id: true, title: true, slug: true, excerpt: true, imageUrl: true, tags: true, publishedAt: true, createdAt: true },
    })).catch(() => []),
    db.siteSetting.findUnique({ where: { key: "homepage_category_ids" } }).catch(() => null),
    db.banner.findMany({
      where: {
        isActive: true,
        position: { in: ["home_hero", "home_mid", "home_bottom"] },
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }).catch(() => []),
    getActiveGalleryItems(20).catch(() => []),
    db.siteSetting.findUnique({ where: { key: "social_facebook" } }).catch(() => null),
    db.galleryItem.findMany({
      where: { type: "FACEBOOK", isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 8,
    }).catch(() => []),
  ]);

  const returnsDays = await getReturnsDays();
  const trustBadges = buildTrustBadges(returnsDays);
  const about = await getAboutContent();

  // Testimonials are managed in Admin → Testimonials. The section hides
  // itself when there are no active entries.
  const testimonials: TestimonialItem[] = await db.testimonial
    .findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 8,
      select: { id: true, name: true, location: true, tag: true, rating: true, quote: true },
    })
    .catch(() => []);

  // Home-page section copy editable in Admin → Settings → Homepage.
  const homeCopyRows = await db.siteSetting
    .findMany({ where: { key: { in: ["home_blog_eyebrow", "home_blog_heading", "home_blog_description", "home_testimonials_eyebrow", "home_testimonials_heading"] } } })
    .catch(() => [] as { key: string; value: string }[]);
  const homeCopy = (key: string, fallback: string) => homeCopyRows.find((r) => r.key === key)?.value?.trim() || fallback;


  const facebookUrl = facebookSetting?.value || null;
  const galleryPhotos = galleryItems.filter((g) => g.type !== "VIDEO" && g.type !== "FACEBOOK").slice(0, 8);
  const galleryVideos = galleryItems.filter((g) => g.type === "VIDEO").slice(0, 8);
  // "From Mandya to Your Home" borrows the first gallery photo (fields/farmers)
  // rather than a separate upload slot — falls back to nothing if none is set.
  const mandyaPhoto = galleryPhotos[0] ?? null;

  const heroSlides = dbSlides.length > 0 ? dbSlides : FALLBACK_SLIDES;

  let homepageCategoryIds: string[] = [];
  try { if (homepageCatSetting?.value) homepageCategoryIds = JSON.parse(homepageCatSetting.value); } catch {}

  // Admin → Settings → Homepage can pin and order categories. When nothing is
  // pinned, show every active category that has an image, in catalogue order,
  // so the section works out of the box as categories are added.
  type HomeCat = { id: string; name: string; slug: string; imageUrl: string | null };
  const catSelect = { id: true, name: true, slug: true, imageUrl: true } as const;
  let homeCategories: HomeCat[] = [];
  if (homepageCategoryIds.length) {
    const picked = await db.category
      .findMany({ where: { id: { in: homepageCategoryIds }, isActive: true }, select: catSelect })
      .catch(() => [] as HomeCat[]);
    // Preserve the admin-chosen order
    homeCategories = homepageCategoryIds.map((id) => picked.find((c) => c.id === id)).filter(Boolean) as HomeCat[];
  }
  // A stale pin list (categories since deleted or deactivated) must not blank
  // the section — fall back to the automatic list.
  if (!homeCategories.length) {
    homeCategories = await db.category
      .findMany({
        where: { isActive: true, imageUrl: { not: null } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: catSelect,
        take: 10,
      })
      .catch(() => [] as HomeCat[]);
  }

  const heroBanners = activeBanners.filter(b => b.position === "home_hero");
  const midBanners = activeBanners.filter(b => b.position === "home_mid");
  const bottomBanners = activeBanners.filter(b => b.position === "home_bottom");

  return (
    <>
      <PopupBanner popup={activePopup} />

      {/* ── HERO SLIDER ──────────────────────────────────────────────────────── */}
      <HeroSlider slides={heroSlides} />

      {/* ── HERO BANNERS ─────────────────────────────────────────────────────── */}
      {heroBanners.length > 0 && (
        <section className="flex flex-col">
          {heroBanners.map(banner => (
            <PromoBanner key={banner.id} banner={banner} />
          ))}
        </section>
      )}

      {/* ── SHOP BY CATEGORIES ────────────────────────────────────────────── */}
      <ShopByCategories categories={homeCategories} />

      {/* ── FEATURED PRODUCTS ─────────────────────────────────────────────────── */}
      <section className="pt-10 pb-16 lg:pt-12 lg:pb-20" style={{ background: "var(--color-cream)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <span
              className="text-xs font-semibold tracking-[0.18em] uppercase"
              style={{ fontFamily: "var(--font-body)", color: "var(--color-gold)" }}
            >
              Curated for You
            </span>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-h1)",
                fontWeight: "var(--weight-heading)",
                color: "var(--color-text-primary)",
              }}
            >
              New Arrivals
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2.5 px-10 py-3.5 rounded-xs text-sm font-semibold font-body border transition-all duration-normal hover:gap-3.5"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
            >
              View All Products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── MID BANNERS ──────────────────────────────────────────────────────── */}
      {midBanners.length > 0 && (
        <section className="flex flex-col">
          {midBanners.map(banner => (
            <PromoBanner key={banner.id} banner={banner} />
          ))}
        </section>
      )}

      {/* ── EDITORIAL BANNER (OUR HERITAGE) ─────────────────────────────────── */}
      <section className="py-16 lg:py-24" style={{ background: "var(--color-ivory)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              {/* Eyebrow */}
              <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.2em] uppercase font-body"
                style={{ background: "var(--color-primary-50)", color: "var(--color-gold-dark)" }}>
                {about.homeEyebrow || "OUR HERITAGE"}
              </div>

              {/* Heading */}
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl leading-tight"
                style={{ fontFamily: "var(--font-heading)", fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)" }}
              >
                <span className="whitespace-pre-line">{about.homeHeading}</span>
              </h2>

              {/* Description Paragraph */}
              <p
                className="text-sm sm:text-base leading-relaxed font-body"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {about.homeBody}
              </p>

              {/* 4 Feature Bullets (2x2 Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 font-body">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-gold-dark)" }} />
                  <span className="text-xs sm:text-sm font-medium leading-snug" style={{ color: "var(--color-text-secondary)" }}>
                    Directly supporting Mandya sugarcane farmers with fair pay.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-gold-dark)" }} />
                  <span className="text-xs sm:text-sm font-medium leading-snug" style={{ color: "var(--color-text-secondary)" }}>
                    100% chemical-free natural process with zero preservatives.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-gold-dark)" }} />
                  <span className="text-xs sm:text-sm font-medium leading-snug" style={{ color: "var(--color-text-secondary)" }}>
                    Generational purity & authentic local sugarcane heritage.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-gold-dark)" }} />
                  <span className="text-xs sm:text-sm font-medium leading-snug" style={{ color: "var(--color-text-secondary)" }}>
                    Dedicated team committed to sustainability & quality.
                  </span>
                </div>
              </div>

              {/* Quote / Subtext */}
              {about.homeQuote && (
                <p className="text-xs sm:text-sm italic font-body pl-3 py-0.5"
                  style={{ color: "var(--color-text-muted)", borderLeft: "2px solid var(--color-gold)" }}>
                  {about.homeQuote}
                </p>
              )}

              {/* Gold Pill Button */}
              <div className="pt-2">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-300 hover:shadow-lg group"
                  style={{ background: "var(--color-primary)", color: "var(--color-text-primary)" }}
                >
                  {about.homeCtaLabel || "READ OUR STORY"}
                  <span className="w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1"
                    style={{ background: "var(--color-text-primary)", color: "var(--color-gold-light)" }}>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Right Image Frame (Soft backdrop container) */}
            <div className="relative w-full max-w-[520px] mx-auto lg:mx-0 lg:ml-auto p-5 sm:p-7 rounded-3xl" style={{ background: "var(--color-cream)" }}>
              <div className="relative w-full aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden shadow-md bg-white">
                <SmartImage
                  src={about.storyImage}
                  alt={about.homeEyebrow}
                  fill
                  objectFit="cover"
                  objectPosition="center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE VKC ───────────────────────────────────────────────────── */}
      <WhyChoose />

      {/* ── FROM MANDYA TO YOUR HOME ─────────────────────────────────────────── */}
      {mandyaPhoto && (
        <section className="relative" style={{ height: "clamp(360px, 52vw, 560px)" }}>
          <SmartImage src={mandyaPhoto.url} alt={mandyaPhoto.caption || "A VKC farmer in the sugarcane fields of Mandya"} fill objectFit="cover" objectPosition="center" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(36,26,18,0.05) 0%, rgba(36,26,18,0.55) 65%, rgba(36,26,18,0.78) 100%)" }} />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
              <span className="text-xs font-semibold tracking-[0.22em] uppercase font-body" style={{ color: "var(--color-gold-light)" }}>
                Our Journey
              </span>
              <h2 className="mt-3 max-w-xl" style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h2)", fontWeight: "var(--weight-heading)", color: "#FFFFFF" }}>
                From Mandya to Your Home
              </h2>
              <p className="mt-3 max-w-lg text-sm sm:text-base font-body" style={{ color: "rgba(255,255,255,0.82)", textAlign: "left", hyphens: "none" }}>
                Every batch begins in the sugarcane fields of Mandya and reaches your kitchen unchanged — the same purity, carried the whole way.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── BLOG PREVIEW ─────────────────────────────────────────────────────── */}
      {latestBlogs.length > 0 && (
        <section className="py-16 lg:py-20" style={{ background: "var(--color-ivory)" }}>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-6 mb-10">
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs font-semibold tracking-[0.18em] uppercase"
                  style={{ fontFamily: "var(--font-body)", color: "var(--color-gold)" }}>
                  {homeCopy("home_blog_eyebrow", "From the Blog")}
                </span>
                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h2)", fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)" }}>
                  {homeCopy("home_blog_heading", "Stories from the cane fields")}
                </h2>
                {homeCopy("home_blog_description", "") && (
                  <p className="text-sm font-body" style={{ color: "var(--color-text-muted)", textAlign: "left", hyphens: "none", maxWidth: 560 }}>
                    {homeCopy("home_blog_description", "")}
                  </p>
                )}
              </div>
              <Link href="/blog" className="text-sm font-medium font-body flex items-center gap-1.5 hover:gap-2.5 transition-all"
                style={{ color: "var(--color-primary)" }}>
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {latestBlogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  id={blog.id}
                  title={blog.title}
                  slug={blog.slug}
                  excerpt={blog.excerpt}
                  imageUrl={blog.imageUrl}
                  publishedAt={blog.publishedAt}
                  createdAt={blog.createdAt}
                  tags={blog.tags}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GALLERY PREVIEW (photos, single-row slider) ──────────────────────── */}
      {galleryPhotos.length > 0 && (
        <section className="py-16 lg:py-20" style={{ background: "var(--color-cream)" }}>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.18em] uppercase"
                  style={{ fontFamily: "var(--font-body)", color: "var(--color-gold)" }}>
                  Behind the Scenes
                </span>
                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h2)", fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)" }}>
                  Gallery
                </h2>
              </div>
              <Link href="/gallery" className="text-sm font-medium font-body flex items-center gap-1.5 hover:gap-2.5 transition-all"
                style={{ color: "var(--color-primary)" }}>
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <EventGallery media={galleryPhotos} layout="slider" />
          </div>
        </section>
      )}

      {/* ── VIDEOS ────────────────────────────────────────────────────────────── */}
      {galleryVideos.length > 0 && (
        <section className="py-16 lg:py-20" style={{ background: "var(--color-ivory)" }}>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.18em] uppercase"
                  style={{ fontFamily: "var(--font-body)", color: "var(--color-gold)" }}>
                  Watch
                </span>
                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h2)", fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)" }}>
                  Videos
                </h2>
              </div>
              <Link href="/gallery" className="text-sm font-medium font-body flex items-center gap-1.5 hover:gap-2.5 transition-all"
                style={{ color: "var(--color-primary)" }}>
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <EventGallery media={galleryVideos} />
          </div>
        </section>
      )}

      {/* ── FOLLOW US ON FACEBOOK ────────────────────────────────────────────── */}
      {/* Videos added via Admin → Facebook Videos should still show even if the
          Facebook page URL (Admin → Settings → Social Links) hasn't been set yet —
          only the "Follow Us" button itself needs that URL. The one other spot
          (besides the footer) where the logo's royal-blue half gets a moment. */}
      {(facebookUrl || facebookVideos.length > 0) && (
        <section className="py-10" style={{ background: "var(--color-royal)" }}>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.12)" }}>
              <Facebook className="h-6 w-6" style={{ color: "white" }} />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", color: "white" }}>Follow us on Facebook</p>
              <p className="text-sm font-body" style={{ color: "rgba(255,255,255,0.75)" }}>New arrivals, festive offers, and behind-the-scenes — right in your feed.</p>
            </div>
            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-body font-semibold transition-opacity hover:opacity-90"
                style={{ background: "var(--color-gold)", color: "var(--color-text-primary)" }}
              >
                Follow Us
              </a>
            )}
          </div>
          {facebookVideos.length > 0 && (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              {/* Vertical reels-style clips — 9:16 so they show full frame
                  instead of being cropped square. More columns than the event
                  grid, since portrait tiles are much taller. */}
              <EventGallery media={facebookVideos} aspect="9/16" />
            </div>
          )}
        </section>
      )}

      {/* ── TESTIMONIALS (real approved reviews only; hidden when none) ─────── */}
      <Testimonials
        items={testimonials}
        eyebrow={homeCopy("home_testimonials_eyebrow", "Customer stories")}
        heading={homeCopy("home_testimonials_heading", "What our customers say")}
      />

      {/* ── TRUST BADGES ─────────────────────────────────────────────────────── */}
      <section
        className="py-14"
        style={{
          background: "var(--color-ivory)",
          borderTop: "1px solid var(--color-parchment)",
          borderBottom: "1px solid var(--color-parchment)",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {trustBadges.map(({ Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
                    {title}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed font-body" style={{ color: "var(--color-text-muted)" }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM BANNERS (just above the closing CTA) ───────────────────────── */}
      {bottomBanners.length > 0 && (
        <section className="flex flex-col">
          {bottomBanners.map(banner => (
            <PromoBanner key={banner.id} banner={banner} />
          ))}
        </section>
      )}

      {/* ── CLOSING CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 text-center" style={{ background: "var(--color-text-primary)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h2)", fontWeight: "var(--weight-heading)", color: "#FFFFFF" }}>
            Taste the Tradition of Mandya
          </h2>
          <div className="mt-8">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2.5 px-10 py-3.5 rounded-full text-sm font-semibold font-body transition-all duration-normal hover:gap-3.5"
              style={{ background: "var(--color-primary)", color: "var(--color-text-primary)" }}
            >
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
