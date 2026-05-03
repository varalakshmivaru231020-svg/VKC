import { NextResponse } from "next/server";
import { getProducts } from "@/lib/db/products";

export const dynamic = "force-dynamic";

/**
 * Paginated product listing for mobile.
 *
 * Query params:
 *   page          (1-based, default 1)
 *   limit         (default 20, max 50)
 *   sort          newest | price-asc | price-desc | popular
 *   q             search term
 *   categorySlug  filter by category
 *   minPrice / maxPrice
 *   inStock       "true"
 *   isFeatured    "true"
 *   attr.<name>=value  (one filter per attribute, repeatable)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;

    const page  = Math.max(1, parseInt(sp.get("page")  ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20")));

    // Attribute filters: any param starting with "attr."
    const attributeFilters: { attributeId: string; value: string }[] = [];
    sp.forEach((value, key) => {
      if (key.startsWith("attr.") && value) {
        attributeFilters.push({ attributeId: key.slice(5), value });
      }
    });

    const result = await getProducts({
      page, limit,
      sort:           (sp.get("sort") as any) ?? "newest",
      categorySlug:   sp.get("categorySlug") ?? undefined,
      minPrice:       sp.get("minPrice") ? parseInt(sp.get("minPrice")!) : undefined,
      maxPrice:       sp.get("maxPrice") ? parseInt(sp.get("maxPrice")!) : undefined,
      inStock:        sp.get("inStock") === "true",
      isFeatured:     sp.get("isFeatured") === "true" ? true : undefined,
      search:         sp.get("q") ?? undefined,
      attributeFilters: attributeFilters.length ? attributeFilters : undefined,
    });

    return NextResponse.json({
      products: result.products,
      pagination: {
        page:        result.page,
        limit:       result.limit,
        total:       result.total,
        totalPages:  Math.ceil(result.total / result.limit),
        hasMore:     result.page * result.limit < result.total,
      },
    });
  } catch (err) {
    console.error("[v1/products]", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
