"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, CheckCircle2, Wallet, AlertCircle, Truck, Package, ExternalLink } from "lucide-react";
import ShiprocketDialog from "./ShiprocketDialog";
import PartnerDispatchDialog from "./PartnerDispatchDialog";

interface Props {
  orderId: string;
  orderNumber: string;
  itemCount: number;
  deliveryPincode: string;
  isCOD: boolean;
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
  shiprocketEnabled?: boolean;
  shiprocketOrderId?: string | null;
  shiprocketShipmentId?: string | null;
  pickupPincodeDefault?: string;
  dtdcEnabled?: boolean;
  delhiveryEnabled?: boolean;
  dtdcServiceTypes?: string[];
  // True when the order has at least one OrderReturn row. The per-return
  // workflow lives in OrderReturnsPanel, so when this is set we hide the
  // legacy order-level return card to avoid two places to update the same
  // thing.
  hasReturns?: boolean;
}

export default function OrderStatusForm({
  orderId,
  orderNumber,
  itemCount,
  deliveryPincode,
  isCOD,
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
  shiprocketEnabled = false,
  shiprocketOrderId: initSROrderId,
  shiprocketShipmentId: initSRShipmentId,
  pickupPincodeDefault,
  dtdcEnabled = false,
  delhiveryEnabled = false,
  dtdcServiceTypes,
  hasReturns = false,
}: Props) {
  const router = useRouter();
  const [tracking,   setTracking] = useState(trackingNumber ?? "");
  const [trackingUrl,setUrl]      = useState(initialTrackingUrl ?? "");
  const [courier,    setCourier]  = useState(initialCourier ?? "");
  const [saving,     setSaving]   = useState(false);
  const [saved,      setSaved]    = useState(false);
  const [error,      setError]    = useState("");

  // Shiprocket state
  const [srOrderId,    setSrOrderId]    = useState(initSROrderId    ?? "");
  const [srShipmentId, setSrShipmentId] = useState(initSRShipmentId ?? "");
  const [srLoading,    setSrLoading]    = useState(false);
  const [srError,      setSrError]      = useState("");
  const [srAwb,        setSrAwb]        = useState("");
  const [srDialogOpen, setSrDialogOpen] = useState(false);

  // Direct-carrier partner dialog (DTDC / Delhivery)
  const [partnerDialog, setPartnerDialog] = useState<"dtdc" | "delhivery" | null>(null);

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

  // Generic transition helper used by every stage button on the delivery
  // flow. Caller passes the target status plus any tracking fields it wants
  // committed in the same call (e.g. courier + tracking when dispatching).
  const transitionTo = async (
    targetStatus: string,
    extra: { courierPartner?: string | null; trackingNumber?: string | null; trackingUrl?: string | null } = {}
  ) => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus, ...extra }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return false; }
      setSaved(true);
      router.refresh();
      return true;
    } catch {
      setError("Network error. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Update only the courier / tracking fields without changing status — used
  // in the SHIPPED stage so admins can correct or fill in tracking after the
  // order has already moved out.
  const updateTracking = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: tracking || null,
          trackingUrl:    trackingUrl || null,
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

  // (Legacy auto-create flow removed — admin now picks dimensions + courier
  // via the ShiprocketDialog modal. See setSrDialogOpen.)

  const inputCls = "w-full h-9 px-3 border rounded-sm text-sm font-body focus:outline-none";
  const inputStyle = { borderColor: "var(--color-parchment)", background: "white" };

  const showCancelPanel = currentStatus === "CANCELLED" && cancelReason;

  const isReturnState = [
    "RETURN_REQUESTED",
    "RETURN_PICKUP_ASSIGNED",
    "RETURN_PICKUP_COMPLETED",
    "RETURN_DELIVERED",
    "RETURN_APPROVED",
  ].includes(currentStatus);

  // Legacy order-level return workflow — only show as a fallback when the
  // order is in a return state but there are NO per-item OrderReturn rows
  // (e.g. very old orders). When OrderReturn rows exist, the Returns panel
  // below is the single source of truth.
  const showReturnPanel = !hasReturns && isReturnState;

  // The status dropdown / Save Changes is only useful for the delivery-side
  // flow. Hide it whenever the order is in any return state — return
  // progression is owned by either the Returns panel or the legacy workflow
  // card above, never by the dropdown.
  const showStatusForm = !isReturnState;

  // When neither the legacy return workflow nor the status form is shown,
  // the only useful action left is Print Invoice. Surface a small hint
  // pointing the admin to the Returns panel so the empty-looking card
  // doesn't read as a bug.
  const showHandledByReturnsHint = !showStatusForm && !showReturnPanel && !showCancelPanel;

  return (
    <div className="space-y-5">
      {showHandledByReturnsHint && (
        <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
          Return progress is managed in the Returns section below.
        </p>
      )}

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

      {/* ── Delivery flow — stage-by-stage buttons (mirrors the return flow).
         Each card surfaces only the action the admin can take next from the
         current status, with required inputs gated to the relevant stage. */}
      {showStatusForm && (
        <div className="p-4 rounded-xl border space-y-3" style={{ background: "var(--color-cream)", borderColor: "var(--color-parchment)" }}>

          {/* PENDING → Confirm */}
          {currentStatus === "PENDING" && (
            <div className="space-y-2 p-3 rounded-lg" style={{ background: "white", border: "1px solid var(--color-parchment)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>Step 1 · Confirm order</p>
              <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                Confirms payment + reservation. Inventory stays locked for this customer.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => transitionTo("CONFIRMED")} disabled={saving}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold font-body text-white disabled:opacity-60"
                  style={{ background: "var(--color-primary)" }}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {saving ? "Saving…" : "Confirm order"}
                </button>
                <button onClick={() => { if (confirm("Cancel this order? Stock will be released.")) transitionTo("CANCELLED"); }}
                  disabled={saving}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-medium font-body border disabled:opacity-60"
                  style={{ borderColor: "var(--color-parchment)", color: "var(--color-error)" }}>
                  Cancel order
                </button>
              </div>
            </div>
          )}

          {/* CONFIRMED → Start processing */}
          {currentStatus === "CONFIRMED" && (
            <div className="space-y-2 p-3 rounded-lg" style={{ background: "white", border: "1px solid var(--color-parchment)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>Step 2 · Start processing</p>
              <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                Move to processing once the items are being packed for dispatch.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => transitionTo("PROCESSING")} disabled={saving}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold font-body text-white disabled:opacity-60"
                  style={{ background: "var(--color-primary)" }}>
                  <Package className="h-3.5 w-3.5" />
                  {saving ? "Saving…" : "Start processing"}
                </button>
                <button onClick={() => { if (confirm("Cancel this order? Stock will be released.")) transitionTo("CANCELLED"); }}
                  disabled={saving}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-medium font-body border disabled:opacity-60"
                  style={{ borderColor: "var(--color-parchment)", color: "var(--color-error)" }}>
                  Cancel order
                </button>
              </div>
            </div>
          )}

          {/* PROCESSING → Dispatch (requires courier + tracking) */}
          {currentStatus === "PROCESSING" && (
            <div className="space-y-2 p-3 rounded-lg" style={{ background: "white", border: "1px solid var(--color-parchment)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>Step 3 · Dispatch</p>
              <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                Enter the courier name and tracking number to dispatch the order.
              </p>

              {/* Shiprocket — opens dialog for dimensions + courier picker */}
              {shiprocketEnabled && !srOrderId && (
                <div className="p-2.5 rounded-lg border" style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}>
                  <p className="text-xs font-body mb-2" style={{ color: "#1D4ED8" }}>
                    Shiprocket is enabled — set dimensions and choose a courier:
                  </p>
                  <button
                    onClick={() => setSrDialogOpen(true)}
                    className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-semibold font-body text-white"
                    style={{ background: "#1D4ED8" }}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    Create Shipment via Shiprocket
                  </button>
                  {srError && <p className="text-xs mt-1" style={{ color: "var(--color-error)" }}>{srError}</p>}
                </div>
              )}
              {srOrderId && srOrderId !== "undefined" && (
                <div className="p-2.5 rounded-lg border text-xs font-body" style={{ background: "#F0FDF4", borderColor: "#BBF7D0", color: "#166534" }}>
                  ✓ Shiprocket shipment created (ID: {srOrderId})
                  {srShipmentId && <> · Shipment: {srShipmentId}</>}
                  {srAwb && <> · AWB: <span className="font-mono font-medium">{srAwb}</span></>}
                </div>
              )}

              {srDialogOpen && (
                <ShiprocketDialog
                  orderId={orderId}
                  orderNumber={orderNumber}
                  itemCount={itemCount}
                  deliveryPincode={deliveryPincode}
                  pickupPincodeDefault={pickupPincodeDefault}
                  isCOD={isCOD}
                  onClose={() => setSrDialogOpen(false)}
                  onCreated={(info) => {
                    setSrOrderId(info.shiprocket_order_id);
                    setSrShipmentId(info.shipment_id);
                    if (info.awb_code) {
                      setSrAwb(info.awb_code);
                      setTracking(info.awb_code);
                      setCourier(info.courier_name ?? "");
                    }
                  }}
                />
              )}

              {/* DTDC / Delhivery — direct-carrier booking (no rate/courier picker) */}
              {(dtdcEnabled || delhiveryEnabled) && (
                <div className="p-2.5 rounded-lg border" style={{ background: "#FAFAF9", borderColor: "var(--color-parchment)" }}>
                  <p className="text-xs font-body mb-2" style={{ color: "var(--color-text-secondary)" }}>
                    Book directly with a courier partner:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dtdcEnabled && (
                      <button
                        onClick={() => setPartnerDialog("dtdc")}
                        className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-semibold font-body text-white"
                        style={{ background: "#B91C1C" }}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        Book via DTDC
                      </button>
                    )}
                    {delhiveryEnabled && (
                      <button
                        onClick={() => setPartnerDialog("delhivery")}
                        className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-semibold font-body text-white"
                        style={{ background: "#B45309" }}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        Book via Delhivery
                      </button>
                    )}
                  </div>
                </div>
              )}

              {partnerDialog && (
                <PartnerDispatchDialog
                  provider={partnerDialog}
                  orderId={orderId}
                  orderNumber={orderNumber}
                  itemCount={itemCount}
                  deliveryPincode={deliveryPincode}
                  isCOD={isCOD}
                  serviceTypes={partnerDialog === "dtdc" ? (dtdcServiceTypes ?? ["B2C SMART EXPRESS", "B2C PRIORITY"]) : undefined}
                  onClose={() => setPartnerDialog(null)}
                  onCreated={(info) => {
                    setTracking(info.awb);
                    setCourier(info.courier_name);
                    if (info.trackingUrl) setUrl(info.trackingUrl);
                  }}
                />
              )}

              <input value={courier} onChange={(e) => { setCourier(e.target.value); setSaved(false); }}
                placeholder="Courier name (e.g. BlueDart, DTDC, Delhivery) *"
                className={inputCls} style={inputStyle} />
              <input value={tracking} onChange={(e) => { setTracking(e.target.value); setSaved(false); }}
                placeholder="Tracking number *"
                className={inputCls} style={inputStyle} />
              <input value={trackingUrl} onChange={(e) => { setUrl(e.target.value); setSaved(false); }}
                placeholder="Tracking URL (optional)"
                className={inputCls} style={inputStyle} />
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => transitionTo("SHIPPED", {
                    courierPartner: courier.trim(),
                    trackingNumber: tracking.trim(),
                    trackingUrl:    trackingUrl.trim() || null,
                  })}
                  disabled={saving || !courier.trim() || !tracking.trim()}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold font-body text-white disabled:opacity-60"
                  style={{ background: "var(--color-primary)" }}>
                  <Truck className="h-3.5 w-3.5" />
                  {saving ? "Saving…" : "Dispatch order"}
                </button>
                <button onClick={() => { if (confirm("Cancel this order? Stock will be released.")) transitionTo("CANCELLED"); }}
                  disabled={saving}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-medium font-body border disabled:opacity-60"
                  style={{ borderColor: "var(--color-parchment)", color: "var(--color-error)" }}>
                  Cancel order
                </button>
              </div>
            </div>
          )}

          {/* SHIPPED → Update tracking / Mark delivered */}
          {currentStatus === "SHIPPED" && (
            <div className="space-y-2 p-3 rounded-lg" style={{ background: "white", border: "1px solid var(--color-parchment)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>Step 4 · Mark delivered</p>
              {(initialCourier || trackingNumber) && (
                <p className="text-xs font-body" style={{ color: "var(--color-text-secondary)" }}>
                  Currently with <span className="font-medium">{initialCourier ?? "courier"}</span>
                  {trackingNumber ? <> · <span className="font-mono">{trackingNumber}</span></> : null}
                </p>
              )}
              <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                You can correct courier details below before marking delivered.
              </p>
              <input value={courier} onChange={(e) => { setCourier(e.target.value); setSaved(false); }}
                placeholder="Courier name"
                className={inputCls} style={inputStyle} />
              <input value={tracking} onChange={(e) => { setTracking(e.target.value); setSaved(false); }}
                placeholder="Tracking number"
                className={inputCls} style={inputStyle} />
              <input value={trackingUrl} onChange={(e) => { setUrl(e.target.value); setSaved(false); }}
                placeholder="Tracking URL (optional)"
                className={inputCls} style={inputStyle} />
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => transitionTo("DELIVERED", {
                    courierPartner: courier.trim() || null,
                    trackingNumber: tracking.trim() || null,
                    trackingUrl:    trackingUrl.trim() || null,
                  })} disabled={saving}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold font-body text-white disabled:opacity-60"
                  style={{ background: "var(--color-primary)" }}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {saving ? "Saving…" : "Mark delivered"}
                </button>
                <button onClick={updateTracking} disabled={saving}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-medium font-body border disabled:opacity-60"
                  style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)" }}>
                  {saving ? "Saving…" : "Save tracking"}
                </button>
              </div>
            </div>
          )}

          {/* DELIVERED — terminal for the delivery flow */}
          {currentStatus === "DELIVERED" && (
            <div className="p-3 rounded-lg" style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)" }}>
              <p className="flex items-center gap-1.5 text-xs font-body font-semibold" style={{ color: "var(--color-success)" }}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Delivered to customer
              </p>
              {(initialCourier || trackingNumber) && (
                <p className="text-xs font-body mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  Via {initialCourier ?? "courier"}{trackingNumber ? ` · ${trackingNumber}` : ""}
                </p>
              )}
            </div>
          )}

          {/* REFUNDED — terminal */}
          {currentStatus === "REFUNDED" && !showCancelPanel && (
            <div className="p-3 rounded-lg" style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)" }}>
              <p className="flex items-center gap-1.5 text-xs font-body font-semibold" style={{ color: "var(--color-success)" }}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Refund processed
              </p>
            </div>
          )}

          {error && (
            <p className="flex items-center gap-1.5 text-xs font-body" style={{ color: "var(--color-error)" }}>
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </p>
          )}
          {saved && (
            <p className="text-xs font-body" style={{ color: "var(--color-success)" }}>✓ Saved</p>
          )}
        </div>
      )}

      {!showStatusForm && error && (
        <p className="flex items-center gap-1.5 text-xs font-body" style={{ color: "var(--color-error)" }}>
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <a href={`/admin/orders/${orderId}/invoice`} target="_blank"
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-sm border text-xs font-body font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)" }}>
          <Printer className="h-3.5 w-3.5" /> Print Invoice
        </a>
      </div>
    </div>
  );
}
