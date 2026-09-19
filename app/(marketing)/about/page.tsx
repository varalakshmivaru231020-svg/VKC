import type { Metadata } from "next";
import { db } from "@/lib/db";
import { normalizeBannerImageUrl } from "@/lib/banners";
import { getCtaBackground } from "@/lib/cta";
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
  const [rows, aboutBanners, cta] = await Promise.all([
    db.siteSetting
      .findMany({ where: { key: { in: ["store_phone", "whatsapp_number", "store_email"] } } })
      .catch(() => [] as { key: string; value: string }[]),
    db.banner
      .findMany({
        where: {
          isActive: true,
          position: { in: ["about_banner", "about_intro", "about_vision_bg"] },
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { position: true, imageUrl: true, mobileImageUrl: true, title: true },
      })
      .catch(() => []),
    getCtaBackground(),
  ]);
  const get = (k: string) => rows.find((r) => r.key === k)?.value || undefined;
  const pick = (position: string) => aboutBanners.find((item) => (
    item.position === position && (normalizeBannerImageUrl(item.imageUrl) || normalizeBannerImageUrl(item.mobileImageUrl))
  )) ?? null;
  const banner = pick("about_banner");
  // The photograph beside the introduction, below the banner ("about_intro").
  const intro = pick("about_intro");
  // The picture behind the Vision and Mission panel ("about_vision_bg").
  const vision = pick("about_vision_bg");
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
      introImage={normalizeBannerImageUrl(intro?.imageUrl) ?? normalizeBannerImageUrl(intro?.mobileImageUrl) ?? null}
      introImageMobile={normalizeBannerImageUrl(intro?.mobileImageUrl) ?? null}
      introAlt={intro?.title ?? ""}
      visionImage={normalizeBannerImageUrl(vision?.imageUrl) ?? normalizeBannerImageUrl(vision?.mobileImageUrl) ?? null}
      visionImageMobile={normalizeBannerImageUrl(vision?.mobileImageUrl) ?? null}
      ctaImage={cta.image}
      ctaImageMobile={cta.mobileImage}
    />
  );
}
