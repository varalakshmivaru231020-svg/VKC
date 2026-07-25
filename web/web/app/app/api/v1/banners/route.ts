import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const banners = await db.banner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ banners });
  } catch (err) {
    console.error("[v1/banners]", err);
    return NextResponse.json({ error: "Failed to load banners" }, { status: 500 });
  }
}
