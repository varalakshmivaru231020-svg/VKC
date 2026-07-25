import type { Metadata } from "next";
import { getActiveGalleryItems } from "@/lib/db/gallery";
import { EventGallery } from "@/components/events/EventGallery";

export const metadata: Metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const items = await getActiveGalleryItems().catch(() => []);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      <div className="relative py-16 text-center border-b" style={{ background: "var(--color-cream)", borderColor: "var(--color-parchment)" }}>
        <p className="text-label mb-2" style={{ color: "var(--color-gold)" }}>Behind the Weave</p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h1)", fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)" }}>
          Gallery
        </h1>
        <p className="mt-3 max-w-xl mx-auto text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
          Photos and videos from our looms, stores, and celebrations.
        </p>
      </div>
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EventGallery media={items} />
      </div>
    </div>
  );
}
