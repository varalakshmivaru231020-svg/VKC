import { db } from "@/lib/db";
import MediaLibraryClient from "@/components/admin/MediaLibraryClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const items = await db.galleryItem.findMany({
    where: { type: "IMAGE" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return (
    <MediaLibraryClient
      items={items}
      mediaType="IMAGE"
      title="Gallery"
      description="Photos shown in the homepage Gallery section and /gallery."
    />
  );
}
