const STORY_FIELDS = [
  "name", "region", "fabric", "categoryId", "heroImage", "featuredImage", "shortIntro",
  "history", "origin", "geographicalLocation", "weavingTechnique", "fabricInfo",
  "borderDesign", "motifs", "traditionalUsage", "occasionsToWear", "culturalSignificance",
  "careInstructions", "isPublished", "sortOrder", "metaTitle", "metaDesc", "canonicalUrl", "ogImage",
] as const;

/** Picks + normalizes the editable SareeStory fields from an admin form/API request body. */
export function pickStoryData(body: any) {
  const data: Record<string, any> = {};
  for (const key of STORY_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.interestingFacts !== undefined) {
    data.interestingFacts = Array.isArray(body.interestingFacts)
      ? body.interestingFacts
      : String(body.interestingFacts).split("\n").map((s: string) => s.trim()).filter(Boolean);
  }
  if (data.categoryId === "") data.categoryId = null;
  if (data.sortOrder !== undefined) data.sortOrder = parseInt(data.sortOrder) || 0;
  return data;
}
