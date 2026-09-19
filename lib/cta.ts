import { db } from "@/lib/db";
import { normalizeBannerImageUrl } from "@/lib/banners";

export interface CtaBackground {
  image: string | null;
  mobileImage: string | null;
}

/**
 * The one photograph behind every closing call to action (the dark block
 * that ends About and Leadership). Upload it in Admin → Banners at position
 * "cta_background"; "mobile image" is used on phones when set. With nothing
 * uploaded the block stays the flat dark panel it always was.
 */
export async function getCtaBackground(): Promise<CtaBackground> {
  const now = new Date();
  const banner = await db.banner
    .findFirst({
      where: {
        isActive: true,
        position: "cta_background",
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { imageUrl: true, mobileImageUrl: true },
    })
    .catch(() => null);
  return {
    image: normalizeBannerImageUrl(banner?.imageUrl),
    mobileImage: normalizeBannerImageUrl(banner?.mobileImageUrl),
  };
}
