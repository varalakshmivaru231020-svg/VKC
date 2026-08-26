"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, X, Save, Loader2, ImageIcon, Upload, Eye, EyeOff, AlertCircle, Pencil } from "lucide-react";
import { uploadImageFile } from "@/lib/utils/upload";
import { SmartImage } from "@/components/ui/SmartImage";
import { toISTDateTimeLocal } from "@/lib/utils/format";

/** Dates are stored UTC; admins think in IST. Show both date and time — a
 *  date alone hides schedules like "17:53 to 18:00", which is a 7-minute
 *  window that looks identical to an all-day one in the list. */
const fmtIST = (v: string | null) =>
  v ? new Date(v).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
      })
    : null;

interface PopupItem {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

const emptyForm = () => ({ imageUrl: "", linkUrl: "", isActive: true, startsAt: "", endsAt: "" });
const inputCls = "w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none";
const inputStyle = { borderColor: "#E5E7EB", background: "white", color: "#111827" };

export default function PopupPage() {
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string) => (v: any) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    fetch("/api/admin/popup").then((r) => r.json()).then(setPopups).finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    setUploadError(null);
    const result = await uploadImageFile(file);
    setUploading(false);
    if (!result.ok) { setUploadError(`${result.error} — ${result.details}`); return; }
    set("imageUrl")(result.url);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setUploadError(null);
    setModal(true);
  };

  const openEdit = (p: PopupItem) => {
    setEditingId(p.id);
    setForm({
      imageUrl: p.imageUrl,
      linkUrl: p.linkUrl ?? "",
      isActive: p.isActive,
      // Stored UTC -> the IST value the datetime-local input expects, so the
      // admin sees back exactly the time they typed.
      startsAt: toISTDateTimeLocal(p.startsAt),
      endsAt: toISTDateTimeLocal(p.endsAt),
    });
    setUploadError(null);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.imageUrl.trim()) { alert("Image required"); return; }
    setSaving(true);
    const res = await fetch(
      editingId ? `/api/admin/popup/${editingId}` : "/api/admin/popup",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    if (res.ok) {
      const saved = await res.json();
      setPopups((p) => editingId ? p.map((x) => (x.id === editingId ? saved : x)) : [saved, ...p]);
      setModal(false);
      setEditingId(null);
      setForm(emptyForm());
    } else { const d = await res.json(); alert(d.error ?? "Failed"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this popup?")) return;
    setDeleting(id);
    await fetch(`/api/admin/popup/${id}`, { method: "DELETE" });
    setPopups((p) => p.filter((x) => x.id !== id));
    setDeleting(null);
  };

  const toggleActive = async (p: PopupItem) => {
    const res = await fetch(`/api/admin/popup/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (res.ok) setPopups((prev) => prev.map((x) => x.id === p.id ? { ...x, isActive: !p.isActive } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "#111827" }}>Popup Manager</h1>
          <p className="text-sm font-body text-gray-500 mt-0.5">Show promotional popups to website visitors</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-body text-white"
          style={{ background: "var(--color-primary)" }}>
          <Plus className="h-4 w-4" /> Add Popup
        </button>
      </div>

      <div className="p-4 rounded-xl text-sm font-body border" style={{ background: "#EFF6FF", borderColor: "#BFDBFE", color: "#1E40AF" }}>
        Only one popup should be active at a time. The most recently created active popup will be shown to visitors.
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-gray-300" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popups.map((popup) => (
            <div key={popup.id} className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
              <div className="relative h-48 bg-gray-100">
                {popup.imageUrl
                  ? <SmartImage src={popup.imageUrl} alt="" fill objectFit="contain" />
                  : <ImageIcon className="h-12 w-12 m-auto mt-16 text-gray-200" />}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${popup.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
                    {popup.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                {popup.linkUrl && <p className="text-xs font-body text-gray-500 truncate mb-2">→ {popup.linkUrl}</p>}
                {popup.startsAt && <p className="text-xs font-body text-gray-400">From: {fmtIST(popup.startsAt)}</p>}
                {popup.endsAt && <p className="text-xs font-body text-gray-400">Until: {fmtIST(popup.endsAt)}</p>}
                {popup.isActive && popup.endsAt && new Date(popup.endsAt) < new Date() && (
                  <p className="text-xs font-body mt-1.5 font-medium" style={{ color: "#B45309" }}>
                    Not showing — the end time has passed.
                  </p>
                )}
                {popup.isActive && popup.startsAt && new Date(popup.startsAt) > new Date() && (
                  <p className="text-xs font-body mt-1.5 font-medium" style={{ color: "#1D4ED8" }}>
                    Not showing yet — starts later.
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => openEdit(popup)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium font-body hover:bg-gray-50 transition-colors" style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => toggleActive(popup)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium font-body hover:bg-gray-50 transition-colors" style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                    {popup.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {popup.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => handleDelete(popup.id)} disabled={deleting === popup.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium font-body hover:bg-red-50 transition-colors"
                    style={{ borderColor: "#FECACA", color: "#DC2626" }}>
                    {deleting === popup.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {popups.length === 0 && (
            <div className="col-span-3 rounded-xl border p-16 flex flex-col items-center gap-3" style={{ background: "white", borderColor: "#E5E7EB" }}>
              <ImageIcon className="h-12 w-12 text-gray-200" />
              <p className="text-sm font-body text-gray-400">No popups created yet</p>
            </div>
          )}
        </div>
      )}

      {/* Add modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-xl shadow-2xl" style={{ background: "white" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="text-base font-semibold font-body" style={{ color: "#111827" }}>{editingId ? "Edit Popup" : "Add Popup"}</h2>
              <button onClick={() => { setModal(false); setEditingId(null); }} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">Popup Image *</label>
                {form.imageUrl && <img src={form.imageUrl} alt="" className="w-full h-40 object-contain rounded-lg mb-2 border" style={{ borderColor: "#E5E7EB" }} />}
                <div className="flex items-center gap-3">
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium font-body hover:bg-gray-50"
                    style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploading ? "Uploading…" : "Upload"}
                  </button>
                  <input value={form.imageUrl} onChange={(e) => set("imageUrl")(e.target.value)}
                    className="flex-1 h-8 px-3 border rounded-lg text-xs font-body focus:outline-none"
                    style={inputStyle} placeholder="Or paste image URL" />
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                {uploadError && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg text-xs font-body mt-2" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{uploadError}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">Click URL (optional)</label>
                <input value={form.linkUrl} onChange={(e) => set("linkUrl")(e.target.value)} className={inputCls} style={inputStyle} placeholder="/shop or https://example.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">Start Date</label>
                  <input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt")(e.target.value)} className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">End Date</label>
                  <input type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt")(e.target.value)} className={inputCls} style={inputStyle} />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => set("isActive")(!form.isActive)}
                  className="relative w-10 h-6 rounded-full transition-all cursor-pointer"
                  style={{ background: form.isActive ? "var(--color-primary)" : "#D1D5DB" }}>
                  <div className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all"
                    style={{ left: form.isActive ? "calc(100% - 18px)" : "2px" }} />
                </div>
                <span className="text-sm font-medium font-body text-gray-700">{form.isActive ? "Active immediately" : "Inactive"}</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => { setModal(false); setEditingId(null); }} className="px-4 py-2 rounded-lg text-sm font-body text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold font-body text-white disabled:opacity-60"
                style={{ background: "var(--color-primary)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving…" : "Create Popup"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
