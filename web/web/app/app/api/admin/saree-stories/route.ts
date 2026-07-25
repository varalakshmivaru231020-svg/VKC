import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { pickStoryData } from "@/lib/utils/sareeStoryFields";

export async function GET() {
  try {
    const stories = await db.sareeStory.findMany({
      include: {
        category: { select: { id: true, name: true, slug: true } },
        media: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(stories);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "Saree name is required" }, { status: 400 });

    let slug = slugify(body.name);
    let n = 1;
    while (await db.sareeStory.findUnique({ where: { slug } })) slug = `${slugify(body.name)}-${++n}`;

    const story = await db.sareeStory.create({
      data: { ...pickStoryData(body), name: body.name.trim(), slug },
      include: { category: true, media: true },
    });
    return NextResponse.json(story);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
