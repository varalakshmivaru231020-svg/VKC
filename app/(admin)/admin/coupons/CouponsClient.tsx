"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Plus, Pencil, Trash2, X, Save, Loader2 } from "lucide-react";
import { formatINR, toISTDateTimeLocal } from "@/lib/utils/format";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

type CouponType = "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";

const emptyForm = () => ({
  code: "", type: "PERCENTAGE" as CouponType, value: "",
  minOrderAmount: "", maxDiscount: "", usageLimit: "",
  startsAt: "", expiresAt: "", isActive: true,
});

interface Props { coupons: Coupon[] }

export default function CouponsClient({ coupons: initial }: Props) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initial);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (v: any) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => { setForm(emptyForm()); setEditTarget(null); setModal("add"); };
  const openEdit = (c: Coupon) => {
    setForm({
      code: c.code, type: c.type, value: String(c.value),
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : "",
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      startsAt: toISTDateTimeLocal(c.startsAt), expiresAt: toISTDateTimeLocal(c.expiresAt),
      isActive: c.isActive,
    });
    setEditTarget(c);
    setModal("edit");
  };

  const handleSave = async () => {
    if (!form.code.trim()) { alert("Code is required"); return; }
    if (!form.value && form.type !== "FREE_SHIPPING") { alert("Value is required"); return; }
    setSaving(true);
    try {
      const url = modal === "edit" ? `/api/admin/coupons/${editTarget!.id}` : "/api/admin/coupons";
      const method = modal === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setModal(null);
      router.refresh();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    setDeleting(c.id);
    try {
      await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
      setCoupons((p) => p.filter((x) => x.id !== c.id));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const focusStyle = {
    onFocus: (e: React.FocusEvent<any>) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)"; },
    onBlur: (e: React.FocusEvent<any>) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; },
  };

  const inputCls = "w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none transition-all";
  const inputStyle = { borderColor: "#E5E7EB", background: "white", color: "#111827" };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Coupons</h1>
            <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>{coupons.length} discount codes</p>
          </div>
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-body font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--color-primary)", color: "white" }}>
            <Plus className="h-4 w-4" /> Create Coupon
          </button>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
          {coupons.length === 0 ? (
            <div className="p-16 flex flex-col items-center text-center gap-3">
              <Ticket className="h-10 w-10" style={{ color: "#D1D5DB" }} />
              <p className="text-sm font-body font-semibold" style={{ color: "#111827" }}>No coupons yet</p>
              <button onClick={openAdd} className="text-sm font-body font-medium" style={{ color: "var(--color-primary)" }}>
                Create your first coupon →
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  {["Code", "Type", "Discount", "Min Order", "Max Discount", "Used", "Expires", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest font-body" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 transition-colors hover:bg-gray-50" style={{ borderColor: "#E5E7EB" }}>
                    <td className="px-5 py-3.5">
                      <code className="text-sm font-mono font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: "#F9FAFB", color: "#111827", border: "1px solid #E5E7EB" }}>
                        {c.code}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-body" style={{ color: "#6B7280" }}>
                      {c.type === "PERCENTAGE" ? "Percentage" : c.type === "FIXED" ? "Fixed" : "Free Shipping"}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold font-body" style={{ color: "var(--color-primary)" }}>
                      {c.type === "PERCENTAGE" ? `${c.value}%` : c.type === "FIXED" ? formatINR(c.value) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-body" style={{ color: "#6B7280" }}>
                      {c.minOrderAmount ? formatINR(c.minOrderAmount) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-body" style={{ color: "#6B7280" }}>
                      {c.maxDiscount ? formatINR(c.maxDiscount) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-body" style={{ color: "#374151" }}>
                      {c.usedCount}
                      {c.usageLimit && <span style={{ color: "#9CA3AF" }}> / {c.usageLimit}</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-body" style={{ color: "#6B7280" }}>
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "No expiry"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold font-body rounded-full"
                        style={{ background: c.isActive ? "#D1FAE5" : "#F3F4F6", color: c.isActive ? "#065F46" : "#6B7280" }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.isActive ? "#059669" : "#9CA3AF" }} />
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(c)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-blue-50"
                          style={{ borderColor: "#E5E7EB" }} title="Edit">
                          <Pencil className="h-3.5 w-3.5" style={{ color: "#3B82F6" }} />
                        </button>
                        <button onClick={() => handleDelete(c)} disabled={deleting === c.id}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-red-50"
                          style={{ borderColor: "#E5E7EB" }} title="Delete">
                          {deleting === c.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#EF4444" }} />
                            : <Trash2 className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl my-4" style={{ background: "white" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
              <h2 className="text-base font-semibold font-body" style={{ color: "#111827" }}>
                {modal === "add" ? "Create Coupon" : `Edit: ${editTarget?.code}`}
              </h2>
              <button onClick={() => setModal(null)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" style={{ color: "#6B7280" }} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Code */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Coupon Code *</label>
                <input value={form.code} onChange={(e) => set("code")(e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE20" className={inputCls + " font-mono uppercase"} style={inputStyle} {...focusStyle} />
                <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>Will be auto-uppercased</p>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Discount Type *</label>
                <div className="flex gap-2">
                  {(["PERCENTAGE", "FIXED", "FREE_SHIPPING"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => set("type")(t)}
                      className="flex-1 py-2.5 rounded-lg border text-xs font-semibold font-body transition-all"
                      style={form.type === t
                        ? { background: "var(--color-primary)", color: "white", borderColor: "var(--color-primary)" }
                        : { background: "white", color: "#6B7280", borderColor: "#E5E7EB" }}>
                      {t === "PERCENTAGE" ? "% Off" : t === "FIXED" ? "₹ Fixed" : "Free Ship"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value */}
              {form.type !== "FREE_SHIPPING" && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
                    {form.type === "PERCENTAGE" ? "Percentage Off *" : "Fixed Amount (₹) *"}
                  </label>
                  <input type="number" value={form.value} onChange={(e) => set("value")(e.target.value)}
                    placeholder={form.type === "PERCENTAGE" ? "e.g. 20" : "e.g. 500"}
                    min={0} max={form.type === "PERCENTAGE" ? 100 : undefined}
                    className={inputCls} style={inputStyle} {...focusStyle} />
                </div>
              )}

              {/* Min Order + Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Min Order (₹)</label>
                  <input type="number" value={form.minOrderAmount} onChange={(e) => set("minOrderAmount")(e.target.value)}
                    placeholder="Optional" min={0} className={inputCls} style={inputStyle} {...focusStyle} />
                </div>
                {form.type === "PERCENTAGE" && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Max Discount (₹)</label>
                    <input type="number" value={form.maxDiscount} onChange={(e) => set("maxDiscount")(e.target.value)}
                      placeholder="Optional cap" min={0} className={inputCls} style={inputStyle} {...focusStyle} />
                  </div>
                )}
              </div>

              {/* Usage limit */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={(e) => set("usageLimit")(e.target.value)}
                  placeholder="Leave blank for unlimited" min={1} className={inputCls} style={inputStyle} {...focusStyle} />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Starts At</label>
                  <input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt")(e.target.value)}
                    className={inputCls} style={inputStyle} {...focusStyle} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Expires At</label>
                  <input type="datetime-local" value={form.expiresAt} onChange={(e) => set("expiresAt")(e.target.value)}
                    className={inputCls} style={inputStyle} {...focusStyle} />
                </div>
              </div>

              {/* Active */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => set("isActive")(!form.isActive)}
                  className="relative w-10 h-6 rounded-full transition-all cursor-pointer"
                  style={{ background: form.isActive ? "var(--color-primary)" : "#D1D5DB" }}>
                  <div className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all"
                    style={{ left: form.isActive ? "calc(100% - 18px)" : "2px" }} />
                </div>
                <span className="text-sm font-medium font-body" style={{ color: "#374151" }}>
                  {form.isActive ? "Active — customers can use this code" : "Inactive — code disabled"}
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
              <button onClick={() => setModal(null)}
                className="px-4 py-2 rounded-lg border text-sm font-medium font-body transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-semibold font-body flex items-center gap-2 transition-all disabled:opacity-60"
                style={{ background: "var(--color-primary)", color: "white" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving…" : modal === "add" ? "Create Coupon" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
