"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, RefreshCw, Trash2, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

// Tracking + "delete dispatch" controls for orders booked directly with a
// courier partner (DTDC / Delhivery). Shown on the order detail page whenever
// the order's courierPartner points at one of these carriers.

type Provider = "dtdc" | "delhivery" | "shiprocket";

interface Props {
  provider: Provider;
  orderId:  string;
  awb:      string;
  courierPartner: string;
}

const LABEL: Record<Provider, string> = { dtdc: "DTDC", delhivery: "Delhivery", shiprocket: "Shiprocket" };

// Human-friendly copy for the mapped internal event.
const EVENT_LABEL: Record<string, { text: string; color: string }> = {
  PICKED_UP:        { text: "Picked up",         color: "#4338CA" },
  IN_TRANSIT:       { text: "In transit",        color: "#4338CA" },
  OUT_FOR_DELIVERY: { text: "Out for delivery",  color: "#B45309" },
  DELIVERED:        { text: "Delivered",         color: "#166534" },
  NDR:              { text: "Delivery attempt failed", color: "#B45309" },
  RTO_INITIATED:    { text: "Return to origin",  color: "#B91C1C" },
  RTO_DELIVERED:    { text: "Returned to origin",color: "#B91C1C" },
  CANCELLED:        { text: "Cancelled",         color: "#B91C1C" },
  UNKNOWN:          { text: "No update yet",     color: "#6B7280" },
};

export default function PartnerTrackingPanel({ provider, orderId, awb, courierPartner }: Props) {
  const router = useRouter();
  const endpoint = `/api/admin/${provider}`;

  const [tracking, setTracking]     = useState(false);
  const [status, setStatus]         = useState<{ raw: string | null; mapped: string } | null>(null);
  const [error, setError]           = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [canForce, setCanForce]     = useState(false);
  const [done, setDone]             = useState(false);

  const refreshTracking = async () => {
    setError(""); setTracking(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "track", orderId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Tracking failed"); return; }
      setStatus({ raw: data.status ?? null, mapped: data.mapped ?? "UNKNOWN" });
    } catch (e: any) {
      setError(e?.message ?? "Network error");
    } finally {
      setTracking(false);
    }
  };

  const cancelDispatch = async (force = false) => {
    if (!force && !confirm(`Cancel this ${LABEL[provider]} shipment and remove it from the order? This lets you re-dispatch. The parcel will be cancelled with ${LABEL[provider]}.`)) return;
    setError(""); setCanForce(false); setCancelling(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_shipment", orderId, force }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Cancel failed");
        setCanForce(!!data.canForceClear);
        return;
      }
      setDone(true);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Network error");
    } finally {
      setCancelling(false);
    }
  };

  const evt = status ? (EVENT_LABEL[status.mapped] ?? EVENT_LABEL.UNKNOWN) : null;

  return (
    <div className="rounded-md border p-5" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
      <h2 className="text-sm font-body font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
        <Truck className="h-4 w-4" /> {courierPartner} Shipment
      </h2>

      {awb ? (
        <p className="text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>
          AWB: <span className="font-mono font-medium" style={{ color: "var(--color-text-primary)" }}>{awb}</span>
        </p>
      ) : (
        <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
          No AWB assigned yet — you can still cancel &amp; remove this dispatch.
        </p>
      )}

      {evt && (
        <p className="text-xs font-body mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ background: "var(--color-cream)", color: evt.color }}>
          <CheckCircle2 className="h-3 w-3" /> {evt.text}
          {status?.raw && status.raw.toUpperCase() !== evt.text.toUpperCase() && (
            <span style={{ color: "var(--color-text-muted)" }}>· {status.raw}</span>
          )}
        </p>
      )}

      {error && (
        <p className="flex items-start gap-1.5 text-xs font-body mt-2" style={{ color: "var(--color-error)" }}>
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {error}
        </p>
      )}

      {done ? (
        <p className="flex items-center gap-1.5 text-xs font-body font-semibold mt-3" style={{ color: "var(--color-success)" }}>
          <CheckCircle2 className="h-3.5 w-3.5" /> Dispatch removed — you can re-dispatch this order.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={refreshTracking} disabled={tracking || !awb}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium font-body border disabled:opacity-60"
            style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)" }}>
            {tracking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {tracking ? "Checking…" : "Refresh tracking"}
          </button>
          <button onClick={() => cancelDispatch(false)} disabled={cancelling}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold font-body text-white disabled:opacity-60"
            style={{ background: "var(--color-error)" }}>
            {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            {cancelling ? "Cancelling…" : "Cancel / delete dispatch"}
          </button>
          {canForce && (
            <button onClick={() => cancelDispatch(true)} disabled={cancelling}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium font-body border disabled:opacity-60"
              style={{ borderColor: "#FCA5A5", color: "var(--color-error)" }}>
              <Trash2 className="h-3.5 w-3.5" /> Clear from order anyway
            </button>
          )}
        </div>
      )}

      <p className="text-[11px] font-body mt-3" style={{ color: "var(--color-text-muted)" }}>
        Cancelling voids the label with {LABEL[provider]} and clears the tracking number so the order can be re-dispatched.
      </p>
    </div>
  );
}
