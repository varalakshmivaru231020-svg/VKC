import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedStories, getStoryFilterOptions } from "@/lib/db/saree-stories";
import { SmartImage } from "@/components/ui/SmartImage";
import SareeStoriesFilters from "./SareeStoriesFilters";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Saree Stories — History & Craftsmanship",
  description: "Discover the history, weaving technique, and cultural significance behind every saree we sell — Kanchipuram, Banarasi, Mysore Silk, Gadwal, and more.",
};
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Record<string, string | undefined>;
}

export default async function SareeStoriesPage({ searchParams }: Props) {
  const page = parseInt(searchParams.page ?? "1") || 1;

  const [{ stories, total, limit }, filterOptions] = await Promise.all([
    getPublishedStories({
      search: searchParams.q,
      categorySlug: searchParams.category,
      region: searchParams.region,
      fabric: searchParams.fabric,
      sort: (searchParams.sort as any) ?? "newest",
      page,
    }),
    getStoryFilterOptions(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      <div className="relative py-16 text-center border-b" style={{ background: "var(--color-cream)", borderColor: "var(--color-parchment)" }}>
        <p className="text-label mb-2" style={{ color: "var(--color-gold)" }}>Heritage &amp; Craft</p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h1)", fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)" }}>
          Saree Stories
        </h1>
        <p className="mt-3 max-w-xl mx-auto text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
          The history, weaving technique, and cultural significance behind every saree we sell.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 shrink-0">
            <SareeStoriesFilters
              regions={filterOptions.regions}
              fabrics={filterOptions.fabrics}
              categories={filterOptions.categories}
              current={searchParams}
            />
          </aside>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-body mb-6" style={{ color: "var(--color-text-muted)" }}>
              <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{total}</span> {total === 1 ? "story" : "stories"}
            </p>

            {stories.length === 0 ? (
              <p className="text-center text-sm font-body py-16" style={{ color: "var(--color-text-muted)" }}>
                No saree stories match your filters yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <Link
                    key={story.id}
                    href={`/saree-stories/${story.slug}`}
                    className="group rounded-2xl overflow-hidden border transition-all hover:shadow-lg hover:-translate-y-0.5"
                    style={{ background: "white", borderColor: "var(--color-parchment)" }}
                  >
                    <div className="relative h-56 overflow-hidden" style={{ background: "var(--color-cream)" }}>
                      {story.featuredImage ? (
                        <SmartImage src={story.featuredImage} alt={story.name} fill objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🧵</div>
                      )}
                    </div>
                    <div className="p-5">
                      {(story.region || story.fabric) && (
                        <p className="text-[11px] font-body font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-gold)" }}>
                          {[story.region, story.fabric].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
                        {story.name}
                      </h2>
                      {story.shortIntro && (
                        <p className="text-sm font-body line-clamp-2 mb-3" style={{ color: "var(--color-text-muted)" }}>{story.shortIntro}</p>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs font-body font-semibold group-hover:gap-1.5 transition-all" style={{ color: "var(--color-primary)" }}>
                        Read the Story <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a key={p}
                    href={`?${new URLSearchParams({ ...searchParams, page: String(p) } as Record<string, string>)}`}
                    className="h-9 w-9 flex items-center justify-center rounded-sm text-sm font-body font-medium border transition-colors"
                    style={p === page
                      ? { background: "var(--color-primary)", color: "white", borderColor: "var(--color-primary)" }
                      : { borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)" }}>
                    {p}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
