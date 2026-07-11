import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_THEME } from "@/lib/theme/defaults";

const COLOR_KEYS = [
  "color.primary", "color.primary.dark", "color.primary.light", "color.primary.50",
  "color.gold", "color.gold.light", "color.gold.dark",
] as const;

export async function POST() {
  try {
    await db.$transaction([
      ...COLOR_KEYS.map((key) =>
        db.siteSetting.upsert({
          where: { key },
          update: { value: DEFAULT_THEME[key] },
          create: { key, value: DEFAULT_THEME[key], label: key, group: "colors", type: "color" },
        })
      ),
      db.siteSetting.deleteMany({ where: { key: "active_theme_preset_id" } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
