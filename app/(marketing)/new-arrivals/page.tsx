import type { Metadata } from "next";
import { getProducts } from "@/lib/db/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { ProductData } from "@/lib/types/product";
import { PageBanner } from "@/components/layout/PageBanner";
import { getPageBanner } from "@/lib/page-banners";
import { PAGE_CONTAINER } from "@/lib/layout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New Arrivals — vkcgoldikshu" };

export default async function NewArrivalsPage() {
  let result: { products: ProductData[]; total: number; page: number; limit: number } = { products: [], total: 0, page: 1, limit: 24 };
  try {
    result = await getProducts({ sort: "newest", isFeatured: true, limit: 24 });
    // Fallback: if no featured, get newest
    if (result.products.length === 0) {
      result = await getProducts({ sort: "newest", limit: 24 });
    }
  } catch {}

  const pageBanner = await getPageBanner("newArrivals");

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      <PageBanner {...pageBanner} />

      <div className={`${PAGE_CONTAINER} py-14 sm:py-20`}>
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
