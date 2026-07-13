-- CreateTable
CREATE TABLE "gallery_items" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "caption" VARCHAR(300),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);
