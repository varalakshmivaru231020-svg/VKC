"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Truck, CheckCircle2, Package, Wallet, X, Loader2, AlertCircle,
} from "lucide-react";

/* ──────────────── Types ──────────────── */

interface OrderItem {
  id: string;
  productName: string;
  variantColor: string;
  sareeCode: string | null;
  quantity: number;
  totalPrice: string | number;
  imageUrl: string | null;
}

interface ReturnItemRow {
  id: string;
  orderItemId: string;
  quantity: number;
  orderItem?: { productName: string; variantColor: string; sareeCode?: string | null; imageUrl?: string | null };
}

interface OrderReturnRow {
  id: string;
  returnNumber: string | null;
  refundAmount?: number;
  status: string;
  reason: string;
  remark: string | null;
  refundMethod: string | null;
  refundMode: string | null;
  refundTxnId: string | null;
  refundNote: string | null;
  refundedAt: string | null;
  pickupCourier: string | null;
  pickupTracking: string | null;
  pickedUpAt: string | null;
  pickedUpNotes: string | null;
  deliveredAt: string | null;
  raisedBy: "CUSTOMER" | "ADMIN" | string;
  rejectionReason: string | null;
  createdAt: string;
  items: ReturnItemRow[];
}

interface Props {
  orderId: string;
  orderStatus: string;
  orderItems: OrderItem[];
}

const STATUS_LABEL: Record<string, string> = {
  REQUESTED:        "Return Requested",
  PICKUP_ASSIGNED:  "Pickup Assigned",
  PICKUP_COMPLETED: "Picked Up",
  DELIVERED:        "Returned to Warehouse",
  REFUNDED:         "Refunded",
  REJECTED:         "Rejected",
};
const STATUS_COLOR: Record<string, string> = {
  REQUESTED:        "#D97706",
  PICKUP_ASSIGNED:  "#D97706",
  PICKUP_COMPLETED: "#D97706",
  DELIVERED:        "#4338CA",
  REFUNDED:         "var(--color-success)",
  REJECTED:         "var(--color-error)",
};

const inputCls = "w-full h-9 px-3 border rounded-sm text-sm font-body focus:outline-none";
const inputStyle = { borderColor: "var(--color-parchment)", background: "white" };
const taCls = "w-full px-3 py-2 border rounded-sm text-sm font-body focus:outline-none";

/* ──────────────── Component ──────────────── */

