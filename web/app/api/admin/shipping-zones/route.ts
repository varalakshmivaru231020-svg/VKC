import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function adminOnly() {
  const s = await auth();
  return (s?.user as any)?.role === "ADMIN" ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET() {
  const zones = await db.shippingZone.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json(zones);
}

export async function POST(req: NextRequest) {
  const err = await adminOnly(); if (err) return err;
  const { name, countries, rateType, rate, minOrderFree, customDutyNote, estimatedDays, isActive, sortOrder } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const zone = await db.shippingZone.create({
    data: {
      name,
      countries: countries || [],
      rateType: rateType || "FLAT",
      rate: rate || 0,
      minOrderFree: minOrderFree || null,
      customDutyNote: customDutyNote || null,
      estimatedDays: estimatedDays || null,
      isActive: isActive !== false,
      sortOrder: sortOrder || 0,
    },
  });
  return NextResponse.json(zone);
}
