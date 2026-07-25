import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { tag, heading, subtext, ctaLabel, ctaHref, ctaSecLabel, ctaSecHref, bgColor, imageBg, imageUrl, videoUrl, sortOrder, isActive } = await req.json();
    const slide = await db.heroSlide.update({
      where: { id: params.id },
      data: {
        tag: tag?.trim(),
        heading: heading?.trim(),
        subtext: subtext?.trim() ?? "",
        ctaLabel: ctaLabel?.trim(),
        ctaHref: ctaHref?.trim(),
        ctaSecLabel: ctaSecLabel?.trim() || null,
        ctaSecHref: ctaSecHref?.trim() || null,
        bgColor: bgColor?.trim() || "#F2EBE0",
        imageBg: imageBg?.trim() || "",
        imageUrl: imageUrl?.trim() || null,
        videoUrl: videoUrl?.trim() || null,
        sortOrder: parseInt(sortOrder) || 0,
        isActive: isActive ?? true,
      },
    });
    return NextResponse.json(slide);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.heroSlide.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
