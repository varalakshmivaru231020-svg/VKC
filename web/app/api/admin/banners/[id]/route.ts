import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { title, subtitle, imageUrl, mobileImageUrl, linkUrl, position, bannerType, sortOrder, isActive } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!imageUrl?.trim()) return NextResponse.json({ error: "Image is required" }, { status: 400 });
    if (!position?.trim()) return NextResponse.json({ error: "Position is required" }, { status: 400 });
    const banner = await db.banner.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        subtitle: subtitle || null,
        imageUrl,
        mobileImageUrl: mobileImageUrl || null,
        linkUrl: linkUrl || null,
        position,
        bannerType: bannerType || "PROMOTIONAL",
        sortOrder: parseInt(sortOrder) || 0,
        isActive: isActive ?? true,
      },
    });
    return NextResponse.json(banner);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.banner.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
