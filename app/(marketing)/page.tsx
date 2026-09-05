import Link from "next/link";
import { ArrowRight, Shield, RefreshCw, Truck, Sparkles, Facebook } from "lucide-react";
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
import { Legacy } from "@/components/home/Legacy";
import { getActiveGalleryItems } from "@/lib/db/gallery";
import { EventGallery } from "@/components/events/EventGallery";

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

const FALLBACK_SLIDES = [
  {
    tag: "100% Natural",
    heading: "Pure Jaggery\nfrom Mandya",
    subtext: "Chemical-free jaggery pressed from cane grown in Srirangapatna — no preservatives, no artificial colours.",
    ctaLabel: "Explore Range",
    ctaHref: "/category/jaggery",
    ctaSecLabel: "Our Story",
    ctaSecHref: "/about",
    bgColor: "#F2EBE0",
    imageBg: "linear-gradient(135deg, #D4A76A 0%, #8B4513 50%, #5C2E0A 100%)",
    imageUrl: null,
  },
  {
    tag: "Festive Edit",
    heading: "Gift Boxes &\nFestive Combos",
    subtext: "Premium jaggery hampers, laddus and coconut bars — made for celebrations and thoughtful gifting.",
    ctaLabel: "Shop Gift Boxes",
    ctaHref: "/category/gift-boxes",
    ctaSecLabel: "See All Festive",
    ctaSecHref: "/shop?occasion=festival",
    bgColor: "#EDE3D5",
    imageBg: "linear-gradient(135deg, #B8860B 0%, #6B3A2A 50%, #3D1C10 100%)",
    imageUrl: null,
  },
  {
    tag: "Everyday Goodness",
    heading: "Bars, Bites\n& Syrups",
    subtext: "Puffed rice bars, coconut bars, energy bites and jaggery syrups — wholesome snacking for every day.",
    ctaLabel: "Shop Snacks",
    ctaHref: "/category/bars-snacks",
    ctaSecLabel: "Daily Range",
    ctaSecHref: "/shop?occasion=daily",
    bgColor: "#EAE8E2",
    imageBg: "linear-gradient(135deg, #9DB5A0 0%, #5F7A65 50%, #3A5040 100%)",
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
      {/* ── OUR LEGACY — directly below the banner ─────────────────────────── */}
      <Legacy />

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

      {/* ── EDITORIAL BANNER ─────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24" style={{ background: "var(--color-ivory)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div
              className="aspect-square w-full max-w-[460px] mx-auto lg:mx-0 lg:ml-auto rounded-md overflow-hidden relative"
              style={{ background: "linear-gradient(135deg, var(--color-cream), var(--color-parchment))" }}
            >
              {/* Same image as the About page's story portrait — one setting
                  drives both, so updating it in admin changes them together.
                  "contain" so the whole picture shows, whatever its shape. */}
              <SmartImage
                src={about.storyImage}
                alt={about.homeEyebrow}
                fill
                objectFit="contain"
                objectPosition="center"
              />
            </div>
            {/* Text */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px w-10" style={{ background: "var(--color-gold)" }} />
                <span
                  className="text-xs font-semibold tracking-[0.18em] uppercase"
                  style={{ fontFamily: "var(--font-body)", color: "var(--color-gold)" }}
                >
                  {about.homeEyebrow}
                </span>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "var(--text-h1)",
                  fontWeight: "var(--weight-heading)",
                  lineHeight: "var(--leading-heading)",
                  color: "var(--color-text-primary)",
                }}
              >
                {/* Newlines in the setting control where the headline wraps. */}
                <span className="whitespace-pre-line">{about.homeHeading}</span>
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-body-xl)",
                  lineHeight: "var(--leading-body)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {about.homeBody}
              </p>
              <div className="gold-divider" />
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-muted)",
                  lineHeight: "var(--leading-body)",
                }}
              >
                {about.homeQuote}
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm font-semibold font-body transition-all hover:gap-3"
                style={{ color: "var(--color-primary)" }}
              >
                {about.homeCtaLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

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
                <Link key={blog.id} href={`/blog/${blog.slug}`}
                  className="group rounded-2xl border overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
                  style={{ background: "white", borderColor: "var(--color-parchment)" }}>
                  <div className="relative overflow-hidden" style={{ background: "var(--color-cream)", aspectRatio: "4 / 3" }}>
                    {blog.imageUrl
                      ? <div className="absolute inset-3 transition-transform duration-500 group-hover:scale-[1.04]"><SmartImage src={blog.imageUrl} alt={blog.title} fill objectFit="contain" /></div>
                      : <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="h-12 w-12 opacity-20" style={{ color: "var(--color-primary)" }} />
                        </div>}
                  </div>
                  <div className="p-5">
                    {blog.tags.slice(0, 1).map(tag => (
                      <span key={tag} className="px-2 py-0.5 text-[10px] font-body font-semibold rounded-full mb-3 inline-block"
                        style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>{tag}</span>
                    ))}
                    <h3 className="text-sm font-semibold font-body line-clamp-2 mb-2" style={{ color: "var(--color-text-primary)" }}>{blog.title}</h3>
                    {blog.excerpt && (
                      <p className="text-xs font-body line-clamp-2 mb-3" style={{ color: "var(--color-text-muted)", textAlign: "left", hyphens: "none" }}>{blog.excerpt}</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-body font-semibold group-hover:gap-1.5 transition-all"
                      style={{ color: "var(--color-primary)" }}>
                      Read More <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
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
          only the "Follow Us" button itself needs that URL. */}
      {(facebookUrl || facebookVideos.length > 0) && (
        <section className="py-10" style={{ background: "var(--color-primary)" }}>
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
                style={{ background: "white", color: "var(--color-primary)" }}
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

      {/* ── WHY CHOOSE VKC ───────────────────────────────────────────────────── */}
      <WhyChoose />

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

      {/* ── BOTTOM BANNERS (just above footer newsletter) ────────────────────── */}
      {bottomBanners.length > 0 && (
        <section className="flex flex-col">
          {bottomBanners.map(banner => (
            <PromoBanner key={banner.id} banner={banner} />
          ))}
        </section>
      )}
    </>
  );
}
