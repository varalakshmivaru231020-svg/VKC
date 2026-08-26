import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const slides = await db.heroSlide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    return NextResponse.json(slides);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tag, heading, subtext, ctaLabel, ctaHref, ctaSecLabel, ctaSecHref, bgColor, imageBg, imageUrl, mobileImageUrl, videoUrl, sortOrder, isActive } = await req.json();
    if (!imageUrl?.trim()) return NextResponse.json({ error: "Image is required" }, { status: 400 });
    const slide = await db.heroSlide.create({
      data: {
        tag: tag?.trim() ?? "",
        heading: heading?.trim() ?? "",
        subtext: subtext?.trim() ?? "",
        ctaLabel: ctaLabel?.trim() || "Explore Collection",
        ctaHref: ctaHref?.trim() || "/shop",
        ctaSecLabel: ctaSecLabel?.trim() || null,
        ctaSecHref: ctaSecHref?.trim() || null,
        bgColor: bgColor?.trim() || "#F2EBE0",
        imageBg: imageBg?.trim() || "",
        imageUrl: imageUrl?.trim() || null,
        mobileImageUrl: mobileImageUrl?.trim() || null,
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
