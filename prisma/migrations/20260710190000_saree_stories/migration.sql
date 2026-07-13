-- CreateTable
CREATE TABLE "saree_stories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "region" VARCHAR(100),
    "fabric" VARCHAR(100),
    "categoryId" TEXT,
    "heroImage" VARCHAR(500),
    "featuredImage" VARCHAR(500),
    "shortIntro" VARCHAR(600),
    "history" TEXT,
    "origin" TEXT,
    "geographicalLocation" TEXT,
    "weavingTechnique" TEXT,
    "fabricInfo" TEXT,
    "borderDesign" TEXT,
    "motifs" TEXT,
    "traditionalUsage" TEXT,
    "occasionsToWear" TEXT,
    "culturalSignificance" TEXT,
    "interestingFacts" TEXT[],
    "careInstructions" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" VARCHAR(200),
    "metaDesc" VARCHAR(400),
    "canonicalUrl" VARCHAR(300),
    "ogImage" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saree_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saree_story_media" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "caption" VARCHAR(300),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saree_story_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saree_stories_slug_key" ON "saree_stories"("slug");

-- AddForeignKey
ALTER TABLE "saree_stories" ADD CONSTRAINT "saree_stories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saree_story_media" ADD CONSTRAINT "saree_story_media_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "saree_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
