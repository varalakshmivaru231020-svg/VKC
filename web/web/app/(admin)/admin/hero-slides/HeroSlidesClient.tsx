"use client";

import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Upload, ImageIcon, Loader2, X, Save, AlertCircle } from "lucide-react";
import { uploadImageFile } from "@/lib/utils/upload";
import { SmartImage } from "@/components/ui/SmartImage";

interface HeroSlide {
  id: string;
  tag: string;
  heading: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  ctaSecLabel: string | null;
  ctaSecHref: string | null;
  bgColor: string;
  imageBg: string;
  imageUrl: string | null;
  videoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm = () => ({
  tag: "", heading: "", subtext: "",
  ctaLabel: "Explore Collection", ctaHref: "/shop",
  ctaSecLabel: "", ctaSecHref: "",
  bgColor: "#F2EBE0", imageBg: "", imageUrl: "", videoUrl: "",
  sortOrder: "0", isActive: true,
});

export default function HeroSlidesClient({ slides: initial }: { slides: HeroSlide[] }) {
  const [slides, setSlides]     = useState(initial);
  const [modal, setModal]       = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<HeroSlide | null>(null);
  const [form, setForm]         = useState(emptyForm());
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof ReturnType<typeof emptyForm>) => (v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setForm(emptyForm());
    setPreview(null);
    setEditTarget(null);
    setModal("add");
  };

  const openEdit = (s: HeroSlide) => {
    setForm({
      tag: s.tag, heading: s.heading, subtext: s.subtext,
      ctaLabel: s.ctaLabel, ctaHref: s.ctaHref,
      ctaSecLabel: s.ctaSecLabel ?? "", ctaSecHref: s.ctaSecHref ?? "",
      bgColor: s.bgColor, imageBg: s.imageBg, imageUrl: s.imageUrl ?? "", videoUrl: s.videoUrl ?? "",
      sortOrder: String(s.sortOrder), isActive: s.isActive,
    });
    setPreview(s.imageUrl ?? null);
    setEditTarget(s);
    setModal("edit");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const result = await uploadImageFile(file);
    setUploading(false);
    if (!result.ok) { setUploadError(`${result.error} — ${result.details}`); setPreview(null); return; }
    set("imageUrl")(result.url); setPreview(result.url);
  };

