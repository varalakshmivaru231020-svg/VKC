import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/db/events";
import { EventGallery } from "@/components/events/EventGallery";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventBySlug(params.slug).catch(() => null);
  if (!event) return { title: "Event" };
  return { title: event.title, description: event.description ?? undefined };
}

export default async function EventDetailPage({ params }: Props) {
  const event = await getEventBySlug(params.slug).catch(() => null);
  if (!event) notFound();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      <div className="relative py-14 text-center border-b" style={{ background: "var(--color-cream)", borderColor: "var(--color-parchment)" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h1)", fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)" }}>
          {event.title}
        </h1>
        {event.description && (
          <p className="mt-3 max-w-xl mx-auto text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
            {event.description}
          </p>
        )}
      </div>
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EventGallery media={event.media} />
      </div>
    </div>
  );
}
