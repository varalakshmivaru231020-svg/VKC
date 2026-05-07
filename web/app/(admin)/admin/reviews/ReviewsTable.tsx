"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Check, X, Edit3, Trash2, Loader2, Save } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  images: string[];
  isApproved: boolean;
  createdAt: string;
  user: { id: string; firstName: string | null; lastName: string | null; email: string };
  product: { id: string; name: string; slug: string } | null;
  orderItem: {
    id: string;
    productName: string;
    variantColor: string;
    sareeCode: string | null;
    order: { id: string; orderNumber: string; deliveredAt: string | null };
  } | null;
}

export default function ReviewsTable({ initialReviews }: { initialReviews: ReviewRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<ReviewRow[]>(initialReviews);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ rating: number; title: string; body: string }>({ rating: 0, title: "", body: "" });
  const [busy, setBusy] = useState(false);

  const startEdit = (r: ReviewRow) => {
    setEditing(r.id);
    setDraft({ rating: r.rating, title: r.title ?? "", body: r.body ?? "" });
  };

  const saveEdit = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: draft.rating, title: draft.title, body: draft.body }),
      });
      if (!res.ok) { alert("Failed to save"); return; }
      const d = await res.json();
      setRows((p) => p.map((r) => r.id === id ? { ...r, ...d.review } : r));
      setEditing(null);
    } finally { setBusy(false); }
  };

  const setApproval = async (id: string, isApproved: boolean) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved }),
      });
      if (!res.ok) { alert("Failed to update"); return; }
      setRows((p) => p.map((r) => r.id === id ? { ...r, isApproved } : r));
      router.refresh();
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) { alert("Failed to delete"); return; }
      setRows((p) => p.filter((r) => r.id !== id));
      router.refresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const author = [r.user.firstName, r.user.lastName].filter(Boolean).join(" ") || r.user.email;
        const isEditing = editing === r.id;
        return (
          <div key={r.id} className="rounded-md border p-4 flex gap-4" style={{ borderColor: "var(--color-parchment)", background: "white" }}>
            {/* Left meta */}
            <div className="w-56 shrink-0 text-xs font-body space-y-2" style={{ color: "var(--color-text-muted)" }}>
              <div>
                <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{author}</p>
                <p>{r.user.email}</p>
                <Link href={`/admin/customers/${r.user.id}`} className="underline" style={{ color: "var(--color-primary)" }}>View customer</Link>
              </div>
              {r.orderItem?.order && (
                <div>
                  <p>Order
                    <Link href={`/admin/orders/${r.orderItem.order.id}`} className="ml-1 underline" style={{ color: "var(--color-primary)" }}>
                      #{r.orderItem.order.orderNumber}
                    </Link>
                  </p>
                  {r.orderItem.order.deliveredAt && (
                    <p>Delivered {new Date(r.orderItem.order.deliveredAt).toLocaleDateString("en-IN")}</p>
                  )}
                </div>
              )}
              <div>
                <p>Product</p>
                {r.product ? (
                  <Link href={`/shop/${r.product.slug}`} target="_blank"
                    className="underline" style={{ color: "var(--color-primary)" }}>
                    {r.product.name}
                  </Link>
                ) : <p>—</p>}
                {r.orderItem && (
                  <p className="text-[11px]">{r.orderItem.variantColor}{r.orderItem.sareeCode ? ` · ${r.orderItem.sareeCode}` : ""}</p>
                )}
              </div>
              <p>Submitted {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-2">
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setDraft((d) => ({ ...d, rating: n }))}>
                        <Star className="h-5 w-5"
                          fill={draft.rating >= n ? "#F59E0B" : "transparent"}
                          style={{ color: draft.rating >= n ? "#F59E0B" : "var(--color-parchment)" }} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className="h-4 w-4"
                        fill={r.rating >= n ? "#F59E0B" : "transparent"}
                        style={{ color: r.rating >= n ? "#F59E0B" : "var(--color-parchment)" }} />
                    ))}
                    <span className="ml-2 text-xs font-body font-semibold" style={{ color: "var(--color-text-secondary)" }}>{r.rating}/5</span>
                  </div>
                )}
                <span className="px-2 py-0.5 text-[10px] font-body font-bold uppercase tracking-wide rounded"
                  style={{
                    background: r.isApproved ? "var(--color-success-bg)" : "var(--color-warning-bg)",
                    color:      r.isApproved ? "var(--color-success)"    : "var(--color-warning)",
                  }}>
                  {r.isApproved ? "Approved" : "Pending"}
                </span>
              </div>

              {isEditing ? (
                <>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="Title (optional)"
                    className="w-full h-9 px-3 mb-2 border rounded-sm text-sm font-body"
                    style={{ borderColor: "var(--color-parchment)" }} />
                  <textarea
                    value={draft.body}
                    onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                    rows={3}
                    placeholder="Review text"
                    className="w-full px-3 py-2 border rounded-sm text-sm font-body"
                    style={{ borderColor: "var(--color-parchment)" }} />
                </>
              ) : (
                <>
                  {r.title && <p className="text-sm font-body font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>{r.title}</p>}
                  {r.body  && <p className="text-sm font-body whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>{r.body}</p>}
                </>
              )}

              {r.images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {r.images.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer"
                      className="relative w-16 h-16 rounded overflow-hidden border block"
                      style={{ borderColor: "var(--color-parchment)" }}>
                      <SmartImage src={url} alt="" fill objectFit="cover" />
                    </a>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {isEditing ? (
                  <>
                    <button onClick={() => saveEdit(r.id)} disabled={busy}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm text-xs font-semibold text-white disabled:opacity-50"
                      style={{ background: "var(--color-primary)" }}>
                      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                    </button>
                    <button onClick={() => setEditing(null)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm text-xs font-medium border"
                      style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)" }}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {!r.isApproved ? (
                      <button onClick={() => setApproval(r.id, true)} disabled={busy}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: "var(--color-success)" }}>
                        <Check className="h-3 w-3" /> Approve
                      </button>
                    ) : (
                      <button onClick={() => setApproval(r.id, false)} disabled={busy}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm text-xs font-medium border"
                        style={{ borderColor: "var(--color-warning)", color: "var(--color-warning)" }}>
                        <X className="h-3 w-3" /> Unpublish
                      </button>
                    )}
                    <button onClick={() => startEdit(r)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm text-xs font-medium border"
                      style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)" }}>
                      <Edit3 className="h-3 w-3" /> Edit
                    </button>
                    <button onClick={() => remove(r.id)} disabled={busy}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm text-xs font-medium border"
                      style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}>
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
