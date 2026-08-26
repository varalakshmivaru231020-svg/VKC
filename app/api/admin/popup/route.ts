import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseISTDateTimeLocal } from "@/lib/utils/format";

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
      // The form sends a bare datetime-local string with no timezone, which
      // `new Date()` reads as server time — and this server runs UTC. An admin
      // in India scheduling 5:53 PM got 5:53 PM UTC, i.e. 11:23 PM their time,
      // so popups appeared 5.5 hours late. Coupons already used this helper.
      startsAt: parseISTDateTimeLocal(startsAt),
      endsAt: parseISTDateTimeLocal(endsAt),
    },
  });
  return NextResponse.json(popup);
}
