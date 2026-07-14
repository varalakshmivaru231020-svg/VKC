import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Video, Calendar, Clock } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Video Bookings" };

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: "var(--color-warning-bg)", color: "var(--color-warning)", label: "Awaiting Confirmation" },
  CONFIRMED: { bg: "var(--color-primary-50)", color: "var(--color-primary)", label: "Confirmed" },
  COMPLETED: { bg: "var(--color-success-bg)", color: "var(--color-success)", label: "Completed" },
  CANCELLED: { bg: "var(--color-error-bg)",   color: "var(--color-error)",   label: "Cancelled" },
};

export default async function VideoBookingsPage() {
  const session = await auth();
  const bookings = session?.user?.id
    ? await db.videoBooking.findMany({
        where:   { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="px-6 sm:px-8 lg:px-10 py-8 space-y-6">
      <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Video Bookings</h1>

      {bookings.length === 0 ? (
        <div className="rounded-md border p-12 flex flex-col items-center text-center gap-4"
          style={{ background: "white", borderColor: "var(--color-parchment)" }}>
          <Video className="h-12 w-12" style={{ color: "var(--color-text-disabled)" }} />
          <div>
            <p className="text-base font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>No video shopping requests yet</p>
            <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-muted)" }}>
              Book a live video call with our team from the "Video Shopping" button to see it here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const statusStyle = STATUS_STYLES[b.status] ?? STATUS_STYLES.PENDING;
            return (
              <div key={b.id} className="p-5 rounded-md border"
                style={{ background: "white", borderColor: "var(--color-parchment)" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      Video Shopping Appointment
                    </p>
                    <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      Requested on {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-semibold font-body rounded-full"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}>
                    {statusStyle.label}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-4 flex-wrap text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" style={{ color: "var(--color-text-muted)" }} />
                    {new Date(b.preferredDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" style={{ color: "var(--color-text-muted)" }} />
                    {b.preferredTime}
                  </span>
                </div>

                {b.notes && (
                  <p className="mt-3 text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>
                    "{b.notes}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
