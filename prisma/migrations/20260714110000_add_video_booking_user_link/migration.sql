-- AlterTable
ALTER TABLE "video_bookings" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "video_bookings_userId_idx" ON "video_bookings"("userId");

-- AddForeignKey
ALTER TABLE "video_bookings" ADD CONSTRAINT "video_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
