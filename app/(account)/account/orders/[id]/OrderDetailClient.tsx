"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight, Package, Download, X, CheckCircle2, Clock, Truck,
  Box, AlertCircle, RotateCcw, Wallet, Star, ImagePlus, Loader2,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

interface OrderItem {
  id: string;
  productName: string;
  variantColor: string;
  sareeCode: string | null;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  imageUrl: string | null;
  productSlug: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  orderType?: string;
  preBookingEtaDate?: string | null;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: string | number;
  discountAmount: string | number;
  shippingAmount: string | number;
  taxAmount?: string | number;
  totalAmount: string | number;
  walletAmountUsed?: string | number;
  shippingAddress: any;
  trackingNumber: string | null;
  cancelReason: string | null;
  cancelRefundMethod: string | null;
  returnReason: string | null;
  returnType: string | null;
  returnRefundMethod: string | null;
  returnRequestedAt: string | null;
  createdAt: string;
  confirmedAt: string | null;
  processingAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  items: OrderItem[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:           { bg: "var(--color-warning-bg)",  color: "var(--color-warning)",  label: "Order Placed" },
  CONFIRMED:         { bg: "var(--color-primary-50)",  color: "var(--color-primary)",  label: "Confirmed" },
  PROCESSING:        { bg: "var(--color-primary-50)",  color: "var(--color-primary)",  label: "Processing" },
  SHIPPED:           { bg: "#EEF2FF",                  color: "#4338CA",               label: "Shipped" },
  DELIVERED:         { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Delivered" },
  CANCELLED:         { bg: "var(--color-error-bg)",    color: "var(--color-error)",    label: "Cancelled" },
  REFUNDED:          { bg: "var(--color-error-bg)",    color: "var(--color-error)",    label: "Refunded" },
  RETURN_REQUESTED:        { bg: "#FEF3C7",                  color: "#D97706",               label: "Return Requested" },
  RETURN_PICKUP_ASSIGNED:  { bg: "#FEF3C7",                  color: "#D97706",               label: "Pickup Assigned" },
  RETURN_PICKUP_COMPLETED: { bg: "#FEF3C7",                  color: "#D97706",               label: "Picked Up" },
  RETURN_DELIVERED:        { bg: "#EEF2FF",                  color: "#4338CA",               label: "Returned to Warehouse" },
  RETURN_APPROVED:         { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Return Approved" },
  EXCHANGE_REQUESTED:      { bg: "#FEF3C7",                  color: "#D97706",               label: "Exchange Requested" },
  EXCHANGE_APPROVED:       { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Exchange Approved" },
};

const TIMELINE_STEPS = [
  { key: "PENDING",    label: "Order Placed", icon: Box },
  { key: "CONFIRMED",  label: "Confirmed",    icon: CheckCircle2 },
  { key: "PROCESSING", label: "Processing",   icon: Clock },
  { key: "SHIPPED",    label: "Shipped",      icon: Truck },
  { key: "DELIVERED",  label: "Delivered",    icon: Package },
];

// Pre-booked orders reuse the same OrderStatus lifecycle (no separate admin
// dashboard in this MVP — see PRE_BOOKING_PLAN.md) but read very differently
// to a customer: "Processing" undersells what's actually a procurement wait.
const PREBOOKING_TIMELINE_STEPS = [
  { key: "PENDING",    label: "Booked",         icon: Box },
  { key: "CONFIRMED",  label: "Confirmed",      icon: CheckCircle2 },
  { key: "PROCESSING", label: "In Procurement", icon: Clock },
  { key: "SHIPPED",    label: "Shipped",        icon: Truck },
  { key: "DELIVERED",  label: "Delivered",      icon: Package },
];

const STATUS_ORDER = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

// Return-progress steps. Only shown if the order has at least one return
// request. Status keys are mapped from individual OrderReturn status enum
// values, plus REFUNDED as the final step.
const RETURN_STEPS = [
  { key: "REQUESTED",        label: "Return Requested", icon: RotateCcw },
  { key: "PICKUP_ASSIGNED",  label: "Pickup Assigned",  icon: Truck },
  { key: "PICKUP_COMPLETED", label: "Picked Up",        icon: Package },
  { key: "DELIVERED",        label: "Returned",         icon: Box },
  { key: "REFUNDED",         label: "Refunded",         icon: CheckCircle2 },
];

const RETURN_STATUS_ORDER = ["REQUESTED", "PICKUP_ASSIGNED", "PICKUP_COMPLETED", "DELIVERED", "REFUNDED"];

function RadioCard({ selected, onClick, icon: Icon, title, subtitle }: {
  selected: boolean; onClick: () => void;
  icon: React.ElementType; title: string; subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all"
      style={{
        borderColor: selected ? "var(--color-primary)" : "var(--color-parchment)",
        background: selected ? "var(--color-primary-50)" : "white",
      }}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: selected ? "var(--color-primary)" : "var(--color-cream)" }}>
        <Icon className="h-4 w-4" style={{ color: selected ? "white" : "var(--color-text-muted)" }} />
      </div>
      <div>
        <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>{title}</p>
        <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>{subtitle}</p>
      </div>
    </button>
  );
}

export default function OrderDetailClient({ order: initial }: { order: Order }) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);

