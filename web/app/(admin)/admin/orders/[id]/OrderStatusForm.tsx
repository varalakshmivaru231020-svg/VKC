"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, CheckCircle2, Wallet, AlertCircle } from "lucide-react";

const STATUSES = [
  { value: "PENDING",            label: "Pending" },
  { value: "CONFIRMED",          label: "Confirmed" },
  { value: "PROCESSING",         label: "Processing" },
  { value: "SHIPPED",            label: "Shipped" },
  { value: "DELIVERED",          label: "Delivered" },
  { value: "CANCELLED",          label: "Cancelled" },
  { value: "REFUNDED",           label: "Refunded" },
  { value: "RETURN_REQUESTED",   label: "Return Requested" },
  { value: "RETURN_APPROVED",    label: "Return Approved" },
  { value: "EXCHANGE_REQUESTED", label: "Exchange Requested" },
  { value: "EXCHANGE_APPROVED",  label: "Exchange Approved" },
];

interface Props {
  orderId: string;
  currentStatus: string;
  trackingNumber: string | null;
  trackingUrl?: string | null;
  courierPartner?: string | null;
  cancelReason?: string | null;
  cancelRefundMethod?: string | null;
  returnReason?: string | null;
  returnType?: string | null;
  returnRefundMethod?: string | null;
  paymentStatus?: string;
}

