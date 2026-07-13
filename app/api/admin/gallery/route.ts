import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type");
    const items = await db.galleryItem.findMany({
      where: type === "IMAGE" || type === "VIDEO" ? { type } : undefined,
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
        type: type === "VIDEO" ? "VIDEO" : "IMAGE",
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
