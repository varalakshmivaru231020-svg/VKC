import type { Metadata } from "next";
import { db } from "@/lib/db";
import { normalizeBannerImageUrl } from "@/lib/banners";
import { ABOUT_MEDIA, resolveAboutMedia, type AboutSlotKey, type ResolvedMedia } from "@/lib/about-media";
import AboutExperience, { type AboutProduct } from "./AboutExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Story — From Cane to Legacy | VKC Gold Ikshu",
  description:
    "Since 1988, Mandya, Karnataka. The story of VKC Gold Ikshu — from Late Shri B Ramachandra's sugarcane crusher to a family legacy of pure, chemical-free jaggery.",
};

export default async function AboutPage() {
  const now = new Date();
  const positions = Object.values(ABOUT_MEDIA).map((s) => s.position);

  // Photographs come from Admin → Banners (one position per scene, see
  // lib/about-media.ts), products and the home hero slide from the catalogue,
  // contact details from Admin → Settings. Every query soft-fails so the film
  // still plays from its defaults if the database is unreachable.
  const [rows, banners, heroSlide, products] = await Promise.all([
    db.siteSetting
      .findMany({ where: { key: { in: ["store_phone", "whatsapp_number", "store_email", "store_address"] } } })
      .catch(() => [] as { key: string; value: string }[]),
    db.banner
      .findMany({
        where: {
          isActive: true,
          position: { in: positions },
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { position: true, imageUrl: true, mobileImageUrl: true, title: true },
      })
      .catch(() => []),
    db.heroSlide
      .findFirst({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { imageUrl: true } })
      .catch(() => null),
    db.product
      .findMany({
        where: { isActive: true },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: 8,
        select: {
          name: true,
          slug: true,
          category: { select: { name: true } },
          variants: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } },
          },
        },
      })
      .catch(() => []),
  ]);

  const get = (k: string) => rows.find((r) => r.key === k)?.value || undefined;

  const media = {} as Record<AboutSlotKey, ResolvedMedia>;
  for (const key of Object.keys(ABOUT_MEDIA) as AboutSlotKey[]) {
    const hit = banners.find((b) => b.position === ABOUT_MEDIA[key].position && normalizeBannerImageUrl(b.imageUrl));
    media[key] = resolveAboutMedia(
      key,
      hit ? { imageUrl: normalizeBannerImageUrl(hit.imageUrl), mobileImageUrl: normalizeBannerImageUrl(hit.mobileImageUrl), title: hit.title } : null,
      key === "sweetness" ? normalizeBannerImageUrl(heroSlide?.imageUrl) : null,
    );
  }

  const shown: AboutProduct[] = products
    .map((p) => ({ name: p.name, slug: p.slug, category: p.category?.name ?? null, image: normalizeBannerImageUrl(p.variants[0]?.images[0]?.url) }))
    .filter((p): p is AboutProduct => Boolean(p.image));

  return (
    <AboutExperience
      media={media}
      products={shown}
      phone={get("store_phone") ?? "+91 95916 08382"}
      whatsapp={get("whatsapp_number") ?? "919591608382"}
      email={(get("store_email") ?? "info@vkccanegold.co.in").trim()}
    />
  );
}