export default function OrderStatusForm({
  orderId,
  currentStatus,
  trackingNumber,
  trackingUrl: initialTrackingUrl,
  courierPartner: initialCourier,
  cancelReason,
  cancelRefundMethod,
  returnReason,
  returnType,
  returnRefundMethod,
  paymentStatus,
}: Props) {
  const router = useRouter();
  const [status,     setStatus]   = useState(currentStatus);
  const [tracking,   setTracking] = useState(trackingNumber ?? "");
  const [trackingUrl,setUrl]      = useState(initialTrackingUrl ?? "");
  const [courier,    setCourier]  = useState(initialCourier ?? "");
  const [saving,     setSaving]   = useState(false);
  const [saved,      setSaved]    = useState(false);
  const [error,      setError]    = useState("");

  // Refund panel state
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundDone, setRefundDone] = useState(paymentStatus === "REFUNDED");

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          trackingNumber: tracking || null,
          trackingUrl: trackingUrl || null,
          courierPartner: courier || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveReturn = async () => {
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_return" }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveExchange = async () => {
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_exchange" }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleProcessRefund = async () => {
    setProcessingRefund(true); setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process_refund" }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      setRefundDone(true);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setProcessingRefund(false);
    }
  };

  const inputCls = "w-full h-9 px-3 border rounded-sm text-sm font-body focus:outline-none";
  const inputStyle = { borderColor: "var(--color-parchment)", background: "white" };

  const showCancelPanel = currentStatus === "CANCELLED" && cancelReason;
  const showReturnPanel = ["RETURN_REQUESTED", "RETURN_APPROVED"].includes(currentStatus);
  const showExchangePanel = ["EXCHANGE_REQUESTED", "EXCHANGE_APPROVED"].includes(currentStatus);

  return (
    <div className="space-y-5">
      {/* ── Cancel / Return / Exchange info panel ── */}
      {showCancelPanel && (
        <div className="p-4 rounded-xl border" style={{ background: "#FEF2F2", borderColor: "#FCA5A5" }}>
          <p className="text-sm font-semibold font-body mb-1" style={{ color: "var(--color-error)" }}>
            Order Cancelled by Customer
          </p>
          <p className="text-xs font-body" style={{ color: "#9B1C1C" }}>
            Reason: {cancelReason}
          </p>
          {cancelRefundMethod && (
            <p className="text-xs font-body mt-0.5" style={{ color: "#9B1C1C" }}>
              Refund to: {cancelRefundMethod === "WALLET" ? "Customer Wallet" : "Original payment source"}
            </p>
          )}
          {!refundDone && cancelRefundMethod ? (
            <button
              onClick={handleProcessRefund}
              disabled={processingRefund}
              className="mt-3 flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold font-body text-white disabled:opacity-60"
              style={{ background: cancelRefundMethod === "WALLET" ? "var(--color-primary)" : "var(--color-error)" }}>
              {cancelRefundMethod === "WALLET" ? <Wallet className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {processingRefund ? "Processing…" : cancelRefundMethod === "WALLET" ? "Credit Wallet" : "Mark as Refunded"}
            </button>
          ) : refundDone && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--color-success)" }}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Refund processed
            </p>
          )}
        </div>
      )}

      {showReturnPanel && (
        <div className="p-4 rounded-xl border" style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}>
          <p className="text-sm font-semibold font-body mb-1" style={{ color: "#92400E" }}>
            {currentStatus === "RETURN_REQUESTED" ? "Return Requested by Customer" : "Return Approved"}
          </p>
          {returnReason && (
            <p className="text-xs font-body" style={{ color: "#92400E" }}>Reason: {returnReason}</p>
          )}
          {returnRefundMethod && (
            <p className="text-xs font-body mt-0.5" style={{ color: "#92400E" }}>
              Refund to: {returnRefundMethod === "WALLET" ? "Customer Wallet" : "Original payment source"}
            </p>
          )}
          {currentStatus === "RETURN_REQUESTED" && (
            <button
              onClick={handleApproveReturn}
              disabled={saving}
              className="mt-3 flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold font-body text-white disabled:opacity-60"
              style={{ background: "var(--color-primary)" }}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {saving ? "Approving…" : "Approve Return"}
            </button>
          )}
          {currentStatus === "RETURN_APPROVED" && !refundDone && returnRefundMethod && (
            <button
              onClick={handleProcessRefund}
              disabled={processingRefund}
              className="mt-3 flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold font-body text-white disabled:opacity-60"
              style={{ background: returnRefundMethod === "WALLET" ? "var(--color-primary)" : "var(--color-error)" }}>
              {returnRefundMethod === "WALLET" ? <Wallet className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {processingRefund ? "Processing…" : returnRefundMethod === "WALLET" ? "Credit Wallet" : "Mark as Refunded"}
            </button>
          )}
          {refundDone && currentStatus === "RETURN_APPROVED" && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--color-success)" }}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Refund processed
            </p>
          )}
        </div>
      )}

      {showExchangePanel && (
        <div className="p-4 rounded-xl border" style={{ background: "#EFF6FF", borderColor: "#93C5FD" }}>
          <p className="text-sm font-semibold font-body mb-1" style={{ color: "#1E40AF" }}>
            {currentStatus === "EXCHANGE_REQUESTED" ? "Exchange Requested by Customer" : "Exchange Approved — Wallet Credited"}
          </p>
          {returnReason && (
            <p className="text-xs font-body" style={{ color: "#1E40AF" }}>Reason: {returnReason}</p>
          )}
          {currentStatus === "EXCHANGE_REQUESTED" && (
            <button
              onClick={handleApproveExchange}
              disabled={saving}
              className="mt-3 flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold font-body text-white disabled:opacity-60"
              style={{ background: "#1E40AF" }}>
              <Wallet className="h-3.5 w-3.5" />
              {saving ? "Approving…" : "Approve & Credit Wallet"}
            </button>
          )}
          {currentStatus === "EXCHANGE_APPROVED" && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--color-success)" }}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Wallet credited successfully
            </p>
          )}
        </div>
      )}

      {/* ── Status / Tracking ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-body font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
            Order Status
          </label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setSaved(false); }}
            className={inputCls} style={inputStyle}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-body font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
            Courier Partner
          </label>
          <input value={courier} onChange={(e) => { setCourier(e.target.value); setSaved(false); }}
            placeholder="e.g. BlueDart, DTDC, Delhivery"
            className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-body font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
            Tracking Number
          </label>
          <input value={tracking} onChange={(e) => { setTracking(e.target.value); setSaved(false); }}
            placeholder="Enter tracking number"
            className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-body font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
            Tracking URL
          </label>
          <input value={trackingUrl} onChange={(e) => { setUrl(e.target.value); setSaved(false); }}
            placeholder="https://tracking.courier.com/..."
            className={inputCls} style={inputStyle} />
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-body" style={{ color: "var(--color-error)" }}>
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 rounded-sm text-sm font-body font-medium text-white transition-colors disabled:opacity-60"
          style={{ background: "var(--color-primary)" }}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {saved && <span className="text-xs font-body" style={{ color: "var(--color-success)" }}>✓ Saved</span>}
        <a href={`/admin/orders/${orderId}/invoice`} target="_blank"
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-sm border text-xs font-body font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)" }}>
          <Printer className="h-3.5 w-3.5" /> Print Invoice
        </a>
      </div>
    </div>
  );
}
