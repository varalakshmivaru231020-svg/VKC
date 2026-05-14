import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function adminOnly() {
  const s = await auth();
  return (s?.user as any)?.role === "ADMIN" ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET() {
  const err = await adminOnly(); if (err) return err;
  const popups = await db.popup.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(popups);
}

export async function POST(req: NextRequest) {
  const err = await adminOnly(); if (err) return err;
  const { imageUrl, linkUrl, isActive, startsAt, endsAt } = await req.json();
  if (!imageUrl?.trim()) return NextResponse.json({ error: "Image required" }, { status: 400 });

  const popup = await db.popup.create({
    data: {
      imageUrl,
      linkUrl: linkUrl || null,
      isActive: isActive !== false,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
    },
  });
  return NextResponse.json(popup);
}
