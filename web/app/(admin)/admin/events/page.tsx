import { db } from "@/lib/db";
import EventsClient from "./EventsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events" };

export default async function EventsPage() {
  const events = await db.event.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });
  const serialized = events.map((e) => ({
    ...e,
    startsAt: e.startsAt ? e.startsAt.toISOString() : null,
    endsAt: e.endsAt ? e.endsAt.toISOString() : null,
  }));
  return <EventsClient events={serialized} />;
}
