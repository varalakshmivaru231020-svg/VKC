import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_THEME } from "@/lib/theme/defaults";

const COLOR_KEYS = [
  "color.primary", "color.primary.dark", "color.primary.light", "color.primary.50",
  "color.gold", "color.gold.light", "color.gold.dark",
] as const;

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const active = await db.siteSetting.findUnique({ where: { key: "active_theme_preset_id" } });
    const isActive = active?.value === params.id;

    await db.$transaction([
      ...(isActive
        ? [
            ...COLOR_KEYS.map((key) =>
              db.siteSetting.upsert({
                where: { key },
                update: { value: DEFAULT_THEME[key] },
                create: { key, value: DEFAULT_THEME[key], label: key, group: "colors", type: "color" },
              })
            ),
            db.siteSetting.deleteMany({ where: { key: "active_theme_preset_id" } }),
          ]
        : []),
      db.themePreset.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ ok: true, resetToDefault: isActive });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
