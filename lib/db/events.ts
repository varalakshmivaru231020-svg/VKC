import { db } from "@/lib/db";

export async function getActiveEvents() {
  const now = new Date();
  return db.event.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getEventBySlug(slug: string) {
  return db.event.findUnique({
    where: { slug, isActive: true },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });
}
