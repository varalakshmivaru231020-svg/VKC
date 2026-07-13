import { db } from "@/lib/db";
import SareeStoriesListClient from "./SareeStoriesListClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saree Stories" };

export default async function SareeStoriesPage() {
  const stories = await db.sareeStory.findMany({
    include: { category: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return <SareeStoriesListClient stories={stories} />;
}
