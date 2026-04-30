import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const address = await db.address.findUnique({ where: { id: params.id } });
  if (!address || address.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.address.delete({ where: { id: params.id } });

  // If deleted address was default, promote the most recent remaining one
  if (address.isDefault) {
    const next = await db.address.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const address = await db.address.findUnique({ where: { id: params.id } });
  if (!address || address.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  if (body.isDefault) {
    await db.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
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
      isDefault:    body.isDefault    ?? address.isDefault,
    },
  });

  return NextResponse.json({ address: updated });
}
