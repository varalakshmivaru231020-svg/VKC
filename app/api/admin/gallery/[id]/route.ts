import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { type, url, caption, isActive, sortOrder } = await req.json();
    const item = await db.galleryItem.update({
      where: { id: params.id },
      data: {
        ...(type !== undefined && { type: type === "VIDEO" ? "VIDEO" : "IMAGE" }),
        ...(url !== undefined && { url: url.trim() }),
        ...(caption !== undefined && { caption: caption?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) || 0 }),
      },
    });
    return NextResponse.json(item);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.galleryItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
