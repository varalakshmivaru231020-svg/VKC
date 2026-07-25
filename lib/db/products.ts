import { db } from "@/lib/db";
import type { ProductData } from "@/lib/types/product";
import { isPreBookingAvailable, preBookingRemainingSlots, preBookingEtaLabel } from "@/lib/utils/prebooking";

function mapProduct(p: any): ProductData {
  return {
    ...p,
    costPrice: undefined,
    gstPercent: Number(p.gstPercent),
    preBookingEtaLabel: preBookingEtaLabel(p),
    variants: p.variants?.map((v: any) => ({
      ...v,
      costPrice: Number(v.costPrice),
      salePrice: Number(v.salePrice),
      originalPrice: Number(v.originalPrice),
      preBookingAvailable: isPreBookingAvailable(p, v),
      preBookingRemainingSlots: preBookingRemainingSlots(p, v),
    })) ?? [],
  };
}

export interface ProductFilters {
  categorySlug?: string;
  attributeFilters?: { attributeId: string; value: string }[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  color?: string;
  isFeatured?: boolean;
  search?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "popular";
  page?: number;
  limit?: number;
}

export async function getProducts(filters: ProductFilters = {}) {
  const {
    categorySlug, attributeFilters,
    minPrice, maxPrice, inStock, color, isFeatured, search,
    sort = "newest", page = 1, limit = 24,
  } = filters;

  const where: any = { isActive: true };

  if (categorySlug) {
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
  if (minPrice !== undefined || maxPrice !== undefined || inStock || color) {
    where.variants = {
      some: {
        isActive: true,
        ...(minPrice !== undefined && { salePrice: { gte: minPrice } }),
        ...(maxPrice !== undefined && { salePrice: { lte: maxPrice } }),
        ...(inStock && { stockQty: { gt: 0 } }),
        ...(color && { colorHex: color }),
      },
    };
  }

  const orderBy: any =
    sort === "price-asc"  ? { variants: { _count: "asc" } } :
    sort === "price-desc" ? { variants: { _count: "desc" } } :
    { createdAt: "desc" };

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { isActive: true },
          include: {
            images: { orderBy: { sortOrder: "asc" } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { products: products.map(mapProduct), total, page, limit };
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
