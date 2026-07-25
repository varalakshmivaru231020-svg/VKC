import { db } from "@/lib/db";

export async function getActiveGalleryItems(limit?: number) {
  return db.galleryItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}
