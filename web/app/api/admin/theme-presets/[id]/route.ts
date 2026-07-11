import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const active = await db.siteSetting.findUnique({ where: { key: "active_theme_preset_id" } });
    if (active?.value === params.id) {
      return NextResponse.json({ error: "Deactivate this theme before deleting it" }, { status: 400 });
    }
    await db.themePreset.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
