import { db } from "@/lib/db";
import HeroSlidesClient from "./HeroSlidesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hero Slides" };

export default async function HeroSlidesPage() {
  const slides = await db.heroSlide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return <HeroSlidesClient slides={slides} />;
}
