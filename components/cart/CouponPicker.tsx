"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Tag, Check, Ticket, ChevronRight, AlertCircle } from "lucide-react";
import { formatINR } from "@/lib/utils/format";

interface AvailableCoupon {
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  expiresAt: string | null;
  description: string;
}

interface CouponResult {
  code: string;
  discount: number;
  freeShipping: boolean;
  description: string;
}

interface Props {
  subtotal: number;
  applied: CouponResult | null;
  onApply: (result: CouponResult) => void;
  onRemove: () => void;
}

function daysLeft(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function CouponPicker({ subtotal, applied, onApply, onRemove }: Props) {
  const [open, setOpen] = useState(false);
  const [coupons, setCoupons] = useState<AvailableCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load coupon list once
  useEffect(() => {
    if (!open || coupons.length > 0) return;
    setLoading(true);
    fetch("/api/coupons")
      .then(r => r.json())
      .then(d => setCoupons(Array.isArray(d) ? d : []))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Auto-focus search when modal opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 80);
  }, [open]);

  // Close on Escape / click outside
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const applyCoupon = async (code: string) => {
    setError("");
    setApplying(code);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), subtotal }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Invalid coupon"); setApplying(null); return; }
      onApply({ code: data.code, discount: data.discount, freeShipping: data.freeShipping, description: data.description });
      setOpen(false);
      setManualCode("");
      setError("");
    } catch {
      setError("Something went wrong");
    } finally {
      setApplying(null);
    }
  };

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  // ── Applied state ───────────────────────────────────────────────────────────
  if (applied) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl border"
        style={{ background: "var(--color-success-bg)", borderColor: "var(--color-success)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--color-success)" }}>
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold font-body" style={{ color: "var(--color-success)" }}>
              {applied.code} applied
            </p>
            <p className="text-[11px] font-body" style={{ color: "var(--color-success)", opacity: 0.8 }}>
              {applied.freeShipping ? "Free shipping on this order" : `You save ${formatINR(applied.discount)}`}
            </p>
          </div>
        </div>
        <button onClick={onRemove} className="text-xs font-semibold font-body underline underline-offset-2"
          style={{ color: "var(--color-error)" }}>
          Remove
        </button>
      </div>
    );
  }

  // ── Picker trigger ──────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-2.5">
        {/* Manual input row */}
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={e => { setManualCode(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={e => e.key === "Enter" && manualCode && applyCoupon(manualCode)}
            placeholder="Enter coupon code"
            className="flex-1 h-10 px-3 border rounded-lg text-sm font-body focus:outline-none transition-all"
            style={{ borderColor: error ? "var(--color-error)" : "var(--color-parchment)", background: "white" }}
            onFocus={e => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = error ? "var(--color-error)" : "var(--color-parchment)"; }}
          />
          <button
            onClick={() => manualCode && applyCoupon(manualCode)}
            disabled={!manualCode || applying === manualCode}
            className="h-10 px-4 rounded-lg text-sm font-semibold font-body disabled:opacity-50 transition-all"
            style={{ background: "var(--color-primary)", color: "white" }}
          >
            {applying === manualCode ? "…" : "Apply"}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs font-body" style={{ color: "var(--color-error)" }}>
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        {/* Browse offers button */}
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-dashed text-sm font-body transition-all hover:bg-cream"
          style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
        >
          <span className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Browse available offers
          </span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            ref={modalRef}
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "var(--color-ivory)", maxHeight: "85vh" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0"
              style={{ borderColor: "var(--color-parchment)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "var(--color-primary-50)" }}>
                  <Tag className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Available Offers</p>
                  <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
                    {coupons.length} coupon{coupons.length !== 1 ? "s" : ""} available
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full transition-colors hover:bg-cream"
                style={{ color: "var(--color-text-muted)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--color-parchment)", background: "white" }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search coupons…"
                  className="w-full h-9 pl-9 pr-4 border rounded-lg text-sm font-body focus:outline-none transition-all"
                  style={{ borderColor: "var(--color-parchment)", background: "var(--color-ivory)" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "var(--color-parchment)"; }}
                />
                {search && (
                  <button onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--color-text-muted)" }}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Coupon list */}
            <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--color-parchment)" }}>
              {loading ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <span className="h-6 w-6 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
                  <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>Loading offers…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-2 text-center px-6">
                  <Ticket className="h-10 w-10" style={{ color: "var(--color-parchment)" }} />
                  <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
                    {search ? "No matching coupons" : "No offers available right now"}
                  </p>
                  {search && (
                    <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                      Try entering the code manually above
                    </p>
                  )}
                </div>
              ) : (
                filtered.map(c => {
                  const meetsMin = !c.minOrderAmount || subtotal >= c.minOrderAmount;
                  const days = c.expiresAt ? daysLeft(c.expiresAt) : null;
                  const isApplying = applying === c.code;
                  return (
                    <div key={c.code} className="px-4 py-4 flex items-start gap-3"
                      style={{ background: "white", opacity: meetsMin ? 1 : 0.65 }}>
                      {/* Code badge */}
                      <div className="shrink-0 mt-0.5">
                        <div className="px-2.5 py-1 rounded-md border border-dashed font-mono text-xs font-bold tracking-wide"
                          style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", background: "var(--color-primary-50)" }}>
                          {c.code}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
                          {c.description}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {c.minOrderAmount && (
                            <p className="text-[11px] font-body" style={{ color: meetsMin ? "var(--color-text-muted)" : "var(--color-error)" }}>
                              {meetsMin ? `Min order ${formatINR(c.minOrderAmount)}` : `Add ${formatINR(c.minOrderAmount - subtotal)} more to unlock`}
                            </p>
                          )}
                          {days !== null && (
                            <p className="text-[11px] font-body" style={{ color: days <= 3 ? "var(--color-error)" : "var(--color-text-muted)" }}>
                              {days <= 0 ? "Expires today" : `Expires in ${days}d`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Apply button */}
                      <button
                        onClick={() => meetsMin && applyCoupon(c.code)}
                        disabled={!meetsMin || isApplying}
                        className="shrink-0 h-8 px-3.5 rounded-lg text-xs font-semibold font-body transition-all disabled:opacity-50"
                        style={{ background: meetsMin ? "var(--color-primary)" : "var(--color-parchment)", color: meetsMin ? "white" : "var(--color-text-muted)" }}
                      >
                        {isApplying ? (
                          <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                        ) : "Apply"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom safe area */}
            <div className="h-safe-bottom shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />
          </div>
        </div>
      )}
    </>
  );
}
