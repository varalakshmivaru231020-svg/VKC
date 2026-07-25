"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, EyeOff, Pencil, Trash2, X, Save, Loader2, Upload, ImageIcon, AlertCircle } from "lucide-react";
import { uploadImageFile } from "@/lib/utils/upload";
import { SmartImage } from "@/components/ui/SmartImage";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  position: string;
  bannerType: string;
  sortOrder: number;
  isActive: boolean;
}

const POSITIONS: Record<string, string> = {
  home_hero:       "Home — Hero",
  home_mid:        "Home — Mid Section",
  home_bottom:     "Home — Bottom",
  category_top:    "Category — Top",
  category_banner: "Category — Banner",
  shop_top:        "Shop — Top",
  shop_banner:     "Shop — Banner",
  about_banner:    "Our Story — Banner",
};

const BANNER_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  PROMOTIONAL:  { label: "Promotional",   color: "#7C3AED", bg: "#EDE9FE" },
  SEASONAL:     { label: "Seasonal",      color: "#0369A1", bg: "#E0F2FE" },
  SALE:         { label: "Sale / Offer",  color: "#DC2626", bg: "#FEE2E2" },
  CATEGORY:     { label: "Category",      color: "#059669", bg: "#D1FAE5" },
  BRAND:        { label: "Brand",         color: "#D97706", bg: "#FEF3C7" },
  ANNOUNCEMENT: { label: "Announcement",  color: "#374151", bg: "#F3F4F6" },
  CUSTOM:       { label: "Custom",        color: "#6B7280", bg: "#F9FAFB" },
};

const emptyForm = () => ({
  title: "", subtitle: "", imageUrl: "", mobileImageUrl: "", linkUrl: "",
  position: "", bannerType: "PROMOTIONAL", sortOrder: "0", isActive: true,
});

interface Props { banners: Banner[] }

