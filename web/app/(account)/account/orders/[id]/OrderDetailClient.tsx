"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight, Package, Download, X, CheckCircle2, Clock, Truck,
  Box, AlertCircle, RotateCcw, RefreshCw, Wallet,
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
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: string | number;
  discountAmount: string | number;
  shippingAmount: string | number;
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
  RETURN_REQUESTED:  { bg: "#FEF3C7",                  color: "#D97706",               label: "Return Requested" },
  RETURN_APPROVED:   { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Return Approved" },
  EXCHANGE_REQUESTED:{ bg: "#FEF3C7",                  color: "#D97706",               label: "Exchange Requested" },
  EXCHANGE_APPROVED: { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Exchange Approved" },
};

const TIMELINE_STEPS = [
  { key: "PENDING",    label: "Order Placed", icon: Box },
  { key: "CONFIRMED",  label: "Confirmed",    icon: CheckCircle2 },
  { key: "PROCESSING", label: "Processing",   icon: Clock },
  { key: "SHIPPED",    label: "Shipped",      icon: Truck },
  { key: "DELIVERED",  label: "Delivered",    icon: Package },
];

const STATUS_ORDER = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

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
  const [modal, setModal] = useState<"cancel" | "return" | "exchange" | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState<"SOURCE" | "WALLET">("SOURCE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reasons from settings
  const [cancelReasons, setCancelReasons] = useState<string[]>([]);
  const [returnReasons, setReturnReasons] = useState<string[]>([]);
  const [exchangeReasons, setExchangeReasons] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/order-reasons").then(r => r.json()).then((d) => {
      if (d.cancelReasons) setCancelReasons(d.cancelReasons);
      if (d.returnReasons) setReturnReasons(d.returnReasons);
      if (d.exchangeReasons) setExchangeReasons(d.exchangeReasons);
    }).catch(() => {});
  }, []);

  const openModal = (m: "cancel" | "return" | "exchange") => {
    setReason("");
    setNotes("");
    setRefundMethod("SOURCE");
    setError("");
    setModal(m);
  };

  const handleSubmit = async () => {
    if (!reason) { setError("Please select a reason"); return; }
    setSubmitting(true);
    setError("");
    const fullReason = notes.trim() ? `${reason} — ${notes.trim()}` : reason;
    try {
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

  const statusStyle = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
  const currentStep = STATUS_ORDER.indexOf(order.status);
  const isPaid = order.paymentStatus === "PAID";
  const canCancel = ["PENDING", "CONFIRMED"].includes(order.status);
  const canReturn = order.status === "DELIVERED";
  const addr = order.shippingAddress as any;

  const fmt = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;
  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;

  const isTerminal = ["CANCELLED", "REFUNDED", "RETURN_REQUESTED", "RETURN_APPROVED",
    "EXCHANGE_REQUESTED", "EXCHANGE_APPROVED"].includes(order.status);

  const currentReasons =
    modal === "cancel" ? cancelReasons :
    modal === "return" ? returnReasons :
    exchangeReasons;

  const modalTitle =
    modal === "cancel" ? "Cancel Order" :
    modal === "return" ? "Return Order" :
    "Exchange Order";

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
          <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Placed on {fmtDate(order.createdAt)}
          </p>
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
          {canReturn && (
            <>
              <button
                onClick={() => openModal("return")}
                className="flex items-center gap-2 px-4 py-2 rounded-sm border text-sm font-body font-medium transition-colors hover:bg-amber-50"
                style={{ borderColor: "#D97706", color: "#D97706" }}>
                <RotateCcw className="h-3.5 w-3.5" /> Return
              </button>
              <button
                onClick={() => openModal("exchange")}
                className="flex items-center gap-2 px-4 py-2 rounded-sm border text-sm font-body font-medium transition-colors hover:bg-blue-50"
                style={{ borderColor: "#4338CA", color: "#4338CA" }}>
                <RefreshCw className="h-3.5 w-3.5" /> Exchange
              </button>
            </>
          )}
          <span className="px-3 py-1.5 text-xs font-semibold font-body rounded-full"
            style={{ background: statusStyle.bg, color: statusStyle.color }}>
            {statusStyle.label}
          </span>
        </div>
      </div>

      {/* Status timeline */}
      {!isTerminal && (
        <div className="p-6 rounded-md border" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
          <h2 className="text-sm font-body font-semibold mb-6" style={{ color: "var(--color-text-primary)" }}>Order Status</h2>
          <div className="flex items-start gap-0">
            {TIMELINE_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              const Icon = step.icon;
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
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div className="flex-1 h-0.5 -ml-2 relative z-0"
                        style={{ background: i < currentStep ? "var(--color-primary)" : "var(--color-parchment)" }} />
                    )}
                  </div>
                  <p className="text-xs font-body text-center mt-2 px-1"
                    style={{ color: done ? "var(--color-primary)" : "var(--color-text-muted)", fontWeight: active ? 600 : 400 }}>
                    {step.label}
                  </p>
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
      )}

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

      {/* Return / Exchange status banner */}
      {["RETURN_REQUESTED", "RETURN_APPROVED", "EXCHANGE_REQUESTED", "EXCHANGE_APPROVED"].includes(order.status) && (
        <div className="p-4 rounded-md flex gap-3"
          style={{
            background: ["RETURN_APPROVED", "EXCHANGE_APPROVED"].includes(order.status) ? "var(--color-success-bg)" : "#FEF9C3",
            borderLeft: `3px solid ${["RETURN_APPROVED", "EXCHANGE_APPROVED"].includes(order.status) ? "var(--color-success)" : "#D97706"}`,
          }}>
          <RotateCcw className="h-5 w-5 shrink-0 mt-0.5"
            style={{ color: ["RETURN_APPROVED", "EXCHANGE_APPROVED"].includes(order.status) ? "var(--color-success)" : "#D97706" }} />
          <div>
            <p className="text-sm font-body font-semibold"
              style={{ color: ["RETURN_APPROVED", "EXCHANGE_APPROVED"].includes(order.status) ? "var(--color-success)" : "#92400E" }}>
              {order.status === "RETURN_REQUESTED" && "Return request submitted — awaiting admin review"}
              {order.status === "RETURN_APPROVED" && "Return approved — refund will be processed shortly"}
              {order.status === "EXCHANGE_REQUESTED" && "Exchange request submitted — awaiting admin review"}
              {order.status === "EXCHANGE_APPROVED" && "Exchange approved — wallet credited with order amount"}
            </p>
            {order.returnReason && (
              <p className="text-xs font-body mt-0.5" style={{ color: "#92400E", opacity: 0.8 }}>
                Reason: {order.returnReason}
              </p>
            )}
            {order.returnRefundMethod && (
              <p className="text-xs font-body mt-0.5" style={{ color: "#92400E", opacity: 0.8 }}>
                Refund method: {order.returnRefundMethod === "WALLET" ? "Wallet credit" : "Original payment source"}
              </p>
            )}
          </div>
        </div>
      )}

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

              {/* Exchange info */}
              {modal === "exchange" && (
                <div className="p-4 rounded-xl" style={{ background: "var(--color-primary-50)" }}>
                  <p className="text-sm font-semibold font-body" style={{ color: "var(--color-primary)" }}>
                    How exchange works
                  </p>
                  <p className="text-xs font-body mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    Once your return is received and approved, the full order amount will be credited to your Vijaylakshmi wallet. You can use it to place a new order.
                  </p>
                </div>
              )}

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
                  modal === "return" ? "Request Return" :
                  "Request Exchange"}
              </button>
            </div>

            <div className="shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />
          </div>
        </div>
      )}
    </div>
  );
}
