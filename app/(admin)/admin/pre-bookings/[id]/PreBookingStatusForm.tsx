"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "PENDING_APPROVAL",  label: "Pending Approval" },
  { value: "ACCEPTED",          label: "Accepted" },
  { value: "WAITING_FOR_STOCK", label: "Waiting for Stock" },
  { value: "STOCK_AVAILABLE",   label: "Stock Available" },
  { value: "PROCESSING",        label: "Processing" },
  { value: "SHIPPED",           label: "Shipped" },
  { value: "DELIVERED",         label: "Delivered" },
  { value: "CANCELLED",         label: "Cancelled" },
];

interface Props {
  orderId: string;
  currentStatus: string;
  currentEtaDate: string | null; // ISO date string, yyyy-mm-dd, or null
}

export default function PreBookingStatusForm({ orderId, currentStatus, currentEtaDate }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [etaDate, setEtaDate] = useState(currentEtaDate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = currentStatus === "CANCELLED" || currentStatus === "DELIVERED";

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pre-bookings/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preBookingStatus: status !== currentStatus ? status : undefined,
          preBookingEtaDate: etaDate !== (currentEtaDate ?? "") ? (etaDate || null) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not save"); return; }
      router.refresh();
    } catch {
      setError("Could not save — check your connection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-md border p-5 space-y-4" style={{ borderColor: "var(--color-parchment)", background: "white" }}>
      <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>Pre-Booking Status</p>

      {locked && (
        <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
          This order is {currentStatus.toLowerCase()} — no further status changes allowed.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold font-body" style={{ color: "#374151" }}>Status</label>
          <select
            value={status}
            disabled={locked}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full h-10 px-3 border rounded-lg text-sm font-body focus:outline-none disabled:opacity-60"
            style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold font-body" style={{ color: "#374151" }}>Expected Availability Date</label>
          <input
            type="date"
            value={etaDate}
            disabled={locked}
            onChange={(e) => setEtaDate(e.target.value)}
            className="w-full h-10 px-3 border rounded-lg text-sm font-body focus:outline-none disabled:opacity-60"
            style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }}
          />
        </div>
      </div>

      {error && <p className="text-xs font-body" style={{ color: "var(--color-error)" }}>{error}</p>}

      <button
        onClick={save}
        disabled={locked || saving || (status === currentStatus && etaDate === (currentEtaDate ?? ""))}
        className="h-10 px-5 rounded-lg text-sm font-body font-semibold transition-opacity disabled:opacity-50"
        style={{ background: "var(--color-primary)", color: "white" }}
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
