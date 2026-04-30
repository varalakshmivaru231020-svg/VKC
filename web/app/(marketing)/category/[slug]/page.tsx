import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProducts } from "@/lib/db/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import ShopFilters from "../../shop/ShopFilters";
import ShopHeader from "../../shop/ShopHeader";
import type { ProductData } from "@/lib/types/product";

export const dynamic = "force-dynamic";

const FABRICS = ["Silk", "Cotton", "Georgette", "Chiffon", "Crepe", "Tussar", "Organza"];
const OCCASIONS = ["Wedding", "Festival", "Party", "Daily", "Office"];
const REGIONS = ["Tamil Nadu", "Uttar Pradesh", "Gujarat", "Madhya Pradesh", "Karnataka", "Odisha", "West Bengal"];
const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
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
  let category = null;
  try {
    category = await db.category.findUnique({ where: { slug: params.slug } });
  } catch {}

  if (!category) notFound();

  const page = parseInt(searchParams.page ?? "1");
  let result: { products: ProductData[]; total: number; page: number; limit: number } = { products: [], total: 0, page: 1, limit: 24 };
  try {
    result = await getProducts({
      categorySlug: params.slug,
      sort: (searchParams.sort as any) ?? "newest",
      fabric: searchParams.fabric,
      occasion: searchParams.occasion,
      regionOfOrigin: searchParams.region,
      minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined,
      inStock: searchParams.inStock === "true",
      page,
      limit: 24,
    });
  } catch {}

  const totalPages = Math.ceil(result.total / result.limit);
  const activeFilters = [
    searchParams.fabric, searchParams.occasion, searchParams.region,
    searchParams.inStock === "true" ? "In Stock" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      {/* Category hero */}
      <div className="relative py-14 text-center overflow-hidden"
        style={{ background: "var(--color-cream)", borderBottom: "1px solid var(--color-parchment)" }}>
        <div className="gold-divider mb-6 mx-auto w-32" />
        <p className="text-label mb-3" style={{ color: "var(--color-gold)" }}>Collection</p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h1)", fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)" }}>
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-3 max-w-xl mx-auto text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
            {category.description}
          </p>
        )}
        <p className="mt-4 text-xs font-body" style={{ color: "var(--color-text-disabled)" }}>
          {result.total} sarees
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 shrink-0">
            <ShopFilters fabrics={FABRICS} occasions={OCCASIONS} regions={REGIONS} current={searchParams} />
          </aside>
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
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a key={p} href={`?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
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
