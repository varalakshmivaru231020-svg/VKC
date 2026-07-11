import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lighten, darken } from "@/lib/theme/color";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const preset = await db.themePreset.findUnique({ where: { id: params.id } });
    if (!preset) return NextResponse.json({ error: "Preset not found" }, { status: 404 });

    const colorUpdates: Record<string, string> = {
      "color.primary":       preset.colorPrimary,
      "color.primary.dark":  darken(preset.colorPrimary, 0.25),
      "color.primary.light": lighten(preset.colorPrimary, 0.2),
      "color.primary.50":    lighten(preset.colorPrimary, 0.92),
      "color.gold":          preset.colorGold,
      "color.gold.light":    lighten(preset.colorGold, 0.35),
      "color.gold.dark":     darken(preset.colorGold, 0.3),
    };

    await db.$transaction([
      ...Object.entries(colorUpdates).map(([key, value]) =>
        db.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value, label: key, group: "colors", type: "color" },
        })
      ),
      db.siteSetting.upsert({
        where: { key: "active_theme_preset_id" },
        update: { value: preset.id },
        create: { key: "active_theme_preset_id", value: preset.id, label: "Active Theme Preset", group: "general", type: "text" },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
