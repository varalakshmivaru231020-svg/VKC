import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function adminOnly() {
  const s = await auth();
  return (s?.user as any)?.role === "ADMIN" ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET() {
  const err = await adminOnly(); if (err) return err;
  try {
    const bookings = await db.videoBooking.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(bookings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
