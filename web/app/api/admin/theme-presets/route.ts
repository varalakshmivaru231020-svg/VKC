import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const presets = await db.themePreset.findMany({ orderBy: { createdAt: "desc" } });
    const activeSetting = await db.siteSetting.findUnique({ where: { key: "active_theme_preset_id" } });
    return NextResponse.json({ presets, activeId: activeSetting?.value ?? null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, emoji, colorPrimary, colorGold, bannerImage, bannerText, eventId } = await req.json();
    if (!name?.trim() || !colorPrimary || !colorGold) {
      return NextResponse.json({ error: "Name, primary color and gold color are required" }, { status: 400 });
    }
    const preset = await db.themePreset.create({
      data: {
        name: name.trim(),
        emoji: emoji?.trim() || null,
        colorPrimary, colorGold,
        bannerImage: bannerImage?.trim() || null,
        bannerText: bannerText?.trim() || null,
        eventId: eventId || null,
      },
    });
    return NextResponse.json(preset);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