  const handleSave = async () => {
    if (!form.imageUrl.trim()) { alert("Image is required"); return; }
    setSaving(true);
    try {
      const url    = modal === "edit" ? `/api/admin/hero-slides/${editTarget!.id}` : "/api/admin/hero-slides";
      const method = modal === "edit" ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      const saved: HeroSlide = await res.json();
      if (modal === "add") {
        setSlides((p) => [...p, saved].sort((a, b) => a.sortOrder - b.sortOrder));
      } else {
        setSlides((p) => p.map((x) => x.id === saved.id ? saved : x));
      }
      setModal(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    setDeleting(id);
    await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE" });
    setSlides((p) => p.filter((s) => s.id !== id));
    setDeleting(null);
  };

  const toggleActive = async (s: HeroSlide) => {
    await fetch(`/api/admin/hero-slides/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, isActive: !s.isActive }),
    });
    setSlides((p) => p.map((x) => x.id === s.id ? { ...x, isActive: !x.isActive } : x));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Hero Slides</h1>
          <p className="text-sm text-gray-500 mt-0.5">{slides.length} slide{slides.length !== 1 ? "s" : ""} — displayed in homepage hero carousel</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ background: "var(--color-primary)" }}>
          <Plus className="h-4 w-4" /> Add Slide
        </button>
      </div>

      {/* Slides list */}
      {slides.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-16 flex flex-col items-center gap-4">
          <ImageIcon className="h-12 w-12 text-gray-300" />
          <p className="text-gray-500 text-sm">No hero slides yet. Add your first slide.</p>
          <button onClick={openAdd}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--color-primary)" }}>
            <Plus className="h-4 w-4 inline mr-1.5" />Add Slide
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((s) => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-4 flex gap-4 items-center shadow-sm">
              {/* Thumbnail */}
              <div className="relative shrink-0 w-24 h-14 rounded-lg overflow-hidden"
                style={{ background: s.imageUrl ? undefined : s.bgColor }}>
                {s.imageUrl
                  ? <SmartImage src={s.imageUrl} alt={s.tag} fill objectFit="cover" />
                  : <div className="w-full h-full" style={{ background: s.imageBg || s.bgColor }} />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gold)" }}>{s.tag}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${s.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.isActive ? "Active" : "Hidden"}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{s.heading.replace(/\n/g, " ")}</p>
                <p className="text-xs text-gray-500 truncate">{s.subtext}</p>
              </div>

              {/* Order badge */}
              <span className="text-xs text-gray-400 font-medium tabular-nums">#{s.sortOrder}</span>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActive(s)}
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  title={s.isActive ? "Hide" : "Show"}>
                  {s.isActive ? <Eye className="h-4 w-4 text-gray-400" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                </button>
                <button onClick={() => openEdit(s)}
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Pencil className="h-4 w-4 text-gray-400" />
                </button>
                <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                  {deleting === s.id
                    ? <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                    : <Trash2 className="h-4 w-4 text-red-400" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{modal === "add" ? "Add Hero Slide" : "Edit Hero Slide"}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slide Image *</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative cursor-pointer border-2 border-dashed border-gray-200 rounded-xl overflow-hidden transition-colors hover:border-primary"
                  style={{ height: 180 }}>
                  {preview
                    ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                        <Upload className="h-8 w-8" />
                        <span className="text-sm">Click to upload image</span>
                      </div>}
                  {uploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-primary)" }} />
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                {uploadError && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg text-xs font-body mt-1.5" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{uploadError}</span>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">Auto-converted to WebP · Or enter a URL below</p>
                <input value={form.imageUrl} onChange={(e) => { set("imageUrl")(e.target.value); setPreview(e.target.value || null); }}
                  className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="https://..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Background Video URL (optional)</label>
                <input value={form.videoUrl} onChange={(e) => set("videoUrl")(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="https://... .mp4" />
                <p className="text-xs text-gray-400 mt-1">When set, this video plays instead of the image above (muted, looping).</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tag</label>
                  <input value={form.tag} onChange={(e) => set("tag")(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="New Season" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder")(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Heading</label>
                <textarea value={form.heading} onChange={(e) => set("heading")(e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                  placeholder="The Art of\nKanjivaram Silk (use \n for line break)" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtext</label>
                <textarea value={form.subtext} onChange={(e) => set("subtext")(e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                  placeholder="Handwoven in the looms of Tamil Nadu..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary CTA Label</label>
                  <input value={form.ctaLabel} onChange={(e) => set("ctaLabel")(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="Explore Collection" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary CTA Link</label>
                  <input value={form.ctaHref} onChange={(e) => set("ctaHref")(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="/shop" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Secondary CTA Label</label>
                  <input value={form.ctaSecLabel} onChange={(e) => set("ctaSecLabel")(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="View Lookbook" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Secondary CTA Link</label>
                  <input value={form.ctaSecHref} onChange={(e) => set("ctaSecHref")(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="/about" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Background Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={form.bgColor} onChange={(e) => set("bgColor")(e.target.value)}
                      className="h-10 w-12 rounded border border-gray-200 cursor-pointer p-0.5" />
                    <input value={form.bgColor} onChange={(e) => set("bgColor")(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      placeholder="#F2EBE0" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Image Panel Gradient</label>
                  <input value={form.imageBg} onChange={(e) => set("imageBg")(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="linear-gradient(135deg, #D4A76A, #8B4513)" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => set("isActive")(!form.isActive)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${form.isActive ? "bg-green-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? "left-4.5 translate-x-0" : "left-0.5"}`} />
                </button>
                <span className="text-sm text-gray-700">{form.isActive ? "Active (visible on homepage)" : "Hidden"}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2 border-t border-gray-100">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
                style={{ background: "var(--color-primary)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving…" : "Save Slide"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
