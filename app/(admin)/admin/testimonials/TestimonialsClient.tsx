"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Save, Loader2, Star, Eye, EyeOff, MessageSquareQuote } from "lucide-react";

export interface TestimonialRow {
  id: string;
  name: string;
  location: string | null;
  tag: string | null;
  rating: number;
  quote: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm = () => ({ name: "", location: "", tag: "", rating: "5", quote: "", sortOrder: "0", isActive: true });

const inputCls = "w-full px-3.5 py-2.5 border rounded-lg text-sm font-body focus:outline-none";
const inputStyle = { borderColor: "#E5E7EB", background: "white", color: "#111827" };

export default function TestimonialsClient({ items: initial }: { items: TestimonialRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<TestimonialRow | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const set = (k: keyof ReturnType<typeof emptyForm>) => (v: any) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => { setForm(emptyForm()); setEditing(null); setError(null); setModal("add"); };
  const openEdit = (t: TestimonialRow) => {
    setForm({ name: t.name, location: t.location ?? "", tag: t.tag ?? "", rating: String(t.rating), quote: t.quote, sortOrder: String(t.sortOrder), isActive: t.isActive });
    setEditing(t); setError(null); setModal("edit");
  };

  const save = async () => {
    setSaving(true); setError(null);
    const url = modal === "edit" && editing ? `/api/admin/testimonials/${editing.id}` : "/api/admin/testimonials";
    const res = await fetch(url, {
      method: modal === "edit" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rating: Number(form.rating), sortOrder: Number(form.sortOrder) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Could not save"); return; }
    setItems((prev) => modal === "edit" ? prev.map((t) => (t.id === data.id ? data : t)) : [...prev, data]);
    setModal(null);
    router.refresh();
  };

  const toggleActive = async (t: TestimonialRow) => {
    const res = await fetch(`/api/admin/testimonials/${t.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...t, isActive: !t.isActive }),
    });
    if (res.ok) { const data = await res.json(); setItems((prev) => prev.map((x) => (x.id === t.id ? data : x))); router.refresh(); }
  };

  const remove = async (t: TestimonialRow) => {
    if (!confirm(`Delete the testimonial from ${t.name}?`)) return;
    setDeleting(t.id);
    const res = await fetch(`/api/admin/testimonials/${t.id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) { setItems((prev) => prev.filter((x) => x.id !== t.id)); router.refresh(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "#111827" }}>Testimonials</h1>
          <p className="text-sm font-body mt-1" style={{ color: "#6B7280" }}>
            Customer quotes shown in the “What our customers say” section on the home page. Active ones appear in the order below.
          </p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold font-body text-white" style={{ background: "var(--color-primary, #D9731A)" }}>
          <Plus className="h-4 w-4" /> Add testimonial
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ borderColor: "#E5E7EB", background: "white" }}>
          <MessageSquareQuote className="h-10 w-10 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
          <p className="text-sm font-body" style={{ color: "#6B7280" }}>No testimonials yet. Add the first one and it will appear on the home page.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => (
            <div key={t.id} className="rounded-xl border p-5 flex flex-col" style={{ borderColor: "#E5E7EB", background: "white", opacity: t.isActive ? 1 : 0.6 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5" aria-label={`${t.rating} stars`}>
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-4 w-4 fill-current" style={{ color: s <= t.rating ? "#D9731A" : "#E5E7EB" }} />)}
                </div>
                <span className="text-[11px] font-body font-semibold px-2 py-0.5 rounded-full" style={{ background: t.isActive ? "#ECFDF5" : "#F3F4F6", color: t.isActive ? "#047857" : "#6B7280" }}>
                  {t.isActive ? "Active" : "Hidden"} · #{t.sortOrder}
                </span>
              </div>
              {t.tag && <span className="mt-3 inline-block self-start text-[11px] font-body font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: "#FDF1E4", color: "#9A5B0B" }}>{t.tag}</span>}
              <p className="mt-3 text-sm font-body italic flex-1" style={{ color: "#374151", lineHeight: 1.6 }}>“{t.quote}”</p>
              <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: "#F3F4F6" }}>
                <div>
                  <div className="text-sm font-semibold font-body" style={{ color: "#111827" }}>{t.name}</div>
                  {t.location && <div className="text-xs font-body" style={{ color: "#9CA3AF" }}>{t.location}</div>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(t)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-gray-100" title={t.isActive ? "Hide" : "Show"} style={{ color: "#6B7280" }}>
                    {t.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => openEdit(t)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-gray-100" title="Edit" style={{ color: "#6B7280" }}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(t)} disabled={deleting === t.id} className="h-8 w-8 grid place-items-center rounded-md hover:bg-red-50" title="Delete" style={{ color: "#DC2626" }}>
                    {deleting === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(17,24,39,0.5)" }} onClick={() => setModal(null)}>
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-4" style={{ background: "white" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold font-body" style={{ color: "#111827" }}>{modal === "edit" ? "Edit testimonial" : "Add testimonial"}</h2>
              <button onClick={() => setModal(null)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium font-body mb-1" style={{ color: "#374151" }}>Customer name *</label>
                <input value={form.name} onChange={(e) => set("name")(e.target.value)} className={inputCls} style={inputStyle} placeholder="Deepika Nair" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium font-body mb-1" style={{ color: "#374151" }}>Location</label>
                <input value={form.location} onChange={(e) => set("location")(e.target.value)} className={inputCls} style={inputStyle} placeholder="Mysuru" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium font-body mb-1" style={{ color: "#374151" }}>Tag (product or topic)</label>
                <input value={form.tag} onChange={(e) => set("tag")(e.target.value)} className={inputCls} style={inputStyle} placeholder="Jaggery Cubes" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium font-body mb-1" style={{ color: "#374151" }}>Rating</label>
                <select value={form.rating} onChange={(e) => set("rating")(e.target.value)} className={inputCls} style={inputStyle}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium font-body mb-1" style={{ color: "#374151" }}>Order</label>
                <input type="number" min={0} value={form.sortOrder} onChange={(e) => set("sortOrder")(e.target.value)} className={inputCls} style={inputStyle} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium font-body mb-1" style={{ color: "#374151" }}>Testimonial *</label>
                <textarea value={form.quote} onChange={(e) => set("quote")(e.target.value)} rows={4} className={inputCls} style={inputStyle} placeholder="What the customer said, in their words." />
              </div>
              <label className="col-span-2 inline-flex items-center gap-2 text-sm font-body" style={{ color: "#374151" }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive")(e.target.checked)} /> Show on the home page
              </label>
            </div>

            {error && <p className="text-sm font-body" style={{ color: "#DC2626" }}>{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModal(null)} className="h-10 px-4 rounded-lg text-sm font-body border" style={{ borderColor: "#E5E7EB", color: "#374151" }}>Cancel</button>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold font-body text-white" style={{ background: "var(--color-primary, #D9731A)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
