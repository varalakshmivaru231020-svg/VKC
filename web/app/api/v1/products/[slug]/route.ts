import { NextResponse } from "next/server";
import { getProductBySlug, getRelatedProducts } from "@/lib/db/products";

export const dynamic = "force-dynamic";

/**
 * Single product detail by slug. Includes related products list.
 *
 * Path: /api/v1/products/{slug}
 */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const product = await getProductBySlug(params.slug);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const related = await getRelatedProducts(product.id, product.categoryId ?? undefined, 8);

    return NextResponse.json({ product, related });
  } catch (err) {
    console.error("[v1/products/:slug]", err);
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}
