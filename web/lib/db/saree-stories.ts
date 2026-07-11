import { db } from "@/lib/db";

export interface SareeStoryFilters {
  search?: string;
  categorySlug?: string;
  region?: string;
  fabric?: string;
  sort?: "newest" | "oldest" | "name-asc" | "name-desc";
  page?: number;
  limit?: number;
}

export async function getPublishedStories(filters: SareeStoryFilters = {}) {
  const { search, categorySlug, region, fabric, sort = "newest", page = 1, limit = 12 } = filters;

  const where: any = { isPublished: true };
  if (categorySlug) where.category = { slug: categorySlug };
  if (region) where.region = region;
  if (fabric) where.fabric = fabric;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { shortIntro: { contains: search, mode: "insensitive" } },
      { region: { contains: search, mode: "insensitive" } },
      { fabric: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: any =
    sort === "name-asc"  ? { name: "asc" } :
    sort === "name-desc" ? { name: "desc" } :
    sort === "oldest"    ? { createdAt: "asc" } :
    [{ sortOrder: "asc" }, { createdAt: "desc" }];

  const [total, stories] = await Promise.all([
    db.sareeStory.count({ where }),
    db.sareeStory.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { stories, total, page, limit };
}

export async function getStoryBySlug(slug: string) {
  return db.sareeStory.findUnique({
    where: { slug, isPublished: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      media: { orderBy: { sortOrder: "asc" } },
    },
  });
}

/** Auto-derived — same region or fabric, excluding self. No manual curation needed. */
export async function getRelatedStories(story: { id: string; region: string | null; fabric: string | null }, limit = 4) {
  if (!story.region && !story.fabric) return [];
  return db.sareeStory.findMany({
    where: {
      id: { not: story.id },
      isPublished: true,
      OR: [
        ...(story.region ? [{ region: story.region }] : []),
        ...(story.fabric ? [{ fabric: story.fabric }] : []),
      ],
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

/** Products in the same saree category, if the story is linked to one. */
export async function getRelatedProductsForStory(categoryId: string | null, limit = 4) {
  if (!categoryId) return [];
  const products = await db.product.findMany({
    where: { isActive: true, categoryId },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        where: { isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => ({
    ...p,
    costPrice: undefined,
    variants: p.variants.map((v) => ({
      ...v,
      costPrice: Number(v.costPrice),
      salePrice: Number(v.salePrice),
      originalPrice: Number(v.originalPrice),
    })),
  }));
}

/** Distinct filter option lists for the listing page sidebar. */
export async function getStoryFilterOptions() {
  const [regions, fabrics, categories] = await Promise.all([
    db.sareeStory.findMany({ where: { isPublished: true, region: { not: null } }, select: { region: true }, distinct: ["region"] }),
    db.sareeStory.findMany({ where: { isPublished: true, fabric: { not: null } }, select: { fabric: true }, distinct: ["fabric"] }),
    db.sareeStory.findMany({
      where: { isPublished: true, categoryId: { not: null } },
      select: { category: { select: { id: true, name: true, slug: true } } },
      distinct: ["categoryId"],
    }),
  ]);
  return {
    regions: regions.map((r) => r.region).filter(Boolean) as string[],
    fabrics: fabrics.map((f) => f.fabric).filter(Boolean) as string[],
    categories: categories.map((c) => c.category).filter(Boolean) as { id: string; name: string; slug: string }[],
  };
}
