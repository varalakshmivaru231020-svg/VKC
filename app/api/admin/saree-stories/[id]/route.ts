import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pickStoryData } from "@/lib/utils/sareeStoryFields";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const story = await db.sareeStory.update({
      where: { id: params.id },
      data: pickStoryData(body),
      include: {
        category: { select: { id: true, name: true, slug: true } },
        media: { orderBy: { sortOrder: "asc" } },
      },
    });
    return NextResponse.json(story);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.sareeStory.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
