import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import EventForm from "../../EventForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Event" };

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const event = await db.event.findUnique({
    where: { id: params.id },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });

  if (!event) notFound();

  // Built field by field rather than spread: the form is a client component, so
  // it only gets plain serialisable values and no stray Date columns.
  return (
    <EventForm
      event={{
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        coverImage: event.coverImage,
        isActive: event.isActive,
        sortOrder: event.sortOrder,
        startsAt: event.startsAt ? event.startsAt.toISOString() : null,
        endsAt: event.endsAt ? event.endsAt.toISOString() : null,
        media: event.media.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          caption: m.caption,
          sortOrder: m.sortOrder,
        })),
      }}
    />
  );
}
