import { db } from "@/lib/db";
import { normalizeBannerImageUrl } from "@/lib/banners";
import type { PageBannerProps } from "@/components/layout/PageBanner";

/**
 * Every inner page's banner, in one place: its words, and the Admin → Banners
 * position its photograph is uploaded to. The component is
 * components/layout/PageBanner.tsx; pages call getPageBanner("about") and
 * spread the result into it.
 *
 * To change a page's banner image: Admin → Banners → New (or edit), choose
 * that page's position below, upload, save. "Mobile image" is used on phones
 * when set. Titles and descriptions are edited here.
 */
export const PAGE_BANNERS = {
  about: {
    position: "about_banner",
    crumb: "About Us",
    title: "About Us",
    description: "The family, the values and the place behind VKC Gold Ikshu.",
  },
  leadership: {
    position: "leadership_banner",
    crumb: "Leadership",
    title: "Leadership",
    description: "The people carrying a legacy forward — heritage, discipline and a forward-looking approach.",
  },
  credentials: {
    position: "credentials_banner",
    crumb: "Credentials",
    title: "Credentials",
    description: "Registrations, compliance and continuous learning — exactly where we stand.",
  },
  shop: {
    position: "shop_banner",
    crumb: "Shop",
    title: "Our Products",
    description: "Crafted with purpose. Rooted in purity.",
  },
  blog: {
    position: "blog_banner",
    crumb: "Blogs",
    title: "Blogs",
    description: "How our jaggery is made, honest notes on natural sweeteners, and ideas for gifting and everyday cooking.",
  },
  gallery: {
    position: "gallery_banner",
    crumb: "Gallery",
    title: "Gallery",
    description: "Photos from our unit, our cane fields, and the farmers we work with.",
  },
  contact: {
    position: "contact_banner",
    crumb: "Contact",
    title: "Contact Us",
    description: "Customers, retailers, distributors and business partners — we would love to hear from you.",
  },
} as const;

export type PageBannerKey = keyof typeof PAGE_BANNERS;

/** Used by every inner page that has no photograph of its own. */
export const DEFAULT_BANNER_POSITION = "inner_banner_default";

/**
 * Words from the table above, photograph from Admin → Banners. The page's own
 * position wins; otherwise the shared default ("inner_banner_default"); and
 * failing that the About page's, so every inner page opens on the same kind
 * of band rather than some dark and some plain. Soft-fails to no image.
 */
export async function getPageBanner(key: PageBannerKey): Promise<PageBannerProps> {
  const cfg = PAGE_BANNERS[key];
  const now = new Date();
  const order = [cfg.position, DEFAULT_BANNER_POSITION, PAGE_BANNERS.about.position];
  const banners = await db.banner
    .findMany({
      where: {
        isActive: true,
        position: { in: order },
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { position: true, imageUrl: true, mobileImageUrl: true, title: true },
    })
    .catch(() => []);
  const usable = banners.filter((b) => normalizeBannerImageUrl(b.imageUrl) || normalizeBannerImageUrl(b.mobileImageUrl));
  const banner = order.map((pos) => usable.find((b) => b.position === pos)).find(Boolean) ?? null;
  return {
    crumb: cfg.crumb,
    title: cfg.title,
    description: cfg.description,
    image: normalizeBannerImageUrl(banner?.imageUrl),
    mobileImage: normalizeBannerImageUrl(banner?.mobileImageUrl),
    // A shared photograph is decoration on a page it was not made for.
    imageAlt: banner && banner.position === cfg.position ? banner.title : "",
    headingId: `${key}-banner-heading`,
  };
}
