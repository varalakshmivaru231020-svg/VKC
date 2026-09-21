import { db } from "@/lib/db";
import type { ProductData } from "@/lib/types/product";

function mapProduct(p: any): ProductData {
  return {
    ...p,
    costPrice: undefined,
    gstPercent: Number(p.gstPercent),
    variants: p.variants?.map((v: any) => ({
      ...v,
      costPrice: Number(v.costPrice),
      salePrice: Number(v.salePrice),
      originalPrice: Number(v.originalPrice),
    })) ?? [],
  };
}

/**
 * The variant salePrice condition for a min/max price range. Both bounds must
 * live in ONE `salePrice` object: they used to be two separate spreads that
 * each wrote the `salePrice` key, so with both set the second silently
 * replaced the first and the minimum was dropped ("₹500 – ₹1,000" returned
 * everything up to ₹1,000).
 */
export function salePriceFilter(minPrice?: number, maxPrice?: number): { salePrice?: { gte?: number; lte?: number } } {
  const range: { gte?: number; lte?: number } = {};
  if (minPrice !== undefined && Number.isFinite(minPrice)) range.gte = minPrice;
  if (maxPrice !== undefined && Number.isFinite(maxPrice)) range.lte = maxPrice;
  return Object.keys(range).length ? { salePrice: range } : {};
}

export interface ProductFilters {
  categorySlug?: string;
  /** Several categories at once (the app's checkbox filter). */
  categorySlugs?: string[];
  /** At least this many percent off on some variant. */
  minDiscount?: number;
  /** Average approved-review rating of at least this. */
  minRating?: number;
  attributeFilters?: { attributeId: string; value: string }[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  color?: string;
  isFeatured?: boolean;
  search?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "popular" | "discount" | "rating";
  page?: number;
  limit?: number;
}

export async function getProducts(filters: ProductFilters = {}) {
  const {
    categorySlug, categorySlugs, minDiscount, minRating, attributeFilters,
    minPrice, maxPrice, inStock, color, isFeatured, search,
    sort = "newest", page = 1, limit = 24,
  } = filters;

  const where: any = { isActive: true };

  if (categorySlugs && categorySlugs.length > 0) {
    where.category = { slug: { in: categorySlugs } };
  } else if (categorySlug) {
    where.category = { slug: categorySlug };
  }
  if (isFeatured !== undefined) {
    where.isFeatured = isFeatured;
  }
  if (attributeFilters && attributeFilters.length > 0) {
    where.AND = attributeFilters.map(({ attributeId, value }) => ({
      productAttributes: { some: { attributeId, values: { has: value } } },
    }));
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { fabric: { contains: search, mode: "insensitive" } },
      { weaveType: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }
  if (Object.keys(salePriceFilter(minPrice, maxPrice)).length > 0 || inStock || color) {
    where.variants = {
      some: {
        isActive: true,
        ...salePriceFilter(minPrice, maxPrice),
        ...(inStock && { stockQty: { gt: 0 } }),
        ...(color && { colorHex: color }),
      },
    };
  }

  const include = {
    category: { select: { id: true, name: true, slug: true } },
    variants: {
      where: { isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" as const } },
      },
      orderBy: { sortOrder: "asc" as const },
    },
  };

  // Price, discount and rating live on variants and reviews, which Prisma
  // can't order a product list by. For those the matching set is ranked in
  // memory (the catalogue is small) and only the requested page is loaded.
  const ranked =
    sort === "price-asc" || sort === "price-desc" || sort === "discount" || sort === "rating" ||
    !!minDiscount || !!minRating;

  let total: number;
  let products: any[];

  if (ranked) {
    const rows = await db.product.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        variants: { where: { isActive: true }, select: { salePrice: true, originalPrice: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const ratings = await getRatingSummaries(rows.map((r) => r.id));
    let scored = rows.map((r) => {
      const prices = r.variants.map((v) => Number(v.salePrice));
      const discount = Math.max(0, ...r.variants.map((v) => {
        const mrp = Number(v.originalPrice), sale = Number(v.salePrice);
        return mrp > sale && mrp > 0 ? Math.round(((mrp - sale) / mrp) * 100) : 0;
      }));
      return {
        id: r.id,
        price: prices.length ? Math.min(...prices) : 0,
        discount,
        rating: ratings.get(r.id)?.average ?? 0,
      };
    });
    if (minDiscount) scored = scored.filter((r) => r.discount >= minDiscount);
    if (minRating) scored = scored.filter((r) => r.rating >= minRating);
    // Array.sort is stable, so ties keep the newest-first order.
    if (sort === "price-asc") scored.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") scored.sort((a, b) => b.price - a.price);
    else if (sort === "discount") scored.sort((a, b) => b.discount - a.discount);
    else if (sort === "rating") scored.sort((a, b) => b.rating - a.rating);

    total = scored.length;
    const ids = scored.slice((page - 1) * limit, page * limit).map((r) => r.id);
    const found = await db.product.findMany({ where: { id: { in: ids } }, include });
    const byId = new Map(found.map((p) => [p.id, p]));
    products = ids.map((id) => byId.get(id)).filter(Boolean);
  } else {
    [total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
  }

  const summaries = await getRatingSummaries(products.map((p) => p.id));
  products = products.map((p) => ({
    ...p,
    ratingAverage: summaries.get(p.id)?.average ?? 0,
    ratingCount: summaries.get(p.id)?.count ?? 0,
  }));

  return { products: products.map(mapProduct), total, page, limit };
}

/** Average rating and count of approved reviews, per product id. */
async function getRatingSummaries(productIds: string[]) {
  const out = new Map<string, { average: number; count: number }>();
  if (productIds.length === 0) return out;
  const groups = await db.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  for (const g of groups) {
    out.set(g.productId, { average: Math.round((g._avg.rating ?? 0) * 10) / 10, count: g._count._all });
  }
  return out;
}

export interface ColorSwatch {
  hex: string;
  name: string;
}

/** Distinct colors across active variants, one swatch per hex (first color name seen wins). */
export async function getAvailableColors(): Promise<ColorSwatch[]> {
  const variants = await db.productVariant.findMany({
    where: { isActive: true, product: { isActive: true } },
    select: { colorHex: true, colorName: true },
    distinct: ["colorHex"],
    orderBy: { colorName: "asc" },
  });
  return variants
    .filter((v) => v.colorHex)
    .map((v) => ({ hex: v.colorHex, name: v.colorName }));
}

export async function getProductBySlug(slug: string): Promise<ProductData | null> {
  const p = await db.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        where: { isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
      productAttributes: {
        include: { attribute: { select: { id: true, name: true, inputType: true } } },
        orderBy: { attribute: { sortOrder: "asc" } },
      },
    },
  });
  return p ? mapProduct(p) : null;
}

export async function getFeaturedProducts(limit = 8): Promise<ProductData[]> {
  const products = await db.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        where: { isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return products.map(mapProduct);
}

export async function getRelatedProducts(productId: string, categoryId?: string, limit = 6) {
  const products = await db.product.findMany({
    where: {
      isActive: true,
      id: { not: productId },
      ...(categoryId && { categoryId }),
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        where: { isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return products.map(mapProduct);
}
