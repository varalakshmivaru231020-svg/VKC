"use client";

import { useState, useEffect } from "react";
import { Truck, Plus, Trash2, Edit2, Check, X, Globe, AlertCircle } from "lucide-react";

interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  rateType: "FLAT" | "PERCENTAGE" | "FREE";
  rate: number;
  minOrderFree: number | null;
  customDutyNote: string | null;
  estimatedDays: string | null;
  isActive: boolean;
  sortOrder: number;
}

const inputCls = "w-full h-10 px-3 border rounded-lg text-sm font-body focus:outline-none";
const inputStyle = { borderColor: "#E5E7EB", background: "white", color: "#111827" };

const EMPTY: Omit<ShippingZone, "id" | "sortOrder"> = {
  name: "", countries: [], rateType: "FLAT", rate: 0,
  minOrderFree: null, customDutyNote: null, estimatedDays: null, isActive: true,
};

export default function ShippingZonesPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY, countriesText: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/shipping-zones");
    const data = await res.json();
    setZones(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditId(null);
    setForm({ ...EMPTY, countriesText: "" });
    setShowForm(true);
    setError("");
  };

  const openEdit = (z: ShippingZone) => {
    setEditId(z.id);
    setForm({
      name: z.name, countries: z.countries, rateType: z.rateType,
      rate: z.rate, minOrderFree: z.minOrderFree, customDutyNote: z.customDutyNote ?? "",
      estimatedDays: z.estimatedDays ?? "", isActive: z.isActive,
      countriesText: z.countries.join(", "),
    });
    setShowForm(true);
    setError("");
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Zone name is required"); return; }
    setSaving(true); setError("");
    const countries = form.countriesText.split(",").map(s => s.trim()).filter(Boolean);
    const body = {
      name: form.name, countries, rateType: form.rateType,
      rate: Number(form.rate) || 0,
      minOrderFree: form.minOrderFree ? Number(form.minOrderFree) : null,
      customDutyNote: (form.customDutyNote as string | null)?.trim() || null,
      estimatedDays: (form.estimatedDays as string | null)?.trim() || null,
      isActive: form.isActive,
    };

    const url = editId ? `/api/admin/shipping-zones/${editId}` : "/api/admin/shipping-zones";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { setError("Failed to save zone"); setSaving(false); return; }
    setSaving(false); setShowForm(false); setEditId(null); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this shipping zone?")) return;
    await fetch(`/api/admin/shipping-zones/${id}`, { method: "DELETE" });
    load();
  };

  const toggleActive = async (z: ShippingZone) => {
    await fetch(`/api/admin/shipping-zones/${z.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !z.isActive }),
    });
    load();
  };

  const u = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Shipping Zones</h1>
          <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>International shipping rates & custom duty notices</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-body"
          style={{ background: "var(--color-primary)", color: "white" }}>
          <Plus className="h-4 w-4" /> Add Zone
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border p-6 space-y-4" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
              {editId ? "Edit Zone" : "New Shipping Zone"}
            </h2>
            <button onClick={() => setShowForm(false)}><X className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} /></button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm font-body" style={{ background: "#FEF2F2", color: "#DC2626" }}>
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Zone Name *</label>
              <input value={form.name} onChange={u("name")} placeholder="e.g. South Asia, Europe" className={inputCls} style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Estimated Delivery</label>
              <input value={form.estimatedDays as string} onChange={u("estimatedDays")} placeholder="e.g. 7-14 business days" className={inputCls} style={inputStyle} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Countries (comma-separated ISO codes or names)</label>
            <textarea value={form.countriesText} onChange={u("countriesText")} rows={2}
              placeholder="US, UK, AU, CA, DE, FR, SG, MY…"
              className="w-full px-3 py-2 border rounded-lg text-sm font-body focus:outline-none resize-none"
              style={inputStyle} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Rate Type</label>
              <select value={form.rateType} onChange={u("rateType")} className={inputCls} style={inputStyle}>
                <option value="FLAT">Flat (₹)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FREE">Free Shipping</option>
              </select>
            </div>
            {form.rateType !== "FREE" && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
                  Rate ({form.rateType === "PERCENTAGE" ? "%" : "₹"})
                </label>
                <input type="number" value={form.rate as number} onChange={u("rate")} placeholder="0" className={inputCls} style={inputStyle} />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Free above (₹)</label>
              <input type="number" value={form.minOrderFree ?? ""} onChange={u("minOrderFree")} placeholder="Leave blank if no free threshold" className={inputCls} style={inputStyle} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Custom Duty Notice</label>
            <textarea value={form.customDutyNote as string} onChange={u("customDutyNote")} rows={2}
              placeholder="Custom duty/import taxes are the buyer's responsibility and will be collected on delivery."
              className="w-full px-3 py-2 border rounded-lg text-sm font-body focus:outline-none resize-none"
              style={inputStyle} />
            <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>Shown to customers when they select this shipping zone at checkout.</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className="relative w-9 h-5 rounded-full transition-colors cursor-pointer"
                style={{ background: form.isActive ? "var(--color-primary)" : "#D1D5DB" }}>
                <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all" style={{ left: form.isActive ? "18px" : "2px" }} />
              </div>
              <span className="text-sm font-body" style={{ color: "#374151" }}>Active</span>
            </label>
            <div className="flex-1" />
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-body border" style={{ borderColor: "#E5E7EB", color: "#374151" }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-body disabled:opacity-60"
              style={{ background: "var(--color-primary)", color: "white" }}>
              {saving ? "Saving…" : <><Check className="h-4 w-4" /> Save Zone</>}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-parchment)" }}>
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-6 w-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : zones.length === 0 ? (
          <div className="p-16 text-center">
            <Globe className="h-12 w-12 mx-auto mb-3" style={{ color: "var(--color-text-disabled)" }} />
            <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>No shipping zones yet</p>
            <p className="text-xs font-body mt-1" style={{ color: "var(--color-text-muted)" }}>Add zones for international shipping with custom rates.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-cream)", borderBottom: "1px solid var(--color-parchment)" }}>
                {["Zone", "Countries", "Rate", "Delivery", "Custom Duty", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-body font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zones.map((z, i) => (
                <tr key={z.id} className="border-b" style={{ borderColor: "var(--color-parchment)", background: i % 2 === 0 ? "white" : "var(--color-ivory)" }}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>{z.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                      {z.countries.length > 0 ? z.countries.slice(0, 4).join(", ") + (z.countries.length > 4 ? ` +${z.countries.length - 4}` : "") : "All countries"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>
                      {z.rateType === "FREE" ? "Free" : z.rateType === "PERCENTAGE" ? `${z.rate}%` : `₹${z.rate}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                    {z.estimatedDays ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {z.customDutyNote ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-body" style={{ background: "#FEF3C7", color: "#92400E" }}>Notice set</span>
                    ) : <span className="text-xs font-body" style={{ color: "var(--color-text-disabled)" }}>—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(z)}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-body"
                      style={{ background: z.isActive ? "var(--color-success-bg)" : "#F3F4F6", color: z.isActive ? "var(--color-success)" : "#6B7280" }}>
                      {z.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(z)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100" style={{ color: "#6B7280" }}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(z.id)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50" style={{ color: "#EF4444" }}>
                        <Trash2 className="h-3.5 w-3.5" />
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
  );
}
