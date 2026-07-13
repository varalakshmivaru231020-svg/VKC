"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Truck, Package, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// Shared dispatch dialog for the direct-carrier partners (DTDC / Delhivery).
// Unlike Shiprocket these carriers expose no serviceability/rate API, so the
// flow is a simple: enter dimensions → book → done. On success it returns the
// AWB + courier label to the parent (which fills the tracking inputs).

type Provider = "dtdc" | "delhivery";

interface Props {
  provider:        Provider;
  orderId:         string;
  orderNumber:     string;
  itemCount:       number;
  deliveryPincode: string;
  isCOD:           boolean;
  // DTDC only — service type choices. Ignored for Delhivery.
  serviceTypes?:   string[];
  onClose:  () => void;
  onCreated: (info: { awb: string; courier_name: string; trackingUrl?: string }) => void;
}

const META: Record<Provider, { label: string; endpoint: string; accent: string; accentBg: string; accentBorder: string }> = {
  dtdc:      { label: "DTDC",      endpoint: "/api/admin/dtdc",      accent: "#B91C1C", accentBg: "#FEF2F2", accentBorder: "#FCA5A5" },
  delhivery: { label: "Delhivery", endpoint: "/api/admin/delhivery", accent: "#B45309", accentBg: "#FFFBEB", accentBorder: "#FCD34D" },
};

type Step = "dimensions" | "creating" | "done";

export default function PartnerDispatchDialog({
  provider, orderId, orderNumber, itemCount, deliveryPincode, isCOD,
  serviceTypes, onClose, onCreated,
}: Props) {
  const router = useRouter();
  const meta = META[provider];

  const [step, setStep]       = useState<Step>("dimensions");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const [length,  setLength]  = useState("40");
  const [breadth, setBreadth] = useState("30");
  const [height,  setHeight]  = useState("5");
  const [weight,  setWeight]  = useState(String(0.5 * itemCount || 0.5));
  const [service, setService] = useState(serviceTypes?.[0] ?? "");

  const [result, setResult] = useState<{ awb: string; courier_name: string; trackingUrl?: string } | null>(null);

  const createShipment = async () => {
    setError(""); setLoading(true); setStep("creating");
    try {
      const res = await fetch(meta.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_shipment",
          orderId,
          dimensions: {
            length:  Number(length),
            breadth: Number(breadth),
            height:  Number(height),
            weight:  Number(weight),
          },
          ...(provider === "dtdc" && service ? { serviceType: service } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.awb) {
        setError(data.error ?? `${meta.label} rejected the request`);
        setStep("dimensions");
        return;
      }
      const info = { awb: data.awb as string, courier_name: (data.courier_name as string) ?? meta.label, trackingUrl: data.trackingUrl as string | undefined };
      setResult(info);
      setStep("done");
      onCreated(info);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Network error");
      setStep("dimensions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--color-parchment)" }}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: meta.accentBg }}>
              <Truck className="h-4 w-4" style={{ color: meta.accent }} />
            </div>
            <div>
              <p className="font-semibold text-sm font-body" style={{ color: "var(--color-text-primary)" }}>
                Create {meta.label} Shipment
              </p>
              <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                Order #{orderNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-3 p-2.5 rounded-lg flex items-start gap-2 text-xs font-body" style={{ background: "#FEF2F2", color: "var(--color-error)", border: "1px solid #FCA5A5" }}>
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === "dimensions" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                  Package Dimensions
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Length (cm)"  value={length}  onChange={setLength}  />
                  <NumField label="Breadth (cm)" value={breadth} onChange={setBreadth} />
                  <NumField label="Height (cm)"  value={height}  onChange={setHeight}  />
                  <NumField label="Weight (kg)"  value={weight}  onChange={setWeight}  step="0.1" />
                </div>
              </div>

              {provider === "dtdc" && serviceTypes && serviceTypes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                    Service Type
                  </p>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full h-9 px-3 border rounded-lg text-sm font-body focus:outline-none"
                    style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
                  >
                    {serviceTypes.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                  Shipping Route
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Pickup (from Settings)" value="From account" readOnly />
                  <NumField label="Delivery Pincode (from order)" value={deliveryPincode} readOnly />
                </div>
                {isCOD && (
                  <p className="mt-2 text-xs font-body inline-flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: "#FEF3C7", color: "#92400E" }}>
                    <Package className="h-3 w-3" /> COD order — cash-on-delivery will be booked for the order total
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={onClose} className="h-9 px-4 rounded-lg text-xs font-medium border" style={{ borderColor: "var(--color-parchment)" }}>
                  Cancel
                </button>
                <button
                  onClick={createShipment}
                  disabled={loading || !length || !breadth || !height || !weight || !deliveryPincode}
                  className="h-9 px-4 rounded-lg text-xs font-semibold text-white disabled:opacity-50 inline-flex items-center gap-2"
                  style={{ background: meta.accent }}
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                  {loading ? "Booking…" : `Book ${meta.label}`}
                </button>
              </div>
            </div>
          )}

          {step === "creating" && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: meta.accent }} />
              <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
                Booking shipment with {meta.label}…
              </p>
            </div>
          )}

          {step === "done" && result && (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "var(--color-success)" }}>
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <p className="text-base font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
                Shipment Booked
              </p>
              <div className="text-xs font-body space-y-1">
                <p><span style={{ color: "var(--color-text-muted)" }}>Courier:</span> {result.courier_name}</p>
                <p><span style={{ color: "var(--color-text-muted)" }}>AWB:</span> <span className="font-mono font-medium" style={{ color: "var(--color-success)" }}>{result.awb}</span></p>
              </div>
              <button onClick={onClose} className="mt-3 h-9 px-5 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--color-primary)" }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, readOnly = false, step }: {
  label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; step?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-body font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
      <input
        type={readOnly && isNaN(Number(value)) ? "text" : "number"}
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className="w-full h-9 px-3 border rounded-lg text-sm font-body focus:outline-none"
        style={{
          borderColor: "var(--color-parchment)",
          background: readOnly ? "#F9FAFB" : "white",
          color: "var(--color-text-primary)",
        }}
      />
    </label>
  );
}
