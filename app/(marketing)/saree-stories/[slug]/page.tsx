import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getStoryBySlug, getRelatedStories, getRelatedProductsForStory } from "@/lib/db/saree-stories";
import { SmartImage } from "@/components/ui/SmartImage";
import { ShareButton } from "@/components/ui/ShareButton";
import { EventGallery } from "@/components/events/EventGallery";
import { ProductCard } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://vijaylakshmisarees.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const story = await getStoryBySlug(params.slug);
  if (!story) return {};

  const title = story.metaTitle || `${story.name} — Saree Story`;
  const description = story.metaDesc || story.shortIntro || `Discover the history, craftsmanship, and cultural significance of ${story.name}.`;
  const image = story.ogImage || story.featuredImage || story.heroImage || undefined;
  const url = story.canonicalUrl || `${BASE_URL}/saree-stories/${story.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

const CONTENT_SECTIONS: { key: keyof NonNullable<Awaited<ReturnType<typeof getStoryBySlug>>>; title: string }[] = [
  { key: "history", title: "History" },
  { key: "origin", title: "Origin" },
  { key: "geographicalLocation", title: "Geographical Location" },
  { key: "weavingTechnique", title: "Weaving Technique" },
  { key: "fabricInfo", title: "Fabric Information" },
  { key: "borderDesign", title: "Border Design" },
  { key: "motifs", title: "Motifs" },
  { key: "traditionalUsage", title: "Traditional Usage" },
  { key: "occasionsToWear", title: "Occasions to Wear" },
  { key: "culturalSignificance", title: "Cultural Significance" },
  { key: "careInstructions", title: "Care Instructions" },
];

export default async function SareeStoryPage({ params }: Props) {
  const story = await getStoryBySlug(params.slug);
  if (!story) notFound();

  const [relatedStories, relatedProducts] = await Promise.all([
    getRelatedStories(story, 4),
    getRelatedProductsForStory(story.categoryId, 4),
  ]);

  const canonicalUrl = story.canonicalUrl || `${BASE_URL}/saree-stories/${story.slug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.name,
    description: story.shortIntro || story.metaDesc || undefined,
    image: story.featuredImage || story.heroImage || undefined,
    datePublished: story.createdAt.toISOString(),
    dateModified: story.updatedAt.toISOString(),
    author: { "@type": "Organization", name: "Vijaylakshmi Sarees" },
    publisher: { "@type": "Organization", name: "Vijaylakshmi Sarees" },
    mainEntityOfPage: canonicalUrl,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Saree Stories", item: `${BASE_URL}/saree-stories` },
      { "@type": "ListItem", position: 3, name: story.name, item: canonicalUrl },
    ],
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* ── Breadcrumbs ── */}
      <nav aria-label="Breadcrumb" className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <ol className="flex items-center flex-wrap gap-1.5 text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
          <li><Link href="/" className="hover:underline">Home</Link></li>
          <ChevronRight className="h-3 w-3" />
          <li><Link href="/saree-stories" className="hover:underline">Saree Stories</Link></li>
          <ChevronRight className="h-3 w-3" />
          <li aria-current="page" style={{ color: "var(--color-text-primary)" }}>{story.name}</li>
        </ol>
      </nav>

      {/* ── Hero Banner ── */}
      <div className="relative mt-6 mx-4 sm:mx-6 lg:mx-auto max-w-[1200px] rounded-2xl overflow-hidden" style={{ height: 340, background: "var(--color-cream)" }}>
        {story.heroImage ? (
          <SmartImage src={story.heroImage} alt={story.name} fill objectFit="cover" />
        ) : story.featuredImage ? (
          <SmartImage src={story.featuredImage} alt={story.name} fill objectFit="cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          {(story.region || story.fabric) && (
            <p className="text-xs font-body font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--color-gold-light)" }}>
              {[story.region, story.fabric].filter(Boolean).join(" · ")}
            </p>
          )}
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", color: "white" }}>{story.name}</h1>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {story.shortIntro && (
          <p className="text-lg font-body leading-relaxed mb-8" style={{ color: "var(--color-text-secondary)" }}>{story.shortIntro}</p>
        )}

        <div className="flex items-center justify-between mb-8 pb-6 border-b" style={{ borderColor: "var(--color-parchment)" }}>
          <ShareButton title={story.name} text={story.shortIntro ?? undefined} />
          {story.category && (
            <Link href={`/category/${story.category.slug}`}
              className="text-sm font-body font-semibold" style={{ color: "var(--color-primary)" }}>
              Shop {story.category.name} →
            </Link>
          )}
        </div>

        {/* ── Story content sections ── */}
        <div className="space-y-8">
          {CONTENT_SECTIONS.map(({ key, title }) => {
            const value = story[key];
            if (!value || typeof value !== "string") return null;
            return (
              <section key={key}>
                <h2 className="mb-2" style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h3)", color: "var(--color-text-primary)" }}>{title}</h2>
                <p className="text-sm font-body leading-relaxed whitespace-pre-line" style={{ color: "var(--color-text-secondary)" }}>{value}</p>
              </section>
            );
          })}

          {story.interestingFacts.length > 0 && (
            <section>
              <h2 className="mb-3" style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h3)", color: "var(--color-text-primary)" }}>Interesting Facts</h2>
              <ul className="space-y-2">
                {story.interestingFacts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-body leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--color-gold)" }} />
                    {fact}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── Gallery ── */}
        {story.media.length > 0 && (
          <section className="mt-12 pt-8 border-t" style={{ borderColor: "var(--color-parchment)" }}>
            <h2 className="mb-4" style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h3)", color: "var(--color-text-primary)" }}>Gallery</h2>
            <EventGallery media={story.media} />
          </section>
        )}

        {/* ── Related Products ── */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 pt-8 border-t" style={{ borderColor: "var(--color-parchment)" }}>
            <h2 className="mb-4" style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h3)", color: "var(--color-text-primary)" }}>Shop {story.name}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {relatedProducts.map((product: any) => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        )}

        {/* ── Related Sarees ── */}
        {relatedStories.length > 0 && (
          <section className="mt-12 pt-8 border-t" style={{ borderColor: "var(--color-parchment)" }}>
            <h2 className="mb-4" style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h3)", color: "var(--color-text-primary)" }}>Related Sarees</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {relatedStories.map((rs) => (
                <Link key={rs.id} href={`/saree-stories/${rs.slug}`} className="group">
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2" style={{ background: "var(--color-cream)" }}>
                    {rs.featuredImage && <SmartImage src={rs.featuredImage} alt={rs.name} fill objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />}
                  </div>
                  <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>{rs.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
