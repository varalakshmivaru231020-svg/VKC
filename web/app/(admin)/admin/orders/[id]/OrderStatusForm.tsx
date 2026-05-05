"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, CheckCircle2, Wallet, AlertCircle, Truck, Package } from "lucide-react";

const STATUSES = [
  { value: "PENDING",                  label: "Pending" },
  { value: "CONFIRMED",                label: "Confirmed" },
  { value: "PROCESSING",               label: "Processing" },
  { value: "SHIPPED",                  label: "Shipped" },
  { value: "DELIVERED",                label: "Delivered" },
  { value: "CANCELLED",                label: "Cancelled" },
  { value: "REFUNDED",                 label: "Refunded" },
  { value: "RETURN_REQUESTED",         label: "Return Requested" },
  { value: "RETURN_PICKUP_ASSIGNED",   label: "Return Pickup Assigned" },
  { value: "RETURN_PICKUP_COMPLETED",  label: "Return Pickup Completed" },
  { value: "RETURN_DELIVERED",         label: "Return Delivered (at warehouse)" },
  { value: "RETURN_APPROVED",          label: "Return Approved" },
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
  returnPickupCourier?: string | null;
  returnPickupTracking?: string | null;
  returnPickedUpNotes?: string | null;
  returnRefundNotes?: string | null;
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
  returnPickupCourier,
  returnPickupTracking,
  returnPickedUpNotes,
  returnRefundNotes,
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

  // Return-pickup workflow state
  const [pickupCourier,  setPickupCourier]  = useState(returnPickupCourier  ?? "");
  const [pickupTracking, setPickupTracking] = useState(returnPickupTracking ?? "");
  const [pickupNotes,    setPickupNotes]    = useState(returnPickedUpNotes  ?? "");
  const [refundNote,     setRefundNote]     = useState(returnRefundNotes    ?? "");
  const [pickupBusy,     setPickupBusy]     = useState(false);

  const callAdmin = async (body: Record<string, unknown>) => {
    setError("");
    setPickupBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return false; }
      router.refresh();
      return true;
    } catch {
      setError("Network error");
      return false;
    } finally {
      setPickupBusy(false);
    }
  };

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
  const showReturnPanel = [
    "RETURN_REQUESTED",
    "RETURN_PICKUP_ASSIGNED",
    "RETURN_PICKUP_COMPLETED",
    "RETURN_DELIVERED",
    "RETURN_APPROVED",
  ].includes(currentStatus);

  return (
    <div className="space-y-5">
      {/* ── Cancel / Return info panel ── */}
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
        <div className="p-4 rounded-xl border space-y-3" style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}>
          <div>
            <p className="text-sm font-semibold font-body" style={{ color: "#92400E" }}>
              {currentStatus === "RETURN_REQUESTED"        && "Return Requested — assign a courier to pick it up"}
              {currentStatus === "RETURN_PICKUP_ASSIGNED"  && "Pickup Assigned — record once the courier collects the parcel"}
              {currentStatus === "RETURN_PICKUP_COMPLETED" && "Pickup Completed — mark as delivered when it reaches the warehouse"}
              {currentStatus === "RETURN_DELIVERED"        && "Returned to Warehouse — process the refund"}
              {currentStatus === "RETURN_APPROVED"         && "Return Approved"}
            </p>
            {returnReason && (
              <p className="text-xs font-body mt-1" style={{ color: "#92400E" }}>Reason: {returnReason}</p>
            )}
            {returnRefundMethod && (
              <p className="text-xs font-body mt-0.5" style={{ color: "#92400E" }}>
                Refund to: {returnRefundMethod === "WALLET" ? "Customer Wallet" : "Original payment source"}
              </p>
            )}
          </div>

          {/* Step 1 — Assign pickup */}
          {currentStatus === "RETURN_REQUESTED" && (
            <div className="space-y-2 p-3 rounded-lg" style={{ background: "#FFF7E5", border: "1px solid #FCD34D" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#92400E" }}>Step 1 · Assign pickup courier</p>
              <input value={pickupCourier} onChange={(e) => setPickupCourier(e.target.value)}
                placeholder="Courier name (e.g. BlueDart)"
                className={inputCls} style={inputStyle} />
              <input value={pickupTracking} onChange={(e) => setPickupTracking(e.target.value)}
                placeholder="Pickup tracking number (optional)"
                className={inputCls} style={inputStyle} />
              <button
                onClick={() => callAdmin({ action: "assign_return_pickup", pickupCourier, pickupTracking })}
                disabled={pickupBusy || !pickupCourier.trim()}
                className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold font-body text-white disabled:opacity-60"
                style={{ background: "var(--color-primary)" }}>
                <Truck className="h-3.5 w-3.5" />
                {pickupBusy ? "Saving…" : "Assign pickup"}
              </button>
            </div>
          )}

          {/* Step 2 — Mark pickup completed */}
          {currentStatus === "RETURN_PICKUP_ASSIGNED" && (
            <div className="space-y-2 p-3 rounded-lg" style={{ background: "#FFF7E5", border: "1px solid #FCD34D" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#92400E" }}>Step 2 · Mark pickup completed</p>
              {returnPickupCourier && (
                <p className="text-xs font-body" style={{ color: "#92400E" }}>
                  Courier: {returnPickupCourier}{returnPickupTracking ? ` · Tracking ${returnPickupTracking}` : ""}
                </p>
              )}
              <textarea value={pickupNotes} onChange={(e) => setPickupNotes(e.target.value)} rows={3}
                placeholder="Pickup notes (item condition, missing accessories, photos taken, etc.)"
                className="w-full px-3 py-2 border rounded-sm text-sm font-body focus:outline-none"
                style={{ borderColor: "var(--color-parchment)", background: "white" }} />
              <button
                onClick={() => callAdmin({ action: "complete_return_pickup", pickupNotes })}
                disabled={pickupBusy}
                className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold font-body text-white disabled:opacity-60"
                style={{ background: "var(--color-primary)" }}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {pickupBusy ? "Saving…" : "Mark pickup completed"}
              </button>
            </div>
          )}

          {/* Step 3 — Mark delivered to warehouse */}
          {currentStatus === "RETURN_PICKUP_COMPLETED" && (
            <div className="space-y-2 p-3 rounded-lg" style={{ background: "#FFF7E5", border: "1px solid #FCD34D" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#92400E" }}>Step 3 · Confirm receipt at warehouse</p>
              {returnPickedUpNotes && (
                <p className="text-xs font-body" style={{ color: "#92400E" }}>Pickup notes: {returnPickedUpNotes}</p>
              )}
              <p className="text-xs font-body" style={{ color: "#92400E" }}>
                This restocks inventory and unlocks the refund step.
              </p>
              <button
                onClick={() => callAdmin({ action: "mark_return_delivered" })}
                disabled={pickupBusy}
                className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold font-body text-white disabled:opacity-60"
                style={{ background: "var(--color-primary)" }}>
                <Package className="h-3.5 w-3.5" />
                {pickupBusy ? "Saving…" : "Mark delivered to warehouse"}
              </button>
            </div>
          )}

          {/* Step 4 — Process refund (RETURN_DELIVERED or legacy RETURN_APPROVED) */}
          {(currentStatus === "RETURN_DELIVERED" || currentStatus === "RETURN_APPROVED") && !refundDone && returnRefundMethod && (
            <div className="space-y-2 p-3 rounded-lg" style={{ background: "#FFF7E5", border: "1px solid #FCD34D" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#92400E" }}>Final step · Process refund</p>
              <textarea value={refundNote} onChange={(e) => setRefundNote(e.target.value)} rows={2}
                placeholder="Refund note (transaction ref, deductions, etc.)"
                className="w-full px-3 py-2 border rounded-sm text-sm font-body focus:outline-none"
                style={{ borderColor: "var(--color-parchment)", background: "white" }} />
              <button
                onClick={async () => {
                  setProcessingRefund(true);
                  const ok = await callAdmin({ action: "process_refund", refundNote });
                  if (ok) setRefundDone(true);
                  setProcessingRefund(false);
                }}
                disabled={processingRefund || pickupBusy}
                className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold font-body text-white disabled:opacity-60"
                style={{ background: returnRefundMethod === "WALLET" ? "var(--color-primary)" : "var(--color-error)" }}>
                {returnRefundMethod === "WALLET" ? <Wallet className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {processingRefund ? "Processing…" : returnRefundMethod === "WALLET" ? "Credit Wallet" : "Mark as Refunded"}
              </button>
            </div>
          )}

          {refundDone && (
            <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--color-success)" }}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Refund processed
              {returnRefundNotes && <span style={{ color: "#92400E", fontWeight: 400 }}> — {returnRefundNotes}</span>}
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
