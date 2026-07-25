import { db } from "@/lib/db";
import MediaLibraryClient from "@/components/admin/MediaLibraryClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Facebook Videos" };

export default async function FacebookVideosPage() {
  const items = await db.galleryItem.findMany({
    where: { type: "FACEBOOK" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return (
    <MediaLibraryClient
      items={items}
      mediaType="VIDEO"
      dbType="FACEBOOK"
      title="Facebook Videos"
      description={`Shown in the "Follow us on Facebook" section on the homepage. Paste a Facebook video link, or upload an MP4 directly.`}
    />
  );
}
