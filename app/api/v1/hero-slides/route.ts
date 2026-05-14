import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const slides = await db.heroSlide.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ slides });
  } catch (err) {
    console.error("[v1/hero-slides]", err);
    return NextResponse.json({ error: "Failed to load hero slides" }, { status: 500 });
  }
}
