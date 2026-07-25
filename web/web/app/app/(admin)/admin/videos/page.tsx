import { db } from "@/lib/db";
import MediaLibraryClient from "@/components/admin/MediaLibraryClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Videos" };

export default async function VideosPage() {
  const items = await db.galleryItem.findMany({
    where: { type: "VIDEO" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return (
    <MediaLibraryClient
      items={items}
      mediaType="VIDEO"
      title="Videos"
      description="Videos shown in the homepage Videos section and /gallery. Paste YouTube, Facebook, or Vimeo links — they embed automatically."
    />
  );
}
