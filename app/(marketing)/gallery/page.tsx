import type { Metadata } from "next";
import { getActiveGalleryItems } from "@/lib/db/gallery";
import { EventGallery } from "@/components/events/EventGallery";
import { PageBanner } from "@/components/layout/PageBanner";
import { getPageBanner } from "@/lib/page-banners";
import { PAGE_CONTAINER } from "@/lib/layout";

export const metadata: Metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const [items, pageBanner] = await Promise.all([getActiveGalleryItems().catch(() => []), getPageBanner("gallery")]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      <PageBanner {...pageBanner} />
      <div className={`${PAGE_CONTAINER} py-14 sm:py-20`}>
        <EventGallery media={items} />
      </div>
    </div>
  );
}