export default function OrderReturnsPanel({ orderId, orderStatus, orderItems }: Props) {
  const router = useRouter();
  const [returns, setReturns] = useState<OrderReturnRow[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showRaise, setShowRaise] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/orders/${orderId}/returns`);
    const data = await res.json().catch(() => ({}));
    setReturns(data.returns ?? []);
    setWalletBalance(typeof data.walletBalance === "number" ? data.walletBalance : 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orderId]);

  // How many of each item are already locked into a non-rejected return.
  const consumed: Record<string, number> = {};
  for (const r of returns) {
    if (r.status === "REJECTED") continue;
    for (const ri of r.items) {
      consumed[ri.orderItemId] = (consumed[ri.orderItemId] ?? 0) + ri.quantity;
    }
  }
  const eligible = orderItems
    .map((oi) => ({ ...oi, available: oi.quantity - (consumed[oi.id] ?? 0) }))
    .filter((oi) => oi.available > 0);

  const canRaise = orderStatus === "DELIVERED" && eligible.length > 0;

  return (
    <div className="rounded-md border" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--color-parchment)" }}>
        <h2 className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Returns ({returns.length})
        </h2>
        <button
          onClick={() => setShowRaise(true)}
          disabled={!canRaise}
          title={canRaise ? "" : "Return can be raised only for delivered items not already in a return"}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-body font-medium border transition-colors disabled:opacity-50 hover:bg-gray-50"
          style={{ borderColor: "var(--color-parchment)", color: "var(--color-primary)" }}
        >
          <Plus className="h-3.5 w-3.5" /> Raise return
        </button>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>Loading…</p>
        ) : returns.length === 0 ? (
          <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
            No return requests for this order.
          </p>
        ) : (
          returns.map((r) => (
            <ReturnCard key={r.id} ret={r} walletBalance={walletBalance} onRefresh={() => { load(); router.refresh(); }} />
          ))
        )}
      </div>

      {showRaise && (
        <RaiseReturnDialog
          orderId={orderId}
          eligible={eligible}
          onClose={() => setShowRaise(false)}
          onCreated={() => { setShowRaise(false); load(); router.refresh(); }}
        />
      )}
    </div>
  );
}

/* ──────────────── Single return card with all lifecycle controls ──────────────── */

function ReturnCard({ ret, walletBalance, onRefresh }: { ret: OrderReturnRow; walletBalance: number; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Form state for the active step
  const [pickupCourier, setPickupCourier] = useState(ret.pickupCourier ?? "");
  const [pickupTracking, setPickupTracking] = useState(ret.pickupTracking ?? "");
  const [pickupNotes, setPickupNotes] = useState(ret.pickedUpNotes ?? "");
  const [refundMode, setRefundMode] = useState("");
  const [refundTxnId, setRefundTxnId] = useState("");
  const [refundNote, setRefundNote] = useState(ret.refundNote ?? "");

  const call = async (body: Record<string, unknown>) => {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/admin/returns/${ret.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      onRefresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  const statusColor = STATUS_COLOR[ret.status] ?? "#6B7280";

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-parchment)", background: "#FFFBF6" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {ret.returnNumber && (
              <span className="px-2 py-0.5 text-[11px] font-body font-bold rounded font-mono"
                style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
                {ret.returnNumber}
              </span>
            )}
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded"
              style={{ background: `${statusColor}1f`, color: statusColor }}>
              {STATUS_LABEL[ret.status] ?? ret.status}
            </span>
            <span className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
              {ret.raisedBy === "ADMIN" ? "Raised by admin" : "Raised by customer"} · {new Date(ret.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-primary)" }}>
            <span className="font-medium">Reason:</span> {ret.reason}
          </p>
          {ret.refundMethod && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-body font-semibold"
              style={{
                background: ret.refundMethod === "WALLET" ? "var(--color-primary-50)" : "#FEF2F2",
                color:      ret.refundMethod === "WALLET" ? "var(--color-primary)"     : "var(--color-error)",
                border:     `1px solid ${ret.refundMethod === "WALLET" ? "var(--color-primary)" : "#FCA5A5"}`,
              }}>
              {ret.refundMethod === "WALLET"
                ? <><Wallet className="h-3 w-3" /> Customer requested refund to Wallet</>
                : <><CheckCircle2 className="h-3 w-3" /> Customer requested refund to Original payment source</>}
            </div>
          )}
        </div>
      </div>

      {/* Items in this return */}
      <div className="space-y-1.5 mb-3">
        {ret.items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 text-xs font-body" style={{ color: "var(--color-text-secondary)" }}>
            <span className="px-1.5 py-0.5 rounded" style={{ background: "white", border: "1px solid var(--color-parchment)" }}>×{it.quantity}</span>
            <span>
              {it.orderItem?.productName ?? "Item"}
              {it.orderItem?.variantColor ? ` · ${it.orderItem.variantColor}` : ""}
              {it.orderItem?.sareeCode ? ` · ${it.orderItem.sareeCode}` : ""}
            </span>
          </div>
        ))}
      </div>

      {/* Pickup info if recorded */}
      {(ret.pickupCourier || ret.pickedUpAt) && (
        <div className="text-xs font-body mb-3 space-y-0.5" style={{ color: "var(--color-text-muted)" }}>
          {ret.pickupCourier && <p>Courier: {ret.pickupCourier}{ret.pickupTracking ? ` · Tracking ${ret.pickupTracking}` : ""}</p>}
          {ret.pickedUpAt && <p>Picked up: {new Date(ret.pickedUpAt).toLocaleString()}</p>}
          {ret.pickedUpNotes && <p>Pickup notes: {ret.pickedUpNotes}</p>}
          {ret.deliveredAt && <p>Delivered to warehouse: {new Date(ret.deliveredAt).toLocaleString()}</p>}
        </div>
      )}

      {/* Refund info if processed */}
      {ret.status === "REFUNDED" && (
        <div className="rounded-md p-3 mb-3" style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)" }}>
          <p className="text-xs font-body font-semibold flex items-center gap-1.5" style={{ color: "var(--color-success)" }}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Refund processed
          </p>
          <p className="text-xs font-body mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {ret.refundMode && <>Mode: {ret.refundMode}</>}
            {ret.refundTxnId && <> · Txn: {ret.refundTxnId}</>}
            {ret.refundedAt && <> · {new Date(ret.refundedAt).toLocaleString()}</>}
          </p>
          {ret.refundNote && (
            <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
              Note: {ret.refundNote}
            </p>
          )}
        </div>
      )}

      {ret.status === "REJECTED" && (
        <p className="text-xs font-body" style={{ color: "var(--color-error)" }}>
          Rejected{ret.rejectionReason ? ` — ${ret.rejectionReason}` : ""}
        </p>
      )}

      {/* Step controls */}
      {ret.status === "REQUESTED" && (
        <div className="space-y-2 mt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Step 1 · Assign pickup</p>
          <input value={pickupCourier} onChange={(e) => setPickupCourier(e.target.value)} placeholder="Courier (e.g. BlueDart)" className={inputCls} style={inputStyle} />
          <input value={pickupTracking} onChange={(e) => setPickupTracking(e.target.value)} placeholder="Pickup tracking (optional)" className={inputCls} style={inputStyle} />
          <div className="flex gap-2">
            <button onClick={() => call({ action: "assign_pickup", pickupCourier, pickupTracking })}
              disabled={busy || !pickupCourier.trim()}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-sm text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--color-primary)" }}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />} Assign pickup
            </button>
            <button onClick={() => {
              const r = prompt("Reject this return?");
              if (r != null) call({ action: "reject", reason: r });
            }} disabled={busy}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-sm text-xs font-medium border"
              style={{ borderColor: "var(--color-parchment)", color: "var(--color-error)" }}>
              <X className="h-3 w-3" /> Reject
            </button>
          </div>
        </div>
      )}

      {ret.status === "PICKUP_ASSIGNED" && (
        <div className="space-y-2 mt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Step 2 · Mark picked up</p>
          <textarea value={pickupNotes} onChange={(e) => setPickupNotes(e.target.value)} rows={2}
            placeholder="Pickup notes (item condition, missing accessories, photos taken, etc.)"
            className={taCls} style={inputStyle} />
          <button onClick={() => call({ action: "complete_pickup", pickupNotes })} disabled={busy}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-sm text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Mark picked up
          </button>
        </div>
      )}

      {ret.status === "PICKUP_COMPLETED" && (
        <div className="space-y-2 mt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Step 3 · Confirm receipt at warehouse (restocks inventory)</p>
          <button onClick={() => call({ action: "mark_delivered" })} disabled={busy}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-sm text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />} Mark delivered to warehouse
          </button>
        </div>
      )}

      {ret.status === "DELIVERED" && (() => {
        const isWallet = ret.refundMethod === "WALLET";
        const refundAmount = Number(ret.refundAmount ?? 0);
        const newBalance = walletBalance + refundAmount;
        const fmt = (v: number) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        // Validation: wallet → only Remark required; source → all three required.
        const canSubmit = isWallet
          ? refundNote.trim().length > 0
          : refundMode.trim().length > 0 && refundTxnId.trim().length > 0 && refundNote.trim().length > 0;
        return (
          <div className="space-y-2 mt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Step 4 · Process refund</p>

            {/* Prominent destination banner — colour and copy mirror the
                customer's own choice so the admin can't accidentally refund
                to the wrong place. */}
            {ret.refundMethod && (
              <div className="rounded-md p-3 flex items-start gap-2.5"
                style={{
                  background: isWallet ? "var(--color-primary-50)" : "#FEF2F2",
                  border:     `1px solid ${isWallet ? "var(--color-primary)" : "#FCA5A5"}`,
                }}>
                {isWallet
                  ? <Wallet className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
                  : <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-error)" }} />}
                <div>
                  <p className="text-xs font-body font-semibold"
                    style={{ color: isWallet ? "var(--color-primary)" : "var(--color-error)" }}>
                    {isWallet
                      ? "Customer requested refund to Wallet"
                      : "Customer requested refund to Original Payment Source"}
                  </p>
                  <p className="text-[11px] font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {isWallet
                      ? "Clicking below will instantly add the refund amount to the customer's wallet balance."
                      : "Process it via your gateway / bank, then record the mode + transaction reference below."}
                  </p>
                </div>
              </div>
            )}

            {/* Wallet preview — current balance, refund amount, projected new balance */}
            {isWallet && (
              <div className="rounded-md p-3 grid grid-cols-3 gap-3 text-center"
                style={{ background: "white", border: "1px solid var(--color-parchment)" }}>
                <div>
                  <p className="text-[10px] font-body font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Current Balance</p>
                  <p className="text-sm font-body font-semibold mt-1" style={{ color: "var(--color-text-primary)" }}>{fmt(walletBalance)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-body font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Refund Amount</p>
                  <p className="text-sm font-body font-semibold mt-1" style={{ color: "var(--color-success)" }}>+ {fmt(refundAmount)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-body font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>New Balance</p>
                  <p className="text-sm font-body font-semibold mt-1" style={{ color: "var(--color-primary)" }}>{fmt(newBalance)}</p>
                </div>
              </div>
            )}

            {/* Source-account fields — Mode + Txn id, both required. */}
            {!isWallet && (
              <div className="grid grid-cols-2 gap-2">
                <input value={refundMode} onChange={(e) => setRefundMode(e.target.value)}
                  placeholder="Mode (UPI / NEFT / IMPS / Card / Cash) *" className={inputCls} style={inputStyle} />
                <input value={refundTxnId} onChange={(e) => setRefundTxnId(e.target.value)}
                  placeholder="Transaction ID / UTR / Cheque no. *" className={inputCls} style={inputStyle} />
              </div>
            )}

            {/* Remark — required for both wallet and source. */}
            <textarea value={refundNote} onChange={(e) => setRefundNote(e.target.value)} rows={2}
              placeholder={isWallet
                ? "Remark (reason for refund, partial refund detail, etc.) *"
                : "Remark (deductions, partial refund detail, etc.) *"}
              className={taCls} style={inputStyle} />

            <button onClick={() => call({ action: "process_refund", refundMode, refundTxnId, refundNote })}
              disabled={busy || !canSubmit}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-sm text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: isWallet ? "var(--color-primary)" : "var(--color-error)" }}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> :
                isWallet ? <Wallet className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
              {isWallet ? "Credit wallet" : "Mark as refunded"}
            </button>
          </div>
        );
      })()}

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-body" style={{ color: "var(--color-error)" }}>
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}

/* ──────────────── Raise return dialog ──────────────── */

function RaiseReturnDialog({
  orderId, eligible, onClose, onCreated,
}: {
  orderId: string;
  eligible: Array<OrderItem & { available: number }>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [reasonChoice, setReasonChoice] = useState("");      // dropdown selection
  const [reasonOther, setReasonOther] = useState("");        // free-text override
  const [remark, setRemark] = useState("");
  const [refundMethod, setRefundMethod] = useState<"SOURCE" | "WALLET">("SOURCE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Reasons configured by admin under Settings → Return Order Reasons
  const [reasons, setReasons] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/order-reasons").then((r) => r.json()).then((d) => {
      if (Array.isArray(d.returnReasons)) setReasons(d.returnReasons);
    }).catch(() => {});
  }, []);

  const totalPicked = Object.values(picks).reduce((a, b) => a + (b || 0), 0);

  // Final reason = dropdown choice (if any) plus the manual text appended.
  // If only the manual text is filled, it stands alone.
  const finalReason = (() => {
    const a = reasonChoice.trim();
    const b = reasonOther.trim();
    if (a && b) return `${a} — ${b}`;
    return a || b;
  })();

  const submit = async () => {
    if (!finalReason) { setError("Pick a reason or enter one manually"); return; }
    const items = Object.entries(picks)
      .filter(([, q]) => q > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (items.length === 0) { setError("Pick at least one item"); return; }

    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, reason: finalReason, remark, refundMethod }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      onCreated();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl my-4" style={{ background: "white" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
          <h3 className="text-base font-semibold font-body" style={{ color: "#111827" }}>Raise return on behalf of customer</h3>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="h-4 w-4" style={{ color: "#6B7280" }} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#6B7280" }}>Items</p>
            <div className="space-y-2">
              {eligible.map((oi) => (
                <div key={oi.id} className="flex items-center gap-3 p-2 rounded-lg border" style={{ borderColor: "#E5E7EB" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium truncate" style={{ color: "#111827" }}>{oi.productName}</p>
                    <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>
                      {oi.variantColor}{oi.sareeCode ? ` · ${oi.sareeCode}` : ""} · max {oi.available}
                    </p>
                  </div>
                  <input type="number" min={0} max={oi.available}
                    value={picks[oi.id] ?? 0}
                    onChange={(e) => {
                      const n = Math.max(0, Math.min(oi.available, parseInt(e.target.value || "0")));
                      setPicks((p) => ({ ...p, [oi.id]: n }));
                    }}
                    className="w-16 h-9 px-2 border rounded text-sm text-center"
                    style={{ borderColor: "#E5E7EB" }} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#6B7280" }}>Reason *</p>
            <select value={reasonChoice} onChange={(e) => setReasonChoice(e.target.value)}
              className="w-full h-10 px-3 border rounded-lg text-sm bg-white" style={{ borderColor: "#E5E7EB" }}>
              <option value="">— Select a reason —</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <input value={reasonOther} onChange={(e) => setReasonOther(e.target.value)}
              placeholder="Other / additional details (optional)"
              className="w-full h-10 px-3 mt-2 border rounded-lg text-sm" style={{ borderColor: "#E5E7EB" }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#6B7280" }}>Remark</p>
            <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3}
              placeholder="Any extra context for this return"
              className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: "#E5E7EB" }} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#6B7280" }}>Refund destination</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setRefundMethod("SOURCE")}
                className="flex flex-col items-start p-3 rounded-lg border text-left"
                style={{
                  borderColor: refundMethod === "SOURCE" ? "var(--color-primary)" : "#E5E7EB",
                  background: refundMethod === "SOURCE" ? "var(--color-primary-50)" : "white",
                }}>
                <span className="text-sm font-semibold" style={{ color: "#111827" }}>Original source</span>
                <span className="text-[11px]" style={{ color: "#6B7280" }}>Refunded back to the customer's payment account</span>
              </button>
              <button onClick={() => setRefundMethod("WALLET")}
                className="flex flex-col items-start p-3 rounded-lg border text-left"
                style={{
                  borderColor: refundMethod === "WALLET" ? "var(--color-primary)" : "#E5E7EB",
                  background: refundMethod === "WALLET" ? "var(--color-primary-50)" : "white",
                }}>
                <span className="text-sm font-semibold" style={{ color: "#111827" }}>Wallet</span>
                <span className="text-[11px]" style={{ color: "#6B7280" }}>Instant credit to the customer's wallet</span>
              </button>
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs font-body" style={{ color: "var(--color-error)" }}>
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: "#E5E7EB", color: "#374151" }}>
            Cancel
          </button>
          <button onClick={submit} disabled={busy || totalPicked === 0}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {busy ? "Creating…" : "Create return"}
          </button>
        </div>
      </div>
    </div>
  );
}
