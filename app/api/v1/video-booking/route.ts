import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * POST { name, phone, email?, preferredDate, preferredTime, notes? }
 * Public — creates a Video Shopping appointment request, viewable in
 * Admin → Video Bookings. Store staff follow up by phone/WhatsApp.
 * When the requester is logged in, the booking is linked to their account
 * so they can track its status under Account -> Video Bookings.
 */
export async function POST(req: Request) {
  const { name, phone, email, preferredDate, preferredTime, notes } = await req.json().catch(() => ({}));

  if (!name || !phone || !preferredDate || !preferredTime) {
    return NextResponse.json({ error: "Name, phone, preferred date and time are required" }, { status: 400 });
  }

  const date = new Date(preferredDate);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const session = await auth();

  const booking = await db.videoBooking.create({
    data: {
      userId: session?.user?.id ?? null,
      name: String(name).slice(0, 150),
      phone: String(phone).slice(0, 20),
      email: email ? String(email).slice(0, 200) : null,
      preferredDate: date,
      preferredTime: String(preferredTime).slice(0, 50),
      notes: notes ? String(notes).slice(0, 2000) : null,
    },
  });

  return NextResponse.json({ success: true, id: booking.id });
}
