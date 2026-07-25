import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { type, url, caption } = await req.json();
    if (!url?.trim()) return NextResponse.json({ error: "URL is required" }, { status: 400 });
    const count = await db.eventMedia.count({ where: { eventId: params.id } });
    const media = await db.eventMedia.create({
      data: {
        eventId: params.id,
        type: type === "VIDEO" ? "VIDEO" : "IMAGE",
        url: url.trim(),
        caption: caption?.trim() || null,
        sortOrder: count,
      },
    });
    return NextResponse.json(media);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
