-- CreateTable
CREATE TABLE "video_bookings" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(200),
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "preferredTime" VARCHAR(50) NOT NULL,
    "notes" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_bookings_pkey" PRIMARY KEY ("id")
);
