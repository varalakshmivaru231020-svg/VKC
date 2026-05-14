import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const address = await db.address.findUnique({ where: { id: params.id } });
  if (!address || address.userId !== u.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  if (body.isDefault) {
    await db.address.updateMany({ where: { userId: u.id }, data: { isDefault: false } });
  }

  const updated = await db.address.update({
    where: { id: params.id },
    data: {
      label:        body.label        ?? address.label,
      fullName:     body.fullName     ?? address.fullName,
      phone:        body.phone        ?? address.phone,
      addressLine1: body.addressLine1 ?? address.addressLine1,
      addressLine2: body.addressLine2 ?? address.addressLine2,
      city:         body.city         ?? address.city,
      state:        body.state        ?? address.state,
      pincode:      body.pincode      ?? address.pincode,
      country:      body.country      ?? address.country,
      isDefault:    body.isDefault    ?? address.isDefault,
    },
  });
  return NextResponse.json({ address: updated });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const address = await db.address.findUnique({ where: { id: params.id } });
  if (!address || address.userId !== u.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.address.delete({ where: { id: params.id } });

  if (address.isDefault) {
    const next = await db.address.findFirst({ where: { userId: u.id }, orderBy: { createdAt: "desc" } });
    if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return NextResponse.json({ success: true });
}
