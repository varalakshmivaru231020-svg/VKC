import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getProducts, getAvailableColors } from "@/lib/db/products";
import { getThemeSettings } from "@/lib/theme/server";
import { ProductGrid } from "@/components/product/ProductGrid";
import ShopFilters from "./ShopFilters";
import ShopHeader from "./ShopHeader";
import { attrKey } from "./attrKey";
import { PromoBanner } from "@/components/home/PromoBanner";
import { PageBanner } from "@/components/layout/PageBanner";
import { getPageBanner } from "@/lib/page-banners";
import type { ProductData } from "@/lib/types/product";

export const metadata: Metadata = { title: "Shop All Products" };
export const dynamic = "force-dynamic";

const SORT_OPTIONS = [
  { label: "Newest First",      value: "newest" },
  { label: "Price: Low → High", value: "price-asc" },
  { label: "Price: High → Low", value: "price-desc" },
];

interface Props {
  searchParams: Record<string, string | undefined>;
}

export default async function ShopPage({ searchParams }: Props) {
  const now = new Date();
  const [settings, attributes, colors, shopBanners, pageBanner] = await Promise.all([
    getThemeSettings(),
    db.attribute.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, options: true, inputType: true },
    }).catch(() => []),
    getAvailableColors().catch(() => []),
    db.banner.findMany({
      where: {
        isActive: true,
        position: "shop_top",
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }).catch(() => []),
    // The page banner's photograph: Admin → Banners, position "shop_banner".
    getPageBanner("shop"),
  ]);

  // Build attribute filters from URL params
  const attributeFilters: { attributeId: string; value: string }[] = [];
  for (const attr of attributes) {
    const key = attrKey(attr.name);
    const val = searchParams[key];
    if (val) attributeFilters.push({ attributeId: attr.id, value: val });
  }

  const page = parseInt(searchParams.page ?? "1");

  let result: { products: ProductData[]; total: number; page: number; limit: number } = {
    products: [], total: 0, page: 1, limit: 24,
  };
  try {
    result = await getProducts({
      sort: (searchParams.sort as any) ?? "newest",
      attributeFilters: attributeFilters.length ? attributeFilters : undefined,
      minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined,
      inStock: searchParams.inStock === "true",
      color: searchParams.color,
      search: searchParams.q,
      page,
      limit: 24,
    });
  } catch {}

  const totalPages = Math.ceil(result.total / result.limit);

  // Active filter labels for display
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
  if (searchParams.q) activeFilters.push(`"${searchParams.q}"`);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      {/* Shop top banners */}
      {shopBanners.length > 0 && (
        <section className="flex flex-col">
          {shopBanners.map(banner => (
            <PromoBanner key={banner.id} banner={banner} />
          ))}
        </section>
      )}

      {/* The standard inner-page banner (components/layout/PageBanner). */}
      <PageBanner {...pageBanner} />
      <div className="border-b" style={{ background: "var(--color-cream)", borderColor: "var(--color-parchment)" }}>
        <p className="max-w-3xl mx-auto px-5 py-5 text-sm font-body text-center" style={{ color: "var(--color-text-muted)", textAlign: "center", hyphens: "none" }}>
          Our product direction is inspired by natural sweetness, rooted values, and a growing commitment to quality-led development — a dependable identity in jaggery and value-added natural sweetener products.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sidebar-sticky pr-1">
              <ShopFilters attributes={attributes} colors={colors} current={searchParams} />
            </div>
          </aside>

          {/* Main content */}
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
            <div className="mt-0 sm:mt-6">
              <ProductGrid products={result.products} />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`?${new URLSearchParams({ ...searchParams, page: String(p) } as Record<string, string>)}`}
                    className="h-9 w-9 flex items-center justify-center rounded-sm text-sm font-body font-medium transition-colors border"
                    style={
                      p === page
                        ? { background: "var(--color-primary)", color: "var(--color-text-inverse)", borderColor: "var(--color-primary)" }
                        : { borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)" }
                    }
                  >
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
