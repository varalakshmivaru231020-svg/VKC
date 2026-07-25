"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Truck, Package, Star, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  orderId: string;
  orderNumber: string;
  itemCount: number;
  deliveryPincode: string;
  pickupPincodeDefault?: string;
  isCOD: boolean;
  onClose: () => void;
  onCreated: (info: { shiprocket_order_id: string; shipment_id: string; awb_code?: string; courier_name?: string }) => void;
}

interface Courier {
  courier_company_id: number;
  courier_name:       string;
  rate:               number;
  estimated_delivery_days: string;
  rating:             number;
  cod:                number;
  is_surface:         boolean;
}

type Step = "dimensions" | "couriers" | "creating" | "done";

export default function ShiprocketDialog({
  orderId, orderNumber, itemCount, deliveryPincode, pickupPincodeDefault,
  isCOD, onClose, onCreated,
}: Props) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("dimensions");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1 — dimensions
  const [length,  setLength]  = useState("40");
  const [breadth, setBreadth] = useState("30");
  const [height,  setHeight]  = useState("5");
  const [weight,  setWeight]  = useState(String(0.5 * itemCount || 0.5));
  // Pickup pincode is FIXED — sourced from Settings → Shiprocket → Pickup
  // Pincode. Admin can change it once in Settings; not per-shipment.
  const pickup = pickupPincodeDefault ?? "";

  // Step 2 — couriers
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selected, setSelected] = useState<Courier | null>(null);

  // Step 3 — creating
  const [result, setResult] = useState<{ shiprocket_order_id: string; shipment_id: string; awb_code?: string; courier_name?: string } | null>(null);

  const fetchCouriers = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/shiprocket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "serviceability",
          pickupPincode:   pickup,
          deliveryPincode: deliveryPincode,
          weight:          Number(weight),
          cod:             isCOD ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to fetch couriers"); return; }
      const list: Courier[] = data.couriers ?? [];
      if (list.length === 0) {
        setError("No couriers serve this route. Check the pincodes.");
        return;
      }
      // Cheapest first
      list.sort((a, b) => a.rate - b.rate);
      setCouriers(list);
      setSelected(list[0]);
      setStep("couriers");
    } catch (e: any) {
      setError(e?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  };

  const createShipment = async () => {
    if (!selected) { setError("Select a courier first"); return; }
    setError(""); setLoading(true); setStep("creating");
    try {
      const res = await fetch("/api/admin/shiprocket", {
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
          pickupLocation: "Primary",
          courierId: selected.courier_company_id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.shiprocket_order_id) {
        setError(data.error ?? "Shiprocket rejected the request");
        setStep("couriers");
        return;
      }
      const info = {
        shiprocket_order_id: String(data.shiprocket_order_id),
        shipment_id:         String(data.shipment_id),
        awb_code:            data.awb_code,
        courier_name:        data.courier_name ?? selected.courier_name,
      };
      setResult(info);
      setStep("done");
      onCreated(info);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Network error");
      setStep("couriers");
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
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "#EFF6FF" }}>
              <Truck className="h-4 w-4" style={{ color: "#1D4ED8" }} />
            </div>
            <div>
              <p className="font-semibold text-sm font-body" style={{ color: "var(--color-text-primary)" }}>
                Create Shiprocket Shipment
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

        {/* Stepper */}
        <div className="flex items-center gap-2 px-5 pt-4 text-xs font-body">
          {(["dimensions","couriers","done"] as const).map((s, i) => {
            const stepIdx  = ["dimensions","couriers","done"].indexOf(s);
            const currIdx  = ["dimensions","couriers","creating","done"].indexOf(step);
            const adjustedCurrIdx = step === "creating" ? 1 : currIdx > 2 ? 2 : currIdx;
            const isActive = adjustedCurrIdx === stepIdx;
            const isDone   = adjustedCurrIdx > stepIdx;
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: isDone ? "var(--color-success)" : isActive ? "#1D4ED8" : "var(--color-cream)",
                    color: isDone || isActive ? "white" : "var(--color-text-muted)",
                  }}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    color: isActive ? "#1D4ED8" : isDone ? "var(--color-success)" : "var(--color-text-muted)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {s === "dimensions" ? "Dimensions" : s === "couriers" ? "Pick Courier" : "Done"}
                </span>
                {i < 2 && <div className="w-6 h-px" style={{ background: "var(--color-parchment)" }} />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-3 p-2.5 rounded-lg flex items-start gap-2 text-xs font-body" style={{ background: "#FEF2F2", color: "var(--color-error)", border: "1px solid #FCA5A5" }}>
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Dimensions */}
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

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                  Shipping Route
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Pickup Pincode (from Settings)" value={pickup} readOnly />
                  <NumField label="Delivery Pincode (from order)" value={deliveryPincode} readOnly />
                </div>
                <p className="mt-2 text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
                  To change the pickup pincode, go to Settings → Shiprocket → Pickup Pincode.
                </p>
                {isCOD && (
                  <p className="mt-2 text-xs font-body inline-flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: "#FEF3C7", color: "#92400E" }}>
                    <Package className="h-3 w-3" /> COD order — only COD-supporting couriers will appear
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={onClose} className="h-9 px-4 rounded-lg text-xs font-medium border" style={{ borderColor: "var(--color-parchment)" }}>
                  Cancel
                </button>
                <button
                  onClick={fetchCouriers}
                  disabled={loading || !length || !breadth || !height || !weight || !pickup || !deliveryPincode}
                  className="h-9 px-4 rounded-lg text-xs font-semibold text-white disabled:opacity-50 inline-flex items-center gap-2"
                  style={{ background: "#1D4ED8" }}
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                  {loading ? "Checking…" : "Check Couriers"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Couriers */}
          {step === "couriers" && (
            <div className="space-y-3">
              <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                {couriers.length} couriers available for this route. Cheapest first.
              </p>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {couriers.map((c) => {
                  const isSelected = selected?.courier_company_id === c.courier_company_id;
                  return (
                    <label
                      key={c.courier_company_id}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                      style={{
                        borderColor: isSelected ? "#1D4ED8" : "var(--color-parchment)",
                        background:  isSelected ? "#EFF6FF" : "white",
                      }}
                    >
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelected(c)}
                        className="accent-blue-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium font-body" style={{ color: "var(--color-text-primary)" }}>
                            {c.courier_name}
                          </p>
                          {c.cod === 1 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#DCFCE7", color: "#166534" }}>
                              COD
                            </span>
                          )}
                          {c.is_surface && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#FEF3C7", color: "#92400E" }}>
                              SURFACE
                            </span>
                          )}
                          {c.rating > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-body" style={{ color: "var(--color-text-muted)" }}>
                              <Star className="h-2.5 w-2.5 fill-current" style={{ color: "#F59E0B" }} />
                              {c.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                          ETA: {c.estimated_delivery_days} day{c.estimated_delivery_days === "1" ? "" : "s"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold font-body" style={{ color: "var(--color-primary)" }}>
                          ₹{c.rate.toFixed(0)}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex justify-between gap-2 pt-2">
                <button onClick={() => setStep("dimensions")} className="h-9 px-4 rounded-lg text-xs font-medium border" style={{ borderColor: "var(--color-parchment)" }}>
                  ← Back
                </button>
                <button
                  onClick={createShipment}
                  disabled={!selected}
                  className="h-9 px-4 rounded-lg text-xs font-semibold text-white disabled:opacity-50 inline-flex items-center gap-2"
                  style={{ background: "var(--color-primary)" }}
                >
                  <Truck className="h-3.5 w-3.5" />
                  Create Shipment with {selected?.courier_name ?? "—"}
                </button>
              </div>
            </div>
          )}

          {/* Creating */}
          {step === "creating" && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#1D4ED8" }} />
              <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
                Creating shipment and assigning AWB…
              </p>
            </div>
          )}

          {/* Done */}
          {step === "done" && result && (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "var(--color-success)" }}>
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <p className="text-base font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
                Shipment Created
              </p>
              <div className="text-xs font-body space-y-1">
                <p><span style={{ color: "var(--color-text-muted)" }}>Shiprocket Order:</span> <span className="font-mono">{result.shiprocket_order_id}</span></p>
                <p><span style={{ color: "var(--color-text-muted)" }}>Shipment ID:</span> <span className="font-mono">{result.shipment_id}</span></p>
                {result.awb_code && <p><span style={{ color: "var(--color-text-muted)" }}>AWB:</span> <span className="font-mono font-medium" style={{ color: "var(--color-success)" }}>{result.awb_code}</span></p>}
                {result.courier_name && <p><span style={{ color: "var(--color-text-muted)" }}>Courier:</span> {result.courier_name}</p>}
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

function NumField({ label, value, onChange, readOnly = false, maxLength, step }: {
  label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; maxLength?: number; step?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-body font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        maxLength={maxLength}
        className="w-full h-9 px-3 border rounded-lg text-sm font-body focus:outline-none focus:border-blue-500"
        style={{
          borderColor: "var(--color-parchment)",
          background: readOnly ? "#F9FAFB" : "white",
          color: "var(--color-text-primary)",
        }}
      />
    </label>
  );
}
