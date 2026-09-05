import type { Metadata } from "next";
import { db } from "@/lib/db";
import { normalizeBannerImageUrl } from "@/lib/banners";
import LeadershipExperience from "./LeadershipExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leadership — vkcgoldikshu",
  description:
    "The family behind VKC Gold Ikshu: founded in legacy by Late Shri B Ramachandra and led today by Managing Director Naveenchandra B R, with Director Abhishek B R and Promoter Director Mrs. Pushpalatha.",
};

export default async function LeadershipPage() {
  // Header background from Admin → Banners, position "leadership_banner".
  const now = new Date();
  const banner = await db.banner
    .findFirst({
      where: {
        isActive: true,
        position: "leadership_banner",
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { imageUrl: true, title: true },
    })
    .catch(() => null);

  return <LeadershipExperience bannerImage={normalizeBannerImageUrl(banner?.imageUrl)} bannerAlt={banner?.title ?? ""} />;
}
