import { Suspense } from "react";
import type { Metadata } from "next";
import { getProducts } from "@/lib/db/products";
import { getThemeSettings } from "@/lib/theme/server";
import { ProductGrid } from "@/components/product/ProductGrid";
import ShopFilters from "./ShopFilters";
import ShopHeader from "./ShopHeader";
import type { ProductData } from "@/lib/types/product";

export const metadata: Metadata = { title: "Shop All Sarees" };
export const dynamic = "force-dynamic";

const FABRICS = ["Silk", "Cotton", "Georgette", "Chiffon", "Crepe", "Tussar", "Organza"];
const OCCASIONS = ["Wedding", "Festival", "Party", "Daily", "Office"];
const REGIONS = ["Tamil Nadu", "Uttar Pradesh", "Gujarat", "Madhya Pradesh", "Karnataka", "Odisha", "West Bengal"];
const SORT_OPTIONS = [
  { label: "Newest First",   value: "newest" },
  { label: "Price: Low → High", value: "price-asc" },
  { label: "Price: High → Low", value: "price-desc" },
];

interface Props {
  searchParams: {
    sort?: string;
    fabric?: string;
    occasion?: string;
    region?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    q?: string;
    page?: string;
  };
}

export default async function ShopPage({ searchParams }: Props) {
  const settings = await getThemeSettings();
  const page = parseInt(searchParams.page ?? "1");

  let result: { products: ProductData[]; total: number; page: number; limit: number } = { products: [], total: 0, page: 1, limit: 24 };
  try {
    result = await getProducts({
      sort: (searchParams.sort as any) ?? "newest",
      fabric: searchParams.fabric,
      occasion: searchParams.occasion,
      regionOfOrigin: searchParams.region,
      minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined,
      inStock: searchParams.inStock === "true",
      search: searchParams.q,
      page,
      limit: 24,
    });
  } catch {}

  const totalPages = Math.ceil(result.total / result.limit);
  const activeFilters = [
    searchParams.fabric, searchParams.occasion, searchParams.region,
    searchParams.inStock === "true" ? "In Stock" : null,
    searchParams.q ? `"${searchParams.q}"` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      {/* Page header */}
      <div className="py-10 text-center border-b" style={{ background: "var(--color-cream)", borderColor: "var(--color-parchment)" }}>
        <p className="text-label mb-2" style={{ color: "var(--color-gold)" }}>Explore</p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h1)", fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)" }}>
          All Sarees
        </h1>
        <p className="text-body-sm mt-2 font-body" style={{ color: "var(--color-text-muted)" }}>
          {result.total > 0 ? `${result.total} sarees curated for you` : "Handwoven from across India"}
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sidebar-sticky pr-1">
            <ShopFilters
              fabrics={FABRICS}
              occasions={OCCASIONS}
              regions={REGIONS}
              current={searchParams}
            />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <ShopHeader
              total={result.total}
              sortOptions={SORT_OPTIONS}
              currentSort={searchParams.sort ?? "newest"}
              activeFilters={activeFilters}
              fabrics={FABRICS}
              occasions={OCCASIONS}
              regions={REGIONS}
              current={searchParams}
            />
            <div className="mt-6">
              <ProductGrid products={result.products} />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
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
