"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, Upload, X, Loader2, Video } from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { uploadImageFile } from "@/lib/utils/upload";

interface VariantImage {
  url: string;
  file?: File;
  uploading?: boolean;
  error?: string;
}

interface Variant {
  id?: string;
  colorName: string;
  colorHex: string;
  sareeCode: string;
  costPrice: string;
  salePrice: string;
  originalPrice: string;
  stockQty: string;
  images: VariantImage[];
}

interface AttributeDef {
  id: string;
  name: string;
  inputType: string;
  options: string[];
  sortOrder: number;
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  shortDesc: string | null;
  careInstructions: string | null;
  gstPercent: number | string;
  sareeLengthCm: number | null;
  categoryId: string | null;
  isFeatured: boolean;
  isActive: boolean;
  videoUrl: string | null;
  preBookingMode?: "OFF" | "AUTO_ON_OUT_OF_STOCK" | "ALWAYS_ON";
  preBookingEtaMinDays?: number | null;
  preBookingEtaMaxDays?: number | null;
  preBookingMaxQtyPerOrder?: number | null;
  preBookingMaxTotalQty?: number | null;
  preBookingDisclaimer?: string | null;
  preBookingReturnsAllowed?: boolean;
  productAttributes?: { attributeId: string; values: string[] }[];
  variants: {
    id: string;
    colorName: string;
    colorHex: string;
    sareeCode: string | null;
    costPrice: number;
    salePrice: number;
    originalPrice: number;
    stockQty: number;
    images: { url: string; isPrimary: boolean; sortOrder: number }[];
  }[];
}

interface Props {
  product: ProductData;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
        <h2 className="text-sm font-semibold font-body" style={{ color: "#111827" }}>{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required, hint, as: As = "input", rows }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; hint?: string;
  as?: "input" | "textarea"; rows?: number;
}) {
  const cls = "w-full px-4 border rounded-lg text-sm font-body focus:outline-none transition-all";
  const style = { borderColor: "#E5E7EB", background: "white", color: "#111827" };
  const focusFns = {
    onFocus: (e: React.FocusEvent<any>) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)"; },
    onBlur: (e: React.FocusEvent<any>) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; },
  };
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
        {label}{required && <span className="ml-1" style={{ color: "var(--color-error)" }}>*</span>}
      </label>
      {As === "textarea"
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows ?? 3} className={cls + " py-3 resize-y"} style={style} {...focusFns} />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls + " h-10"} style={style} {...focusFns} />
      }
      {hint && <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>{hint}</p>}
    </div>
  );
}

