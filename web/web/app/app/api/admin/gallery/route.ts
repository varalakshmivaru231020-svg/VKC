import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_TYPES = ["IMAGE", "VIDEO", "FACEBOOK"];

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type");
    const items = await db.galleryItem.findMany({
      where: type && VALID_TYPES.includes(type) ? { type } : undefined,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, url, caption, isActive } = await req.json();
    if (!url?.trim()) return NextResponse.json({ error: "URL is required" }, { status: 400 });
    const count = await db.galleryItem.count();
    const item = await db.galleryItem.create({
      data: {
        type: VALID_TYPES.includes(type) ? type : "IMAGE",
        url: url.trim(),
        caption: caption?.trim() || null,
        isActive: isActive ?? true,
        sortOrder: count,
      },
    });
    return NextResponse.json(item);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
