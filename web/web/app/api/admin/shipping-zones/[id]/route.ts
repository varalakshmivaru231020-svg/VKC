import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function adminOnly() {
  const s = await auth();
  return (s?.user as any)?.role === "ADMIN" ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const err = await adminOnly(); if (err) return err;
  const body = await req.json();
  const zone = await db.shippingZone.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.countries !== undefined && { countries: body.countries }),
      ...(body.rateType !== undefined && { rateType: body.rateType }),
      ...(body.rate !== undefined && { rate: body.rate }),
      ...(body.minOrderFree !== undefined && { minOrderFree: body.minOrderFree || null }),
      ...(body.customDutyNote !== undefined && { customDutyNote: body.customDutyNote || null }),
      ...(body.estimatedDays !== undefined && { estimatedDays: body.estimatedDays || null }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  });
  return NextResponse.json(zone);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const err = await adminOnly(); if (err) return err;
  await db.shippingZone.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
