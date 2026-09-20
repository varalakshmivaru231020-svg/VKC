import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProducts, getAvailableColors, type ColorSwatch } from "@/lib/db/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import ShopFilters from "../../shop/ShopFilters";
import ShopHeader from "../../shop/ShopHeader";
import { attrKey } from "../../shop/attrKey";
import { PromoBanner } from "@/components/home/PromoBanner";
import type { ProductData } from "@/lib/types/product";
import { PageBanner } from "@/components/layout/PageBanner";
import { getCustomPageBanner } from "@/lib/page-banners";
import { PAGE_CONTAINER } from "@/lib/layout";

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
  let colors: ColorSwatch[] = [];

  const now = new Date();
  let categoryBanners: Awaited<ReturnType<typeof db.banner.findMany>> = [];

  try {
    [category, attributes, colors, categoryBanners] = await Promise.all([
      db.category.findUnique({ where: { slug: params.slug } }),
      db.attribute.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, options: true, inputType: true },
      }),
      getAvailableColors(),
      db.banner.findMany({
        where: {
          isActive: true,
          position: "category_top",
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

  // The standard inner-page banner. Photograph: Admin → Banners, "category_banner"
  // (shared by all categories), else the site default. A category without a
  // description of its own gets a neutral line, so the heading sits exactly
  // where it does on Shop.
  const pageBanner = await getCustomPageBanner({
    position: "category_banner",
    crumb: category.name,
    title: category.name,
    description: category.description?.trim() || "Pure, chemical-free jaggery and cane products from Mandya — browse the collection.",
    headingId: "category-banner-heading",
  });

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
      color: searchParams.color,
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
  if (searchParams.color) {
    const matched = colors.find((c) => c.hex === searchParams.color);
    activeFilters.push(matched?.name ?? "Color");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      {/* The standard inner-page banner, as on Shop. */}
      <PageBanner {...pageBanner} />

      {/* Promotional strips (Admin → Banners, "category_top") follow the page banner. */}
      {categoryBanners.length > 0 && (
        <section className="flex flex-col">
          {categoryBanners.map(banner => (
            <PromoBanner key={banner.id} banner={banner} />
          ))}
        </section>
      )}

      <div className={`${PAGE_CONTAINER} py-6 sm:py-10`}>
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 shrink-0">
            <ShopFilters attributes={attributes} colors={colors} current={searchParams} />
          </aside>
          <div className="flex-1 min-w-0">
            <ShopHeader
              total={result.total}
              sortOptions={SORT_OPTIONS}
              currentSort={searchParams.sort ?? "newest"}
              activeFilters={activeFilters}
              attributes={attributes}
              colors={colors}
              current={searchParams}
            />
            <div className="mt-6">
              <ProductGrid products={result.products} columns={3} />
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