  // Modal state
  const [modal, setModal] = useState<"cancel" | "return" | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState<"SOURCE" | "WALLET">("SOURCE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Item picker state for the Return modal (orderItemId → qty)
  const [returnPicks, setReturnPicks] = useState<Record<string, number>>({});
  // When the modal was opened from an item-level "Return this item" button we
  // store the targeted orderItemId here so the modal shows only that item
  // instead of the full picker.
  const [returnTargetItemId, setReturnTargetItemId] = useState<string | null>(null);

  // Existing returns for this order (may be multiple — partial returns over time)
  const [returns, setReturns] = useState<Array<any>>([]);

  // Reviews state — keyed by orderItemId so we can show "Reviewed" on each row
  const [reviewsByItem, setReviewsByItem] = useState<Record<string, any>>({});
  const [reviewItem, setReviewItem] = useState<OrderItem | null>(null);

  // Reasons from settings
  const [cancelReasons, setCancelReasons] = useState<string[]>([]);
  const [returnReasons, setReturnReasons] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/order-reasons").then(r => r.json()).then((d) => {
      if (d.cancelReasons) setCancelReasons(d.cancelReasons);
      if (d.returnReasons) setReturnReasons(d.returnReasons);
    }).catch(() => {});

    fetch(`/api/user/orders/${initial.id}/returns`).then(r => r.json()).then((d) => {
      if (Array.isArray(d.returns)) setReturns(d.returns);
    }).catch(() => {});

    const ids = (initial.items ?? []).map((it) => it.id).filter(Boolean);
    if (ids.length) {
      fetch(`/api/user/reviews?orderItemIds=${ids.join(",")}`).then(r => r.json()).then((d) => {
        if (Array.isArray(d.reviews)) {
          const map: Record<string, any> = {};
          for (const rv of d.reviews) if (rv.orderItemId) map[rv.orderItemId] = rv;
          setReviewsByItem(map);
        }
      }).catch(() => {});
    }
  }, [initial.id]);

  // Compute remaining-eligible quantity per order item AND map each item to
  // the latest (active) return it's part of so we can show per-product status.
  const consumedByItem: Record<string, number> = {};
  const returnByItem: Record<string, { id: string; returnNumber: string | null; status: string }> = {};
  for (const r of returns) {
    if (r.status === "REJECTED") continue;
    for (const ri of r.items ?? []) {
      consumedByItem[ri.orderItemId] = (consumedByItem[ri.orderItemId] ?? 0) + ri.quantity;
      // Latest non-rejected return for this item — `returns` is ordered desc.
      if (!returnByItem[ri.orderItemId]) {
        returnByItem[ri.orderItemId] = { id: r.id, returnNumber: r.returnNumber ?? null, status: r.status };
      }
    }
  }
  const eligibleItems = (initial.items ?? []).map((it) => ({
    ...it,
    available: it.quantity - (consumedByItem[it.id] ?? 0),
  })).filter((it) => it.available > 0);

  const openModal = (m: "cancel" | "return") => {
    setReason("");
    setNotes("");
    setRefundMethod("SOURCE");
    setError("");
    setReturnPicks({});
    setReturnTargetItemId(null);
    setModal(m);
  };

  // Open the return modal pre-targeted to a single item — clicking the
  // "Return this item" button per row should not require the customer to
  // re-pick from the full list.
  const openReturnForItem = (itemId: string, available: number) => {
    setReason("");
    setNotes("");
    setRefundMethod("SOURCE");
    setError("");
    setReturnPicks({ [itemId]: available });
    setReturnTargetItemId(itemId);
    setModal("return");
  };

  const handleSubmit = async () => {
    if (!reason) { setError("Please select a reason"); return; }
    setSubmitting(true);
    setError("");

    try {
      if (modal === "return") {
        // Item-level return — POST to the new returns endpoint
        const items = Object.entries(returnPicks)
          .filter(([, q]) => q > 0)
          .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
        if (items.length === 0) { setError("Pick at least one item to return"); return; }

        const res = await fetch(`/api/user/orders/${order.id}/returns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, reason, remark: notes.trim() || undefined, refundMethod }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
        setReturns((p) => [data.return, ...p]);
        setOrder((o) => ({ ...o, status: "RETURN_REQUESTED" } as any));
        setModal(null);
        setReturnPicks({});
        return;
      }

      // Cancel — uses the legacy whole-order endpoint
      const fullReason = notes.trim() ? `${reason} — ${notes.trim()}` : reason;
      const res = await fetch(`/api/user/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: modal, reason: fullReason, refundMethod }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      setOrder((o) => ({ ...o, ...data.order }));
      setModal(null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentStep = STATUS_ORDER.indexOf(order.status);
  const isPaid = order.paymentStatus === "PAID";
  const canCancel = ["PENDING", "CONFIRMED"].includes(order.status);
  const canReturn = order.status === "DELIVERED";
  const addr = order.shippingAddress as any;

  const fmt = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;
  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;

  // Cancelled orders never show the timeline. Return-stage statuses and
  // refunded orders DO still show the delivery timeline (5/5 done) plus a
  // return-progress timeline below it.
  const isTerminal = ["CANCELLED", "EXCHANGE_REQUESTED", "EXCHANGE_APPROVED"].includes(order.status);

  // Compute the latest return's progress so we can render the return timeline.
  const latestReturn = returns.length > 0 ? returns[0] : null;

  // Display chip status — if the latest return has already been refunded,
  // override the (denormalised, sometimes stale) order.status so the chip
  // reads "Refunded" instead of "Returned to Warehouse".
  const displayStatus =
    latestReturn?.status === "REFUNDED" ? "REFUNDED" :
    order.status;
  const statusStyle = STATUS_STYLES[displayStatus] ?? STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
  const hasReturn = !!latestReturn || ["RETURN_REQUESTED", "RETURN_PICKUP_ASSIGNED",
    "RETURN_PICKUP_COMPLETED", "RETURN_DELIVERED", "RETURN_APPROVED", "REFUNDED"].includes(order.status);
  const returnStepIndex = (() => {
    if (latestReturn) return RETURN_STATUS_ORDER.indexOf(latestReturn.status);
    // Fallback to denormalised order.status when there's no OrderReturn row yet
    const map: Record<string, string> = {
      RETURN_REQUESTED:        "REQUESTED",
      RETURN_PICKUP_ASSIGNED:  "PICKUP_ASSIGNED",
      RETURN_PICKUP_COMPLETED: "PICKUP_COMPLETED",
      RETURN_DELIVERED:        "DELIVERED",
      RETURN_APPROVED:         "DELIVERED",
      REFUNDED:                "REFUNDED",
    };
    return RETURN_STATUS_ORDER.indexOf(map[order.status] ?? "");
  })();

  const currentReasons =
    modal === "cancel" ? cancelReasons :
    modal === "return" ? returnReasons :
    [];

  const modalTitle =
    modal === "cancel" ? "Cancel Order" :
    "Return Order";

  return (
    <div className="px-6 sm:px-8 lg:px-10 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
        <Link href="/account/orders" className="hover:text-primary transition-colors">My Orders</Link>
        <ChevronRight className="h-3 w-3" />
        <span style={{ color: "var(--color-text-primary)" }}>#{order.orderNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
            Order #{order.orderNumber}
          </h1>
          <p className="text-sm font-body mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: "var(--color-text-muted)" }}>
            Placed on {fmtDate(order.createdAt)}
            {order.orderType === "PRE_BOOKING" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full"
                style={{ background: "var(--color-gold-light)", color: "var(--color-gold-dark)" }}>
                ✦ Pre-Booking
              </span>
            )}
          </p>
          {order.orderType === "PRE_BOOKING" && order.preBookingEtaDate && !["DELIVERED", "CANCELLED"].includes(order.status) && (
            <p className="text-xs font-body mt-1" style={{ color: "var(--color-gold-dark)" }}>
              Expected ready by {fmtDate(order.preBookingEtaDate)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/account/orders/${order.id}/invoice`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-sm border text-sm font-body font-medium transition-colors hover:bg-cream"
            style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)" }}>
            <Download className="h-3.5 w-3.5" /> Invoice
          </a>
          {canCancel && (
            <button
              onClick={() => openModal("cancel")}
              className="flex items-center gap-2 px-4 py-2 rounded-sm border text-sm font-body font-medium transition-colors hover:bg-red-50"
              style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}>
              <X className="h-3.5 w-3.5" /> Cancel Order
            </button>
          )}
          <span className="px-3 py-1.5 text-xs font-semibold font-body rounded-full"
            style={{ background: statusStyle.bg, color: statusStyle.color }}>
            {statusStyle.label}
          </span>
        </div>
      </div>

      {/* Status timeline */}
      {!isTerminal && (() => {
        // Per-step timestamp from the matching Order column. Returns null
        // for older orders that pre-date the confirmedAt/processingAt
        // backfill so we don't render stale text.
        const stepTimestamps: Record<string, string | null> = {
          PENDING:    order.createdAt,
          CONFIRMED:  order.confirmedAt,
          PROCESSING: order.processingAt,
          SHIPPED:    order.shippedAt,
          DELIVERED:  order.deliveredAt,
        };
        const fmtStamp = (s: string | null) =>
          s ? new Date(s).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

        const timelineSteps = order.orderType === "PRE_BOOKING" ? PREBOOKING_TIMELINE_STEPS : TIMELINE_STEPS;
        return (
        <div className="p-6 rounded-md border" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
          <h2 className="text-sm font-body font-semibold mb-6" style={{ color: "var(--color-text-primary)" }}>Order Status</h2>
          <div className="flex items-start gap-0">
            {timelineSteps.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              const Icon = step.icon;
              const ts = fmtStamp(stepTimestamps[step.key] ?? null);
              return (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    {i > 0 && (
                      <div className="flex-1 h-0.5 -mr-2 relative z-0"
                        style={{ background: i <= currentStep ? "var(--color-primary)" : "var(--color-parchment)" }} />
                    )}
                    <div className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: done ? "var(--color-primary)" : "var(--color-cream)",
                        border: `2px solid ${done ? "var(--color-primary)" : "var(--color-parchment)"}`,
                      }}>
                      <Icon className="h-4 w-4" style={{ color: done ? "white" : "var(--color-text-disabled)" }} />
                    </div>
                    {i < timelineSteps.length - 1 && (
                      <div className="flex-1 h-0.5 -ml-2 relative z-0"
                        style={{ background: i < currentStep ? "var(--color-primary)" : "var(--color-parchment)" }} />
                    )}
                  </div>
                  <p className="text-xs font-body text-center mt-2 px-1"
                    style={{ color: done ? "var(--color-primary)" : "var(--color-text-muted)", fontWeight: active ? 600 : 400 }}>
                    {step.label}
                  </p>
                  {done && ts && (
                    <p className="text-[10px] font-body text-center mt-0.5 px-1" style={{ color: "var(--color-text-muted)" }}>
                      {ts}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {order.trackingNumber && (
            <p className="text-xs font-body mt-5 pt-4 border-t" style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-muted)" }}>
              Tracking: <span style={{ color: "var(--color-text-primary)" }} className="font-medium">{order.trackingNumber}</span>
            </p>
          )}
        </div>
        );
      })()}

      {/* Return progress timeline — only for orders that have a return request */}
      {hasReturn && (() => {
        const r: any = latestReturn ?? {};
        const stepStamps: Record<string, string | null> = {
          REQUESTED:        r.createdAt        ?? null,
          PICKUP_ASSIGNED:  r.pickupAssignedAt ?? null,
          PICKUP_COMPLETED: r.pickedUpAt       ?? null,
          DELIVERED:        r.deliveredAt      ?? null,
          REFUNDED:         r.refundedAt       ?? null,
        };
        const fmtStamp = (s: string | null) =>
          s ? new Date(s).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

        return (
        <div className="p-6 rounded-md border" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
          <h2 className="text-sm font-body font-semibold mb-6" style={{ color: "var(--color-text-primary)" }}>Return Progress</h2>
          <div className="flex items-start gap-0">
            {RETURN_STEPS.map((step, i) => {
              const done = returnStepIndex >= 0 && i <= returnStepIndex;
              const active = i === returnStepIndex;
              const Icon = step.icon;
              const ts = fmtStamp(stepStamps[step.key] ?? null);
              return (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    {i > 0 && (
                      <div className="flex-1 h-0.5 -mr-2 relative z-0"
                        style={{ background: done ? "var(--color-primary)" : "var(--color-parchment)" }} />
                    )}
                    <div className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: done ? "var(--color-primary)" : "var(--color-cream)",
                        border: `2px solid ${done ? "var(--color-primary)" : "var(--color-parchment)"}`,
                      }}>
                      <Icon className="h-4 w-4" style={{ color: done ? "white" : "var(--color-text-disabled)" }} />
                    </div>
                    {i < RETURN_STEPS.length - 1 && (
                      <div className="flex-1 h-0.5 -ml-2 relative z-0"
                        style={{ background: returnStepIndex > i ? "var(--color-primary)" : "var(--color-parchment)" }} />
                    )}
                  </div>
                  <p className="text-[11px] font-body text-center mt-2 px-1"
                    style={{ color: done ? "var(--color-primary)" : "var(--color-text-muted)", fontWeight: active ? 600 : 400 }}>
                    {step.label}
                  </p>
                  {done && ts && (
                    <p className="text-[10px] font-body text-center mt-0.5 px-1" style={{ color: "var(--color-text-muted)" }}>
                      {ts}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {latestReturn?.pickupCourier && (
            <p className="text-xs font-body mt-5 pt-4 border-t" style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-muted)" }}>
              Pickup courier: <span style={{ color: "var(--color-text-primary)" }} className="font-medium">{latestReturn.pickupCourier}</span>
              {latestReturn.pickupTracking ? <> · Tracking <span style={{ color: "var(--color-text-primary)" }} className="font-medium">{latestReturn.pickupTracking}</span></> : null}
            </p>
          )}
          {latestReturn?.refundedAt && (
            <p className="text-xs font-body mt-1" style={{ color: "var(--color-success)" }}>
              Refunded on {new Date(latestReturn.refundedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              {latestReturn.refundMode ? ` via ${latestReturn.refundMode}` : ""}
              {latestReturn.refundTxnId ? ` · Ref ${latestReturn.refundTxnId}` : ""}
            </p>
          )}
        </div>
        );
      })()}

      {/* Cancelled banner */}
      {order.status === "CANCELLED" && (
        <div className="p-4 rounded-md flex gap-3" style={{ background: "var(--color-error-bg)", borderLeft: "3px solid var(--color-error)" }}>
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-error)" }} />
          <div>
            <p className="text-sm font-body font-semibold" style={{ color: "var(--color-error)" }}>
              Order cancelled{order.cancelledAt ? ` on ${fmtDate(order.cancelledAt)}` : ""}
            </p>
            {order.cancelReason && (
              <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-error)", opacity: 0.8 }}>
                Reason: {order.cancelReason}
              </p>
            )}
            {order.cancelRefundMethod && isPaid && (
              <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-error)", opacity: 0.8 }}>
                Refund: {order.cancelRefundMethod === "WALLET" ? "To your wallet" : "To original payment source"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Return / Exchange status banner — copy comes from the latest
         OrderReturn's true state when one exists, otherwise from the
         denormalised order.status. This avoids the stale "refund will be
         processed shortly" message after the refund has already happened. */}
      {(latestReturn || ["RETURN_REQUESTED", "RETURN_PICKUP_ASSIGNED", "RETURN_PICKUP_COMPLETED", "RETURN_DELIVERED", "RETURN_APPROVED", "EXCHANGE_REQUESTED", "EXCHANGE_APPROVED"].includes(order.status)) && (() => {
        const effectiveStatus: string = latestReturn?.status ?? (
          order.status === "RETURN_REQUESTED"        ? "REQUESTED" :
          order.status === "RETURN_PICKUP_ASSIGNED"  ? "PICKUP_ASSIGNED" :
          order.status === "RETURN_PICKUP_COMPLETED" ? "PICKUP_COMPLETED" :
          order.status === "RETURN_DELIVERED"        ? "DELIVERED" :
          order.status === "RETURN_APPROVED"         ? "DELIVERED" :
          order.status === "REFUNDED"                ? "REFUNDED" :
          order.status
        );
        const isDone = effectiveStatus === "REFUNDED" || ["RETURN_APPROVED", "EXCHANGE_APPROVED"].includes(order.status);
        const message =
          effectiveStatus === "REQUESTED"        ? "We're sorry for the inconvenience — your return request has been submitted. Our team will review your case and update you shortly." :
          effectiveStatus === "PICKUP_ASSIGNED"  ? "Courier assigned — they'll be in touch to schedule pickup" :
          effectiveStatus === "PICKUP_COMPLETED" ? "Picked up — your parcel is on the way to our warehouse" :
          effectiveStatus === "DELIVERED"        ? "Returned to warehouse — refund will be processed shortly" :
          effectiveStatus === "REFUNDED"         ? "Refund processed — thank you!" :
          order.status === "EXCHANGE_REQUESTED"  ? "Exchange request submitted — awaiting admin review" :
          order.status === "EXCHANGE_APPROVED"   ? "Exchange approved — wallet credited with order amount" :
          "";

        const refundMethodEffective = (latestReturn as any)?.refundMethod ?? order.returnRefundMethod;

        return (
          <div className="p-4 rounded-md flex gap-3"
            style={{
              background: isDone ? "var(--color-success-bg)" : "#FEF9C3",
              borderLeft: `3px solid ${isDone ? "var(--color-success)" : "#D97706"}`,
            }}>
            <RotateCcw className="h-5 w-5 shrink-0 mt-0.5"
              style={{ color: isDone ? "var(--color-success)" : "#D97706" }} />
            <div>
              <p className="text-sm font-body font-semibold"
                style={{ color: isDone ? "var(--color-success)" : "#92400E" }}>
                {message}
              </p>
              {(latestReturn as any)?.returnNumber && (
                <p className="text-xs font-body mt-0.5 font-mono" style={{ color: isDone ? "var(--color-success)" : "#92400E", opacity: 0.85 }}>
                  {(latestReturn as any).returnNumber}
                </p>
              )}
              {((latestReturn as any)?.reason || order.returnReason) && (
                <p className="text-xs font-body mt-0.5" style={{ color: isDone ? "var(--color-success)" : "#92400E", opacity: 0.8 }}>
                  Reason: {(latestReturn as any)?.reason ?? order.returnReason}
                </p>
              )}
              {refundMethodEffective && (
                <p className="text-xs font-body mt-0.5" style={{ color: isDone ? "var(--color-success)" : "#92400E", opacity: 0.8 }}>
                  Refund method: {refundMethodEffective === "WALLET" ? "Wallet credit" : "Original payment source"}
                </p>
              )}
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-md border" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
            <h2 className="px-5 py-4 text-sm font-body font-semibold border-b" style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}>
              Items Ordered ({order.items.length})
            </h2>
            <div className="divide-y" style={{ borderColor: "var(--color-parchment)" }}>
              {order.items.map((item) => {
                const ImageWrapper: any = item.productSlug ? Link : "div";
                const imageWrapperProps = item.productSlug
                  ? { href: `/shop/${item.productSlug}` }
                  : {};
                const itemAvailable = item.quantity - (consumedByItem[item.id] ?? 0);
                const canReturnThis = canReturn && itemAvailable > 0;
                const itemReturn = returnByItem[item.id] ?? null;
                const RETURN_PILL: Record<string, { label: string; bg: string; color: string }> = {
                  REQUESTED:        { label: "Return Requested",   bg: "#FEF3C7", color: "#92400E" },
                  PICKUP_ASSIGNED:  { label: "Pickup Assigned",    bg: "#FEF3C7", color: "#92400E" },
                  PICKUP_COMPLETED: { label: "Picked Up",          bg: "#FEF3C7", color: "#92400E" },
                  DELIVERED:        { label: "Returned to Warehouse", bg: "#EEF2FF", color: "#4338CA" },
                  REFUNDED:         { label: "Refunded",           bg: "var(--color-success-bg)", color: "var(--color-success)" },
                };
                const itemReturnPill = itemReturn ? RETURN_PILL[itemReturn.status] : null;
                // "Reviewable" once delivered, regardless of any return state on
                // the order — the customer should still be able to leave a review
                // for whatever they kept.
                const reviewableStatuses = ["DELIVERED", "RETURN_REQUESTED", "RETURN_PICKUP_ASSIGNED",
                  "RETURN_PICKUP_COMPLETED", "RETURN_DELIVERED", "RETURN_APPROVED", "REFUNDED"];
                const canReview = reviewableStatuses.includes(order.status);
                const existingReview = reviewsByItem[item.id];
                return (
                <div key={item.id} className="flex gap-4 p-5">
                  <ImageWrapper
                    {...imageWrapperProps}
                    className="relative shrink-0 w-16 h-20 rounded-sm overflow-hidden border block"
                    style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}
                  >
                    {item.imageUrl
                      ? <SmartImage src={item.imageUrl} alt={item.productName} fill objectFit="cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-5 w-5" style={{ color: "var(--color-text-disabled)" }} />
                        </div>}
                  </ImageWrapper>
                  <div className="flex-1 min-w-0">
                    {item.productSlug ? (
                      <Link
                        href={`/shop/${item.productSlug}`}
                        className="text-sm font-body font-semibold hover:underline transition-colors"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {item.productName}
                      </Link>
                    ) : (
                      <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        {item.productName}
                      </p>
                    )}
                    <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {item.variantColor}{item.sareeCode ? ` · ${item.sareeCode}` : ""}
                    </p>
                    <p className="text-xs font-body mt-1" style={{ color: "var(--color-text-muted)" }}>Qty: {item.quantity}</p>
                    {itemReturnPill && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="px-2 py-0.5 text-[10px] font-body font-bold uppercase tracking-wide rounded"
                          style={{ background: itemReturnPill.bg, color: itemReturnPill.color }}>
                          {itemReturnPill.label}
                        </span>
                        {itemReturn?.returnNumber && (
                          <span className="text-[11px] font-body font-mono" style={{ color: "var(--color-text-muted)" }}>
                            {itemReturn.returnNumber}
                          </span>
                        )}
                      </div>
                    )}
                    {(canReturnThis || canReview) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {canReturnThis && (
                          <button
                            onClick={() => openReturnForItem(item.id, itemAvailable)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-body font-medium transition-colors hover:bg-amber-50"
                            style={{ borderColor: "#D97706", color: "#D97706" }}>
                            <RotateCcw className="h-3 w-3" /> Return this item
                          </button>
                        )}
                        {canReview && (
                          existingReview ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-body"
                                style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-muted)" }}>
                                <Star className="h-3 w-3" fill="currentColor" /> Reviewed · {existingReview.rating}/5
                                {!existingReview.isApproved && <span className="ml-1 text-[10px]">(awaiting approval)</span>}
                              </span>
                              <button
                                onClick={() => setReviewItem(item)}
                                className="text-xs font-body underline"
                                style={{ color: "var(--color-primary)" }}>
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm("Delete this review?")) return;
                                  const res = await fetch(`/api/user/reviews/${existingReview.id}`, { method: "DELETE" });
                                  if (res.ok) setReviewsByItem((p) => { const c = { ...p }; delete c[item.id]; return c; });
                                }}
                                className="text-xs font-body underline"
                                style={{ color: "var(--color-error)" }}>
                                Delete
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReviewItem(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-body font-medium transition-colors hover:bg-cream"
                              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                              <Star className="h-3 w-3" /> Rate &amp; review
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "var(--text-price-sm)", color: "var(--color-primary)" }}>
                      {fmt(item.totalPrice)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>{fmt(item.unitPrice)} each</p>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {addr && (
            <div className="rounded-md border p-5" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
              <h2 className="text-sm font-body font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>Delivery Address</h2>
              <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{addr.fullName}</p>
              <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-secondary)" }}>
                {addr.addressLine1}{addr.addressLine2 ? ", " + addr.addressLine2 : ""}
              </p>
              <p className="text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>
                {addr.city}, {addr.state} — {addr.pincode}
              </p>
              <p className="text-xs font-body mt-1" style={{ color: "var(--color-text-muted)" }}>{addr.phone}</p>
            </div>
          )}

          <div className="rounded-md border p-5" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
            <h2 className="text-sm font-body font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>Order Summary</h2>
            <div className="space-y-2 text-sm font-body">
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-secondary)" }}>Subtotal</span>
                <span style={{ color: "var(--color-text-primary)" }}>{fmt(order.subtotal)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--color-text-secondary)" }}>Discount</span>
                  <span style={{ color: "var(--color-success)" }}>−{fmt(order.discountAmount)}</span>
                </div>
              )}
              {Number(order.walletAmountUsed ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--color-text-secondary)" }}>Wallet used</span>
                  <span style={{ color: "var(--color-success)" }}>−{fmt(order.walletAmountUsed!)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-secondary)" }}>Shipping</span>
                <span style={{ color: "var(--color-text-primary)" }}>
                  {Number(order.shippingAmount) === 0 ? "Free" : fmt(order.shippingAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t font-semibold" style={{ borderColor: "var(--color-parchment)" }}>
                <span style={{ color: "var(--color-text-primary)" }}>Total</span>
                <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", color: "var(--color-primary)" }}>
                  {fmt(order.totalAmount)}
                </span>
              </div>
              {Number(order.taxAmount ?? 0) > 0 && (
                <p className="text-[11px] font-body pt-1" style={{ color: "var(--color-text-muted)" }}>
                  Includes {fmt(order.taxAmount!)} GST
                </p>
              )}
            </div>
            {order.paymentMethod && (
              <p className="text-xs font-body mt-3 pt-3 border-t capitalize" style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-muted)" }}>
                Paid via {order.paymentMethod.replace(/_/g, " ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal ────────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "white", maxHeight: "90vh" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0"
              style={{ borderColor: "var(--color-parchment)" }}>
              <div>
                <p className="text-base font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>{modalTitle}</p>
                <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>Order #{order.orderNumber}</p>
              </div>
              <button onClick={() => setModal(null)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-cream"
                style={{ color: "var(--color-text-muted)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Item summary / picker — return only */}
              {modal === "return" && (() => {
                // If the modal was opened from a per-item "Return this item"
                // button, show only that item — no picker, no "max N" UI.
                const targeted = returnTargetItemId
                  ? eligibleItems.find((it) => it.id === returnTargetItemId) ?? null
                  : null;
                if (targeted) {
                  return (
                    <div>
                      <p className="text-sm font-semibold font-body mb-3" style={{ color: "var(--color-text-primary)" }}>
                        Returning
                      </p>
                      <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-body font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{targeted.productName}</p>
                          <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
                            {targeted.variantColor}{targeted.sareeCode ? ` · ${targeted.sareeCode}` : ""}
                          </p>
                        </div>
                        {targeted.available > 1 && (
                          <div className="flex items-center gap-1">
                            <button type="button"
                              onClick={() => setReturnPicks((p) => ({ ...p, [targeted.id]: Math.max(1, (p[targeted.id] ?? 0) - 1) }))}
                              className="h-7 w-7 flex items-center justify-center rounded border" style={{ borderColor: "var(--color-parchment)" }}>−</button>
                            <span className="w-7 text-center text-sm font-body">{returnPicks[targeted.id] ?? targeted.available}</span>
                            <button type="button"
                              onClick={() => setReturnPicks((p) => ({ ...p, [targeted.id]: Math.min(targeted.available, (p[targeted.id] ?? 0) + 1) }))}
                              className="h-7 w-7 flex items-center justify-center rounded border" style={{ borderColor: "var(--color-parchment)" }}>+</button>
                          </div>
                        )}
                        {targeted.available === 1 && (
                          <span className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>Qty 1</span>
                        )}
                      </div>
                    </div>
                  );
                }
                // Fallback (legacy / no specific item) — full picker.
                return (
                  <div>
                    <p className="text-sm font-semibold font-body mb-3" style={{ color: "var(--color-text-primary)" }}>
                      Pick items to return
                    </p>
                    {eligibleItems.length === 0 ? (
                      <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
                        No items eligible for a new return.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {eligibleItems.map((it) => {
                          const picked = returnPicks[it.id] ?? 0;
                          return (
                            <div key={it.id} className="flex items-center gap-3 p-2.5 rounded-xl border" style={{ borderColor: "var(--color-parchment)" }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-body font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{it.productName}</p>
                                <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
                                  {it.variantColor}{it.sareeCode ? ` · ${it.sareeCode}` : ""} · max {it.available}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => setReturnPicks((p) => ({ ...p, [it.id]: Math.max(0, picked - 1) }))}
                                  className="h-7 w-7 flex items-center justify-center rounded border" style={{ borderColor: "var(--color-parchment)" }}>−</button>
                                <span className="w-7 text-center text-sm font-body">{picked}</span>
                                <button type="button" onClick={() => setReturnPicks((p) => ({ ...p, [it.id]: Math.min(it.available, picked + 1) }))}
                                  className="h-7 w-7 flex items-center justify-center rounded border" style={{ borderColor: "var(--color-parchment)" }}>+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Reason selection */}
              <div>
                <p className="text-sm font-semibold font-body mb-3" style={{ color: "var(--color-text-primary)" }}>
                  Select a reason
                </p>
                <div className="space-y-2">
                  {currentReasons.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: reason === r ? "var(--color-primary)" : "var(--color-parchment)",
                        background: reason === r ? "var(--color-primary-50)" : "white",
                      }}
                    >
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: reason === r ? "var(--color-primary)" : "var(--color-parchment)" }}>
                        {reason === r && (
                          <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-primary)" }} />
                        )}
                      </div>
                      <span className="text-sm font-body" style={{ color: "var(--color-text-primary)" }}>{r}</span>
                    </button>
                  ))}
                  {currentReasons.length === 0 && (
                    <p className="text-sm font-body py-2" style={{ color: "var(--color-text-muted)" }}>No reasons configured.</p>
                  )}
                </div>
              </div>

              {/* Refund method — shown for cancel (if paid) and return */}
              {(modal === "cancel" && isPaid) || modal === "return" ? (
                <div>
                  <p className="text-sm font-semibold font-body mb-3" style={{ color: "var(--color-text-primary)" }}>
                    Refund preference
                  </p>
                  <div className="flex gap-3">
                    <RadioCard
                      selected={refundMethod === "SOURCE"}
                      onClick={() => setRefundMethod("SOURCE")}
                      icon={X}
                      title="Original source"
                      subtitle="Refund to your payment method (5–7 days)"
                    />
                    <RadioCard
                      selected={refundMethod === "WALLET"}
                      onClick={() => setRefundMethod("WALLET")}
                      icon={Wallet}
                      title="Store wallet"
                      subtitle="Instant credit to your Vijaylakshmi wallet"
                    />
                  </div>
                </div>
              ) : null}

              {/* Optional notes */}
              <div>
                <label className="block text-sm font-semibold font-body mb-2" style={{ color: "var(--color-text-primary)" }}>
                  Additional notes <span className="font-normal text-xs" style={{ color: "var(--color-text-muted)" }}>(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any additional details you'd like to share…"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm font-body focus:outline-none resize-none"
                  style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-parchment)"; }}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm font-body" style={{ color: "var(--color-error)" }}>
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t shrink-0 flex gap-3" style={{ borderColor: "var(--color-parchment)" }}>
              <button onClick={() => setModal(null)}
                className="flex-1 h-11 rounded-xl border text-sm font-body font-semibold transition-colors hover:bg-cream"
                style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)" }}>
                Go Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !reason}
                className="flex-1 h-11 rounded-xl text-sm font-body font-semibold text-white transition-colors disabled:opacity-50"
                style={{ background: modal === "cancel" ? "var(--color-error)" : "var(--color-primary)" }}>
                {submitting ? "Submitting…" :
                  modal === "cancel" ? "Cancel Order" :
                  "Request Return"}
              </button>
            </div>

            <div className="shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />
          </div>
        </div>
      )}

      {reviewItem && (
        <ReviewModal
          item={reviewItem}
          existing={reviewsByItem[reviewItem.id]}
          onClose={() => setReviewItem(null)}
          onSaved={(rv) => {
            setReviewsByItem((p) => ({ ...p, [reviewItem.id]: rv }));
            setReviewItem(null);
          }}
        />
      )}
    </div>
  );
}

/* ──────────────── Review modal ──────────────── */

function ReviewModal({
  item, existing, onClose, onSaved,
}: {
  item: OrderItem;
  existing?: any;
  onClose: () => void;
  onSaved: (review: any) => void;
}) {
  const isEdit = !!existing;
  const [rating, setRating] = useState<number>(existing?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState<string>(existing?.body ?? "");
  const [images, setImages] = useState<string[]>(Array.isArray(existing?.images) ? existing.images : []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const f of Array.from(files)) {
        if (images.length >= 3) break;
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/user/upload-review-image", { method: "POST", body: fd });
        const d = await res.json();
        if (!res.ok) { setError(d.error ?? "Upload failed"); break; }
        setImages((p) => [...p, d.url]);
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (rating < 1) { setError("Please give a star rating"); return; }
    setSubmitting(true);
    setError("");
    try {
      const url = isEdit ? `/api/user/reviews/${existing.id}` : "/api/user/reviews";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? {} : { orderItemId: item.id }),
          rating,
          body: body.trim() || null,
          images,
        }),
      });

      const text = await res.text();
      let payload: any = null;
      try { payload = text ? JSON.parse(text) : null; } catch { /* non-JSON response */ }

      if (!res.ok) {
        setError(payload?.error ?? `Failed to save review (HTTP ${res.status})`);
        return;
      }
      onSaved(payload?.review);
    } catch (err) {
      console.error("[review submit]", err);
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "white", maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--color-parchment)" }}>
          <div>
            <p className="text-base font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>{isEdit ? "Edit Review" : "Rate & Review"}</p>
            <p className="text-xs font-body mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>{item.productName}</p>
          </div>
          <button onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-cream"
            style={{ color: "var(--color-text-muted)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Star rating */}
          <div>
            <p className="text-sm font-semibold font-body mb-3" style={{ color: "var(--color-text-primary)" }}>Your rating</p>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = (hoverRating || rating) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(n)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className="h-8 w-8"
                      fill={filled ? "#F59E0B" : "transparent"}
                      style={{ color: filled ? "#F59E0B" : "var(--color-parchment)" }}
                    />
                  </button>
                );
              })}
              {rating > 0 && (
                <span className="ml-2 text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>{rating}/5</span>
              )}
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold font-body mb-2" style={{ color: "var(--color-text-primary)" }}>
              Review <span className="font-normal text-xs" style={{ color: "var(--color-text-muted)" }}>(optional)</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Tell other shoppers what you liked or didn't…"
              className="w-full px-3 py-2.5 border rounded-xl text-sm font-body focus:outline-none resize-none"
              style={{ borderColor: "var(--color-parchment)", background: "white" }}
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-semibold font-body mb-2" style={{ color: "var(--color-text-primary)" }}>
              Photos <span className="font-normal text-xs" style={{ color: "var(--color-text-muted)" }}>(up to 3)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {images.map((u) => (
                <div key={u} className="relative w-20 h-20 rounded-lg overflow-hidden border" style={{ borderColor: "var(--color-parchment)" }}>
                  <SmartImage src={u} alt="" fill objectFit="cover" />
                  <button
                    type="button"
                    onClick={() => setImages((p) => p.filter((x) => x !== u))}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-cream"
                  style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-muted)" }}>
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                  <span className="text-[10px] mt-1 font-body">{uploading ? "Uploading…" : "Add photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => { handleFiles(e.target.files); e.currentTarget.value = ""; }}
                  />
                </label>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm font-body" style={{ color: "var(--color-error)" }}>
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t shrink-0 flex gap-3" style={{ borderColor: "var(--color-parchment)" }}>
          <button onClick={onClose}
            className="flex-1 h-11 rounded-xl border text-sm font-body font-semibold transition-colors hover:bg-cream"
            style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)" }}>
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || rating < 1 || uploading}
            className="flex-1 h-11 rounded-xl text-sm font-body font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}>
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </div>
        <div className="shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />
      </div>
    </div>
  );
}
