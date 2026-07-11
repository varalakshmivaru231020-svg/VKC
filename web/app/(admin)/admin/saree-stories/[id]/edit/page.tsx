import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import StoryForm from "../../StoryForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Saree Story" };

export default async function EditSareeStoryPage({ params }: { params: { id: string } }) {
  const [story, categories] = await Promise.all([
    db.sareeStory.findUnique({
      where: { id: params.id },
      include: { media: { orderBy: { sortOrder: "asc" } } },
    }),
    db.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!story) notFound();

  return (
    <StoryForm
      mode="edit"
      storyId={story.id}
      categories={categories}
      media={story.media}
      initial={{
        name: story.name,
        region: story.region ?? "",
        fabric: story.fabric ?? "",
        categoryId: story.categoryId ?? "",
        heroImage: story.heroImage ?? "",
        featuredImage: story.featuredImage ?? "",
        shortIntro: story.shortIntro ?? "",
        history: story.history ?? "",
        origin: story.origin ?? "",
        geographicalLocation: story.geographicalLocation ?? "",
        weavingTechnique: story.weavingTechnique ?? "",
        fabricInfo: story.fabricInfo ?? "",
        borderDesign: story.borderDesign ?? "",
        motifs: story.motifs ?? "",
        traditionalUsage: story.traditionalUsage ?? "",
        occasionsToWear: story.occasionsToWear ?? "",
        culturalSignificance: story.culturalSignificance ?? "",
        interestingFacts: story.interestingFacts.join("\n"),
        careInstructions: story.careInstructions ?? "",
        isPublished: story.isPublished,
        sortOrder: String(story.sortOrder),
        metaTitle: story.metaTitle ?? "",
        metaDesc: story.metaDesc ?? "",
        canonicalUrl: story.canonicalUrl ?? "",
        ogImage: story.ogImage ?? "",
      }}
    />
  );
}
