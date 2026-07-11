import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const bookings = await db.videoBooking.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(bookings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