function SelectOpt({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none transition-all appearance-none"
        style={{
          borderColor: "#E5E7EB", background: "white", color: value ? "#111827" : "#9CA3AF",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", backgroundSize: "16px",
        }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function VariantImageUpload({ images, onAdd, onReplace, onRemove }: {
  images: VariantImage[];
  onAdd: (img: VariantImage) => void;
  onReplace: (oldUrl: string, img: VariantImage) => void;
  onRemove: (idx: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const blobUrl = URL.createObjectURL(file);
      onAdd({ url: blobUrl, file, uploading: true });
      try {
        const result = await uploadImageFile(file);
        if (result.ok) {
          onReplace(blobUrl, { url: result.url, uploading: false });
        } else {
          onReplace(blobUrl, { url: blobUrl, uploading: false, error: `${result.error} — ${result.details}` });
        }
      } catch {
        onReplace(blobUrl, { url: blobUrl, uploading: false, error: "Upload failed" });
      }
    }
  };

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative w-20 h-24 rounded-lg overflow-hidden border"
              style={{ borderColor: img.error ? "#FCA5A5" : "#E5E7EB" }}>
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              {img.uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
              )}
              {img.error && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center" title={img.error}>
                  <span className="text-[9px] text-red-700 text-center px-1 font-body">Failed</span>
                </div>
              )}
              {!img.uploading && (
                <button type="button" onClick={() => onRemove(idx)}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center shadow">
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
              {idx === 0 && !img.uploading && !img.error && (
                <div className="absolute bottom-0 inset-x-0 bg-black/50 py-0.5">
                  <p className="text-[9px] text-white text-center font-body font-semibold">Primary</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div
        className="flex flex-col items-center justify-center gap-2 py-5 rounded-lg border-2 border-dashed cursor-pointer transition-all"
        style={{ borderColor: dragging ? "var(--color-primary)" : "#D1D5DB", background: dragging ? "var(--color-primary-50)" : "#F9FAFB" }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}>
        <Upload className="h-5 w-5" style={{ color: dragging ? "var(--color-primary)" : "#9CA3AF" }} />
        <p className="text-xs font-body text-center" style={{ color: "#6B7280" }}>
          <span className="font-semibold" style={{ color: "var(--color-primary)" }}>Click to upload</span> or drag & drop<br />
          JPG, PNG, WebP · Max 5MB
        </p>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
        onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}

export default function EditProductClient({ product }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [shortDesc, setShortDesc] = useState(product.shortDesc ?? "");
  const [careInstructions, setCareInstructions] = useState(product.careInstructions ?? "");
  const [gstPercent, setGstPercent] = useState(String(product.gstPercent ?? "5"));
  const [sareeLengthM, setSareeLengthM] = useState(String((product.sareeLengthCm ?? 560) / 100));
  const [categoryId, setCategoryId] = useState(product.categoryId ?? "");
  const [categories, setCategories] = useState<Array<{ id: string; name: string; parentId?: string | null }>>([]);
  const [isFeatured, setIsFeatured] = useState(product.isFeatured);
  const [isActive, setIsActive] = useState(product.isActive);
  const [preBookingMode, setPreBookingMode] = useState<"OFF" | "AUTO_ON_OUT_OF_STOCK" | "ALWAYS_ON">(product.preBookingMode ?? "OFF");
  const [preBookingEtaMinDays, setPreBookingEtaMinDays] = useState(product.preBookingEtaMinDays != null ? String(product.preBookingEtaMinDays) : "");
  const [preBookingEtaMaxDays, setPreBookingEtaMaxDays] = useState(product.preBookingEtaMaxDays != null ? String(product.preBookingEtaMaxDays) : "");
  const [preBookingMaxQtyPerOrder, setPreBookingMaxQtyPerOrder] = useState(product.preBookingMaxQtyPerOrder != null ? String(product.preBookingMaxQtyPerOrder) : "");
  const [preBookingMaxTotalQty, setPreBookingMaxTotalQty] = useState(product.preBookingMaxTotalQty != null ? String(product.preBookingMaxTotalQty) : "");
  const [preBookingDisclaimer, setPreBookingDisclaimer] = useState(product.preBookingDisclaimer ?? "");
  const [preBookingReturnsAllowed, setPreBookingReturnsAllowed] = useState(product.preBookingReturnsAllowed ?? true);
  const [videoUrl, setVideoUrl] = useState(product.videoUrl ?? "");
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoError, setVideoError] = useState("");
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Dynamic attributes
  const [attributeDefs, setAttributeDefs] = useState<AttributeDef[]>([]);
  const [attrValues, setAttrValues] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    (product.productAttributes ?? []).forEach((pa) => { map[pa.attributeId] = pa.values; });
    return map;
  });

  useEffect(() => {
    fetch("/api/admin/attributes")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAttributeDefs(data.filter((a: any) => a.isActive)); })
      .catch(() => {});

    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.categories ?? []);
        setCategories(list.filter((c: any) => c.isActive !== false));
      })
      .catch(() => {});
  }, []);

  const [variants, setVariants] = useState<Variant[]>(
    product.variants.map((v) => ({
      id: v.id,
      colorName: v.colorName,
      colorHex: v.colorHex,
      sareeCode: v.sareeCode ?? "",
      costPrice: String(v.costPrice),
      salePrice: String(v.salePrice),
      originalPrice: String(v.originalPrice),
      stockQty: String(v.stockQty),
      images: v.images.map((img) => ({ url: img.url })),
    }))
  );

  const updateVariant = (i: number, field: keyof Variant, value: any) =>
    setVariants((p) => p.map((v, idx) => idx === i ? { ...v, [field]: value } : v));

  const addImage = (variantIdx: number, img: VariantImage) =>
    setVariants((p) => p.map((v, idx) => idx === variantIdx
      ? { ...v, images: [...v.images, img] }
      : v
    ));

  const replaceImage = (variantIdx: number, oldUrl: string, img: VariantImage) =>
    setVariants((p) => p.map((v, idx) => idx === variantIdx
      ? { ...v, images: v.images.map((im) => im.url === oldUrl ? img : im) }
      : v
    ));

  const removeImage = (variantIdx: number, imgIdx: number) =>
    setVariants((p) => p.map((v, idx) => idx === variantIdx
      ? { ...v, images: v.images.filter((_, ii) => ii !== imgIdx) }
      : v
    ));

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith("video/")) { setVideoError("Only video files allowed"); return; }
    if (file.size > 100 * 1024 * 1024) { setVideoError("Video too large (max 100MB)"); return; }
    setVideoUploading(true);
    setVideoError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/admin/upload-video", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) { setVideoUrl(data.url); }
      else { setVideoError(data.error ?? "Upload failed"); }
    } catch {
      setVideoError("Upload failed");
    } finally {
      setVideoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { alert("Product name is required"); return; }
    if (variants.some((v) => !v.colorName || !v.salePrice)) {
      alert("Each variant needs a colour name and sale price"); return;
    }
    if (preBookingEtaMinDays && preBookingEtaMaxDays && Number(preBookingEtaMinDays) > Number(preBookingEtaMaxDays)) {
      alert("Pre-Booking: maximum ETA days must be greater than or equal to minimum"); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, description, shortDesc, careInstructions, isFeatured, isActive, videoUrl,
          gstPercent: gstPercent === "" ? 5 : Number(gstPercent),
          sareeLengthCm: Math.round((sareeLengthM === "" ? 5.6 : Number(sareeLengthM)) * 100),
          categoryId: categoryId || null,
          preBookingMode,
          preBookingEtaMinDays: preBookingEtaMinDays === "" ? null : Number(preBookingEtaMinDays),
          preBookingEtaMaxDays: preBookingEtaMaxDays === "" ? null : Number(preBookingEtaMaxDays),
          preBookingMaxQtyPerOrder: preBookingMaxQtyPerOrder === "" ? null : Number(preBookingMaxQtyPerOrder),
          preBookingMaxTotalQty: preBookingMaxTotalQty === "" ? null : Number(preBookingMaxTotalQty),
          preBookingDisclaimer: preBookingDisclaimer.trim() || null,
          preBookingReturnsAllowed,
          productAttributes: Object.entries(attrValues)
            .filter(([, vals]) => vals.length > 0)
            .map(([attributeId, values]) => ({ attributeId, values })),
          variants: variants.map((v) => ({
            ...v,
            imageUrls: v.images.filter((i) => !i.uploading && !i.error).map((i) => i.url),
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div onClick={() => onChange(!value)}
        className="relative w-10 h-6 rounded-full transition-all cursor-pointer shrink-0"
        style={{ background: value ? "var(--color-primary)" : "#D1D5DB" }}>
        <div className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all"
          style={{ left: value ? "calc(100% - 18px)" : "2px" }} />
      </div>
      <span className="text-sm font-body" style={{ color: "#374151" }}>{label}</span>
    </label>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/products"
            className="h-9 w-9 flex items-center justify-center rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E5E7EB" }}>
            <ArrowLeft className="h-4 w-4" style={{ color: "#6B7280" }} />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-body" style={{ color: "#111827" }}>Edit Product</h1>
            <p className="text-sm font-body mt-0.5" style={{ color: "#6B7280" }}>{product.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/products"
            className="px-4 py-2 rounded-lg border text-sm font-medium font-body transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E5E7EB", color: "#374151" }}>
            Cancel
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold font-body flex items-center gap-2 transition-all disabled:opacity-60"
            style={{ background: "var(--color-primary)", color: "white" }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <SectionCard title="Basic Information">
        <div className="space-y-4">
          <Field label="Product Name" value={name} onChange={setName} required placeholder="e.g. Kanjivaram Silk Saree with Zari Border" />
          <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Short Description</label>
            <RichTextEditor value={shortDesc} onChange={setShortDesc} placeholder="One-line summary for listing pages" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Full Description</label>
            <RichTextEditor value={description} onChange={setDescription} placeholder="Detailed description, craftsmanship, materials…" />
          </div>
        </div>
      </SectionCard>

      {/* Product Details — dynamic attributes */}
      <SectionCard title="Product Details">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-4">
            <Toggle value={isFeatured} onChange={setIsFeatured} label="Mark as Featured" />
            <Toggle value={isActive} onChange={setIsActive} label="Active (visible on store)" />
          </div>

          {attributeDefs.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor: "#E5E7EB" }}>
              <p className="text-sm font-body" style={{ color: "#9CA3AF" }}>
                No attributes defined yet. Go to <strong>Settings → Attributes</strong> to add product attributes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {attributeDefs.map((attr) => {
                const vals = attrValues[attr.id] ?? [];
                const setVals = (v: string[]) => setAttrValues((prev) => ({ ...prev, [attr.id]: v }));

                if (attr.inputType === "TEXT") {
                  return (
                    <div key={attr.id} className="space-y-1.5">
                      <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>{attr.name}</label>
                      <input
                        value={vals[0] ?? ""}
                        onChange={(e) => setVals(e.target.value ? [e.target.value] : [])}
                        className="w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none"
                        style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }}
                      />
                    </div>
                  );
                }

                if (attr.inputType === "SINGLE") {
                  return (
                    <div key={attr.id} className="space-y-1.5">
                      <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>{attr.name}</label>
                      <select
                        value={vals[0] ?? ""}
                        onChange={(e) => setVals(e.target.value ? [e.target.value] : [])}
                        className="w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none appearance-none"
                        style={{ borderColor: "#E5E7EB", background: "white", color: vals[0] ? "#111827" : "#9CA3AF" }}>
                        <option value="">Select {attr.name}</option>
                        {attr.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  );
                }

                // MULTI
                return (
                  <div key={attr.id} className="space-y-2">
                    <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>{attr.name}</label>
                    <div className="flex flex-wrap gap-2">
                      {attr.options.map((o) => {
                        const selected = vals.includes(o);
                        return (
                          <button key={o} type="button"
                            onClick={() => setVals(selected ? vals.filter((x) => x !== o) : [...vals, o])}
                            className="px-3 py-1.5 rounded-full text-xs font-medium font-body border transition-all"
                            style={selected
                              ? { background: "var(--color-primary)", color: "white", borderColor: "var(--color-primary)" }
                              : { background: "white", color: "#6B7280", borderColor: "#E5E7EB" }}>
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Pre-Booking */}
      <SectionCard title="Pre-Booking">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium font-body mb-2" style={{ color: "#374151" }}>Mode</label>
            <div className="flex flex-wrap gap-4">
              {([
                ["OFF", "Off"],
                ["AUTO_ON_OUT_OF_STOCK", "Auto — when out of stock"],
                ["ALWAYS_ON", "Always on"],
              ] as const).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer select-none">
                  <div onClick={() => setPreBookingMode(value)}
                    className="relative w-10 h-6 rounded-full transition-all cursor-pointer shrink-0"
                    style={{ background: preBookingMode === value ? "var(--color-primary)" : "#D1D5DB" }}>
                    <div className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all"
                      style={{ left: preBookingMode === value ? "calc(100% - 18px)" : "2px" }} />
                  </div>
                  <span className="text-sm font-body" style={{ color: "#374151" }}>{label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs font-body mt-2" style={{ color: "#9CA3AF" }}>
              Auto shows a "Pre-Book Now" option in place of "Out of Stock" once a colour's stock reaches zero. Always on lets customers pre-book regardless of stock — for made-to-order or upcoming items.
            </p>
          </div>

          {preBookingMode !== "OFF" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold font-body" style={{ color: "#374151" }}>ETA — min days</label>
                  <input type="number" min={0} value={preBookingEtaMinDays} onChange={(e) => setPreBookingEtaMinDays(e.target.value)}
                    placeholder="15" className="w-full h-9 px-3 border rounded-lg text-sm font-body focus:outline-none"
                    style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold font-body" style={{ color: "#374151" }}>ETA — max days</label>
                  <input type="number" min={0} value={preBookingEtaMaxDays} onChange={(e) => setPreBookingEtaMaxDays(e.target.value)}
                    placeholder="25" className="w-full h-9 px-3 border rounded-lg text-sm font-body focus:outline-none"
                    style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold font-body" style={{ color: "#374151" }}>Max qty per order</label>
                  <input type="number" min={1} value={preBookingMaxQtyPerOrder} onChange={(e) => setPreBookingMaxQtyPerOrder(e.target.value)}
                    placeholder="Unlimited" className="w-full h-9 px-3 border rounded-lg text-sm font-body focus:outline-none"
                    style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold font-body" style={{ color: "#374151" }}>Max total capacity</label>
                  <input type="number" min={1} value={preBookingMaxTotalQty} onChange={(e) => setPreBookingMaxTotalQty(e.target.value)}
                    placeholder="Unlimited" className="w-full h-9 px-3 border rounded-lg text-sm font-body focus:outline-none"
                    style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} />
                </div>
              </div>
              <p className="text-xs font-body -mt-2" style={{ color: "#9CA3AF" }}>
                Max total capacity caps how many units of this colour can be pre-booked in total — leave blank for unlimited.
              </p>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
                  Customer-facing disclaimer <span className="font-normal" style={{ color: "#9CA3AF" }}>(optional)</span>
                </label>
                <textarea value={preBookingDisclaimer} onChange={(e) => setPreBookingDisclaimer(e.target.value)}
                  rows={2} placeholder="e.g. Handwoven to order by our Kanchipuram weaver partners."
                  className="w-full px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none resize-y"
                  style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} />
                <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>Shown on the product page next to the Pre-Book button.</p>
              </div>

              <Toggle value={preBookingReturnsAllowed} onChange={setPreBookingReturnsAllowed} label="Returns allowed after delivery" />
            </>
          )}
        </div>
      </SectionCard>

      {/* Specifications */}
      <SectionCard title="Specifications">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
            Saree Length (m)
          </label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={sareeLengthM}
            onChange={(e) => setSareeLengthM(e.target.value)}
            placeholder="5.6"
            className="w-full max-w-[160px] px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none"
            style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }}
          />
          <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>
            Shown in Product Details on the product page. Defaults to 5.6m if left blank.
          </p>
        </div>
      </SectionCard>

      {/* Product Video */}
      <SectionCard title="Product Video">
        <div className="space-y-3">
          <p className="text-xs font-body" style={{ color: "#6B7280" }}>
            Upload a draping or showcase video for this product. Shown on the product detail page. MP4, WebM or MOV · Max 100MB
          </p>

          {videoUrl ? (
            <div className="space-y-2">
              <video
                src={videoUrl}
                controls
                className="w-full rounded-lg border"
                style={{ maxHeight: 280, borderColor: "#E5E7EB", background: "#000" }}
              />
              <button
                type="button"
                onClick={() => { setVideoUrl(""); if (videoInputRef.current) videoInputRef.current.value = ""; }}
                className="flex items-center gap-1.5 text-xs font-medium font-body px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-50"
                style={{ borderColor: "#FECACA", color: "#EF4444" }}>
                <X className="h-3 w-3" /> Remove video
              </button>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-3 py-8 rounded-lg border-2 border-dashed cursor-pointer transition-all"
              style={{
                borderColor: videoUploading ? "var(--color-primary)" : "#D1D5DB",
                background: videoUploading ? "var(--color-primary-50)" : "#F9FAFB",
              }}
              onClick={() => !videoUploading && videoInputRef.current?.click()}>
              {videoUploading
                ? <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
                : <Video className="h-6 w-6" style={{ color: "#9CA3AF" }} />}
              <p className="text-xs font-body text-center" style={{ color: "#6B7280" }}>
                {videoUploading
                  ? "Uploading…"
                  : <><span className="font-semibold" style={{ color: "var(--color-primary)" }}>Click to upload</span> or drag & drop</>}
              </p>
            </div>
          )}

          {videoError && <p className="text-xs font-body" style={{ color: "#EF4444" }}>{videoError}</p>}

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); }}
          />
        </div>
      </SectionCard>

      {/* Care Instructions */}
      <SectionCard title="Care Instructions">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
            Product-specific Care Instructions <span className="font-normal" style={{ color: "#9CA3AF" }}>(optional)</span>
          </label>
          <textarea
            value={careInstructions}
            onChange={(e) => setCareInstructions(e.target.value)}
            rows={4}
            placeholder="Dry clean recommended. Store in a cool, dry place. Avoid direct sunlight. Handle embellishments with care."
            className="w-full px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none resize-y"
            style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }}
          />
          <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>
            Shown on this product's page. Leave blank to fall back to the store-wide default set in Settings → Product Page.
          </p>
        </div>
      </SectionCard>

      {/* GST */}
      <SectionCard title="GST (Tax)">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
            GST Rate (%)
          </label>
          <input
            type="number"
            min={0}
            max={28}
            step={0.01}
            value={gstPercent}
            onChange={(e) => setGstPercent(e.target.value)}
            placeholder="5"
            className="w-full max-w-[160px] px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none"
            style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }}
          />
          <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>
            Applied to this product's price (which is treated as GST-inclusive) and shown on the product page, cart and checkout GST breakup.
          </p>
        </div>
      </SectionCard>

      {/* Variants */}
      <SectionCard title={`Colour Variants (${variants.length})`}>
        <div className="space-y-5">
          {variants.map((v, i) => (
            <div key={v.id ?? i} className="rounded-xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ background: v.colorHex, boxShadow: "0 0 0 1px #E5E7EB" }} />
                  <span className="text-sm font-semibold font-body" style={{ color: "#111827" }}>
                    {v.colorName || `Variant ${i + 1}`}
                  </span>
                </div>
                {variants.length > 1 && (
                  <button onClick={() => setVariants((p) => p.filter((_, idx) => idx !== i))}
                    className="h-7 w-7 flex items-center justify-center rounded-lg border transition-colors hover:bg-red-50"
                    style={{ borderColor: "#FECACA" }}>
                    <Trash2 className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />
                  </button>
                )}
              </div>

              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold font-body" style={{ color: "#374151" }}>Colour Name *</label>
                    <input value={v.colorName} onChange={(e) => updateVariant(i, "colorName", e.target.value)}
                      placeholder="e.g. Ruby Red"
                      className="w-full h-9 px-3 border rounded-lg text-sm font-body focus:outline-none transition-all"
                      style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold font-body" style={{ color: "#374151" }}>Colour</label>
                    <div className="flex items-center gap-2 h-9">
                      <input type="color" value={v.colorHex} onChange={(e) => updateVariant(i, "colorHex", e.target.value)}
                        className="h-9 w-12 border rounded-lg cursor-pointer p-0.5" style={{ borderColor: "#E5E7EB" }} />
                      <input value={v.colorHex} onChange={(e) => updateVariant(i, "colorHex", e.target.value)}
                        className="flex-1 h-9 px-3 border rounded-lg text-xs font-mono focus:outline-none"
                        style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold font-body" style={{ color: "#374151" }}>Saree Code</label>
                    <input value={v.sareeCode} onChange={(e) => updateVariant(i, "sareeCode", e.target.value.toUpperCase())}
                      placeholder="KNJ-001-R" className="w-full h-9 px-3 border rounded-lg text-sm font-mono focus:outline-none uppercase"
                      style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold font-body" style={{ color: "#374151" }}>Cost Price (₹)</label>
                    <input type="number" value={v.costPrice} onChange={(e) => updateVariant(i, "costPrice", e.target.value)}
                      placeholder="0" className="w-full h-9 px-3 border rounded-lg text-sm font-body focus:outline-none"
                      style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold font-body" style={{ color: "#374151" }}>Sale Price (₹) *</label>
                    <input type="number" value={v.salePrice} onChange={(e) => updateVariant(i, "salePrice", e.target.value)}
                      placeholder="0" className="w-full h-9 px-3 border rounded-lg text-sm font-body focus:outline-none"
                      style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold font-body" style={{ color: "#374151" }}>MRP / Original (₹)</label>
                    <input type="number" value={v.originalPrice} onChange={(e) => updateVariant(i, "originalPrice", e.target.value)}
                      placeholder="Leave blank if no discount"
                      className="w-full h-9 px-3 border rounded-lg text-sm font-body focus:outline-none"
                      style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold font-body" style={{ color: "#374151" }}>Stock Qty</label>
                    <input type="number" value={v.stockQty} onChange={(e) => updateVariant(i, "stockQty", e.target.value)}
                      min={0} className="w-full h-9 px-3 border rounded-lg text-sm font-body focus:outline-none"
                      style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold font-body" style={{ color: "#374151" }}>
                    Images — <span className="font-normal" style={{ color: "#9CA3AF" }}>First image = primary.</span>
                  </label>
                  <VariantImageUpload
                    images={v.images}
                    onAdd={(img) => addImage(i, img)}
                    onReplace={(oldUrl, img) => replaceImage(i, oldUrl, img)}
                    onRemove={(imgIdx) => removeImage(i, imgIdx)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => setVariants((p) => [...p, { colorName: "", colorHex: "#8B1A2E", sareeCode: "", costPrice: "", salePrice: "", originalPrice: "", stockQty: "1", images: [] }])}
            className="w-full py-3.5 rounded-xl border-2 border-dashed text-sm font-semibold font-body flex items-center justify-center gap-2 transition-colors hover:bg-gray-50"
            style={{ borderColor: "#D1D5DB", color: "#6B7280" }}>
            <Plus className="h-4 w-4" /> Add Another Colour Variant
          </button>
        </div>
      </SectionCard>

      <div className="flex items-center justify-end gap-3 pb-4">
        <Link href="/admin/products"
          className="px-5 py-2.5 rounded-lg border text-sm font-medium font-body transition-colors hover:bg-gray-50"
          style={{ borderColor: "#E5E7EB", color: "#374151" }}>
          Cancel
        </Link>
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold font-body flex items-center gap-2 transition-all disabled:opacity-60"
          style={{ background: "var(--color-primary)", color: "white" }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function CategorySelect({
  categories, value, onChange,
}: {
  categories: Array<{ id: string; name: string; parentId?: string | null }>;
  value: string;
  onChange: (id: string) => void;
}) {
  const byParent: Record<string, typeof categories> = {};
  for (const c of categories) {
    const k = c.parentId ?? "ROOT";
    (byParent[k] ||= []).push(c);
  }
  const ordered: Array<{ id: string; name: string; depth: number }> = [];
  const walk = (parentId: string, depth: number) => {
    for (const c of byParent[parentId] ?? []) {
      ordered.push({ id: c.id, name: c.name, depth });
      walk(c.id, depth + 1);
    }
  };
  walk("ROOT", 0);
  if (ordered.length === 0) {
    for (const c of categories) ordered.push({ id: c.id, name: c.name, depth: 0 });
  }
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Category</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none transition-all appearance-none"
        style={{
          borderColor: "#E5E7EB",
          background: "white",
          color: value ? "#111827" : "#9CA3AF",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          backgroundSize: "16px",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)"; }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <option value="">— No category —</option>
        {ordered.map(({ id, name, depth }) => (
          <option key={id} value={id}>{"  ".repeat(depth) + (depth > 0 ? "└ " : "") + name}</option>
        ))}
      </select>
    </div>
  );
}
