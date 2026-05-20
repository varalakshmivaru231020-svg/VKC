import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProducts } from "@/lib/db/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import ShopFilters from "../../shop/ShopFilters";
import ShopHeader from "../../shop/ShopHeader";
import { attrKey } from "../../shop/attrKey";
import { PromoBanner } from "@/components/home/PromoBanner";
import type { ProductData } from "@/lib/types/product";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = [
  { label: "Newest First",      value: "newest" },
  { label: "Price: Low → High", value: "price-asc" },
  { label: "Price: High → Low", value: "price-desc" },
];

interface Props {
  params: { slug: string };
  searchParams: Record<string, string | undefined>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const cat = await db.category.findUnique({ where: { slug: params.slug } });
    if (!cat) return { title: "Category" };
    return { title: cat.name, description: cat.description ?? undefined };
  } catch { return { title: "Category" }; }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  let category: Awaited<ReturnType<typeof db.category.findUnique>> = null;
  let attributes: { id: string; name: string; options: string[]; inputType: string }[] = [];

  const now = new Date();
  let categoryBanners: Awaited<ReturnType<typeof db.banner.findMany>> = [];

  let categoryMidBanners: Awaited<ReturnType<typeof db.banner.findMany>> = [];

  try {
    [category, attributes, categoryBanners, categoryMidBanners] = await Promise.all([
      db.category.findUnique({ where: { slug: params.slug } }),
      db.attribute.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, options: true, inputType: true },
      }),
      db.banner.findMany({
        where: {
          isActive: true,
          position: "category_top",
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      db.banner.findMany({
        where: {
          isActive: true,
          position: "category_banner",
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
    ]);
  } catch (e) {
    console.error("[CategoryPage] DB error loading category/attributes:", e);
  }

  if (!category) notFound();

  // Build attribute filters from URL params
  const attributeFilters: { attributeId: string; value: string }[] = [];
  for (const attr of attributes) {
    const key = attrKey(attr.name);
    const val = searchParams[key];
    if (val) attributeFilters.push({ attributeId: attr.id, value: val });
  }

  const pageParam = parseInt(searchParams.page ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  let result: { products: ProductData[]; total: number; page: number; limit: number } = {
    products: [], total: 0, page: 1, limit: 24,
  };
  try {
    result = await getProducts({
      categorySlug: params.slug,
      sort: (searchParams.sort as any) ?? "newest",
      attributeFilters: attributeFilters.length ? attributeFilters : undefined,
      minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined,
      inStock: searchParams.inStock === "true",
      page,
      limit: 24,
    });
  } catch (e) {
    console.error("[CategoryPage] getProducts error for slug:", params.slug, e);
  }

  const totalPages = Math.ceil(result.total / result.limit);

  const activeFilters: string[] = [];
  for (const attr of attributes) {
    const key = attrKey(attr.name);
    const val = searchParams[key];
    if (val) activeFilters.push(val);
  }
  if (searchParams.inStock === "true") activeFilters.push("In Stock");

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      {/* Category top banners */}
      {categoryBanners.length > 0 && (
        <section className="flex flex-col">
          {categoryBanners.map(banner => (
            <PromoBanner key={banner.id} banner={banner} />
          ))}
        </section>
      )}

      {/* Category hero — uses category_banner image as background if uploaded */}
      {(() => {
        const bannerImg = categoryMidBanners[0]?.imageUrl ?? null;
        return (
          <div
            className="relative py-14 text-center overflow-hidden"
            style={
              bannerImg
                ? { backgroundImage: `url(${bannerImg})`, backgroundSize: "cover", backgroundPosition: "center", borderBottom: "none" }
                : { background: "var(--color-cream)", borderBottom: "1px solid var(--color-parchment)" }
            }
          >
            {bannerImg && <div className="absolute inset-0 bg-black/45 pointer-events-none" />}
            <div className="relative z-10">
              <div className="gold-divider mb-6 mx-auto w-32" />
              <p className="text-label mb-3" style={{ color: "var(--color-gold)" }}>Collection</p>
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h1)", fontWeight: "var(--weight-heading)", color: bannerImg ? "white" : "var(--color-text-primary)" }}>
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-3 max-w-xl mx-auto text-sm font-body" style={{ color: bannerImg ? "rgba(255,255,255,0.8)" : "var(--color-text-muted)" }}>
                  {category.description}
                </p>
              )}
              <p className="mt-4 text-xs font-body" style={{ color: bannerImg ? "rgba(255,255,255,0.6)" : "var(--color-text-disabled)" }}>
                {result.total} sarees
              </p>
            </div>
          </div>
        );
      })()}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 shrink-0">
            <ShopFilters attributes={attributes} current={searchParams} />
          </aside>
          <div className="flex-1 min-w-0">
            <ShopHeader
              total={result.total}
              sortOptions={SORT_OPTIONS}
              currentSort={searchParams.sort ?? "newest"}
              activeFilters={activeFilters}
              attributes={attributes}
              current={searchParams}
            />
            <div className="mt-6">
              <ProductGrid products={result.products} />
            </div>
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
