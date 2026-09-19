import type { Metadata } from "next";
import { db } from "@/lib/db";
import { normalizeBannerImageUrl } from "@/lib/banners";
import AboutExperience from "./AboutExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Us — vkcgoldikshu",
  description:
    "vkcgoldikshu (VKC Cane Gold Foods) makes pure, chemical-free jaggery and cane products in Mandya, Karnataka — farmer-first and 100% natural since 1988.",
};

export default async function AboutPage() {
  const now = new Date();

  // Contact details are pulled from Admin → Settings when present, with the
  // real business details as fallbacks so the page is never blank. The hero
  // banner comes from Admin → Banners, position "about_banner" — the same
  // active/date-window rules the Shop and Category pages use.
  const [rows, aboutBanners] = await Promise.all([
    db.siteSetting
      .findMany({ where: { key: { in: ["store_phone", "whatsapp_number", "store_email"] } } })
      .catch(() => [] as { key: string; value: string }[]),
    db.banner
      .findMany({
        where: {
          isActive: true,
          position: "about_banner",
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { imageUrl: true, mobileImageUrl: true, title: true },
      })
      .catch(() => []),
  ]);
  const get = (k: string) => rows.find((r) => r.key === k)?.value || undefined;
  const banner = aboutBanners.find((item) => (
    normalizeBannerImageUrl(item.imageUrl) || normalizeBannerImageUrl(item.mobileImageUrl)
  )) ?? null;
  const bannerImage = normalizeBannerImageUrl(banner?.imageUrl) ?? null;
  const bannerImageMobile = normalizeBannerImageUrl(banner?.mobileImageUrl) ?? null;

  return (
    <AboutExperience
      phone={get("store_phone") ?? "+91 95916 08382"}
      whatsapp={get("whatsapp_number") ?? "919591608382"}
      email={get("store_email") ?? "info@vkccanegold.co.in"}
      bannerImage={bannerImage}
      bannerImageMobile={bannerImageMobile}
      bannerAlt={banner?.title ?? ""}
    />
  );
}
