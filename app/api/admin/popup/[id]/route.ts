import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseISTDateTimeLocal } from "@/lib/utils/format";

async function adminOnly() {
  const s = await auth();
  return (s?.user as any)?.role === "ADMIN" ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const err = await adminOnly(); if (err) return err;
  const body = await req.json();
  const popup = await db.popup.update({
    where: { id: params.id },
    data: {
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.linkUrl !== undefined && { linkUrl: body.linkUrl || null }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.startsAt !== undefined && { startsAt: parseISTDateTimeLocal(body.startsAt) }),
      ...(body.endsAt !== undefined && { endsAt: parseISTDateTimeLocal(body.endsAt) }),
    },
  });
  return NextResponse.json(popup);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const err = await adminOnly(); if (err) return err;
  await db.popup.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
