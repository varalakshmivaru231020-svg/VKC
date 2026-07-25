import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { title, description, coverImage, isActive, sortOrder, startsAt, endsAt } = await req.json();
    const event = await db.event.update({
      where: { id: params.id },
      data: {
        title: title?.trim(),
        description: description?.trim() || null,
        coverImage: coverImage?.trim() || null,
        isActive: isActive ?? true,
        sortOrder: parseInt(sortOrder) || 0,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
      include: { media: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json(event);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.event.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
