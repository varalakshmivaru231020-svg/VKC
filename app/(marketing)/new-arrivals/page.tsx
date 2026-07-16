import type { Metadata } from "next";
import { getProducts } from "@/lib/db/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { ProductData } from "@/lib/types/product";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New Arrivals — Vijaylakshmi Sarees" };

export default async function NewArrivalsPage() {
  let result: { products: ProductData[]; total: number; page: number; limit: number } = { products: [], total: 0, page: 1, limit: 24 };
  try {
    result = await getProducts({ sort: "newest", isFeatured: true, limit: 24 });
    // Fallback: if no featured, get newest
    if (result.products.length === 0) {
      result = await getProducts({ sort: "newest", limit: 24 });
    }
  } catch {}

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      {/* Header */}
      <div className="py-14 text-center" style={{ background: "var(--color-cream)", borderBottom: "1px solid var(--color-parchment)" }}>
        <p className="text-xs font-body font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: "var(--color-gold)" }}>
          Just Arrived
        </p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h1)", fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)" }}>
          New Arrivals
        </h1>
        <p className="text-base font-body mt-3 max-w-md mx-auto" style={{ color: "var(--color-text-muted)" }}>
          Fresh weaves, straight from the looms — handpicked from master artisans across India.
        </p>
        {result.total > 0 && (
          <p className="text-sm font-body mt-2" style={{ color: "var(--color-text-disabled)" }}>
            {result.total} products
          </p>
        )}
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ProductGrid products={result.products} />
        {result.products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-base font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>Coming soon</p>
            <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-muted)" }}>New arrivals will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
