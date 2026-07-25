import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_THEME } from "@/lib/theme/defaults";
import type { ThemeSettings } from "@/lib/theme/types";

export async function GET() {
  try {
    const rows = await db.siteSetting.findMany({ orderBy: { sortOrder: "asc" } });
    const settings: Partial<ThemeSettings> = {};
    for (const row of rows) {
      (settings as Record<string, string>)[row.key] = row.value;
    }
    const merged = { ...DEFAULT_THEME, ...settings };
    return NextResponse.json({ settings: merged });
  } catch (error) {
    console.error("[theme GET]", error);
    return NextResponse.json({ settings: DEFAULT_THEME });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const updates = body.settings as Record<string, string>;

    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Upsert each setting
    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        db.siteSetting.upsert({
          where: { key },
          update: { value, updatedAt: new Date() },
          create: {
            key,
            value,
            label: key,
            group: key.startsWith("color") ? "colors" : key.startsWith("font") || key.startsWith("text") || key.startsWith("weight") ? "typography" : "general",
            type: key.startsWith("color") ? "color" : key.startsWith("font") ? "font-family" : "text",
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[theme PATCH]", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
