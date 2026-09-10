import type { Metadata } from "next";
import { db } from "@/lib/db";
import { normalizeBannerImageUrl } from "@/lib/banners";
import LeadershipExperience from "./LeadershipExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leadership — vkcgoldikshu",
  description:
    "The people behind VKC Gold Ikshu: founded in legacy by Late Shri B Ramachandra and led today by Managing Director Naveenchandra B R, with Director Abhishek B R and Promoter Director Mrs. Pushpalatha.",
};

/* The page's three photographs come from Admin → Banners: the hero
   ("leadership_banner"), and the two halves of the Heritage → Future split
   ("leadership_heritage", "leadership_future"). Each falls back to a
   typographic panel until a real photograph is uploaded — nothing is
   invented. */
const POSITIONS = ["leadership_banner", "leadership_heritage", "leadership_future"] as const;

export default async function LeadershipPage() {
  const now = new Date();
  const banners = await db.banner
    .findMany({
      where: {
        isActive: true,
        position: { in: [...POSITIONS] },
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { position: true, imageUrl: true, title: true },
    })
    .catch(() => []);
  const pick = (position: (typeof POSITIONS)[number]) => banners.find((b) => b.position === position && normalizeBannerImageUrl(b.imageUrl)) ?? null;
  const hero = pick("leadership_banner");
  const heritage = pick("leadership_heritage");
  const future = pick("leadership_future");

  return (
    <LeadershipExperience
      bannerImage={normalizeBannerImageUrl(hero?.imageUrl)}
      bannerAlt={hero?.title ?? ""}
      heritageImage={normalizeBannerImageUrl(heritage?.imageUrl)}
      futureImage={normalizeBannerImageUrl(future?.imageUrl)}
    />
  );
}
