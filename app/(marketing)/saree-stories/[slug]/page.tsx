import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoryBySlug, getRelatedStories, getRelatedProductsForStory } from "@/lib/db/saree-stories";

// Premium Components
import { HeroBanner } from "@/components/saree-stories/HeroBanner";
import { HeritageIntro } from "@/components/saree-stories/HeritageIntro";
import { FeatureCards, FactCounters } from "@/components/saree-stories/PremiumCards";
import { VerticalTimeline, HorizontalProcess } from "@/components/saree-stories/Timelines";
import { MasonryGallery } from "@/components/saree-stories/MasonryGallery";
import { TestimonialCarousel } from "@/components/saree-stories/PremiumCarousels";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";
import { SmartImage } from "@/components/ui/SmartImage";

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

  return (
    <div className="min-h-screen bg-[#FAF8F4] overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      {/* 1. Cinematic Hero Banner */}
      <HeroBanner 
        title={story.name}
        subtitle={[story.region, story.fabric].filter(Boolean).join(" · ")}
        imageUrl={story.heroImage || story.featuredImage}
      />

      {/* 2. Heritage Introduction */}
      <HeritageIntro 
        title={`Woven Heritage of ${story.region || "India"}`}
        subtitle={story.name}
        content={story.shortIntro || story.history || ""}
        imageUrl={story.featuredImage}
      />

      {/* 3. Fact Counters */}
      <FactCounters />

      {/* 4. Feature Cards */}
      <FeatureCards />

      {/* 5. Heritage Timeline */}
      <VerticalTimeline />

      {/* 6. Weaving Process */}
      <HorizontalProcess />

      {/* 7. Masonry Gallery */}
      {story.media && story.media.length > 0 && (
        <MasonryGallery media={story.media} />
      )}

      {/* 8. Related Sarees (Shop Collection) */}
      {relatedProducts.length > 0 && (
        <div className="py-24 bg-white border-t border-[#EAE4DA]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl text-[#2B2118] mb-4" style={{ fontFamily: "'Playfair Display', var(--font-heading), serif" }}>
                Shop {story.name}
              </h2>
              <p className="text-sm uppercase tracking-widest text-[#B8860B] font-body">Curated Collection</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((product: any) => (
                <div key={product.id} className="group cursor-pointer">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 9. Testimonials Carousel */}
      <TestimonialCarousel />

      {/* 10. More Stories */}
      {relatedStories.length > 0 && (
        <div className="py-24 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl md:text-3xl text-[#2B2118]" style={{ fontFamily: "'Playfair Display', var(--font-heading), serif" }}>
                More Saree Stories
              </h2>
              <Link href="/saree-stories" className="text-sm font-semibold font-body text-[#B8860B] uppercase tracking-widest hover:text-[#2B2118] transition-colors">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedStories.map((rs) => (
                <Link key={rs.id} href={`/saree-stories/${rs.slug}`} className="group block">
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden mb-4 bg-[#EAE4DA]">
                    {rs.featuredImage && (
                      <SmartImage src={rs.featuredImage} alt={rs.name} fill objectFit="cover" className="group-hover:scale-105 transition-transform duration-500" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg text-[#2B2118] font-semibold font-body group-hover:text-[#B8860B] transition-colors">
                    {rs.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
