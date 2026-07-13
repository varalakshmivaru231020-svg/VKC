"use client";

import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Loader2, X, Save, AlertCircle } from "lucide-react";
import { uploadImageFile } from "@/lib/utils/upload";
import { parseVideoUrl, isDirectVideoFile } from "@/lib/utils/video";

interface MediaItemRow {
  id: string;
  type: string;
  url: string;
  caption: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface Props {
  items: MediaItemRow[];
  mediaType: "IMAGE" | "VIDEO";
  title: string;
  description: string;
}

function Thumbnail({ item }: { item: MediaItemRow }) {
  if (item.type === "IMAGE") {
    return <img src={item.url} alt={item.caption ?? ""} className="w-full h-full object-cover" />;
  }
  const parsed = parseVideoUrl(item.url);
  if (parsed?.thumbnailUrl) {
    return <img src={parsed.thumbnailUrl} alt={item.caption ?? ""} className="w-full h-full object-cover" />;
  }
  if (parsed) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold uppercase tracking-wide"
        style={{ background: "var(--color-text-primary)" }}>
        {parsed.platform}
      </div>
    );
  }
  return <video src={item.url} className="w-full h-full object-cover" muted />;
}

export default function MediaLibraryClient({ items: initial, mediaType, title, description }: Props) {
  const [items, setItems] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ url: "", caption: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isImage = mediaType === "IMAGE";
  const urlWarning = !isImage && form.url.trim() && !parseVideoUrl(form.url) && !isDirectVideoFile(form.url);

  const refresh = async () => {
    const res = await fetch(`/api/admin/gallery?type=${mediaType}`);
    if (res.ok) setItems(await res.json());
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadImageFile(file);
    setUploading(false);
    if (!result.ok) { alert(`${result.error} — ${result.details}`); return; }
    setForm((f) => ({ ...f, url: result.url }));
  };

  const handleAdd = async () => {
    if (!form.url.trim()) { alert("Provide a media URL" + (isImage ? " or upload an image" : "")); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: mediaType }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      await refresh();
      setModalOpen(false);
      setForm({ url: "", caption: "" });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: MediaItemRow) => {
    setBusyId(item.id);
    const res = await fetch(`/api/admin/gallery/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (res.ok) setItems((s) => s.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)));
    setBusyId(null);
  };

  const remove = async (id: string) => {
    if (!confirm(`Delete this ${isImage ? "image" : "video"}?`)) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    if (res.ok) setItems((s) => s.filter((i) => i.id !== id));
    setBusyId(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--color-primary)" }}>
          <Plus className="h-4 w-4" /> Add {isImage ? "Image" : "Video"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: "#E5E7EB" }}>
            <div className="relative aspect-square bg-gray-100">
              <Thumbnail item={item} />
            </div>
            <div className="p-2.5 space-y-2">
              {item.caption && <p className="text-xs text-gray-600 truncate">{item.caption}</p>}
              <div className="flex items-center gap-1.5">
                <button onClick={() => toggleActive(item)} disabled={busyId === item.id}
                  className="flex-1 h-7 rounded-md text-[11px] font-medium flex items-center justify-center gap-1"
                  style={{ background: item.isActive ? "#EDF7F2" : "#F3F4F6", color: item.isActive ? "#2E6B47" : "#6B7280" }}>
                  {item.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {item.isActive ? "Live" : "Hidden"}
                </button>
                <button onClick={() => remove(item.id)} disabled={busyId === item.id}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-red-200 text-red-600">
                  {busyId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400 py-8 text-center col-span-4">No {isImage ? "images" : "videos"} yet.</p>}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add {isImage ? "Image" : "Video"}</h2>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              {isImage ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Image</label>
                  <input type="file" accept="image/*" onChange={handleUpload} className="text-sm" />
                  {uploading && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
                </div>
              ) : null}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {isImage ? "Or Image URL" : "Video URL"}
                </label>
                <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder={isImage ? "https://... .jpg" : "YouTube, Facebook, Vimeo link, or a direct .mp4 URL"} />
                {!isImage && (
                  <p className="text-xs text-gray-400 mt-1">
                    Paste a normal YouTube, Facebook, or Vimeo video link — it'll be embedded automatically.
                  </p>
                )}
                {urlWarning && (
                  <div className="flex items-start gap-1.5 mt-1.5 text-xs text-amber-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>This doesn't look like a YouTube/Facebook/Vimeo link or a direct video file — it may not play.</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Caption (optional)</label>
                <input value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <button onClick={handleAdd} disabled={saving}
                className="w-full h-11 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: "var(--color-primary)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
