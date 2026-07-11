"use client";

import { useState } from "react";
import { Plus, Trash2, X, Save, Loader2, CheckCircle2, RotateCcw } from "lucide-react";

interface Preset {
  id: string;
  name: string;
  emoji: string | null;
  colorPrimary: string;
  colorGold: string;
  bannerImage: string | null;
  bannerText: string | null;
  eventId: string | null;
}

const emptyForm = () => ({
  name: "", emoji: "", colorPrimary: "#8B1A2E", colorGold: "#C4922A",
  bannerImage: "", bannerText: "", eventId: "",
});

export default function FestivalThemesClient({
  presets: initial, activeId: initialActiveId, events,
}: {
  presets: Preset[]; activeId: string | null; events: { id: string; title: string }[];
}) {
  const [presets, setPresets] = useState(initial);
  const [activeId, setActiveId] = useState(initialActiveId);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const set = (k: keyof ReturnType<typeof emptyForm>) => (v: any) => setForm((f) => ({ ...f, [k]: v }));

  const refresh = async () => {
    const res = await fetch("/api/admin/theme-presets");
    if (res.ok) {
      const data = await res.json();
      setPresets(data.presets);
      setActiveId(data.activeId);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { alert("Name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/theme-presets", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      await refresh();
      setModalOpen(false);
      setForm(emptyForm());
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const activate = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/theme-presets/${id}/activate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to activate");
      setActiveId(id);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const resetDefault = async () => {
    setBusyId("__reset__");
    try {
      const res = await fetch("/api/admin/theme-presets/reset", { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset");
      setActiveId(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this festival theme?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/theme-presets/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      setPresets((s) => s.filter((p) => p.id !== id));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Festival Themes</h1>
          <p className="text-sm text-gray-500 mt-1">One-click seasonal color themes — Diwali, Holi, and more.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={resetDefault} disabled={busyId === "__reset__" || !activeId}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold border border-gray-200 disabled:opacity-40">
            {busyId === "__reset__" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Reset to Default
          </button>
          <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--color-primary)" }}>
            <Plus className="h-4 w-4" /> New Theme
          </button>
        </div>
      </div>

      {!activeId && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-gray-50 text-gray-600 border border-gray-200">
          Default theme is currently active.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {presets.map((p) => (
          <div key={p.id} className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: activeId === p.id ? "var(--color-primary)" : "#E5E7EB" }}>
            <div className="h-3 flex">
              <div className="flex-1" style={{ background: p.colorPrimary }} />
              <div className="flex-1" style={{ background: p.colorGold }} />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900">{p.emoji ? `${p.emoji} ` : ""}{p.name}</p>
                {activeId === p.id && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active
                  </span>
                )}
              </div>
              {p.bannerText && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.bannerText}</p>}
              <div className="flex gap-2">
                <button onClick={() => activate(p.id)} disabled={busyId === p.id || activeId === p.id}
                  className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: "var(--color-primary)" }}>
                  {busyId === p.id ? "…" : activeId === p.id ? "Active" : "Activate"}
                </button>
                <button onClick={() => remove(p.id)} disabled={busyId === p.id}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-red-200 text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {presets.length === 0 && <p className="text-sm text-gray-400 py-8 text-center col-span-2">No festival themes yet — create one to get started.</p>}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">New Festival Theme</h2>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                  <input value={form.name} onChange={(e) => set("name")(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Diwali" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Emoji</label>
                  <input value={form.emoji} onChange={(e) => set("emoji")(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center" placeholder="🪔" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.colorPrimary} onChange={(e) => set("colorPrimary")(e.target.value)} className="h-9 w-9 rounded border border-gray-200" />
                    <input value={form.colorPrimary} onChange={(e) => set("colorPrimary")(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Accent / Gold Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.colorGold} onChange={(e) => set("colorGold")(e.target.value)} className="h-9 w-9 rounded border border-gray-200" />
                    <input value={form.colorGold} onChange={(e) => set("colorGold")(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Homepage Banner Image URL (optional)</label>
                <input value={form.bannerImage} onChange={(e) => set("bannerImage")(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Banner Text (optional)</label>
                <input value={form.bannerText} onChange={(e) => set("bannerText")(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Celebrate Diwali with 20% off festive silks" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Link to Event Gallery (optional)</label>
                <select value={form.eventId} onChange={(e) => set("eventId")(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">None</option>
                  {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
              </div>
              <button onClick={handleCreate} disabled={saving}
                className="w-full h-11 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: "var(--color-primary)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Create Theme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
