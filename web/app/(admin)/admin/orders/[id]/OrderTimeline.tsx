import { Box, CheckCircle2, Clock, Package, Truck, RotateCcw } from "lucide-react";

const TIMELINE_STEPS = [
  { key: "PENDING",    label: "Order Placed", icon: Box },
  { key: "CONFIRMED",  label: "Confirmed",    icon: CheckCircle2 },
  { key: "PROCESSING", label: "Processing",   icon: Clock },
  { key: "SHIPPED",    label: "Shipped",      icon: Truck },
  { key: "DELIVERED",  label: "Delivered",    icon: Package },
];
const STATUS_ORDER = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

const RETURN_STEPS = [
  { key: "REQUESTED",        label: "Return Requested", icon: RotateCcw },
  { key: "PICKUP_ASSIGNED",  label: "Pickup Assigned",  icon: Truck },
  { key: "PICKUP_COMPLETED", label: "Picked Up",        icon: Package },
  { key: "DELIVERED",        label: "Returned",         icon: Box },
  { key: "REFUNDED",         label: "Refunded",         icon: CheckCircle2 },
];
const RETURN_STATUS_ORDER = ["REQUESTED", "PICKUP_ASSIGNED", "PICKUP_COMPLETED", "DELIVERED", "REFUNDED"];

interface ReturnRow {
  status: string;
  pickupCourier:    string | null;
  pickupTracking:   string | null;
  createdAt?:       string | Date | null;
  pickupAssignedAt?:string | Date | null;
  pickedUpAt?:      string | Date | null;
  deliveredAt:      string | Date | null;
  refundedAt:       string | Date | null;
  refundMode:       string | null;
  refundTxnId:      string | null;
  // Actor names resolved at the page level (admin user → "Firstname Lastname")
  raisedByName?:        string | null;
  pickupAssignedByName?:string | null;
  pickedUpByName?:      string | null;
  warehouseByName?:     string | null;
  refundedByName?:      string | null;
}

interface Props {
  status: string;
  trackingNumber?: string | null;
  /** Most-recent OrderReturn for this order, if any */
  latestReturn?: ReturnRow | null;

  // Per-step delivery audit info (timestamps + actor display names).
  createdAt?:    string | Date | null;
  confirmedAt?:  string | Date | null;
  processingAt?: string | Date | null;
  shippedAt?:    string | Date | null;
  deliveredAt?:  string | Date | null;

  confirmedByName?:  string | null;
  processingByName?: string | null;
  shippedByName?:    string | null;
  deliveredByName?:  string | null;
}

const fmtStamp = (s: string | Date | null | undefined) =>
  s ? new Date(s).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

export default function OrderTimeline({
  status, trackingNumber, latestReturn,
  createdAt, confirmedAt, processingAt, shippedAt, deliveredAt,
  confirmedByName, processingByName, shippedByName, deliveredByName,
}: Props) {
  const deliveryStep = STATUS_ORDER.indexOf(status);
  const isCancelled = status === "CANCELLED";

  const deliveryMeta: Record<string, { ts: string | Date | null | undefined; by: string | null | undefined }> = {
    PENDING:    { ts: createdAt,    by: null /* customer */ },
    CONFIRMED:  { ts: confirmedAt,  by: confirmedByName },
    PROCESSING: { ts: processingAt, by: processingByName },
    SHIPPED:    { ts: shippedAt,    by: shippedByName },
    DELIVERED:  { ts: deliveredAt,  by: deliveredByName },
  };

  const orderStatusReturnMap: Record<string, string> = {
    RETURN_REQUESTED:        "REQUESTED",
    RETURN_PICKUP_ASSIGNED:  "PICKUP_ASSIGNED",
    RETURN_PICKUP_COMPLETED: "PICKUP_COMPLETED",
    RETURN_DELIVERED:        "DELIVERED",
    RETURN_APPROVED:         "DELIVERED",
    REFUNDED:                "REFUNDED",
  };
  const returnStepKey = latestReturn?.status ?? orderStatusReturnMap[status];
  const returnStep    = returnStepKey ? RETURN_STATUS_ORDER.indexOf(returnStepKey) : -1;
  const showReturn    = returnStep >= 0;

  const r = latestReturn ?? null;
  const returnMeta: Record<string, { ts: string | Date | null | undefined; by: string | null | undefined }> = {
    REQUESTED:        { ts: r?.createdAt,        by: r?.raisedByName ?? "Customer" },
    PICKUP_ASSIGNED:  { ts: r?.pickupAssignedAt, by: r?.pickupAssignedByName },
    PICKUP_COMPLETED: { ts: r?.pickedUpAt,       by: r?.pickedUpByName },
    DELIVERED:        { ts: r?.deliveredAt,      by: r?.warehouseByName },
    REFUNDED:         { ts: r?.refundedAt,       by: r?.refundedByName },
  };

  return (
    <div className="rounded-md border p-5 space-y-6" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
      <h2 className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>Order Status</h2>

      {isCancelled ? (
        <p className="text-sm font-body" style={{ color: "var(--color-error)" }}>Order cancelled.</p>
      ) : (
        <Strip steps={TIMELINE_STEPS} currentStep={deliveryStep} meta={deliveryMeta} />
      )}

      {trackingNumber && (
        <p className="text-xs font-body pt-3 border-t" style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-muted)" }}>
          Tracking: <span style={{ color: "var(--color-text-primary)" }} className="font-medium">{trackingNumber}</span>
        </p>
      )}

      {showReturn && (
        <>
          <h3 className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>Return Progress</h3>
          <Strip steps={RETURN_STEPS} currentStep={returnStep} meta={returnMeta} />
          {latestReturn?.pickupCourier && (
            <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
              Pickup courier: <span style={{ color: "var(--color-text-primary)" }} className="font-medium">{latestReturn.pickupCourier}</span>
              {latestReturn.pickupTracking ? <> · Tracking <span style={{ color: "var(--color-text-primary)" }} className="font-medium">{latestReturn.pickupTracking}</span></> : null}
            </p>
          )}
          {latestReturn?.refundedAt && (
            <p className="text-xs font-body" style={{ color: "var(--color-success)" }}>
              Refunded
              {latestReturn.refundMode ? ` via ${latestReturn.refundMode}` : ""}
              {latestReturn.refundTxnId ? ` · Ref ${latestReturn.refundTxnId}` : ""}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Strip({
  steps, currentStep, meta,
}: {
  steps: typeof TIMELINE_STEPS;
  currentStep: number;
  meta: Record<string, { ts: string | Date | null | undefined; by: string | null | undefined }>;
}) {
  return (
    <div className="flex items-start gap-0">
      {steps.map((step, i) => {
        const done   = currentStep >= 0 && i <= currentStep;
        const active = i === currentStep;
        const Icon   = step.icon;
        const m      = meta[step.key];
        const ts     = fmtStamp(m?.ts);
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
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 -ml-2 relative z-0"
                  style={{ background: currentStep > i ? "var(--color-primary)" : "var(--color-parchment)" }} />
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
            {done && m?.by && (
              <p className="text-[10px] font-body text-center px-1" style={{ color: "var(--color-text-muted)" }}>
                by {m.by}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
