import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils/format";
import PreBookingStatusForm from "./PreBookingStatusForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pre-Booking Order — Admin" };

export default async function AdminPreBookingDetailPage({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      items: true,
    },
  });

  if (!order || order.orderType !== "PRE_BOOKING") notFound();

  const addr = order.shippingAddress as any;
  const customerName = order.user
    ? [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email
    : addr?.fullName ?? "Guest";

  const fmtDate = (d: Date | string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-6">
      <Link href="/admin/pre-bookings" className="inline-flex items-center gap-1.5 text-sm font-body font-medium"
        style={{ color: "var(--color-primary)" }}>
        <ArrowLeft className="h-4 w-4" /> Back to Pre-Booking Orders
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold font-body flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <PackageSearch className="h-6 w-6" style={{ color: "var(--color-gold-dark)" }} />
            Order #{order.orderNumber}
          </h1>
          <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Placed {fmtDate(order.createdAt)}
          </p>
        </div>
        <span className="px-3 py-1.5 text-xs font-body font-semibold rounded-full"
          style={{ background: "var(--color-gold-light)", color: "var(--color-gold-dark)" }}>
          Payment: {order.paymentStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Customer */}
          <div className="rounded-md border p-5" style={{ borderColor: "var(--color-parchment)", background: "white" }}>
            <p className="text-sm font-body font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>Customer</p>
            <p className="text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>{customerName}</p>
            {order.user?.email && <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>{order.user.email}</p>}
            {(order.user?.phone || addr?.phone) && (
              <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>{order.user?.phone ?? addr?.phone}</p>
            )}
          </div>

          {/* Items — ordered / available / pre-booked breakdown */}
          <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--color-parchment)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--color-cream)", borderBottom: "1px solid var(--color-parchment)" }}>
                  {["Product", "Ordered Qty", "Available Stock", "Pre-Booking Qty", "Unit Price", "Total"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-body font-semibold uppercase tracking-wide"
                      style={{ color: "var(--color-text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const available = item.availableAtBooking ?? 0;
                  const preBookQty = item.quantity - available;
                  return (
                    <tr key={item.id} className="border-b" style={{ borderColor: "var(--color-parchment)" }}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-body font-medium" style={{ color: "var(--color-text-primary)" }}>{item.productName}</p>
                        <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                          {item.variantColor}{item.sareeCode ? ` · ${item.sareeCode}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm font-body" style={{ color: "var(--color-text-primary)" }}>{item.quantity}</td>
                      <td className="px-4 py-3 text-sm font-body" style={{ color: "var(--color-text-primary)" }}>{available}</td>
                      <td className="px-4 py-3 text-sm font-body font-semibold" style={{ color: "var(--color-gold-dark)" }}>{preBookQty}</td>
                      <td className="px-4 py-3 text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>{formatINR(Number(item.unitPrice))}</td>
                      <td className="px-4 py-3 text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{formatINR(Number(item.totalPrice))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 flex justify-end border-t" style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
              <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Order Total: <span style={{ color: "var(--color-primary)" }}>{formatINR(Number(order.totalAmount))}</span>
              </p>
            </div>
          </div>

          {order.preBookingDisclaimerSnap && (
            <div className="rounded-md border p-4" style={{ borderColor: "var(--color-parchment)", background: "var(--color-gold-light)" }}>
              <p className="text-xs font-body" style={{ color: "var(--color-gold-dark)" }}>{order.preBookingDisclaimerSnap}</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <PreBookingStatusForm
            orderId={order.id}
            currentStatus={order.preBookingStatus ?? "PENDING_APPROVAL"}
            currentEtaDate={order.preBookingEtaDate ? new Date(order.preBookingEtaDate).toISOString().slice(0, 10) : null}
          />

          {/* Delivery address */}
          <div className="rounded-md border p-5" style={{ borderColor: "var(--color-parchment)", background: "white" }}>
            <p className="text-sm font-body font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>Delivery Address</p>
            {addr ? (
              <div className="text-sm font-body space-y-0.5" style={{ color: "var(--color-text-secondary)" }}>
                <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{addr.fullName}</p>
                <p>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}</p>
                <p>{addr.city}, {addr.state} — {addr.pincode}</p>
                <p>{addr.country || "India"}</p>
                {addr.phone && <p>📞 {addr.phone}</p>}
              </div>
            ) : (
              <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>No address on file</p>
            )}
          </div>

          {order.preBookingReturnsAllowedSnap === false && (
            <div className="rounded-md border p-4" style={{ borderColor: "var(--color-parchment)", background: "var(--color-error-bg)" }}>
              <p className="text-xs font-body font-semibold" style={{ color: "var(--color-error)" }}>Returns not allowed on this order</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
