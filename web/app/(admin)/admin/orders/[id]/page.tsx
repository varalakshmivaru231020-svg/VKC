import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Package, MapPin, User, Phone, CreditCard, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils/format";
import OrderStatusForm from "./OrderStatusForm";
import { SmartImage } from "@/components/ui/SmartImage";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:            { bg: "var(--color-warning-bg)",  color: "var(--color-warning)",  label: "Pending" },
  CONFIRMED:          { bg: "var(--color-primary-50)",  color: "var(--color-primary)",  label: "Confirmed" },
  PROCESSING:         { bg: "var(--color-primary-50)",  color: "var(--color-primary)",  label: "Processing" },
  SHIPPED:            { bg: "#EEF2FF",                  color: "#4338CA",               label: "Shipped" },
  DELIVERED:          { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Delivered" },
  CANCELLED:          { bg: "var(--color-error-bg)",    color: "var(--color-error)",    label: "Cancelled" },
  REFUNDED:           { bg: "var(--color-error-bg)",    color: "var(--color-error)",    label: "Refunded" },
  RETURN_REQUESTED:   { bg: "#FEF3C7",                  color: "#D97706",               label: "Return Requested" },
  RETURN_APPROVED:    { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Return Approved" },
  EXCHANGE_REQUESTED: { bg: "#EEF2FF",                  color: "#4338CA",               label: "Exchange Requested" },
  EXCHANGE_APPROVED:  { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Exchange Approved" },
};

const PAYMENT_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING:             { bg: "var(--color-warning-bg)",  color: "var(--color-warning)" },
  PAID:                { bg: "var(--color-success-bg)",  color: "var(--color-success)" },
  FAILED:              { bg: "var(--color-error-bg)",    color: "var(--color-error)" },
  REFUNDED:            { bg: "var(--color-error-bg)",    color: "var(--color-error)" },
  PARTIALLY_REFUNDED:  { bg: "var(--color-warning-bg)",  color: "var(--color-warning)" },
};

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      },
      items: {
        include: {
          variant: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const statusStyle  = STATUS_STYLES[order.status]        ?? STATUS_STYLES.PENDING;
  const payStyle     = PAYMENT_STATUS_STYLES[order.paymentStatus] ?? PAYMENT_STATUS_STYLES.PENDING;
  const addr         = order.shippingAddress as any;
  const fmtDate      = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const customerId = order.user?.id ? order.user.id.slice(0, 8).toUpperCase() : null;
  const customerName = order.user
    ? [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email || order.user.phone
    : "Guest";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
        <Link href="/admin/orders" className="hover:underline" style={{ color: "var(--color-primary)" }}>
          Orders
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span style={{ color: "var(--color-text-primary)" }}>#{order.orderNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
            Order #{order.orderNumber}
          </h1>
          <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-muted)" }}>
            Placed on {fmtDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 text-xs font-body font-semibold rounded-full"
            style={{ background: payStyle.bg, color: payStyle.color }}>
            {order.paymentStatus.replace(/_/g, " ")}
          </span>
          <span className="px-3 py-1.5 text-xs font-body font-semibold rounded-full"
            style={{ background: statusStyle.bg, color: statusStyle.color }}>
            {statusStyle.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items + Status */}
        <div className="lg:col-span-2 space-y-6">

          {/* Order Items */}
          <div className="rounded-md border" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
            <h2 className="px-5 py-4 text-sm font-body font-semibold border-b" style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}>
              Items Ordered ({order.items.length})
            </h2>
            <div className="divide-y" style={{ borderColor: "var(--color-parchment)" }}>
              {order.items.map((item) => {
                const img = item.imageUrl ?? item.variant?.images?.[0]?.url ?? null;
                return (
                  <div key={item.id} className="flex gap-4 p-5">
                    <div className="relative shrink-0 w-16 h-20 rounded-sm overflow-hidden border"
                      style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
                      {img
                        ? <SmartImage src={img} alt={item.productName} fill objectFit="cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5" style={{ color: "var(--color-text-disabled)" }} />
                          </div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        {item.productName}
                      </p>
                      <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {item.variantColor}{item.sareeCode ? ` · ${item.sareeCode}` : ""}
                      </p>
                      <p className="text-xs font-body mt-1" style={{ color: "var(--color-text-muted)" }}>
                        Qty: <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{item.quantity}</span>
                        <span className="ml-3">Unit: {formatINR(Number(item.unitPrice))}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "14px", color: "var(--color-primary)" }}>
                        {formatINR(Number(item.totalPrice))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Update Status */}
          <div className="rounded-md border p-5" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
            <h2 className="text-sm font-body font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
              Update Order
            </h2>
            <OrderStatusForm
              orderId={order.id}
              currentStatus={order.status}
              trackingNumber={order.trackingNumber}
              trackingUrl={order.trackingUrl}
              courierPartner={order.courierPartner}
              cancelReason={order.cancelReason}
              cancelRefundMethod={order.cancelRefundMethod}
              returnReason={order.returnReason}
              returnType={order.returnType}
              returnRefundMethod={order.returnRefundMethod}
              paymentStatus={order.paymentStatus}
            />
          </div>
        </div>

        {/* Right: Customer + Address + Summary */}
        <div className="space-y-4">

          {/* Customer Info */}
          <div className="rounded-md border p-5" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
            <h2 className="text-sm font-body font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
              <User className="h-4 w-4" /> Customer
            </h2>
            {order.user ? (
              <div className="space-y-2.5">
                {customerId && (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-body font-bold rounded-full"
                      style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
                      {customerId}
                    </span>
                  </div>
                )}
                <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {customerName}
                </p>
                {order.user.email && (
                  <p className="text-xs font-body flex items-center gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
                    <span>✉</span> {order.user.email}
                  </p>
                )}
                {order.user.phone && (
                  <p className="text-xs font-body flex items-center gap-1.5 font-medium" style={{ color: "var(--color-text-primary)" }}>
                    <Phone className="h-3.5 w-3.5" style={{ color: "var(--color-text-muted)" }} />
                    {order.user.phone}
                  </p>
                )}
                <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                  {order.user._count.orders} order{order.user._count.orders !== 1 ? "s" : ""} total · Joined {new Date(order.user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </p>
                <Link href={`/admin/customers`}
                  className="text-xs font-body font-medium hover:underline"
                  style={{ color: "var(--color-primary)" }}>
                  View all orders →
                </Link>
              </div>
            ) : (
              <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>Guest order</p>
            )}
          </div>

          {/* Delivery Address */}
          {addr && (
            <div className="rounded-md border p-5" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
              <h2 className="text-sm font-body font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                <MapPin className="h-4 w-4" /> Delivery Address
              </h2>
              <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{addr.fullName}</p>
              <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-secondary)" }}>
                {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
              </p>
              <p className="text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>
                {addr.city}, {addr.state} — {addr.pincode}
              </p>
              {addr.phone && (
                <p className="text-xs font-body mt-1.5 flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
                  <Phone className="h-3 w-3" /> {addr.phone}
                </p>
              )}
            </div>
          )}

          {/* Order Summary */}
          <div className="rounded-md border p-5" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
            <h2 className="text-sm font-body font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
              <CreditCard className="h-4 w-4" /> Payment Summary
            </h2>
            <div className="space-y-2 text-sm font-body">
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-secondary)" }}>Subtotal</span>
                <span>{formatINR(Number(order.subtotal))}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--color-text-secondary)" }}>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                  <span style={{ color: "var(--color-success)" }}>−{formatINR(Number(order.discountAmount))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-secondary)" }}>Shipping</span>
                <span>{Number(order.shippingAmount) === 0 ? "Free" : formatINR(Number(order.shippingAmount))}</span>
              </div>
              {Number(order.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--color-text-secondary)" }}>Tax</span>
                  <span>{formatINR(Number(order.taxAmount))}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t font-semibold"
                style={{ borderColor: "var(--color-parchment)" }}>
                <span>Total</span>
                <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", color: "var(--color-primary)" }}>
                  {formatINR(Number(order.totalAmount))}
                </span>
              </div>
            </div>
            {order.paymentMethod && (
              <p className="text-xs font-body mt-3 pt-3 border-t capitalize" style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-muted)" }}>
                Method: {order.paymentMethod.replace(/_/g, " ")}
              </p>
            )}
            {order.paymentId && (
              <p className="text-xs font-body mt-1" style={{ color: "var(--color-text-muted)" }}>
                Ref: <span className="font-mono">{order.paymentId}</span>
              </p>
            )}
          </div>

          {/* Tracking */}
          {(order.trackingNumber || order.shippedAt || order.deliveredAt) && (
            <div className="rounded-md border p-5" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
              <h2 className="text-sm font-body font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                <Truck className="h-4 w-4" /> Shipping
              </h2>
              {order.trackingNumber && (
                <p className="text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>
                  Tracking: <span className="font-mono font-medium" style={{ color: "var(--color-text-primary)" }}>{order.trackingNumber}</span>
                </p>
              )}
              {order.shippedAt && (
                <p className="text-xs font-body mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                  Shipped: {fmtDate(order.shippedAt)}
                </p>
              )}
              {order.deliveredAt && (
                <p className="text-xs font-body mt-1" style={{ color: "var(--color-success)" }}>
                  Delivered: {fmtDate(order.deliveredAt)}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="rounded-md border p-5" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
              <h2 className="text-sm font-body font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>Notes</h2>
              <p className="text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
