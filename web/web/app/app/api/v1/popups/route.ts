import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const popups = await db.popup.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ popups });
  } catch (err) {
    console.error("[v1/popups]", err);
    return NextResponse.json({ error: "Failed to load popups" }, { status: 500 });
  }
}
