import { db } from "@/lib/db";
import VideoBookingsClient from "./VideoBookingsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Video Bookings" };

export default async function VideoBookingsPage() {
  const bookings = await db.videoBooking.findMany({ orderBy: { createdAt: "desc" } });
  const serialized = bookings.map((b) => ({
    ...b,
    preferredDate: b.preferredDate.toISOString(),
    createdAt: b.createdAt.toISOString(),
  }));
  return <VideoBookingsClient bookings={serialized} />;
}
