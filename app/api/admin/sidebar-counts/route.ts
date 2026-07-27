import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [pendingOrders, customers, pendingVideoBookings, pendingPreBookings] = await Promise.all([
      db.order.count({ where: { status: "PENDING" } }),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.videoBooking.count({ where: { status: "PENDING" } }),
      db.order.count({ where: { orderType: "PRE_BOOKING", preBookingStatus: "PENDING_APPROVAL" } }),
    ]);

    return NextResponse.json({ pendingOrders, customers, pendingVideoBookings, pendingPreBookings });
  } catch (error) {
    console.error("Sidebar counts error:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
