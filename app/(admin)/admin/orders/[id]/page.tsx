import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Package, MapPin, User, Phone, CreditCard, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils/format";
import OrderStatusForm from "./OrderStatusForm";
import OrderReturnsPanel from "./OrderReturnsPanel";
import OrderTimeline from "./OrderTimeline";
import PartnerTrackingPanel from "./PartnerTrackingPanel";
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
  RETURN_REQUESTED:        { bg: "#FEF3C7",                  color: "#D97706",               label: "Return Requested" },
  RETURN_PICKUP_ASSIGNED:  { bg: "#FEF3C7",                  color: "#D97706",               label: "Pickup Assigned" },
  RETURN_PICKUP_COMPLETED: { bg: "#FEF3C7",                  color: "#D97706",               label: "Pickup Completed" },
  RETURN_DELIVERED:        { bg: "#EEF2FF",                  color: "#4338CA",               label: "Return Delivered" },
  RETURN_APPROVED:         { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Return Approved" },
  EXCHANGE_REQUESTED:      { bg: "#EEF2FF",                  color: "#4338CA",               label: "Exchange Requested" },
  EXCHANGE_APPROVED:       { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Exchange Approved" },
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

  // Fetch the most-recent return for the timeline strip (with audit fields).
  const latestReturn = await db.orderReturn.findFirst({
    where: { orderId: order.id },
    orderBy: { createdAt: "desc" },
    select: {
      status: true,
      pickupCourier: true, pickupTracking: true,
      createdAt: true, pickupAssignedAt: true, pickedUpAt: true, deliveredAt: true, refundedAt: true,
      refundMode: true, refundTxnId: true,
      raisedBy: true, raisedById: true,
      pickupAssignedById: true, pickedUpById: true, warehouseById: true, refundedById: true,
    },
  });

  // Resolve every admin user-id we plan to display to a "Firstname Lastname"
  // (or email fallback) in a single round-trip.
  const userIds = Array.from(new Set([
    order.confirmedById, order.processingById, order.shippedById, order.deliveredById, order.cancelledById,
    latestReturn?.raisedBy === "ADMIN" ? latestReturn?.raisedById : null,
    latestReturn?.pickupAssignedById, latestReturn?.pickedUpById, latestReturn?.warehouseById, latestReturn?.refundedById,
  ].filter(Boolean) as string[]));
  const users = userIds.length
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true, email: true },
      })
    : [];
  const nameById: Record<string, string> = {};
  for (const u of users) {
    nameById[u.id] = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "Admin";
  }

  // Map every order item to the latest non-rejected return it's part of, so
  // each item row can show a per-product status pill alongside its return id.
  const allReturns = await db.orderReturn.findMany({
    where: { orderId: order.id, NOT: { status: "REJECTED" } },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { orderItemId: true } } },
  });
  const itemReturnMap: Record<string, { returnNumber: string | null; status: string }> = {};
  for (const r of allReturns) {
    for (const ri of r.items) {
      if (!itemReturnMap[ri.orderItemId]) {
        itemReturnMap[ri.orderItemId] = { returnNumber: r.returnNumber, status: r.status };
      }
    }
  }

  // Courier enable flags + pickup pincode default for the dispatch dialogs
  const srSettings = await db.siteSetting.findMany({
    where: { key: { in: ["shiprocket_enabled", "shiprocket_pickup_pincode", "dtdc_enabled", "delhivery_enabled"] } },
  });
  const srMap = Object.fromEntries(srSettings.map((r) => [r.key, r.value]));
  const srEnabled = srMap.shiprocket_enabled === "true";
  const srPickupPincode = srMap.shiprocket_pickup_pincode || process.env.SHIPROCKET_PICKUP_PINCODE || "560036";
  const dtdcEnabled = srMap.dtdc_enabled === "true";
  const delhiveryEnabled = srMap.delhivery_enabled === "true";

  // Override the chip when the latest return has already moved to REFUNDED —
  // otherwise the chip stays stuck on "Returned to Warehouse" even though
  // the order is fully refunded.
  const displayOrderStatus =
    latestReturn?.status === "REFUNDED" ? "REFUNDED" : order.status;
  const statusStyle  = STATUS_STYLES[displayOrderStatus] ?? STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
  const payStyle     = PAYMENT_STATUS_STYLES[order.paymentStatus] ?? PAYMENT_STATUS_STYLES.PENDING;
  const addr         = order.shippingAddress as any;
  const fmtDate      = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  // Detect the courier a dispatch went through so we can show tracking +
  // "delete dispatch" controls. Shiprocket is checked FIRST (via its dedicated
  // id) so it isn't misread when Shiprocket assigns a courier literally named
  // "DTDC"/"Delhivery"; the direct carriers set courierPartner to
  // "DTDC[ · service]" / "Delhivery".
  const srOrderIdVal = (order as any).shiprocketOrderId as string | null;
  const partnerProvider: "dtdc" | "delhivery" | "shiprocket" | null =
    srOrderIdVal && srOrderIdVal !== "undefined" ? "shiprocket"
    : order.trackingNumber && order.courierPartner?.toUpperCase().startsWith("DTDC") ? "dtdc"
    : order.trackingNumber && order.courierPartner?.toUpperCase() === "DELHIVERY" ? "delhivery"
    : null;

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

          <OrderTimeline
            status={order.status}
            trackingNumber={order.trackingNumber}
            createdAt={order.createdAt}
            confirmedAt={order.confirmedAt}
            processingAt={order.processingAt}
            shippedAt={order.shippedAt}
            deliveredAt={order.deliveredAt}
            confirmedByName={order.confirmedById ? nameById[order.confirmedById] : null}
            processingByName={order.processingById ? nameById[order.processingById] : null}
            shippedByName={order.shippedById ? nameById[order.shippedById] : null}
            deliveredByName={order.deliveredById ? nameById[order.deliveredById] : null}
            latestReturn={latestReturn ? {
              status: latestReturn.status,
              pickupCourier: latestReturn.pickupCourier,
              pickupTracking: latestReturn.pickupTracking,
              createdAt: latestReturn.createdAt,
              pickupAssignedAt: latestReturn.pickupAssignedAt,
              pickedUpAt: latestReturn.pickedUpAt,
              deliveredAt: latestReturn.deliveredAt,
              refundedAt: latestReturn.refundedAt,
              refundMode: latestReturn.refundMode,
              refundTxnId: latestReturn.refundTxnId,
              raisedByName:
                latestReturn.raisedBy === "ADMIN"
                  ? (latestReturn.raisedById ? nameById[latestReturn.raisedById] : "Admin")
                  : "Customer",
              pickupAssignedByName: latestReturn.pickupAssignedById ? nameById[latestReturn.pickupAssignedById] : null,
              pickedUpByName:       latestReturn.pickedUpById       ? nameById[latestReturn.pickedUpById]       : null,
              warehouseByName:      latestReturn.warehouseById      ? nameById[latestReturn.warehouseById]      : null,
              refundedByName:       latestReturn.refundedById       ? nameById[latestReturn.refundedById]       : null,
            } : null}
          />

          {/* Order Items */}
          <div className="rounded-md border" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
            <h2 className="px-5 py-4 text-sm font-body font-semibold border-b" style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}>
              Items Ordered ({order.items.length})
            </h2>
            <div className="divide-y" style={{ borderColor: "var(--color-parchment)" }}>
              {order.items.map((item) => {
                const img = item.imageUrl ?? item.variant?.images?.[0]?.url ?? null;
                const itemReturn = itemReturnMap[item.id];
                const RETURN_PILL: Record<string, { label: string; bg: string; color: string }> = {
                  REQUESTED:        { label: "Return Requested",      bg: "#FEF3C7", color: "#92400E" },
                  PICKUP_ASSIGNED:  { label: "Pickup Assigned",       bg: "#FEF3C7", color: "#92400E" },
                  PICKUP_COMPLETED: { label: "Picked Up",             bg: "#FEF3C7", color: "#92400E" },
                  DELIVERED:        { label: "Returned to Warehouse", bg: "#EEF2FF", color: "#4338CA" },
                  REFUNDED:         { label: "Refunded",              bg: "var(--color-success-bg)", color: "var(--color-success)" },
                };
                const pill = itemReturn ? RETURN_PILL[itemReturn.status] : null;
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
                      {pill && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="px-2 py-0.5 text-[10px] font-body font-bold uppercase tracking-wide rounded"
                            style={{ background: pill.bg, color: pill.color }}>
                            {pill.label}
                          </span>
                          {itemReturn?.returnNumber && (
                            <span className="text-[11px] font-body font-mono" style={{ color: "var(--color-text-muted)" }}>
                              {itemReturn.returnNumber}
                            </span>
                          )}
                        </div>
                      )}
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
              orderNumber={order.orderNumber}
              itemCount={order.items.reduce((s, i) => s + i.quantity, 0)}
              deliveryPincode={(addr?.pincode ?? addr?.zip ?? "") as string}
              isCOD={order.paymentMethod === "COD" || order.paymentMethod === "cod"}
              currentStatus={order.status}
              trackingNumber={order.trackingNumber}
              trackingUrl={order.trackingUrl}
              courierPartner={order.courierPartner}
              cancelReason={order.cancelReason}
              cancelRefundMethod={order.cancelRefundMethod}
              returnReason={order.returnReason}
              returnType={order.returnType}
              returnRefundMethod={order.returnRefundMethod}
              returnPickupCourier={(order as any).returnPickupCourier}
              returnPickupTracking={(order as any).returnPickupTracking}
              returnPickedUpNotes={(order as any).returnPickedUpNotes}
              returnRefundNotes={(order as any).returnRefundNotes}
              paymentStatus={order.paymentStatus}
              hasReturns={!!latestReturn}
              shiprocketEnabled={srEnabled}
              shiprocketOrderId={(order as any).shiprocketOrderId}
              shiprocketShipmentId={(order as any).shiprocketShipmentId}
              pickupPincodeDefault={srPickupPincode}
              dtdcEnabled={dtdcEnabled}
              delhiveryEnabled={delhiveryEnabled}
            />
          </div>

          <OrderReturnsPanel
            orderId={order.id}
            orderStatus={order.status}
            orderItems={order.items.map((it) => ({
              id: it.id,
              productName: it.productName,
              variantColor: it.variantColor,
              sareeCode: it.sareeCode,
              quantity: it.quantity,
              totalPrice: it.totalPrice as any,
              imageUrl: it.imageUrl,
            }))}
          />
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

          {/* Courier tracking + delete-dispatch (Shiprocket / DTDC / Delhivery) */}
          {partnerProvider && (
            <PartnerTrackingPanel
              provider={partnerProvider}
              orderId={order.id}
              awb={order.trackingNumber ?? ""}
              courierPartner={order.courierPartner ?? (partnerProvider === "dtdc" ? "DTDC" : partnerProvider === "delhivery" ? "Delhivery" : "Shiprocket")}
            />
          )}

          {/* Tracking */}
          {!partnerProvider && (order.trackingNumber || order.shippedAt || order.deliveredAt) && (
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