export default function BannersClient({ banners: initial }: Props) {
  const router = useRouter();
  const [banners, setBanners] = useState(initial);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [preview, setPreview]              = useState<string | null>(null);
  const [previewMobile, setPreviewMobile]  = useState<string | null>(null);
  const [uploading, setUploading]          = useState<"desktop" | "mobile" | null>(null);
  const [uploadError, setUploadError]      = useState<string | null>(null);
  const fileRef       = useRef<HTMLInputElement>(null);
  const fileRefMobile = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (v: any) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setForm(emptyForm());
    setPreview(null);
    setPreviewMobile(null);
    setEditTarget(null);
    setModal("add");
  };

  const openEdit = (b: Banner) => {
    setForm({
      title: b.title, subtitle: b.subtitle ?? "", imageUrl: b.imageUrl,
      mobileImageUrl: b.mobileImageUrl ?? "", linkUrl: b.linkUrl ?? "",
      position: b.position, bannerType: b.bannerType ?? "PROMOTIONAL",
      sortOrder: String(b.sortOrder), isActive: b.isActive,
    });
    setPreview(b.imageUrl);
    setPreviewMobile(b.mobileImageUrl ?? null);
    setEditTarget(b);
    setModal("edit");
  };

  const handleUpload = (variant: "desktop" | "mobile") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const localUrl = URL.createObjectURL(file);
    if (variant === "desktop") setPreview(localUrl); else setPreviewMobile(localUrl);
    setUploading(variant);
    const result = await uploadImageFile(file);
    setUploading(null);
    if (!result.ok) {
      setUploadError(`${result.error} — ${result.details}`);
      if (variant === "desktop") setPreview(null); else setPreviewMobile(null);
      return;
    }
    if (variant === "desktop") {
      setForm((f) => ({ ...f, imageUrl: result.url }));
      setPreview(result.url);
    } else {
      setForm((f) => ({ ...f, mobileImageUrl: result.url }));
      setPreviewMobile(result.url);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert("Title is required"); return; }
    if (!form.imageUrl.trim()) { alert("Image is required"); return; }
    if (!form.position.trim()) { alert("Position is required"); return; }
    setSaving(true);
    try {
      const url = modal === "edit" ? `/api/admin/banners/${editTarget!.id}` : "/api/admin/banners";
      const method = modal === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved: Banner = await res.json();
      if (modal === "edit") {
        setBanners((prev) => prev.map((b) => b.id === saved.id ? saved : b));
      } else {
        setBanners((prev) => [...prev, saved]);
      }
      setModal(null);
      router.refresh();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b: Banner) => {
    if (!confirm(`Delete banner "${b.title}"?`)) return;
    setDeleting(b.id);
    try {
      const res = await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setBanners((p) => p.filter((x) => x.id !== b.id));
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

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Banners</h1>
            <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Manage banners across the storefront
            </p>
          </div>
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-body font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--color-primary)", color: "white" }}>
            <Plus className="h-4 w-4" /> Add Banner
          </button>
        </div>

        {/* Position guide */}
        <div className="p-4 rounded-xl border" style={{ background: "var(--color-primary-50)", borderColor: "var(--color-primary)" }}>
          <p className="text-sm font-body font-semibold mb-2" style={{ color: "var(--color-primary)" }}>Banner Positions</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(POSITIONS).map(([key, label]) => (
              <span key={key} className="px-2.5 py-1 text-xs font-body rounded-full"
                style={{ background: "white", color: "var(--color-primary)", border: "1px solid var(--color-primary)" }}>
                <code className="font-mono text-[10px] mr-1.5 opacity-60">{key}</code>{label}
              </span>
            ))}
          </div>
        </div>

        {banners.length === 0 ? (
          <div className="rounded-xl border p-16 flex flex-col items-center text-center gap-3"
            style={{ borderColor: "#E5E7EB", background: "white" }}>
            <ImageIcon className="h-12 w-12" style={{ color: "#D1D5DB" }} />
            <div>
              <p className="text-sm font-body font-semibold" style={{ color: "#111827" }}>No banners yet</p>
              <p className="text-xs font-body mt-1" style={{ color: "#9CA3AF" }}>
                Add banners to display promotions across your store
              </p>
            </div>
            <button onClick={openAdd}
              className="px-4 py-2 rounded-lg text-sm font-body font-medium transition-opacity hover:opacity-90"
              style={{ background: "var(--color-primary)", color: "white" }}>
              <Plus className="h-4 w-4 inline mr-1.5" />Add First Banner
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner) => (
              <div key={banner.id}
                className="flex gap-4 p-4 rounded-xl border items-center"
                style={{ background: "white", borderColor: "#E5E7EB", opacity: banner.isActive ? 1 : 0.65 }}>
                <div className="relative w-36 h-20 rounded-lg overflow-hidden shrink-0"
                  style={{ background: "#F9FAFB" }}>
                  {banner.imageUrl
                    ? <SmartImage src={banner.imageUrl} alt={banner.title} fill objectFit="cover" />
                    : <ImageIcon className="h-6 w-6 m-auto mt-7" style={{ color: "#D1D5DB" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold font-body" style={{ color: "#111827" }}>{banner.title}</p>
                  {banner.subtitle && (
                    <p className="text-xs font-body line-clamp-1 mt-0.5" style={{ color: "#9CA3AF" }}>{banner.subtitle}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs font-body px-2 py-0.5 rounded-full"
                      style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
                      {POSITIONS[banner.position] ?? banner.position}
                    </span>
                    {banner.bannerType && BANNER_TYPES[banner.bannerType] && (
                      <span className="text-xs font-body px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: BANNER_TYPES[banner.bannerType].bg,
                          color: BANNER_TYPES[banner.bannerType].color,
                        }}>
                        {BANNER_TYPES[banner.bannerType].label}
                      </span>
                    )}
                    {banner.linkUrl && (
                      <span className="text-xs font-body truncate max-w-[200px]" style={{ color: "#9CA3AF" }}>
                        → {banner.linkUrl}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 text-xs font-body font-semibold"
                    style={{ color: banner.isActive ? "#059669" : "#9CA3AF" }}>
                    {banner.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {banner.isActive ? "Active" : "Hidden"}
                  </span>
                  <button onClick={() => openEdit(banner)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-blue-50"
                    style={{ borderColor: "#E5E7EB" }} title="Edit">
                    <Pencil className="h-3.5 w-3.5" style={{ color: "#3B82F6" }} />
                  </button>
                  <button onClick={() => handleDelete(banner)} disabled={deleting === banner.id}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-red-50"
                    style={{ borderColor: "#E5E7EB" }} title="Delete">
                    {deleting === banner.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#EF4444" }} />
                      : <Trash2 className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl my-4" style={{ background: "white" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
              <h2 className="text-base font-semibold font-body" style={{ color: "#111827" }}>
                {modal === "add" ? "Add Banner" : `Edit: ${editTarget?.title}`}
              </h2>
              <button onClick={() => setModal(null)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" style={{ color: "#6B7280" }} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Title *</label>
                <input value={form.title} onChange={(e) => set("title")(e.target.value)} placeholder="e.g. New Kanjivaram Collection"
                  className="w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none transition-all"
                  style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} {...focusStyle} />
              </div>

              {/* Subtitle */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Subtitle</label>
                <input value={form.subtitle} onChange={(e) => set("subtitle")(e.target.value)} placeholder="Supporting tagline"
                  className="w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none transition-all"
                  style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} {...focusStyle} />
              </div>

              {/* Desktop image */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Desktop Image *</label>
                <p className="text-[11px] font-body" style={{ color: "#6B7280" }}>Wide aspect (e.g. 1600×600). Used on desktop and tablet.</p>
                {preview && (
                  <div className="w-full h-32 rounded-lg overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button onClick={() => { setUploadError(null); fileRef.current?.click(); }} disabled={uploading != null}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium font-body transition-colors hover:bg-gray-50"
                    style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                    {uploading === "desktop" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploading === "desktop" ? "Uploading…" : "Upload Desktop Image"}
                  </button>
                  <p className="text-[10px] font-body" style={{ color: "#9CA3AF" }}>Auto-converted to WebP</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload("desktop")} />
              </div>

              {/* Mobile image (also used by app) */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Mobile / App Image</label>
                <p className="text-[11px] font-body" style={{ color: "#6B7280" }}>Square or portrait (e.g. 1080×1080). Falls back to desktop image if not set.</p>
                {previewMobile && (
                  <div className="w-40 h-40 rounded-lg overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
                    <img src={previewMobile} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button onClick={() => { setUploadError(null); fileRefMobile.current?.click(); }} disabled={uploading != null}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium font-body transition-colors hover:bg-gray-50"
                    style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                    {uploading === "mobile" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploading === "mobile" ? "Uploading…" : "Upload Mobile Image"}
                  </button>
                  {previewMobile && (
                    <button
                      onClick={() => { setForm((f) => ({ ...f, mobileImageUrl: "" })); setPreviewMobile(null); }}
                      className="text-xs font-body underline"
                      style={{ color: "#DC2626" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input ref={fileRefMobile} type="file" accept="image/*" className="hidden" onChange={handleUpload("mobile")} />
              </div>

              {uploadError && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg text-xs font-body" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Position */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Position *</label>
                <select value={form.position} onChange={(e) => set("position")(e.target.value)}
                  className="w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none transition-all appearance-none"
                  style={{
                    borderColor: "#E5E7EB", background: "white", color: form.position ? "#111827" : "#9CA3AF",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", backgroundSize: "16px",
                  }} {...focusStyle}>
                  <option value="">Select position</option>
                  {Object.entries(POSITIONS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Banner Type */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Banner Type</label>
                <select value={form.bannerType} onChange={(e) => set("bannerType")(e.target.value)}
                  className="w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none transition-all appearance-none"
                  style={{
                    borderColor: "#E5E7EB", background: "white", color: "#111827",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", backgroundSize: "16px",
                  }} {...focusStyle}>
                  {Object.entries(BANNER_TYPES).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>Used to categorize and filter banners by campaign type</p>
              </div>

              {/* Link URL */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Link URL</label>
                <input value={form.linkUrl} onChange={(e) => set("linkUrl")(e.target.value)} placeholder="/shop or /category/silk-sarees"
                  className="w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none transition-all"
                  style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} {...focusStyle} />
              </div>

              {/* Sort Order + Active */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder")(e.target.value)}
                    className="w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none transition-all"
                    style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} {...focusStyle} />
                </div>
                <div className="flex flex-col justify-end pb-0.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => set("isActive")(!form.isActive)}
                      className="relative w-10 h-6 rounded-full transition-all cursor-pointer"
                      style={{ background: form.isActive ? "var(--color-primary)" : "#D1D5DB" }}>
                      <div className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all"
                        style={{ left: form.isActive ? "calc(100% - 18px)" : "2px" }} />
                    </div>
                    <span className="text-sm font-medium font-body" style={{ color: "#374151" }}>
                      {form.isActive ? "Active" : "Hidden"}
                    </span>
                  </label>
                </div>
              </div>
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
                {saving ? "Saving…" : modal === "add" ? "Create Banner" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
