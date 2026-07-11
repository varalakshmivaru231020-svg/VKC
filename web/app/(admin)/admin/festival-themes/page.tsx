import { db } from "@/lib/db";
import FestivalThemesClient from "./FestivalThemesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Festival Themes" };

export default async function FestivalThemesPage() {
  const [presets, activeSetting, events] = await Promise.all([
    db.themePreset.findMany({ orderBy: { createdAt: "desc" } }),
    db.siteSetting.findUnique({ where: { key: "active_theme_preset_id" } }),
    db.event.findMany({ select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return <FestivalThemesClient presets={presets} activeId={activeSetting?.value ?? null} events={events} />;
}
