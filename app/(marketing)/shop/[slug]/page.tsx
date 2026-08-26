import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/db/products";
import { db } from "@/lib/db";
import { getReturnsDays } from "@/lib/settings/returns";
import { ProductGrid } from "@/components/product/ProductGrid";
import ProductDetailClient from "./ProductDetailClient";
import type { ProductData } from "@/lib/types/product";

export const dynamic = "force-dynamic";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const p = await getProductBySlug(params.slug);
    if (!p) return { title: "Product Not Found" };
    return {
      title: p.name,
      description: p.shortDesc ?? p.description?.slice(0, 160),
    };
  } catch { return { title: "Product" }; }
}

export default async function ProductDetailPage({ params }: Props) {
  let product: ProductData | null = null;
  let related: ProductData[] = [];
  let careInstructions = "";
  // Returns window comes from the `returns_days` setting so this page cannot
  // quote a different figure to the home page, checkout and invoice.
  const returnsDays = await getReturnsDays();
  let deliveryInstructions = `• Free shipping on this product – Domestic orders only\n• Standard delivery: 4–7 business days\n• Express delivery available at checkout\n• Easy ${returnsDays}-day returns on unworn items with tags intact\n• Exchange available for different colour of same product`;

  try {
    product = await getProductBySlug(params.slug);
    [related] = await Promise.all([
      product ? getRelatedProducts(product.id, product.category?.id, 4) : Promise.resolve([]),
    ]);
    const settingsRows = await db.siteSetting.findMany({ where: { key: { in: ["care_instructions", "delivery_instructions"] } } });
    const settings = Object.fromEntries(settingsRows.map(r => [r.key, r.value]));
    if (settings.care_instructions !== undefined) careInstructions = settings.care_instructions;
    if (settings.delivery_instructions !== undefined) deliveryInstructions = settings.delivery_instructions;
  } catch {}

  if (!product) notFound();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      {/* Breadcrumb */}
      <div className="border-b" style={{ borderColor: "var(--color-parchment)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            {product.category && (
              <>
                <Link href={`/category/${product.category.slug}`} className="hover:text-primary transition-colors">
                  {product.category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span style={{ color: "var(--color-text-primary)" }} className="truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product detail */}
      <ProductDetailClient product={product} careInstructions={careInstructions} deliveryInstructions={deliveryInstructions} returnsDays={returnsDays} />

      {/* Related products */}
      {related.length > 0 && (
        <section className="py-16 border-t" style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-center mb-10" style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h2)", fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)" }}>
              You May Also Love
            </h2>
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}
