import { db } from "@/lib/db";
import { normalizeBannerImageUrl } from "@/lib/banners";
import { WhyChooseView } from "./WhyChooseView";

/**
 * "Why VKC" on the home page. The centre shows the farmer composition that
 * came with the design (public/images/home/why-farmer.webp). An image in
 * Admin → Banners at position "home_why_image" replaces it — ideally a
 * portrait cut-out PNG, which stands free over the drawn circle. The section
 * fetches it itself so the home page does not have to pass anything.
 */
export async function WhyChoose() {
  const now = new Date();
  const banner = await db.banner
    .findFirst({
      where: {
        isActive: true,
        position: "home_why_image",
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { imageUrl: true, mobileImageUrl: true, title: true },
    })
    .catch(() => null);

  return (
    <WhyChooseView
      image={normalizeBannerImageUrl(banner?.imageUrl)}
      mobileImage={normalizeBannerImageUrl(banner?.mobileImageUrl)}
      imageAlt={banner?.title || "A Mandya sugarcane farmer holding freshly cut cane"}
    />
  );
}
