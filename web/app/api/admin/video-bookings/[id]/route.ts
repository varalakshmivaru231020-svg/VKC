import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function adminOnly() {
  const s = await auth();
  return (s?.user as any)?.role === "ADMIN" ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const err = await adminOnly(); if (err) return err;
  try {
    const { status } = await req.json();
    if (!["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const booking = await db.videoBooking.update({ where: { id: params.id }, data: { status } });
    return NextResponse.json(booking);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
