-- AlterTable: hero_slides — add videoUrl column
ALTER TABLE "hero_slides"
  ADD COLUMN IF NOT EXISTS "videoUrl" VARCHAR(500);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "coverImage" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateTable
CREATE TABLE "event_media" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "caption" VARCHAR(300),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_media_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "theme_presets" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "emoji" VARCHAR(10),
    "colorPrimary" VARCHAR(20) NOT NULL,
    "colorGold" VARCHAR(20) NOT NULL,
    "bannerImage" VARCHAR(500),
    "bannerText" VARCHAR(300),
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_presets_pkey" PRIMARY KEY ("id")
);
