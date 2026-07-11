import { db } from "@/lib/db";

export async function getActiveFestivalPreset() {
  const activeSetting = await db.siteSetting.findUnique({ where: { key: "active_theme_preset_id" } });
  if (!activeSetting?.value) return null;

  const preset = await db.themePreset.findUnique({ where: { id: activeSetting.value } });
  if (!preset) return null;

  let eventSlug: string | null = null;
  if (preset.eventId) {
    const event = await db.event.findUnique({ where: { id: preset.eventId }, select: { slug: true } });
    eventSlug = event?.slug ?? null;
  }

  return { ...preset, eventSlug };
}
