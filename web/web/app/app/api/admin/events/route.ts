import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const events = await db.event.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { media: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json(events);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, coverImage, isActive, sortOrder, startsAt, endsAt } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    let slug = slugify(title);
    let n = 1;
    while (await db.event.findUnique({ where: { slug } })) slug = `${slugify(title)}-${++n}`;

    const event = await db.event.create({
      data: {
        title: title.trim(),
        slug,
        description: description?.trim() || null,
        coverImage: coverImage?.trim() || null,
        isActive: isActive ?? true,
        sortOrder: parseInt(sortOrder) || 0,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
      include: { media: true },
    });
    return NextResponse.json(event);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
