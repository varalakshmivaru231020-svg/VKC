import type { Metadata } from "next";
import Link from "next/link";
import { getActiveEvents } from "@/lib/db/events";
import { SmartImage } from "@/components/ui/SmartImage";

export const metadata: Metadata = { title: "Events & Celebrations" };
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getActiveEvents().catch(() => []);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      <div className="relative py-16 text-center border-b" style={{ background: "var(--color-cream)", borderColor: "var(--color-parchment)" }}>
        <p className="text-label mb-2" style={{ color: "var(--color-gold)" }}>Celebrate With Us</p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h1)", fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)" }}>
          Events &amp; Celebrations
        </h1>
        <p className="mt-3 max-w-xl mx-auto text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
          Photos and videos from our festive collections and store celebrations.
        </p>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {events.length === 0 ? (
          <p className="text-center text-sm font-body py-16" style={{ color: "var(--color-text-muted)" }}>
            No events published yet — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <Link
                key={ev.id}
                href={`/events/${ev.slug}`}
                className="group rounded-2xl overflow-hidden border transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: "white", borderColor: "var(--color-parchment)" }}
              >
                <div className="relative h-56 overflow-hidden" style={{ background: "var(--color-cream)" }}>
                  {ev.coverImage ? (
                    <SmartImage src={ev.coverImage} alt={ev.title} fill objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🎉</div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-semibold font-body mb-1.5" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
                    {ev.title}
                  </h2>
                  {ev.description && (
                    <p className="text-sm font-body line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
                      {ev.description}
                    </p>
                  )}
                  <p className="text-xs font-body mt-3" style={{ color: "var(--color-gold)" }}>
                    {ev.media.length} {ev.media.length === 1 ? "item" : "items"} · View Gallery
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
