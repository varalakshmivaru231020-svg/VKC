"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe, Tag, Sliders, Bell, Save, Check, Plus, Trash2, GripVertical,
  ImageIcon, Upload, Share2, CreditCard, MessageSquare, BarChart2,
  Truck, RotateCcw, MapPin, Users, Shield, Package, Settings,
  ChevronRight, ChevronUp, ChevronDown, Eye, EyeOff, Edit2, X, AlertCircle,
  Navigation, Loader2, LayoutGrid, List, Link2,
} from "lucide-react";
import type { ProductOptions } from "@/lib/db/product-options";
import { uploadImageFile } from "@/lib/utils/upload";
import { SmartImage } from "@/components/ui/SmartImage";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props { options: ProductOptions }

type TabId =
  | "general" | "navigation" | "homepage" | "about" | "footer" | "options" | "attributes" | "productpage" | "shipping"
  | "social" | "payments" | "sms" | "analytics"
  | "returns" | "notifications" | "roles";

const tabs: { id: TabId; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "general",       label: "General",         icon: Globe,         desc: "Store name, logo & contact" },
  { id: "navigation",    label: "Header Nav",       icon: Navigation,    desc: "Header menu & category order" },
  { id: "homepage",      label: "Homepage",         icon: LayoutGrid,    desc: "Shop by Category section" },
  { id: "about",         label: "About Page",       icon: Globe,         desc: "About Us & home heritage block" },
  { id: "footer",        label: "Footer Links",     icon: List,          desc: "Shop, Help & Account footer links" },
  { id: "options",       label: "Product Options",  icon: Tag,           desc: "Types, varieties, regions" },
  { id: "attributes",   label: "Attributes",       icon: Sliders,       desc: "Dynamic product attributes" },
  { id: "productpage",  label: "Product Page",     icon: Package,       desc: "Care & delivery instructions" },
  { id: "shipping",     label: "Domestic Shipping",     icon: Truck,  desc: "Per-item rates & free shipping" },
  { id: "returns",      label: "Returns & Cancel",  icon: RotateCcw,     desc: "Policy, reasons & periods" },
  { id: "social",       label: "Social Links",      icon: Share2,        desc: "Instagram, Facebook & more" },
  { id: "payments",     label: "Payment Gateway",   icon: CreditCard,    desc: "Razorpay, COD & keys" },
  { id: "sms",          label: "SMS / WhatsApp",    icon: MessageSquare, desc: "Twilio, MSG91, WA API" },
  { id: "analytics",    label: "Analytics & SEO",   icon: BarChart2,     desc: "GA4, Tag Manager, meta" },
  { id: "notifications",label: "Notifications",     icon: Bell,          desc: "Announcement bar & maintenance" },
  { id: "roles",        label: "Roles & Users",     icon: Users,         desc: "Manage admin users" },
];

type AttrType = "DROPDOWN" | "TEXT" | "MULTISELECT";
interface Attribute { id: string; name: string; type: AttrType; values: string; required: boolean; }

const inputCls = "w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none transition-all";
const inputStyle = { borderColor: "#E5E7EB", background: "white", color: "#111827" };
const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--color-primary)";
    e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)";
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#E5E7EB";
    e.currentTarget.style.boxShadow = "none";
  },
};

function SectionCard({ title, icon: Icon, children, action }: {
  title: string; icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
      <div className="px-6 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: "#6B7280" }} />
          <h2 className="text-sm font-semibold font-body" style={{ color: "#111827" }}>{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function SaveButton({ saved, loading, onClick }: { saved: boolean; loading?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold font-body transition-all disabled:opacity-60"
      style={{ background: saved ? "var(--color-success)" : "var(--color-primary)", color: "white" }}
    >
      {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
      {loading ? "Saving…" : saved ? "Saved!" : "Save Changes"}
    </button>
  );
}

function SecretInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls + " pr-10"}
        style={inputStyle}
        {...focusProps}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: "#9CA3AF" }}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ─────────────── GENERAL ─────────────── */
function GeneralTab() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    store_name: "", tagline: "", support_email: "", support_phone: "",
    store_address: "", store_city: "", store_gst: "", currency_symbol: "₹", currency_code: "INR",
    return_address: "",
    whatsapp_number: "",
    store_hours_weekday: "Mon–Sat: 10 AM – 7 PM",
    store_hours_weekend: "Sun: Closed",
    store_maps_url: "",
  });

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then(({ settings }) => {
      if (!settings) return;
      if (settings.store_logo) setLogoPreview(settings.store_logo);
      setForm((f) => ({
        ...f,
        store_name:          settings.store_name          ?? f.store_name,
        tagline:             settings.tagline             ?? f.tagline,
        support_email:       settings.store_email         ?? f.support_email,
        support_phone:       settings.store_phone         ?? f.support_phone,
        store_address:       settings.store_address       ?? f.store_address,
        store_city:          settings.store_city          ?? f.store_city,
        store_gst:           settings.store_gst           ?? f.store_gst,
        currency_symbol:     settings.currency_symbol     ?? f.currency_symbol,
        currency_code:       settings.currency_code       ?? f.currency_code,
        return_address:      settings.return_address      ?? f.return_address,
        whatsapp_number:     settings.whatsapp_number     ?? f.whatsapp_number,
        store_hours_weekday: settings.store_hours_weekday ?? f.store_hours_weekday,
        store_hours_weekend: settings.store_hours_weekend ?? f.store_hours_weekend,
        store_maps_url:      settings.store_maps_url      ?? f.store_maps_url,
      }));
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setLogoUploadError(null);
    let logoUrl: string | undefined;
    if (logoFile) {
      const result = await uploadImageFile(logoFile);
      if (!result.ok) {
        setLogoUploadError(`${result.error} — ${result.details}`);
        setLoading(false);
        return;
      }
      logoUrl = result.url;
      setLogoPreview(result.url);
      setLogoFile(null);
    }
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_name:          form.store_name,
        tagline:             form.tagline,
        store_email:         form.support_email,
        store_phone:         form.support_phone,
        store_address:       form.store_address,
        store_city:          form.store_city,
        store_gst:           form.store_gst,
        currency_symbol:     form.currency_symbol,
        currency_code:       form.currency_code,
        return_address:      form.return_address,
        whatsapp_number:     form.whatsapp_number,
        store_hours_weekday: form.store_hours_weekday,
        store_hours_weekend: form.store_hours_weekend,
        store_maps_url:      form.store_maps_url,
        ...(logoUrl ? { store_logo: logoUrl } : {}),
      }),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const u = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <SectionCard title="Store Logo" icon={ImageIcon}>
        <div className="flex items-start gap-6 flex-wrap">
          <div
            className="w-36 h-20 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 cursor-pointer overflow-hidden"
            style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}
            onClick={() => fileRef.current?.click()}
          >
            {logoPreview
              ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
              : <div className="text-center"><ImageIcon className="h-6 w-6 mx-auto mb-1" style={{ color: "#D1D5DB" }} /><p className="text-[10px] font-body" style={{ color: "#9CA3AF" }}>No logo</p></div>}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-sm font-medium font-body" style={{ color: "#374151" }}>Upload Store Logo</p>
            <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>PNG or SVG · Max 2 MB · Min 200×80px</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return;
                setLogoFile(f);
                const r = new FileReader();
                r.onload = (ev) => setLogoPreview(ev.target?.result as string);
                r.readAsDataURL(f);
              }} />
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium font-body hover:bg-gray-50"
                style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                <Upload className="h-4 w-4" /> Choose File
              </button>
              {logoFile && <span className="text-xs font-body truncate" style={{ color: "#6B7280" }}>{logoFile.name}</span>}
              {logoPreview && <button onClick={() => { setLogoPreview(null); setLogoFile(null); }} className="text-xs font-body" style={{ color: "var(--color-error)" }}>Remove</button>}
            </div>
            {logoUploadError && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg text-xs font-body mt-2" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{logoUploadError}</span>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Store Information" icon={Globe}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([
            { label: "Store Name", key: "store_name" as const, placeholder: "vkcgoldikshu" },
            { label: "Tagline", key: "tagline" as const, placeholder: "Sweetness of Nature, Strength of Tradition." },
            { label: "Support Email", key: "support_email" as const, placeholder: "care@yourstore.in" },
            { label: "Support Phone", key: "support_phone" as const, placeholder: "+91 98765 43210" },
            { label: "WhatsApp Number", key: "whatsapp_number" as const, placeholder: "+919876543210" },
            { label: "GST Number", key: "store_gst" as const, placeholder: "22AAAAA0000A1Z5" },
            { label: "Currency Symbol", key: "currency_symbol" as const, placeholder: "₹" },
          ]).map(({ label, key, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>{label}</label>
              <input value={form[key]} onChange={u(key)} placeholder={placeholder} className={inputCls} style={inputStyle} {...focusProps} />
            </div>
          ))}
        </div>
        <p className="text-[11px] font-body mt-3" style={{ color: "#9CA3AF" }}>
          WhatsApp number appears in the footer, header, and contact page. Use international format (e.g. +919876543210).
        </p>
      </SectionCard>

      <SectionCard title="Store Address & Hours" icon={MapPin}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Street Address</label>
              <textarea value={form.store_address} onChange={u("store_address")} rows={2}
                placeholder="123 Main Street, Near Temple"
                className="w-full px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none resize-none"
                style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} {...focusProps} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>City</label>
              <input value={form.store_city} onChange={u("store_city")} placeholder="Chennai" className={inputCls} style={inputStyle} {...focusProps} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Weekday Hours</label>
              <input value={form.store_hours_weekday} onChange={u("store_hours_weekday")} placeholder="Mon–Sat: 10 AM – 7 PM" className={inputCls} style={inputStyle} {...focusProps} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Weekend Hours</label>
              <input value={form.store_hours_weekend} onChange={u("store_hours_weekend")} placeholder="Sun: Closed" className={inputCls} style={inputStyle} {...focusProps} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Google Maps URL</label>
              <input value={form.store_maps_url} onChange={u("store_maps_url")} placeholder="https://maps.google.com/..." className={inputCls} style={inputStyle} {...focusProps} />
            </div>
          </div>
          <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>
            Address, city, hours, and Maps URL are shown on the Contact page.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Return / Dispatch Address" icon={RotateCcw}>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Return Address (shown on invoices)</label>
          <textarea value={form.return_address} onChange={u("return_address")} rows={3}
            placeholder="Warehouse address for returns"
            className="w-full px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none resize-none"
            style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} {...focusProps} />
        </div>
      </SectionCard>

      <div className="flex justify-end"><SaveButton saved={saved} loading={loading} onClick={handleSave} /></div>
    </div>
  );
}

/* ─────────────── PRODUCT OPTIONS ─────────────── */
function OptionsTab({ options }: { options: ProductOptions }) {
  const [opts, setOpts] = useState({
    fabrics: options.fabrics.join(", "),
    weaves: options.weaves.join(", "),
    regions: options.regions.join(", "),
    occasions: options.occasions.join(", "),
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/options", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(opts) });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Product Options" icon={Tag}>
        <div className="space-y-4">
          <p className="text-sm font-body" style={{ color: "#6B7280" }}>Separate items with commas. These populate dropdowns in the product form.</p>
          {([
            { key: "fabrics" as const, label: "Types", hint: "Cane Jaggery, Palm Jaggery, Coconut Jaggery…" },
            { key: "weaves" as const, label: "Varieties", hint: "Block, Powder, Cubes…" },
            { key: "regions" as const, label: "Regions of Origin", hint: "Mandya, Karnataka…" },
            { key: "occasions" as const, label: "Uses", hint: "Daily Use, Festive Sweets, Gifting…" },
          ]).map(({ key, label, hint }) => (
            <div key={key} className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>{label}</label>
              <textarea value={opts[key]} onChange={(e) => setOpts((o) => ({ ...o, [key]: e.target.value }))} rows={2}
                placeholder={hint}
                className="w-full px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none resize-none"
                style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} {...focusProps} />
            </div>
          ))}
        </div>
      </SectionCard>
      <div className="flex justify-end"><SaveButton saved={saved} loading={loading} onClick={handleSave} /></div>
    </div>
  );
}

/* ─────────────── TAG INPUT ─────────────── */
function TagInput({ tags, onChange, placeholder = "Type and press Enter or comma…" }: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const val = raw.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput("");
  };

  const remove = (i: number) => onChange(tags.filter((_, idx) => idx !== i));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(input);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      remove(tags.length - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.endsWith(",")) {
      commit(val.slice(0, -1));
    } else {
      setInput(val);
    }
  };

  return (
    <div
      className="min-h-[42px] px-2.5 py-2 border rounded-lg flex flex-wrap gap-1.5 items-center cursor-text transition-all"
      style={{
        borderColor: focused ? "var(--color-primary)" : "#E5E7EB",
        boxShadow: focused ? "0 0 0 3px var(--color-primary-50)" : "none",
        background: "white",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-md text-xs font-body font-medium"
          style={{ background: "var(--color-primary-50)", color: "var(--color-primary)", border: "1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)" }}
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); remove(i); }}
            className="h-4 w-4 rounded flex items-center justify-center hover:bg-red-100 transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); if (input.trim()) commit(input); }}
        placeholder={tags.length === 0 ? placeholder : "Add more…"}
        className="flex-1 min-w-[140px] h-7 text-sm font-body focus:outline-none bg-transparent"
        style={{ color: "#111827" }}
      />
    </div>
  );
}

/* ─────────────── ATTRIBUTES ─────────────── */
interface AttrRow {
  id: string; name: string; imageUrl: string; inputType: string;
  options: string[]; optionImages: string[]; sortOrder: number; isActive: boolean;
}

async function uploadAttrImage(file: File): Promise<string> {
  const result = await uploadImageFile(file);
  if (!result.ok) throw new Error(`${result.error} — ${result.details}`);
  return result.url;
}

function AttributesTab() {
  const [attrs, setAttrs] = useState<AttrRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState<string | null>(null); // attrId or `${attrId}:${optIdx}`
  const [uploadImgError, setUploadImgError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/attributes").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setAttrs(d.map((a: any) => ({ ...a, imageUrl: a.imageUrl ?? "", optionImages: a.optionImages ?? [] })));
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const addAttr = async () => {
    const res = await fetch("/api/admin/attributes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Attribute", inputType: "SINGLE", options: [], optionImages: [], imageUrl: null, sortOrder: attrs.length }),
    });
    const data = await res.json();
    if (res.ok) setAttrs(prev => [...prev, { ...data, imageUrl: data.imageUrl ?? "", optionImages: data.optionImages ?? [] }]);
  };

  const update = (id: string, field: keyof AttrRow, value: any) =>
    setAttrs(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));

  const save = async (attr: AttrRow) => {
    setSaving(attr.id);
    await fetch(`/api/admin/attributes/${attr.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: attr.name, inputType: attr.inputType,
        options: attr.options, optionImages: attr.optionImages,
        imageUrl: attr.imageUrl || null,
        sortOrder: attr.sortOrder, isActive: attr.isActive,
      }),
    });
    setSaving(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this attribute? Product values will be lost.")) return;
    await fetch(`/api/admin/attributes/${id}`, { method: "DELETE" });
    setAttrs(prev => prev.filter(a => a.id !== id));
  };

  const handleAttrImageUpload = async (attrId: string, file: File) => {
    setUploadingImg(attrId);
    setUploadImgError(null);
    try {
      const url = await uploadAttrImage(file);
      update(attrId, "imageUrl", url);
    } catch (e: any) { setUploadImgError(e.message ?? "Upload failed"); }
    setUploadingImg(null);
  };

  const handleOptionImageUpload = async (attrId: string, optIdx: number, file: File) => {
    const key = `${attrId}:${optIdx}`;
    setUploadingImg(key);
    setUploadImgError(null);
    try {
      const url = await uploadAttrImage(file);
      setAttrs(prev => prev.map(a => {
        if (a.id !== attrId) return a;
        const imgs = [...a.optionImages];
        while (imgs.length <= optIdx) imgs.push("");
        imgs[optIdx] = url;
        return { ...a, optionImages: imgs };
      }));
    } catch (e: any) { setUploadImgError(e.message ?? "Upload failed"); }
    setUploadingImg(null);
  };

  const removeOptionImage = (attrId: string, optIdx: number) => {
    setAttrs(prev => prev.map(a => {
      if (a.id !== attrId) return a;
      const imgs = [...a.optionImages];
      imgs[optIdx] = "";
      return { ...a, optionImages: imgs };
    }));
  };

  const handleOptionsChange = (attrId: string, newOpts: string[]) => {
    setAttrs(prev => prev.map(a => {
      if (a.id !== attrId) return a;
      // Re-map images by matching option value so removals from the middle don't shift images
      const newImages = newOpts.map(opt => {
        const oldIdx = a.options.indexOf(opt);
        return oldIdx >= 0 ? (a.optionImages[oldIdx] ?? "") : "";
      });
      return { ...a, options: newOpts, optionImages: newImages };
    }));
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Product Attribute Master" icon={Sliders}
        action={
          <button type="button" onClick={addAttr}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body"
            style={{ background: "var(--color-primary)", color: "white" }}>
            <Plus className="h-3.5 w-3.5" /> Add Attribute
          </button>
        }
      >
        <p className="text-xs font-body mb-4" style={{ color: "#6B7280" }}>
          Define attributes for the product form. <strong>Single</strong> = dropdown, <strong>Multi</strong> = pill toggle, <strong>Text</strong> = free input. You can add an image for each attribute and each option value.
        </p>
        {uploadImgError && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg text-xs font-body mb-3" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{uploadImgError}</span>
          </div>
        )}
        {loading ? (
          <div className="py-10 text-center">
            <div className="inline-block h-5 w-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <div className="space-y-4">
            {attrs.length === 0 && (
              <div className="text-center py-10" style={{ color: "#9CA3AF" }}>
                <Sliders className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-body">No attributes yet. Click "Add Attribute" to create one.</p>
              </div>
            )}
            {attrs.map((attr) => (
              <div key={attr.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
                {/* Attribute header row */}
                <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
                  {/* Attribute image */}
                  <div className="shrink-0">
                    <label className="block text-[10px] font-semibold uppercase tracking-wide font-body mb-1" style={{ color: "#9CA3AF" }}>Icon</label>
                    <label className="cursor-pointer block">
                      <div className="relative w-10 h-10 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden"
                        style={{ borderColor: "#D1D5DB", background: "white" }}>
                        {uploadingImg === attr.id
                          ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-primary)" }} />
                          : attr.imageUrl
                            ? <SmartImage src={attr.imageUrl} alt="" fill objectFit="cover" />
                            : <ImageIcon className="h-4 w-4" style={{ color: "#D1D5DB" }} />}
                      </div>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAttrImageUpload(attr.id, f); }} />
                    </label>
                    {attr.imageUrl && (
                      <button type="button" onClick={() => update(attr.id, "imageUrl", "")}
                        className="text-[9px] font-body mt-0.5 block" style={{ color: "#EF4444" }}>Remove</button>
                    )}
                  </div>

                  <input value={attr.name} onChange={(e) => update(attr.id, "name", e.target.value)}
                    placeholder="Attribute name (e.g. Fabric)" className="flex-1 h-9 px-3 border rounded-lg text-sm font-body focus:outline-none"
                    style={inputStyle} {...focusProps} />

                  <select value={attr.inputType} onChange={(e) => update(attr.id, "inputType", e.target.value)}
                    className="w-32 h-9 px-3 border rounded-lg text-sm font-body focus:outline-none appearance-none" style={inputStyle}>
                    <option value="SINGLE">Single</option>
                    <option value="MULTI">Multi</option>
                    <option value="TEXT">Text</option>
                  </select>

                  <input type="number" value={attr.sortOrder} onChange={(e) => update(attr.id, "sortOrder", Number(e.target.value))}
                    className="w-14 h-9 px-2 border rounded-lg text-sm font-body focus:outline-none text-center" style={inputStyle} title="Sort order" />

                  <div className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none" onClick={() => update(attr.id, "isActive", !attr.isActive)}>
                    <div className="relative w-8 h-4 rounded-full transition-colors"
                      style={{ background: attr.isActive ? "var(--color-primary)" : "#D1D5DB" }}>
                      <div className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-all"
                        style={{ left: attr.isActive ? "17px" : "2px" }} />
                    </div>
                    <span className="text-[11px] font-body" style={{ color: "#6B7280" }}>Active</span>
                  </div>

                  <button type="button" onClick={() => save(attr)} disabled={saving === attr.id}
                    className="h-8 px-3 rounded-lg text-xs font-semibold font-body flex items-center gap-1 shrink-0"
                    style={{ background: "var(--color-primary)", color: "white", opacity: saving === attr.id ? 0.6 : 1 }}>
                    {saving === attr.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                  </button>
                  <button type="button" onClick={() => remove(attr.id)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 shrink-0" style={{ color: "#EF4444" }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Options with per-option images */}
                {attr.inputType !== "TEXT" && (
                  <div className="p-4 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-semibold uppercase tracking-wide font-body" style={{ color: "#9CA3AF" }}>
                          Options
                        </label>
                        {attr.options.length > 0 && (
                          <span className="text-[10px] font-body" style={{ color: "#9CA3AF" }}>
                            {attr.options.length} value{attr.options.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <TagInput
                        tags={attr.options}
                        onChange={(newOpts) => handleOptionsChange(attr.id, newOpts)}
                        placeholder="e.g. Silk, Cotton, Georgette — press Enter or comma to add"
                      />
                      <p className="text-[10px] font-body" style={{ color: "#B0B7C3" }}>
                        Press <kbd className="px-1 py-0.5 rounded text-[9px] font-mono" style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}>Enter</kbd> or <kbd className="px-1 py-0.5 rounded text-[9px] font-mono" style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}>,</kbd> to add · <kbd className="px-1 py-0.5 rounded text-[9px] font-mono" style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}>⌫</kbd> to remove last
                      </p>
                    </div>

                    {attr.options.length > 0 && (
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wide font-body mb-2" style={{ color: "#9CA3AF" }}>Option Images (optional)</label>
                        <div className="flex flex-wrap gap-3">
                          {attr.options.map((opt, optIdx) => {
                            const imgUrl = attr.optionImages[optIdx] ?? "";
                            const uploadKey = `${attr.id}:${optIdx}`;
                            return (
                              <div key={optIdx} className="flex flex-col items-center gap-1">
                                <label className="cursor-pointer block">
                                  <div className="w-14 h-14 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden relative"
                                    style={{ borderColor: imgUrl ? "var(--color-primary)" : "#D1D5DB", background: "#F9FAFB" }}>
                                    {uploadingImg === uploadKey
                                      ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-primary)" }} />
                                      : imgUrl
                                        ? <SmartImage src={imgUrl} alt={opt} fill objectFit="cover" />
                                        : <ImageIcon className="h-4 w-4" style={{ color: "#D1D5DB" }} />}
                                    {imgUrl && (
                                      <button type="button" onClick={(e) => { e.preventDefault(); removeOptionImage(attr.id, optIdx); }}
                                        className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                                        <X className="h-2.5 w-2.5 text-white" />
                                      </button>
                                    )}
                                  </div>
                                  <input type="file" accept="image/*" className="hidden"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOptionImageUpload(attr.id, optIdx, f); }} />
                                </label>
                                <span className="text-[10px] font-body text-center max-w-[56px] truncate" style={{ color: "#374151" }}>{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      <p className="text-xs font-body text-right" style={{ color: "#9CA3AF" }}>Each attribute has its own Save button. Changes are not auto-saved.</p>
    </div>
  );
}

/* ─────────────── ABOUT PAGE ───────────────
   Drives both the About Us page and the "Our Heritage" block on the home page.
   Everything here was hardcoded until now, so an office address needed a
   developer. Repeating blocks (values cards, offices) are stored as JSON in a
   single setting each, edited through the small repeaters below rather than by
   hand-writing JSON. */

const ABOUT_ICON_CHOICES = ["Heart", "ShieldCheck", "Sparkles", "Globe2"];

interface AboutValueRow { icon: string; title: string; desc: string }
interface AboutOfficeRow { label: string; name: string | null; lines: string[] }

function AboutPageTab() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const [values, setValues] = useState<AboutValueRow[]>([]);
  const [offices, setOffices] = useState<AboutOfficeRow[]>([]);
  const storyFileRef = useRef<HTMLInputElement>(null);
  const [storyUploading, setStoryUploading] = useState(false);
  const [storyUploadError, setStoryUploadError] = useState<string | null>(null);

  const put = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStoryUploadError(null);
    setStoryUploading(true);
    const result = await uploadImageFile(file);
    setStoryUploading(false);
    if (!result.ok) { setStoryUploadError(`${result.error} — ${result.details}`); return; }
    put("about_story_image")(result.url);
  };

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then(({ settings }) => {
      if (!settings) return;
      setF(settings);
      try {
        const v = JSON.parse(settings.about_values_json || "[]");
        if (Array.isArray(v)) setValues(v);
      } catch { /* keep empty; the page falls back to its defaults */ }
      try {
        const o = JSON.parse(settings.about_offices_json || "[]");
        if (Array.isArray(o)) setOffices(o);
      } catch { /* same */ }
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const keys = [
      "about_hero_eyebrow", "about_hero_title", "about_hero_subtitle",
      "about_story_heading", "about_story_body", "about_story_image",
      "about_story_caption_top", "about_story_caption_bottom",
      "about_values_eyebrow", "about_values_heading",
      "about_offices_eyebrow", "about_offices_heading",
      "about_cta_heading", "about_cta_text",
      "about_home_eyebrow", "about_home_heading", "about_home_body",
      "about_home_quote", "about_home_cta_label",
    ];
    const payload: Record<string, string> = {};
    keys.forEach((k) => { payload[k] = f[k] ?? ""; });
    payload.about_values_json  = JSON.stringify(values);
    payload.about_offices_json = JSON.stringify(offices);

    await fetch("/api/admin/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const taStyle = "w-full px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none resize-y";
  const taBase = { borderColor: "#E5E7EB", background: "white", color: "#111827" };
  const Field = ({ label, k, hint }: { label: string; k: string; hint?: string }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>{label}</label>
      <input value={f[k] ?? ""} onChange={(e) => put(k)(e.target.value)} className={inputCls} style={inputStyle} {...focusProps} />
      {hint && <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl text-sm font-body border" style={{ background: "#EFF6FF", borderColor: "#BFDBFE", color: "#1E40AF" }}>
        Leave any field empty to keep the built-in wording for it.
      </div>

      <SectionCard title="About Page — Hero" icon={Globe}>
        <div className="space-y-4">
          <Field label="Eyebrow" k="about_hero_eyebrow" />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Title</label>
            <textarea value={f.about_hero_title ?? ""} onChange={(e) => put("about_hero_title")(e.target.value)} rows={2}
              className={taStyle} style={taBase} {...focusProps} />
            <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>Press Enter for a line break.</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Subtitle</label>
            <textarea value={f.about_hero_subtitle ?? ""} onChange={(e) => put("about_hero_subtitle")(e.target.value)} rows={2}
              className={taStyle} style={taBase} {...focusProps} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="About Page — Story" icon={Globe}>
        <div className="space-y-4">
          <Field label="Heading" k="about_story_heading" />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Body</label>
            <textarea value={f.about_story_body ?? ""} onChange={(e) => put("about_story_body")(e.target.value)} rows={10}
              className={taStyle} style={taBase} {...focusProps} />
            <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>Leave a blank line between paragraphs.</p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Story Image</label>
            <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>
              Used both beside the story text on About Us and in the “Our Heritage” block on the home page.
            </p>
            <div className="flex items-start gap-4">
              <div
                onClick={() => storyFileRef.current?.click()}
                className="relative cursor-pointer rounded-xl border-2 border-dashed overflow-hidden shrink-0 flex items-center justify-center"
                style={{ borderColor: "#E5E7EB", width: 140, height: 175, background: "#FAFAFA" }}>
                {f.about_story_image
                  ? <img src={f.about_story_image} alt="story preview" className="w-full h-full object-cover" />
                  : <span className="text-xs font-body text-center px-2" style={{ color: "#9CA3AF" }}>Click to select an image</span>}
                {storyUploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <span className="text-xs font-body" style={{ color: "#374151" }}>Uploading…</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <button onClick={() => storyFileRef.current?.click()}
                  className="px-4 py-2 rounded-lg border text-sm font-medium font-body" style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                  {f.about_story_image ? "Change image" : "Select image"}
                </button>
                <input value={f.about_story_image ?? ""} onChange={(e) => put("about_story_image")(e.target.value)}
                  placeholder="…or paste an image URL"
                  className={inputCls} style={inputStyle} {...focusProps} />
                {storyUploadError && (
                  <p className="text-xs font-body" style={{ color: "#DC2626" }}>{storyUploadError}</p>
                )}
              </div>
            </div>
            <input ref={storyFileRef} type="file" accept="image/*" className="hidden" onChange={handleStoryUpload} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Image Caption — top line" k="about_story_caption_top" />
            <Field label="Image Caption — bottom line" k="about_story_caption_bottom" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="About Page — Values" icon={Globe} action={
        <button onClick={() => setValues((v) => [...v, { icon: "Heart", title: "", desc: "" }])}
          className="text-xs font-semibold font-body px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E5E7EB", color: "#374151" }}>
          + Add card
        </button>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Eyebrow" k="about_values_eyebrow" />
            <Field label="Heading" k="about_values_heading" />
          </div>
          {values.map((row, i) => (
            <div key={i} className="p-4 rounded-xl border space-y-3" style={{ borderColor: "#E5E7EB", background: "#FAFAFA" }}>
              <div className="flex items-center gap-3">
                <select value={row.icon}
                  onChange={(e) => setValues((v) => v.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))}
                  className={inputCls} style={{ ...inputStyle, width: 160 }}>
                  {ABOUT_ICON_CHOICES.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <input value={row.title} placeholder="Title"
                  onChange={(e) => setValues((v) => v.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                  className={inputCls} style={inputStyle} {...focusProps} />
                <button onClick={() => setValues((v) => v.filter((_, j) => j !== i))}
                  className="shrink-0 px-3 py-2 rounded-lg border text-xs font-medium" style={{ borderColor: "#FECACA", color: "#DC2626" }}>
                  Remove
                </button>
              </div>
              <textarea value={row.desc} rows={2} placeholder="Description"
                onChange={(e) => setValues((v) => v.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))}
                className={taStyle} style={taBase} {...focusProps} />
            </div>
          ))}
          {values.length === 0 && (
            <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>No cards added — the page will show its built-in four.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="About Page — Offices" icon={Globe} action={
        <button onClick={() => setOffices((o) => [...o, { label: "", name: null, lines: [] }])}
          className="text-xs font-semibold font-body px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E5E7EB", color: "#374151" }}>
          + Add office
        </button>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Eyebrow" k="about_offices_eyebrow" />
            <Field label="Heading" k="about_offices_heading" />
          </div>
          {offices.map((row, i) => (
            <div key={i} className="p-4 rounded-xl border space-y-3" style={{ borderColor: "#E5E7EB", background: "#FAFAFA" }}>
              <div className="flex items-center gap-3">
                <input value={row.label} placeholder="Label, e.g. Registered Office"
                  onChange={(e) => setOffices((o) => o.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  className={inputCls} style={inputStyle} {...focusProps} />
                <button onClick={() => setOffices((o) => o.filter((_, j) => j !== i))}
                  className="shrink-0 px-3 py-2 rounded-lg border text-xs font-medium" style={{ borderColor: "#FECACA", color: "#DC2626" }}>
                  Remove
                </button>
              </div>
              <input value={row.name ?? ""} placeholder="Business name (optional)"
                onChange={(e) => setOffices((o) => o.map((x, j) => j === i ? { ...x, name: e.target.value || null } : x))}
                className={inputCls} style={inputStyle} {...focusProps} />
              <textarea value={row.lines.join("\n")} rows={5} placeholder="Address — one line per row"
                onChange={(e) => setOffices((o) => o.map((x, j) => j === i ? { ...x, lines: e.target.value.split("\n") } : x))}
                className={taStyle} style={taBase} {...focusProps} />
            </div>
          ))}
          {offices.length === 0 && (
            <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>No offices added — the page will show its built-in two.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="About Page — Closing Call to Action" icon={Globe}>
        <div className="space-y-4">
          <Field label="Heading" k="about_cta_heading" />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Text</label>
            <textarea value={f.about_cta_text ?? ""} onChange={(e) => put("about_cta_text")(e.target.value)} rows={3}
              className={taStyle} style={taBase} {...focusProps} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Home Page — Our Heritage block" icon={Globe}>
        <div className="space-y-4">
          <Field label="Eyebrow" k="about_home_eyebrow" />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Heading</label>
            <textarea value={f.about_home_heading ?? ""} onChange={(e) => put("about_home_heading")(e.target.value)} rows={2}
              className={taStyle} style={taBase} {...focusProps} />
            <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>Press Enter for a line break.</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Body</label>
            <textarea value={f.about_home_body ?? ""} onChange={(e) => put("about_home_body")(e.target.value)} rows={5}
              className={taStyle} style={taBase} {...focusProps} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Closing line</label>
            <textarea value={f.about_home_quote ?? ""} onChange={(e) => put("about_home_quote")(e.target.value)} rows={2}
              className={taStyle} style={taBase} {...focusProps} />
          </div>
          <Field label="Link label" k="about_home_cta_label" hint="The link always points at /about." />
        </div>
      </SectionCard>

      <div className="flex justify-end"><SaveButton saved={saved} loading={loading} onClick={handleSave} /></div>
    </div>
  );
}

/* ─────────────── PRODUCT PAGE ─────────────── */
function ProductPageTab() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [careInstructions, setCareInstructions] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    "• Free shipping on orders above ₹2,999\n• Standard delivery: 4–7 business days\n• Express delivery available at checkout\n• Easy 15-day returns on unworn items with tags intact\n• Exchange available for different colour of same product"
  );

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(({ settings }) => {
      if (!settings) return;
      if (settings.care_instructions !== undefined) setCareInstructions(settings.care_instructions);
      if (settings.delivery_instructions !== undefined) setDeliveryInstructions(settings.delivery_instructions);
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/admin/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ care_instructions: careInstructions, delivery_instructions: deliveryInstructions }),
    });
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const taStyle = "w-full px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none resize-y";
  const taBase = { borderColor: "#E5E7EB", background: "white", color: "#111827" };

  return (
    <div className="space-y-5">
      <SectionCard title="Default Care Instructions" icon={Package}>
        <p className="text-xs font-body mb-3" style={{ color: "#9CA3AF" }}>
          Shown in the "Care Instructions" section on the product detail page when a product has no specific care instructions set.
        </p>
        <textarea value={careInstructions} onChange={e => setCareInstructions(e.target.value)} rows={4}
          placeholder="Dry clean recommended. Store in a cool, dry place. Avoid direct sunlight. Handle embellishments with care."
          className={taStyle} style={taBase} {...focusProps} />
      </SectionCard>

      <SectionCard title="Shipping & Returns Information" icon={Truck}>
        <p className="text-xs font-body mb-3" style={{ color: "#9CA3AF" }}>
          Shown in the "Shipping & Returns" section on the product detail page. Use bullet points (•) to format as a list.
        </p>
        <textarea value={deliveryInstructions} onChange={e => setDeliveryInstructions(e.target.value)} rows={7}
          placeholder="• Free shipping on orders above ₹2,999&#10;• Standard delivery: 4–7 business days"
          className={taStyle} style={taBase} {...focusProps} />
      </SectionCard>

      <div className="flex justify-end"><SaveButton saved={saved} loading={loading} onClick={handleSave} /></div>
    </div>
  );
}

/* ─────────────── HOMEPAGE ─────────────── */
const HOME_COPY_KEYS = [
  "home_blog_eyebrow", "home_blog_heading", "home_blog_description",
  "home_testimonials_eyebrow", "home_testimonials_heading",
] as const;

function HomepageTab() {
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [copy, setCopy] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const putCopy = (k: string) => (v: string) => setCopy((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then(r => r.json()),
      fetch("/api/admin/settings").then(r => r.json()),
    ]).then(([catData, { settings }]) => {
      setCats(Array.isArray(catData) ? catData.filter((c: any) => c.isActive) : []);
      if (settings?.homepage_category_ids) {
        try { setSelected(JSON.parse(settings.homepage_category_ids)); } catch {}
      }
      if (settings) {
        const next: Record<string, string> = {};
        HOME_COPY_KEYS.forEach((k) => { next[k] = settings[k] ?? ""; });
        setCopy(next);
      }
    }).finally(() => setFetching(false));
  }, []);

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const moveUp = (id: string) => {
    setSelected(prev => {
      const i = prev.indexOf(id);
      if (i <= 0) return prev;
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  };

  const moveDown = (id: string) => {
    setSelected(prev => {
      const i = prev.indexOf(id);
      if (i < 0 || i >= prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    const payload: Record<string, string> = { homepage_category_ids: JSON.stringify(selected) };
    HOME_COPY_KEYS.forEach((k) => { payload[k] = copy[k] ?? ""; });
    await fetch("/api/admin/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const unselected = cats.filter(c => !selected.includes(c.id));
  const selectedCats = selected.map(id => cats.find(c => c.id === id)).filter(Boolean) as { id: string; name: string }[];

  const copyInputCls = "w-full px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none";
  const copyInputStyle = { borderColor: "#E5E7EB", background: "white", color: "#111827" };

  return (
    <div className="space-y-5">
      <SectionCard title="Blog Section — Title & Description" icon={LayoutGrid}>
        <p className="text-sm font-body mb-4" style={{ color: "#6B7280" }}>
          Heading shown above the latest blog posts on the home page. Leave a field empty to use the built-in wording.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Eyebrow</label>
            <input value={copy.home_blog_eyebrow ?? ""} onChange={(e) => putCopy("home_blog_eyebrow")(e.target.value)} placeholder="From the Blog" className={copyInputCls} style={copyInputStyle} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Title</label>
            <input value={copy.home_blog_heading ?? ""} onChange={(e) => putCopy("home_blog_heading")(e.target.value)} placeholder="Stories from the cane fields" className={copyInputCls} style={copyInputStyle} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Description</label>
            <textarea value={copy.home_blog_description ?? ""} onChange={(e) => putCopy("home_blog_description")(e.target.value)} rows={2} placeholder="One or two lines under the title (optional)" className={copyInputCls + " resize-y"} style={copyInputStyle} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Testimonials Section — Title" icon={LayoutGrid}>
        <p className="text-sm font-body mb-4" style={{ color: "#6B7280" }}>
          The testimonials themselves are managed under Admin → Testimonials. These fields only change the section heading.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Eyebrow</label>
            <input value={copy.home_testimonials_eyebrow ?? ""} onChange={(e) => putCopy("home_testimonials_eyebrow")(e.target.value)} placeholder="Customer stories" className={copyInputCls} style={copyInputStyle} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Title</label>
            <input value={copy.home_testimonials_heading ?? ""} onChange={(e) => putCopy("home_testimonials_heading")(e.target.value)} placeholder="What our customers say" className={copyInputCls} style={copyInputStyle} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Shop by Category Section" icon={LayoutGrid}>
        <p className="text-sm font-body mb-5" style={{ color: "#6B7280" }}>
          Pick which categories appear in the "Shop by Category" section on the homepage. Use the arrows to control display order.
        </p>

        {fetching ? (
          <div className="py-10 text-center">
            <div className="inline-block h-5 w-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : cats.length === 0 ? (
          <p className="text-sm font-body text-center py-8" style={{ color: "#9CA3AF" }}>No active categories found. Create categories first.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Available */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide font-body mb-2" style={{ color: "#9CA3AF" }}>
                Available Categories
              </p>
              <div className="space-y-1.5">
                {unselected.length === 0 && (
                  <p className="text-xs font-body py-3 text-center" style={{ color: "#9CA3AF" }}>All categories added</p>
                )}
                {unselected.map(cat => (
                  <button key={cat.id} type="button" onClick={() => toggle(cat.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all hover:border-primary/40 hover:bg-primary-50/30"
                    style={{ borderColor: "#E5E7EB", background: "white" }}>
                    <Plus className="h-3.5 w-3.5 shrink-0" style={{ color: "#9CA3AF" }} />
                    <span className="text-sm font-body font-medium" style={{ color: "#374151" }}>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Selected & ordered */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide font-body mb-2" style={{ color: "#9CA3AF" }}>
                Showing on Homepage <span className="ml-1 text-primary">({selected.length})</span>
              </p>
              <div className="space-y-1.5">
                {selectedCats.length === 0 && (
                  <p className="text-xs font-body py-3 text-center" style={{ color: "#9CA3AF" }}>No categories selected yet</p>
                )}
                {selectedCats.map((cat, i) => (
                  <div key={cat.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
                    style={{ borderColor: "var(--color-primary)", background: "var(--color-primary-50)" }}>
                    <span className="text-xs font-mono font-bold w-5 shrink-0 text-center" style={{ color: "var(--color-primary)" }}>{i + 1}</span>
                    <span className="flex-1 text-sm font-body font-medium truncate" style={{ color: "#374151" }}>{cat.name}</span>
                    <div className="flex items-center gap-0.5">
                      <button type="button" onClick={() => moveUp(cat.id)} disabled={i === 0}
                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/60 disabled:opacity-30 transition-all">
                        <ChevronUp className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                      </button>
                      <button type="button" onClick={() => moveDown(cat.id)} disabled={i === selectedCats.length - 1}
                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/60 disabled:opacity-30 transition-all">
                        <ChevronDown className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                      </button>
                      <button type="button" onClick={() => toggle(cat.id)}
                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-red-100 transition-all ml-1">
                        <X className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <div className="flex justify-end"><SaveButton saved={saved} loading={loading} onClick={handleSave} /></div>
    </div>
  );
}

/* ─────────────── SHIPPING ─────────────── */
function ShippingTab() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    free_shipping_threshold: "2999",
    shipping_first_saree_rate: "100",
    shipping_additional_saree_rate: "50",
    domestic_delivery_title: "Standard Delivery",
    domestic_delivery_notes: "4–7 business days",
  });

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(({ settings }) => {
      if (!settings) return;
      setForm({
        free_shipping_threshold:        settings.free_shipping_threshold        ?? "2999",
        shipping_first_saree_rate:      settings.shipping_first_saree_rate      ?? "100",
        shipping_additional_saree_rate: settings.shipping_additional_saree_rate ?? "50",
        domestic_delivery_title:        settings.domestic_delivery_title        ?? "Standard Delivery",
        domestic_delivery_notes:        settings.domestic_delivery_notes        ?? "4–7 business days",
      });
    });
  }, []);

  const u = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/admin/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const first  = Number(form.shipping_first_saree_rate) || 0;
  const extra  = Number(form.shipping_additional_saree_rate) || 0;

  return (
    <div className="space-y-5">
      <SectionCard title="Free Shipping Threshold" icon={Truck}>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
            Free Shipping on Orders Above (₹)
          </label>
          <input type="number" value={form.free_shipping_threshold} onChange={u("free_shipping_threshold")}
            placeholder="2999" className={inputCls} style={inputStyle} {...focusProps} />
          <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>
            When the cart total reaches this amount, shipping is ₹0 regardless of quantity.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Per-Item Shipping Rates" icon={Package}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
              First Item (₹)
            </label>
            <input type="number" value={form.shipping_first_saree_rate} onChange={u("shipping_first_saree_rate")}
              placeholder="100" className={inputCls} style={inputStyle} {...focusProps} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
              Each Additional Item (₹)
            </label>
            <input type="number" value={form.shipping_additional_saree_rate} onChange={u("shipping_additional_saree_rate")}
              placeholder="50" className={inputCls} style={inputStyle} {...focusProps} />
          </div>
        </div>

        {/* Live preview */}
        <div className="mt-5 rounded-xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
          <div className="px-4 py-2.5 border-b" style={{ background: "#F9FAFB", borderColor: "#E5E7EB" }}>
            <p className="text-[11px] font-semibold font-body uppercase tracking-wide" style={{ color: "#6B7280" }}>
              Shipping Preview
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
            {[1, 2, 3, 4, 5].map((qty) => {
              const cost = first + Math.max(0, qty - 1) * extra;
              return (
                <div key={qty} className="flex items-center justify-between px-4 py-2.5">
                  <p className="text-sm font-body" style={{ color: "#374151" }}>
                    {qty} item{qty > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm font-semibold font-body" style={{ color: "var(--color-primary)" }}>
                    ₹{cost}
                    <span className="text-[10px] font-normal ml-1.5" style={{ color: "#9CA3AF" }}>
                      ({qty === 1 ? `₹${first}` : `₹${first} + ${qty - 1}×₹${extra}`})
                    </span>
                  </p>
                </div>
              );
            })}
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ background: "#F0FDF4" }}>
              <p className="text-sm font-body font-semibold" style={{ color: "#15803D" }}>
                Order ≥ ₹{form.free_shipping_threshold}
              </p>
              <p className="text-sm font-bold" style={{ color: "#15803D" }}>FREE</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Delivery Display" icon={Truck}>
        <p className="text-xs font-body mb-4" style={{ color: "#9CA3AF" }}>
          These labels appear on the checkout page under the delivery option card.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Delivery Title</label>
            <input value={form.domestic_delivery_title} onChange={u("domestic_delivery_title")}
              placeholder="Standard Delivery" className={inputCls} style={inputStyle} {...focusProps} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Delivery Notes</label>
            <input value={form.domestic_delivery_notes} onChange={u("domestic_delivery_notes")}
              placeholder="4–7 business days" className={inputCls} style={inputStyle} {...focusProps} />
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end"><SaveButton saved={saved} loading={loading} onClick={handleSave} /></div>
    </div>
  );
}

/* ─────────────── RETURNS & CANCEL ─────────────── */
function ReturnsTab() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelReasons, setCancelReasons] = useState("Changed my mind\nOrdered by mistake\nFound better price elsewhere\nItem no longer needed\nDelivery time too long");
  const [returnReasons, setReturnReasons] = useState("Item received is damaged\nWrong item delivered\nQuality not as expected\nItem not as described");
  const [returnPeriod, setReturnPeriod] = useState("15");

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(({ settings }) => {
      if (!settings) return;
      setCancelReasons(settings.cancel_reasons ?? cancelReasons);
      setReturnReasons(settings.return_reasons ?? returnReasons);
      setReturnPeriod(settings.return_period_days ?? "15");
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/admin/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancel_reasons: cancelReasons, return_reasons: returnReasons, return_period_days: returnPeriod }),
    });
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const taStyle = "w-full px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none resize-none";
  const taBase = { borderColor: "#E5E7EB", background: "white", color: "#111827" };

  return (
    <div className="space-y-5">
      <SectionCard title="Return Window" icon={RotateCcw}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Return Period (days after delivery)</label>
            <input type="number" value={returnPeriod} onChange={e => setReturnPeriod(e.target.value)}
              className={inputCls} style={inputStyle} {...focusProps} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Cancel Order Reasons" icon={Package}>
        <div className="space-y-1.5">
          <p className="text-xs font-body mb-2" style={{ color: "#9CA3AF" }}>One reason per line. Shown to customers in the cancellation flow.</p>
          <textarea value={cancelReasons} onChange={e => setCancelReasons(e.target.value)} rows={6}
            placeholder="Changed my mind&#10;Ordered by mistake" className={taStyle} style={taBase} {...focusProps} />
        </div>
      </SectionCard>

      <SectionCard title="Return Order Reasons" icon={RotateCcw}>
        <div className="space-y-1.5">
          <p className="text-xs font-body mb-2" style={{ color: "#9CA3AF" }}>One reason per line. Shown to customers in the return flow.</p>
          <textarea value={returnReasons} onChange={e => setReturnReasons(e.target.value)} rows={5}
            placeholder="Item received is damaged&#10;Wrong item delivered" className={taStyle} style={taBase} {...focusProps} />
        </div>
      </SectionCard>

      <div className="flex justify-end"><SaveButton saved={saved} loading={loading} onClick={handleSave} /></div>
    </div>
  );
}

/* ─────────────── SOCIAL ─────────────── */
function SocialTab() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    social_instagram: "", social_facebook: "", social_youtube: "",
    social_twitter: "", social_pinterest: "", social_whatsapp: "",
  });

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(({ settings }) => {
      if (!settings) return;
      setForm(f => ({
        ...f,
        social_instagram: settings.social_instagram ?? "",
        social_facebook: settings.social_facebook ?? "",
        social_youtube: settings.social_youtube ?? "",
        social_twitter: settings.social_twitter ?? "",
        social_pinterest: settings.social_pinterest ?? "",
        social_whatsapp: settings.social_whatsapp ?? "",
      }));
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const u = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <SectionCard title="Social Media Links" icon={Share2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([
            { key: "social_instagram" as const, label: "Instagram", placeholder: "https://instagram.com/yourstore" },
            { key: "social_facebook" as const, label: "Facebook", placeholder: "https://facebook.com/yourstore" },
            { key: "social_youtube" as const, label: "YouTube", placeholder: "https://youtube.com/@yourstore" },
            { key: "social_twitter" as const, label: "Twitter / X", placeholder: "https://x.com/yourstore" },
            { key: "social_pinterest" as const, label: "Pinterest", placeholder: "https://pinterest.com/yourstore" },
            { key: "social_whatsapp" as const, label: "WhatsApp Number", placeholder: "+919876543210" },
          ]).map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>{label}</label>
              <input value={form[key]} onChange={u(key)} placeholder={placeholder} className={inputCls} style={inputStyle} {...focusProps} />
            </div>
          ))}
        </div>
      </SectionCard>
      <div className="flex justify-end"><SaveButton saved={saved} loading={loading} onClick={handleSave} /></div>
    </div>
  );
}

/* ─────────────── PAYMENTS ─────────────── */
function PaymentsTab() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    // Razorpay
    razorpay_enabled: "true",
    razorpay_key_id: "", razorpay_key_secret: "",
    pg_test_mode: "true",
    // Cashfree
    cashfree_enabled: "false",
    cashfree_app_id: "", cashfree_secret_key: "",
    cashfree_test_mode: "true",
    // ICICI PG Direct (Phicommerce) — replaces legacy Eazypay
    icici_pg_enabled:       "false",
    icici_pg_base_url:      "",
    icici_pg_command_url:   "",
    icici_pg_merchant_id:   "",
    icici_pg_aggregator_id: "",
    icici_pg_key:           "",
    icici_pg_return_url:    "",
    icici_pg_allowed_modes: "",
    icici_pg_test_mode:     "true",
    // Payment methods
    cod_enabled: "true",
  });

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(({ settings }) => {
      if (!settings) return;
      setForm(f => ({
        ...f,
        razorpay_enabled:   settings.razorpay_enabled   ?? "true",
        razorpay_key_id:    settings.razorpay_key_id    ?? "",
        razorpay_key_secret: settings.razorpay_key_secret ?? "",
        pg_test_mode:       settings.pg_test_mode       ?? "true",
        cashfree_enabled:   settings.cashfree_enabled   ?? "false",
        cashfree_app_id:    settings.cashfree_app_id    ?? "",
        cashfree_secret_key: settings.cashfree_secret_key ?? "",
        cashfree_test_mode: settings.cashfree_test_mode ?? "true",
        icici_pg_enabled:       settings.icici_pg_enabled       ?? "false",
        icici_pg_base_url:      settings.icici_pg_base_url      ?? "",
        icici_pg_command_url:   settings.icici_pg_command_url   ?? "",
        icici_pg_merchant_id:   settings.icici_pg_merchant_id   ?? "",
        icici_pg_aggregator_id: settings.icici_pg_aggregator_id ?? "",
        icici_pg_key:           settings.icici_pg_key           ?? "",
        icici_pg_return_url:    settings.icici_pg_return_url    ?? "",
        icici_pg_allowed_modes: settings.icici_pg_allowed_modes ?? "",
        icici_pg_test_mode:     settings.icici_pg_test_mode     ?? "true",
        cod_enabled:            settings.cod_enabled            ?? "true",
      }));
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const toggle = (k: keyof typeof form) => setForm(f => ({ ...f, [k]: f[k] === "true" ? "false" : "true" }));

  function Toggle({ k, label }: { k: keyof typeof form; label: string }) {
    const on = form[k] === "true";
    return (
      <label className="flex items-center gap-3 cursor-pointer">
        <div onClick={() => toggle(k)} className="relative w-9 h-5 rounded-full transition-colors cursor-pointer"
          style={{ background: on ? "var(--color-primary)" : "#D1D5DB" }}>
          <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all" style={{ left: on ? "18px" : "2px" }} />
        </div>
        <span className="text-sm font-body" style={{ color: "#374151" }}>{label}</span>
      </label>
    );
  }

  function GatewayBadge({ testKey }: { testKey: keyof typeof form }) {
    const isTest = form[testKey] === "true";
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: isTest ? "#F59E0B" : "#10B981" }} />
        <span className="text-xs font-body font-semibold" style={{ color: isTest ? "#92400E" : "#065F46" }}>
          {isTest ? "Test Mode" : "Live Mode"}
        </span>
      </div>
    );
  }

  /* ICICI PG readiness — mirrors missingIciciPgFields() in lib/api/iciciPg.ts.
     Without this the toggle can be ON with blank credentials, and the customer
     only finds out at "Place Order". */
  const iciciPgTest    = form.icici_pg_test_mode === "true";
  const iciciPgApiRoot = iciciPgTest
    ? "https://pgpayuat.icicibank.com/tsp/pg/api"
    : "https://pgpay.icicibank.com/pg/api";
  const siteOrigin        = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
  const autoIciciReturnUrl = siteOrigin ? `${siteOrigin}/api/web/checkout/icici-pg/return` : "";
  const effectiveIciciReturnUrl = form.icici_pg_return_url.trim() || autoIciciReturnUrl;
  const iciciPgMissing = [
    !form.icici_pg_merchant_id.trim() && "Merchant ID",
    !form.icici_pg_key.trim()         && "Secret Key (HMAC)",
    !effectiveIciciReturnUrl          && "Return URL",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5">

      {/* ── Razorpay ── */}
      <SectionCard title="Razorpay" icon={CreditCard}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <GatewayBadge testKey="pg_test_mode" />
            <Toggle k="razorpay_enabled" label="Enable Razorpay" />
          </div>
          <div className="pt-1 border-t" style={{ borderColor: "#F3F4F6" }}>
            <Toggle k="pg_test_mode" label="Test Mode (use test keys)" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Key ID</label>
              <input value={form.razorpay_key_id}
                onChange={e => setForm(f => ({ ...f, razorpay_key_id: e.target.value }))}
                placeholder="rzp_test_xxxxxxxxxx" className={inputCls} style={inputStyle} {...focusProps} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Key Secret</label>
              <SecretInput value={form.razorpay_key_secret}
                onChange={v => setForm(f => ({ ...f, razorpay_key_secret: v }))}
                placeholder="••••••••••••••" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Cashfree ── */}
      <SectionCard title="Cashfree" icon={CreditCard}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <GatewayBadge testKey="cashfree_test_mode" />
            <Toggle k="cashfree_enabled" label="Enable Cashfree" />
          </div>
          <div className="pt-1 border-t" style={{ borderColor: "#F3F4F6" }}>
            <Toggle k="cashfree_test_mode" label="Test Mode (sandbox)" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>App ID</label>
              <input value={form.cashfree_app_id}
                onChange={e => setForm(f => ({ ...f, cashfree_app_id: e.target.value }))}
                placeholder="Cashfree App ID" className={inputCls} style={inputStyle} {...focusProps} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Secret Key</label>
              <SecretInput value={form.cashfree_secret_key}
                onChange={v => setForm(f => ({ ...f, cashfree_secret_key: v }))}
                placeholder="••••••••••••••" />
            </div>
          </div>
          <p className="text-xs font-body" style={{ color: "#6B7280" }}>
            Get your credentials from the{" "}
            <span className="underline cursor-pointer" style={{ color: "var(--color-primary)" }}>
              Cashfree Merchant Dashboard
            </span>
            . Callback URL: <code className="text-xs bg-gray-100 px-1 rounded">/api/v1/checkout/cashfree/verify</code>
          </p>
        </div>
      </SectionCard>

      {/* ── ICICI PG Direct (Phicommerce v2) — replaces legacy Eazypay ── */}
      <SectionCard title="ICICI PG Direct (Phicommerce)" icon={CreditCard}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <GatewayBadge testKey="icici_pg_test_mode" />
            <Toggle k="icici_pg_enabled" label="Enable ICICI PG" />
          </div>
          <div className="pt-1 border-t" style={{ borderColor: "#F3F4F6" }}>
            <Toggle k="icici_pg_test_mode" label="Test Mode (UAT — pgpayuat URLs)" />
          </div>

          {form.icici_pg_enabled === "true" && iciciPgMissing.length > 0 && (
            <div className="rounded-lg px-3 py-2.5 text-xs font-body"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}>
              <strong>Enabled but not usable.</strong> Still missing: {iciciPgMissing.join(", ")}.
              Until these are filled in, ICICI is hidden from checkout so customers
              aren&apos;t sent down a dead end.
            </div>
          )}
          {form.icici_pg_enabled === "true" && iciciPgMissing.length === 0 && (
            <div className="rounded-lg px-3 py-2.5 text-xs font-body"
              style={{ background: iciciPgTest ? "#FFFBEB" : "#ECFDF5",
                       border: `1px solid ${iciciPgTest ? "#FDE68A" : "#A7F3D0"}`,
                       color:  iciciPgTest ? "#92400E" : "#065F46" }}>
              Live at checkout. Transacting against{" "}
              <code className="px-1 rounded" style={{ background: "rgba(0,0,0,0.05)" }}>
                {form.icici_pg_base_url.trim() || `${iciciPgApiRoot}/v2`}
              </code>
              {iciciPgTest && " — no real money moves in Test Mode."}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Merchant ID</label>
              <input value={form.icici_pg_merchant_id}
                onChange={e => setForm(f => ({ ...f, icici_pg_merchant_id: e.target.value }))}
                placeholder="100000000007164" className={inputCls} style={inputStyle} {...focusProps} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Aggregator ID</label>
              <input value={form.icici_pg_aggregator_id}
                onChange={e => setForm(f => ({ ...f, icici_pg_aggregator_id: e.target.value }))}
                placeholder="A100000000007164" className={inputCls} style={inputStyle} {...focusProps} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Secret Key (HMAC)</label>
            <SecretInput value={form.icici_pg_key}
              onChange={v => setForm(f => ({ ...f, icici_pg_key: v }))}
              placeholder="UUID format secret key" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Return URL (public, customer redirects here)</label>
            <input value={form.icici_pg_return_url}
              onChange={e => setForm(f => ({ ...f, icici_pg_return_url: e.target.value }))}
              placeholder={autoIciciReturnUrl || "https://yoursite.com/api/web/checkout/icici-pg/return"}
              className={inputCls} style={inputStyle} {...focusProps} />
            <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>
              {autoIciciReturnUrl
                ? <>Leave blank to use <code className="bg-gray-100 px-1 rounded">{autoIciciReturnUrl}</code>. This exact URL must also be registered in the ICICI merchant dashboard.</>
                : <>Required — NEXT_PUBLIC_BASE_URL is not set, so it cannot be derived automatically.</>}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Base URL (override)</label>
              <input value={form.icici_pg_base_url}
                onChange={e => setForm(f => ({ ...f, icici_pg_base_url: e.target.value }))}
                placeholder={`${iciciPgApiRoot}/v2`} className={inputCls} style={inputStyle} {...focusProps} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Command URL (override)</label>
              <input value={form.icici_pg_command_url}
                onChange={e => setForm(f => ({ ...f, icici_pg_command_url: e.target.value }))}
                placeholder={`${iciciPgApiRoot}/command`} className={inputCls} style={inputStyle} {...focusProps} />
            </div>
          </div>
          <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>
            Both follow the Test Mode toggle when left blank — only fill these in if ICICI gave you different endpoints.
          </p>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Allowed Payment Modes (optional CSV)</label>
            <input value={form.icici_pg_allowed_modes}
              onChange={e => setForm(f => ({ ...f, icici_pg_allowed_modes: e.target.value }))}
              placeholder="CARD,NB,UPI,WALLET — leave blank for all" className={inputCls} style={inputStyle} {...focusProps} />
            <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>Empty = no restriction. Listing all 4 = no restriction.</p>
          </div>
          <p className="text-xs font-body" style={{ color: "#6B7280" }}>
            Verify URL to configure in ICICI dashboard:{" "}
            <code className="text-xs bg-gray-100 px-1 rounded">/api/web/checkout/icici-pg/return</code>
          </p>
        </div>
      </SectionCard>

      {/* ── Payment Methods ── */}
      <SectionCard title="Payment Methods" icon={CreditCard}>
        <div className="space-y-3">
          <Toggle k="cod_enabled" label="Cash on Delivery (COD)" />
        </div>
      </SectionCard>

      <div className="flex justify-end"><SaveButton saved={saved} loading={loading} onClick={handleSave} /></div>
    </div>
  );
}

/* ─────────────── SMS / WHATSAPP / SHIPROCKET ─────────────── */
function SmsTab() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    msg91_auth_key: "", msg91_sender_id: "", msg91_template_id: "",
    whatsapp_api_url: "", whatsapp_token: "", whatsapp_phone_id: "",
    whatsapp_number: "",
    shiprocket_enabled: "false",
    shiprocket_email: "", shiprocket_password: "", shiprocket_channel_id: "",
    shiprocket_pickup_location: "Primary",
    shiprocket_pickup_pincode:  "",
    // DTDC (Shipsy) — direct carrier
    dtdc_enabled: "false",
    dtdc_api_key: "", dtdc_customer_code: "", dtdc_service_type: "B2C SMART EXPRESS",
    dtdc_tracking_token: "",
    dtdc_origin_name: "", dtdc_origin_phone: "",
    dtdc_origin_address_1: "", dtdc_origin_address_2: "",
    dtdc_origin_pincode: "", dtdc_origin_city: "", dtdc_origin_state: "",
    // Delhivery — direct carrier
    delhivery_enabled: "false",
    delhivery_api_token: "", delhivery_pickup_name: "",
  });

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(({ settings }) => {
      if (!settings) return;
      setForm(f => ({
        ...f,
        msg91_auth_key:        settings.msg91_auth_key        ?? "",
        msg91_sender_id:       settings.msg91_sender_id       ?? "",
        msg91_template_id:     settings.msg91_template_id     ?? "",
        whatsapp_api_url:      settings.whatsapp_api_url      ?? "",
        whatsapp_token:        settings.whatsapp_token        ?? "",
        whatsapp_phone_id:     settings.whatsapp_phone_id     ?? "",
        whatsapp_number:       settings.whatsapp_number       ?? "",
        shiprocket_enabled:         settings.shiprocket_enabled         ?? "false",
        shiprocket_email:           settings.shiprocket_email           ?? "",
        shiprocket_password:        settings.shiprocket_password        ?? "",
        shiprocket_channel_id:      settings.shiprocket_channel_id      ?? "",
        shiprocket_pickup_location: settings.shiprocket_pickup_location ?? "Primary",
        shiprocket_pickup_pincode:  settings.shiprocket_pickup_pincode  ?? "",
        dtdc_enabled:          settings.dtdc_enabled          ?? "false",
        dtdc_api_key:          settings.dtdc_api_key          ?? "",
        dtdc_customer_code:    settings.dtdc_customer_code    ?? "",
        dtdc_service_type:     settings.dtdc_service_type     ?? "B2C SMART EXPRESS",
        dtdc_tracking_token:   settings.dtdc_tracking_token   ?? "",
        dtdc_origin_name:      settings.dtdc_origin_name      ?? "",
        dtdc_origin_phone:     settings.dtdc_origin_phone     ?? "",
        dtdc_origin_address_1: settings.dtdc_origin_address_1 ?? "",
        dtdc_origin_address_2: settings.dtdc_origin_address_2 ?? "",
        dtdc_origin_pincode:   settings.dtdc_origin_pincode   ?? "",
        dtdc_origin_city:      settings.dtdc_origin_city      ?? "",
        dtdc_origin_state:     settings.dtdc_origin_state     ?? "",
        delhivery_enabled:     settings.delhivery_enabled     ?? "false",
        delhivery_api_token:   settings.delhivery_api_token   ?? "",
        delhivery_pickup_name: settings.delhivery_pickup_name ?? "",
      }));
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const u = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const srEnabled = form.shiprocket_enabled === "true";
  const dtdcEnabled = form.dtdc_enabled === "true";
  const delhiveryEnabled = form.delhivery_enabled === "true";

  return (
    <div className="space-y-5">

      {/* ── MSG91 SMS Gateway ── */}
      <SectionCard title="MSG91 (SMS OTP)" icon={MessageSquare}>
        <p className="text-xs font-body mb-4" style={{ color: "#6B7280" }}>
          Used to send OTP codes to customers during mobile login. Set <code className="text-xs bg-gray-100 px-1 rounded">MOBILE_USE_FIXED_OTP=false</code> in your <code className="text-xs bg-gray-100 px-1 rounded">.env</code> to enable real SMS.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Auth Key</label>
            <SecretInput value={form.msg91_auth_key} onChange={v => setForm(f => ({ ...f, msg91_auth_key: v }))} placeholder="MSG91 auth key" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Sender ID</label>
            <input value={form.msg91_sender_id} onChange={u("msg91_sender_id")} placeholder="VIJLAK" className={inputCls} style={inputStyle} {...focusProps} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>OTP Template ID</label>
            <input value={form.msg91_template_id} onChange={u("msg91_template_id")} placeholder="Template ID for OTP messages" className={inputCls} style={inputStyle} {...focusProps} />
          </div>
        </div>
      </SectionCard>

      {/* ── WhatsApp Business API ── */}
      <SectionCard title="WhatsApp Business API (Meta)" icon={MessageSquare}>
        <p className="text-xs font-body mb-4" style={{ color: "#6B7280" }}>
          Auto-sends an order confirmation message to the customer when admin confirms their order. Requires an approved <strong>order_confirmation</strong> message template in Meta Business Manager.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Store WhatsApp Number</label>
            <input value={form.whatsapp_number} onChange={u("whatsapp_number")} placeholder="+919876543210" className={inputCls} style={inputStyle} {...focusProps} />
            <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>Shown in footer, header, and contact page</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Phone Number ID</label>
            <input value={form.whatsapp_phone_id} onChange={u("whatsapp_phone_id")} placeholder="Meta Phone Number ID" className={inputCls} style={inputStyle} {...focusProps} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>API Token</label>
            <SecretInput value={form.whatsapp_token} onChange={v => setForm(f => ({ ...f, whatsapp_token: v }))} placeholder="EAAxxxxxxxx…" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>API URL (optional override)</label>
            <input value={form.whatsapp_api_url} onChange={u("whatsapp_api_url")} placeholder="https://graph.facebook.com/v18.0/…" className={inputCls} style={inputStyle} {...focusProps} />
          </div>
        </div>
      </SectionCard>

      {/* ── Shiprocket ── */}
      <SectionCard
        title="Shiprocket (Shipping Automation)"
        icon={Truck}
        action={
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, shiprocket_enabled: srEnabled ? "false" : "true" }))}
              className="relative w-9 h-5 rounded-full transition-all cursor-pointer"
              style={{ background: srEnabled ? "var(--color-primary)" : "#D1D5DB" }}
            >
              <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all" style={{ left: srEnabled ? "18px" : "2px" }} />
            </div>
            <span className="text-xs font-medium font-body" style={{ color: "#6B7280" }}>{srEnabled ? "Enabled" : "Disabled"}</span>
          </label>
        }
      >
        <p className="text-xs font-body mb-4" style={{ color: "#6B7280" }}>
          When enabled, admin can create shipments directly from order detail pages. Courier AWB is auto-assigned.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Shiprocket Email</label>
            <input value={form.shiprocket_email} onChange={u("shiprocket_email")} placeholder="your@email.com" className={inputCls} style={{ ...inputStyle, opacity: srEnabled ? 1 : 0.6 }} {...focusProps} disabled={!srEnabled} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Password</label>
            <SecretInput value={form.shiprocket_password} onChange={v => setForm(f => ({ ...f, shiprocket_password: v }))} placeholder="Shiprocket password" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Channel ID <span className="font-normal text-xs" style={{ color: "#9CA3AF" }}>(optional)</span></label>
            <input value={form.shiprocket_channel_id} onChange={u("shiprocket_channel_id")} placeholder="e.g. 123456 (numeric only)" className={inputCls} style={{ ...inputStyle, opacity: srEnabled ? 1 : 0.6 }} {...focusProps} disabled={!srEnabled} />
            <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>Numeric ID from Shiprocket → Settings → Channels. Not a pincode.</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Pickup Location Name *</label>
            <input value={form.shiprocket_pickup_location} onChange={u("shiprocket_pickup_location")} placeholder="Primary" className={inputCls} style={{ ...inputStyle, opacity: srEnabled ? 1 : 0.6 }} {...focusProps} disabled={!srEnabled} />
            <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>Exact name (case-sensitive) from Shiprocket → Settings → Pickup Addresses</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Pickup Pincode (for serviceability)</label>
            <input value={form.shiprocket_pickup_pincode} onChange={u("shiprocket_pickup_pincode")} placeholder="560036" className={inputCls} style={{ ...inputStyle, opacity: srEnabled ? 1 : 0.6 }} {...focusProps} disabled={!srEnabled} />
            <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>Used by the courier-picker dialog. Defaults to SHIPROCKET_PICKUP_PINCODE env var.</p>
          </div>
        </div>
        {srEnabled && (
          <div className="mt-4 p-3 rounded-lg border" style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
            <p className="text-xs font-body" style={{ color: "#166534" }}>
              After saving, go to any order detail page and use the <strong>Create Shipment</strong> button to push the order to Shiprocket and receive an AWB tracking number automatically.
            </p>
          </div>
        )}
      </SectionCard>

      {/* ── DTDC (direct carrier) ── */}
      <SectionCard
        title="DTDC (Direct Courier)"
        icon={Truck}
        action={
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, dtdc_enabled: dtdcEnabled ? "false" : "true" }))}
              className="relative w-9 h-5 rounded-full transition-all cursor-pointer"
              style={{ background: dtdcEnabled ? "var(--color-primary)" : "#D1D5DB" }}
            >
              <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all" style={{ left: dtdcEnabled ? "18px" : "2px" }} />
            </div>
            <span className="text-xs font-medium font-body" style={{ color: "#6B7280" }}>{dtdcEnabled ? "Enabled" : "Disabled"}</span>
          </label>
        }
      >
        <p className="text-xs font-body mb-4" style={{ color: "#6B7280" }}>
          Book consignments directly with DTDC (Shipsy API). When enabled, admin can dispatch orders via DTDC from the order detail page. The order/label API uses the API key; live tracking needs the separate tracking token.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>API Key *</label>
            <SecretInput value={form.dtdc_api_key} onChange={v => setForm(f => ({ ...f, dtdc_api_key: v }))} placeholder="DTDC api-key" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Customer Code *</label>
            <input value={form.dtdc_customer_code} onChange={u("dtdc_customer_code")} placeholder="e.g. GL1234" className={inputCls} style={{ ...inputStyle, opacity: dtdcEnabled ? 1 : 0.6 }} {...focusProps} disabled={!dtdcEnabled} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Default Service Type</label>
            <input value={form.dtdc_service_type} onChange={u("dtdc_service_type")} placeholder="B2C SMART EXPRESS" className={inputCls} style={{ ...inputStyle, opacity: dtdcEnabled ? 1 : 0.6 }} {...focusProps} disabled={!dtdcEnabled} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Tracking Token <span className="font-normal text-xs" style={{ color: "#9CA3AF" }}>(for status)</span></label>
            <SecretInput value={form.dtdc_tracking_token} onChange={v => setForm(f => ({ ...f, dtdc_tracking_token: v }))} placeholder="DTDC tracking apikey" />
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider mt-5 mb-2" style={{ color: "#9CA3AF" }}>Pickup / Origin Address</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Origin Name *</label>
            <input value={form.dtdc_origin_name} onChange={u("dtdc_origin_name")} placeholder="vkcgoldikshu" className={inputCls} style={{ ...inputStyle, opacity: dtdcEnabled ? 1 : 0.6 }} {...focusProps} disabled={!dtdcEnabled} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Origin Phone *</label>
            <input value={form.dtdc_origin_phone} onChange={u("dtdc_origin_phone")} placeholder="10-digit phone" className={inputCls} style={{ ...inputStyle, opacity: dtdcEnabled ? 1 : 0.6 }} {...focusProps} disabled={!dtdcEnabled} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Address Line 1 *</label>
            <input value={form.dtdc_origin_address_1} onChange={u("dtdc_origin_address_1")} placeholder="Street / building" className={inputCls} style={{ ...inputStyle, opacity: dtdcEnabled ? 1 : 0.6 }} {...focusProps} disabled={!dtdcEnabled} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Address Line 2</label>
            <input value={form.dtdc_origin_address_2} onChange={u("dtdc_origin_address_2")} placeholder="Area / landmark" className={inputCls} style={{ ...inputStyle, opacity: dtdcEnabled ? 1 : 0.6 }} {...focusProps} disabled={!dtdcEnabled} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Origin Pincode *</label>
            <input value={form.dtdc_origin_pincode} onChange={u("dtdc_origin_pincode")} placeholder="560036" className={inputCls} style={{ ...inputStyle, opacity: dtdcEnabled ? 1 : 0.6 }} {...focusProps} disabled={!dtdcEnabled} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Origin City *</label>
            <input value={form.dtdc_origin_city} onChange={u("dtdc_origin_city")} placeholder="Bengaluru" className={inputCls} style={{ ...inputStyle, opacity: dtdcEnabled ? 1 : 0.6 }} {...focusProps} disabled={!dtdcEnabled} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Origin State *</label>
            <input value={form.dtdc_origin_state} onChange={u("dtdc_origin_state")} placeholder="Karnataka" className={inputCls} style={{ ...inputStyle, opacity: dtdcEnabled ? 1 : 0.6 }} {...focusProps} disabled={!dtdcEnabled} />
          </div>
        </div>
      </SectionCard>

      {/* ── Delhivery (direct carrier) ── */}
      <SectionCard
        title="Delhivery (Direct Courier)"
        icon={Truck}
        action={
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, delhivery_enabled: delhiveryEnabled ? "false" : "true" }))}
              className="relative w-9 h-5 rounded-full transition-all cursor-pointer"
              style={{ background: delhiveryEnabled ? "var(--color-primary)" : "#D1D5DB" }}
            >
              <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all" style={{ left: delhiveryEnabled ? "18px" : "2px" }} />
            </div>
            <span className="text-xs font-medium font-body" style={{ color: "#6B7280" }}>{delhiveryEnabled ? "Enabled" : "Disabled"}</span>
          </label>
        }
      >
        <p className="text-xs font-body mb-4" style={{ color: "#6B7280" }}>
          Book shipments directly with Delhivery&apos;s B2C API. The pickup location name must exactly match a registered warehouse on your Delhivery account.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>API Token *</label>
            <SecretInput value={form.delhivery_api_token} onChange={v => setForm(f => ({ ...f, delhivery_api_token: v }))} placeholder="Delhivery API token" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Pickup Location Name *</label>
            <input value={form.delhivery_pickup_name} onChange={u("delhivery_pickup_name")} placeholder="Registered warehouse name" className={inputCls} style={{ ...inputStyle, opacity: delhiveryEnabled ? 1 : 0.6 }} {...focusProps} disabled={!delhiveryEnabled} />
            <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>Exact name (case-sensitive) from your Delhivery dashboard → Warehouses.</p>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end"><SaveButton saved={saved} loading={loading} onClick={handleSave} /></div>
    </div>
  );
}

/* ─────────────── ANALYTICS & SEO ─────────────── */
function AnalyticsTab() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ga4_measurement_id: "", gtm_container_id: "",
    meta_title: "", meta_description: "", meta_keywords: "",
    og_image_url: "",
  });

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(({ settings }) => {
      if (!settings) return;
      setForm(f => ({
        ...f,
        ga4_measurement_id: settings.ga4_measurement_id ?? "",
        gtm_container_id: settings.gtm_container_id ?? "",
        meta_title: settings.meta_title ?? "",
        meta_description: settings.meta_description ?? "",
        meta_keywords: settings.meta_keywords ?? "",
        og_image_url: settings.og_image_url ?? "",
      }));
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const u = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <SectionCard title="Google Analytics & Tag Manager" icon={BarChart2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>GA4 Measurement ID</label>
            <input value={form.ga4_measurement_id} onChange={u("ga4_measurement_id")} placeholder="G-XXXXXXXXXX" className={inputCls} style={inputStyle} {...focusProps} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>GTM Container ID</label>
            <input value={form.gtm_container_id} onChange={u("gtm_container_id")} placeholder="GTM-XXXXXXX" className={inputCls} style={inputStyle} {...focusProps} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Default SEO / Meta Tags" icon={Globe}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Default Meta Title</label>
            <input value={form.meta_title} onChange={u("meta_title")} placeholder="vkcgoldikshu — Pure Cane Jaggery" className={inputCls} style={inputStyle} {...focusProps} />
            <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>{form.meta_title.length}/60 characters</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Default Meta Description</label>
            <textarea value={form.meta_description} onChange={u("meta_description")} rows={3}
              placeholder="Shop pure, chemical-free jaggery made from fresh sugarcane in Mandya."
              className="w-full px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none resize-none"
              style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} {...focusProps} />
            <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>{form.meta_description.length}/160 characters</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Keywords (comma-separated)</label>
            <input value={form.meta_keywords} onChange={u("meta_keywords")} placeholder="jaggery, organic jaggery, cane jaggery, natural sweetener" className={inputCls} style={inputStyle} {...focusProps} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>OG Image URL</label>
            <input value={form.og_image_url} onChange={u("og_image_url")} placeholder="https://yourstore.in/og-image.jpg" className={inputCls} style={inputStyle} {...focusProps} />
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end"><SaveButton saved={saved} loading={loading} onClick={handleSave} /></div>
    </div>
  );
}

/* ─────────────── NOTIFICATIONS ─────────────── */
function NotificationsTab() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    announcement: "", announcementActive: "true",
    maintenanceEnabled: "false", maintenanceTitle: "", maintenanceMessage: "",
  });

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(({ settings }) => {
      if (!settings) return;
      setForm({
        announcement: settings.announcement_text ?? "Free shipping on orders above ₹2,999 · New Arrivals: Kanjivaram Collection",
        announcementActive: settings.announcement_active ?? "true",
        maintenanceEnabled: settings.maintenance_enabled ?? "false",
        maintenanceTitle: settings.maintenance_title ?? "We'll be back shortly",
        maintenanceMessage: settings.maintenance_message ??
          "Our store is undergoing scheduled maintenance. Please check back in a little while — thank you for your patience.",
      });
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/admin/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        announcement_text: form.announcement,
        announcement_active: form.announcementActive,
        maintenance_enabled: form.maintenanceEnabled,
        maintenance_title: form.maintenanceTitle,
        maintenance_message: form.maintenanceMessage,
      }),
    });
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const active = form.announcementActive === "true";
  const maintOn = form.maintenanceEnabled === "true";

  return (
    <div className="space-y-5">
      <SectionCard title="Announcement Bar" icon={Bell}
        action={
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => setForm(f => ({ ...f, announcementActive: active ? "false" : "true" }))}
              className="relative w-9 h-5 rounded-full transition-all cursor-pointer"
              style={{ background: active ? "var(--color-primary)" : "#D1D5DB" }}>
              <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all" style={{ left: active ? "18px" : "2px" }} />
            </div>
            <span className="text-xs font-medium font-body" style={{ color: "#6B7280" }}>{active ? "Visible" : "Hidden"}</span>
          </label>
        }
      >
        <div className="space-y-1.5">
          <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Announcement Text</label>
          <input value={form.announcement} onChange={e => setForm(f => ({ ...f, announcement: e.target.value }))}
            disabled={!active} placeholder="Free shipping on orders above ₹2,999…"
            className={inputCls} style={{ ...inputStyle, opacity: active ? 1 : 0.5 }} {...focusProps} />
          <p className="text-[11px] font-body" style={{ color: "#9CA3AF" }}>Use · to separate rotating messages.</p>
        </div>
      </SectionCard>
      <SectionCard title="Maintenance Mode" icon={Bell}
        action={
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => setForm(f => ({ ...f, maintenanceEnabled: maintOn ? "false" : "true" }))}
              className="relative w-10 h-6 rounded-full transition-all cursor-pointer"
              style={{ background: maintOn ? "#DC2626" : "#D1D5DB" }}>
              <div className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all"
                style={{ left: maintOn ? "calc(100% - 18px)" : "2px" }} />
            </div>
            <span className="text-xs font-body font-medium" style={{ color: maintOn ? "#DC2626" : "#6B7280" }}>
              {maintOn ? "Site is OFFLINE" : "Site is live"}
            </span>
          </label>
        }>
        <div className="space-y-4">
          <div className="p-3 rounded-lg text-xs font-body border"
            style={maintOn
              ? { background: "#FEF2F2", borderColor: "#FECACA", color: "#991B1B" }
              : { background: "#F9FAFB", borderColor: "#E5E7EB", color: "#6B7280" }}>
            {maintOn
              ? "Customers currently see the holding page below instead of the store — nobody can browse or order. The admin panel stays accessible so you can switch this back off."
              : "Turn this on to replace the storefront with a holding page while you work. The admin panel is never blocked."}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Heading</label>
            <input value={form.maintenanceTitle} onChange={e => setForm(f => ({ ...f, maintenanceTitle: e.target.value }))}
              className={inputCls} style={inputStyle} {...focusProps} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Reason shown to visitors</label>
            <textarea value={form.maintenanceMessage} onChange={e => setForm(f => ({ ...f, maintenanceMessage: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none resize-y"
              style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} {...focusProps} />
            <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>Line breaks are preserved.</p>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end"><SaveButton saved={saved} loading={loading} onClick={handleSave} /></div>
    </div>
  );
}

/* ─────────────── ROLES & USERS ─────────────── */
function RolesTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [roleTemplates, setRoleTemplates] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", role: "ADMIN", roleTemplateId: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const loadUsers = () => {
    setLoadingUsers(true);
    Promise.all([
      fetch("/api/admin/staff").then(r => r.json()),
      fetch("/api/admin/roles").then(r => r.json()),
    ]).then(([staffData, rolesData]) => {
      setUsers(staffData.users ?? []);
      setRoleTemplates(rolesData.roles ?? []);
      setLoadingUsers(false);
    }).catch(() => setLoadingUsers(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const openModal = () => {
    setForm({ firstName: "", lastName: "", email: "", phone: "", password: "", role: "ADMIN", roleTemplateId: "" });
    setSaveError("");
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!form.email.trim() || !form.password.trim()) { setSaveError("Email and password are required"); return; }
    setSaving(true); setSaveError("");
    try {
      const res = await fetch("/api/admin/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, roleTemplateId: form.roleTemplateId || null }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create user");
      setShowModal(false);
      loadUsers();
    } catch (e: any) { setSaveError(e.message); }
    setSaving(false);
  };

  const inp = "w-full px-3 py-2 text-sm font-body border rounded-lg outline-none focus:ring-2";

  return (
    <div className="space-y-5">
      <SectionCard title="Admin Users" icon={Users}
        action={
          <button onClick={openModal} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body"
            style={{ background: "var(--color-primary)", color: "white" }}>
            <Plus className="h-3.5 w-3.5" /> New User
          </button>
        }
      >
        {loadingUsers ? (
          <div className="text-center py-8"><div className="inline-block h-5 w-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} /></div>
        ) : users.length === 0 ? (
          <p className="text-sm font-body text-center py-8" style={{ color: "#9CA3AF" }}>No admin users found.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "#E5E7EB" }}>
            {users.map((u: any) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "var(--color-primary)" }}>
                    {(u.firstName?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium font-body" style={{ color: "#111827" }}>
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}
                    </p>
                    <p className="text-xs font-body" style={{ color: "#6B7280" }}>{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-body"
                    style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
                    {u.role}
                  </span>
                  <Shield className="h-4 w-4" style={{ color: u.isActive ? "#10B981" : "#D1D5DB" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="rounded-xl border p-5" style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}>
        <p className="text-sm font-semibold font-body mb-1" style={{ color: "#92400E" }}>Custom Role Templates</p>
        <p className="text-xs font-body mb-2" style={{ color: "#92400E" }}>
          Create custom role names (e.g. "Order Manager", "Warehouse Staff") with module-level permissions on the Roles page.
        </p>
        <a href="/admin/roles" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: "#92400E", color: "white" }}>
          Go to Roles &amp; Permissions →
        </a>
      </div>

      {/* New User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Add New Admin User</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-body font-medium mb-1" style={{ color: "#374151" }}>First Name</label>
                <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className={inp} style={{ borderColor: "#D1D5DB" }} placeholder="Anjali" />
              </div>
              <div>
                <label className="block text-xs font-body font-medium mb-1" style={{ color: "#374151" }}>Last Name</label>
                <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className={inp} style={{ borderColor: "#D1D5DB" }} placeholder="Sharma" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-body font-medium mb-1" style={{ color: "#374151" }}>Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inp} style={{ borderColor: "#D1D5DB" }} placeholder="staff@vkcgoldikshu.com" />
            </div>

            <div>
              <label className="block text-xs font-body font-medium mb-1" style={{ color: "#374151" }}>Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={inp} style={{ borderColor: "#D1D5DB" }} placeholder="+91 98765 43210" />
            </div>

            <div>
              <label className="block text-xs font-body font-medium mb-1" style={{ color: "#374151" }}>Password <span className="text-red-500">*</span></label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className={inp} style={{ borderColor: "#D1D5DB" }} placeholder="Min 8 characters" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-body font-medium mb-1" style={{ color: "#374151" }}>System Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className={inp} style={{ borderColor: "#D1D5DB" }}>
                  <option value="ADMIN">ADMIN — Full Access</option>
                  <option value="STAFF">STAFF — Limited Access</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-body font-medium mb-1" style={{ color: "#374151" }}>Role Template</label>
                <select value={form.roleTemplateId} onChange={e => setForm(f => ({ ...f, roleTemplateId: e.target.value }))}
                  className={inp} style={{ borderColor: "#D1D5DB" }}>
                  <option value="">— None —</option>
                  {roleTemplates.filter((r: any) => r.isActive).map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              To create custom role names, go to{" "}
              <a href="/admin/roles" className="underline" style={{ color: "var(--color-primary)" }}>Roles &amp; Permissions</a>.
            </p>

            {saveError && <p className="text-xs text-red-600 font-body">{saveError}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-lg text-sm font-body font-medium border"
                style={{ borderColor: "#D1D5DB", color: "#374151" }}>
                Cancel
              </button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-2 rounded-lg text-sm font-body font-semibold text-white disabled:opacity-60"
                style={{ background: "var(--color-primary)" }}>
                {saving ? "Creating…" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── HEADER NAVIGATION ─────────────── */
function SortableNavItem({
  id, index, isLast, name, isSubcategory, onMoveUp, onMoveDown, onRemove,
}: {
  id: string; index: number; isLast: boolean; name: string; isSubcategory: boolean;
  onMoveUp: () => void; onMoveDown: () => void; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, borderColor: "#E5E7EB", background: "white" };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 rounded-xl border">
      <button {...attributes} {...listeners} className="h-7 w-7 flex items-center justify-center rounded-lg shrink-0 cursor-grab active:cursor-grabbing touch-none" style={{ color: "#9CA3AF" }} aria-label="Drag to reorder">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold font-body shrink-0"
        style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
        {index + 1}
      </div>
      <span className="text-sm font-medium font-body flex-1" style={{ color: "#111827" }}>
        {name}
        {isSubcategory && (
          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-body" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>
            subcategory
          </span>
        )}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={onMoveUp} disabled={index === 0}
          className="h-7 w-7 flex items-center justify-center rounded-lg border transition-colors hover:bg-gray-50 disabled:opacity-30"
          style={{ borderColor: "#E5E7EB" }}>
          <ChevronUp className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
        </button>
        <button onClick={onMoveDown} disabled={isLast}
          className="h-7 w-7 flex items-center justify-center rounded-lg border transition-colors hover:bg-gray-50 disabled:opacity-30"
          style={{ borderColor: "#E5E7EB" }}>
          <ChevronDown className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
        </button>
        <button onClick={onRemove}
          className="h-7 w-7 flex items-center justify-center rounded-lg border transition-colors hover:bg-red-50"
          style={{ borderColor: "#E5E7EB" }}>
          <X className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />
        </button>
      </div>
    </div>
  );
}

function NavTab() {
  const [allCats, setAllCats] = useState<{ id: string; name: string; parentId: string | null; isActive: boolean }[]>([]);
  const [navIds, setNavIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catsLoading, setCatsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then(r => r.json()),
      fetch("/api/admin/settings").then(r => r.json()),
    ]).then(([cats, { settings }]) => {
      const activeCats = Array.isArray(cats) ? cats.filter((c: any) => c.isActive) : [];
      setAllCats(activeCats);
      if (settings?.header_nav) {
        try { setNavIds(JSON.parse(settings.header_nav)); } catch {}
      } else {
        // No setting saved yet — mirror the header default: all active root categories
        const roots = activeCats
          .filter((c: any) => !c.parentId)
          .sort((a: any, b: any) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
        setNavIds(roots.map((c: any) => c.id));
      }
    }).finally(() => setCatsLoading(false));
  }, []);

  const inNav = navIds.map(id => allCats.find(c => c.id === id)).filter(Boolean) as typeof allCats;
  const notInNav = allCats.filter(c => !navIds.includes(c.id));

  const add = (id: string) => setNavIds(prev => [...prev, id]);
  const remove = (id: string) => setNavIds(prev => prev.filter(x => x !== id));
  const moveUp = (i: number) => setNavIds(prev => {
    if (i === 0) return prev;
    const a = [...prev]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a;
  });
  const moveDown = (i: number) => setNavIds(prev => {
    if (i >= prev.length - 1) return prev;
    const a = [...prev]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a;
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setNavIds(prev => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ header_nav: JSON.stringify(navIds) }),
    });
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Header Navigation Menu" icon={Navigation}>
        <p className="text-sm font-body mb-5" style={{ color: "#6B7280" }}>
          Choose which categories appear in the header nav bar and set their order. Each item can show its subcategories as a mega menu. If empty, all top-level active categories are shown automatically.
        </p>

        {catsLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Active nav items */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest font-body mb-2" style={{ color: "#9CA3AF" }}>
                Active Nav Items ({inNav.length})
              </p>
              {inNav.length === 0 ? (
                <div className="border-2 border-dashed rounded-xl p-6 text-center" style={{ borderColor: "#E5E7EB" }}>
                  <Navigation className="h-8 w-8 mx-auto mb-2" style={{ color: "#E5E7EB" }} />
                  <p className="text-sm font-body" style={{ color: "#9CA3AF" }}>No items selected.</p>
                  <p className="text-xs font-body mt-0.5" style={{ color: "#D1D5DB" }}>Add categories from the list below. If empty, all top-level categories are shown.</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={navIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {inNav.map((cat, i) => (
                        <SortableNavItem key={cat.id} id={cat.id} index={i} isLast={i === inNav.length - 1}
                          name={cat.name} isSubcategory={!!cat.parentId}
                          onMoveUp={() => moveUp(i)} onMoveDown={() => moveDown(i)} onRemove={() => remove(cat.id)} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Add from available */}
            {notInNav.length > 0 && (
              <div className="pt-4 border-t" style={{ borderColor: "#E5E7EB" }}>
                <p className="text-[11px] font-semibold uppercase tracking-widest font-body mb-3" style={{ color: "#9CA3AF" }}>
                  Add to Navigation
                </p>
                <div className="flex flex-wrap gap-2">
                  {notInNav.map(cat => (
                    <button key={cat.id} onClick={() => add(cat.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-body font-medium transition-colors hover:bg-gray-50"
                      style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                      <Plus className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                      {cat.name}
                      {cat.parentId && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>(sub)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>
      <div className="flex justify-end"><SaveButton saved={saved} loading={loading} onClick={handleSave} /></div>
    </div>
  );
}

/* ─────────────── FOOTER LINKS ─────────────── */
type FooterLink = { label: string; href: string };
type FooterSectionKey = "shop" | "help" | "account";

const FOOTER_SECTIONS: Array<{ key: FooterSectionKey; label: string }> = [
  { key: "shop",    label: "Shop" },
  { key: "help",    label: "Help" },
  { key: "account", label: "Account" },
];

const DEFAULT_FOOTER: Record<FooterSectionKey, FooterLink[]> = {
  shop: [
    { label: "New Arrivals",       href: "/new-arrivals" },
    { label: "Jaggery Blocks",  href: "/category/jaggery-blocks" },
    { label: "Jaggery Powder",  href: "/category/jaggery-powder" },
    { label: "Jaggery Cubes",   href: "/category/jaggery-cubes" },
    { label: "Wedding Collection", href: "/shop?occasion=wedding" },
    { label: "Sale",               href: "/shop?sale=true" },
  ],
  help: [
    { label: "About Us",          href: "/about" },
    { label: "Contact Us",        href: "/contact" },
    { label: "Shipping Policy",   href: "/shipping" },
    { label: "Return & Exchange", href: "/returns" },
    { label: "Size Guide",        href: "/size-guide" },
    { label: "Care Instructions", href: "/care" },
    { label: "Track Order",       href: "/account/orders" },
  ],
  account: [
    { label: "My Account",      href: "/account" },
    { label: "My Orders",       href: "/account/orders" },
    { label: "Wishlist",        href: "/account/wishlist" },
    { label: "Saved Addresses", href: "/account/addresses" },
  ],
};

function FooterTab() {
  const [sections, setSections] = useState<Record<FooterSectionKey, FooterLink[]>>(DEFAULT_FOOTER);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(({ settings }) => {
      if (!settings) return;
      setSections(prev => ({
        shop:    tryParse(settings.footer_shop_links)    ?? prev.shop,
        help:    tryParse(settings.footer_help_links)    ?? prev.help,
        account: tryParse(settings.footer_account_links) ?? prev.account,
      }));
      setFetched(true);
    });
  }, []);

  const tryParse = (v: string | undefined): FooterLink[] | null => {
    if (!v) return null;
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : null; } catch { return null; }
  };

  const addLink = (section: FooterSectionKey) =>
    setSections(s => ({ ...s, [section]: [...s[section], { label: "", href: "" }] }));

  const updateLink = (section: FooterSectionKey, idx: number, field: keyof FooterLink, value: string) =>
    setSections(s => ({
      ...s,
      [section]: s[section].map((l, i) => i === idx ? { ...l, [field]: value } : l),
    }));

  const removeLink = (section: FooterSectionKey, idx: number) =>
    setSections(s => ({ ...s, [section]: s[section].filter((_, i) => i !== idx) }));

  const moveLink = (section: FooterSectionKey, idx: number, dir: -1 | 1) => {
    const arr = [...sections[section]];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= arr.length) return;
    [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
    setSections(s => ({ ...s, [section]: arr }));
  };

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        footer_shop_links:    JSON.stringify(sections.shop.filter(l => l.label && l.href)),
        footer_help_links:    JSON.stringify(sections.help.filter(l => l.label && l.href)),
        footer_account_links: JSON.stringify(sections.account.filter(l => l.label && l.href)),
      }),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!fetched) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {FOOTER_SECTIONS.map(({ key, label }) => (
        <SectionCard
          key={key}
          title={`${label} Links`}
          icon={Link2}
          action={
            <button
              onClick={() => addLink(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-colors"
              style={{ background: "var(--color-primary-50)", color: "var(--color-primary)", border: "1px solid var(--color-primary-50)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-primary)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-primary-50)"; (e.currentTarget as HTMLElement).style.color = "var(--color-primary)"; }}
            >
              <Plus className="h-3.5 w-3.5" /> Add Link
            </button>
          }
        >
          {sections[key].length === 0 ? (
            <div className="border-2 border-dashed rounded-xl py-8 text-center" style={{ borderColor: "#E5E7EB" }}>
              <Link2 className="h-6 w-6 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
              <p className="text-sm font-body" style={{ color: "#9CA3AF" }}>No links yet.</p>
              <p className="text-xs font-body mt-0.5" style={{ color: "#D1D5DB" }}>Click "Add Link" to add a footer link.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest font-body" style={{ color: "#9CA3AF" }}>Link Text</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest font-body" style={{ color: "#9CA3AF" }}>URL / Path</p>
                <div className="w-20" />
              </div>
              {sections[key].map((link, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center p-3 rounded-xl border" style={{ borderColor: "#E5E7EB", background: "#FAFAFA" }}>
                  <input
                    value={link.label}
                    onChange={e => updateLink(key, i, "label", e.target.value)}
                    placeholder="e.g. New Arrivals"
                    className={inputCls}
                    style={inputStyle}
                    {...focusProps}
                  />
                  <input
                    value={link.href}
                    onChange={e => updateLink(key, i, "href", e.target.value)}
                    placeholder="e.g. /new-arrivals"
                    className={inputCls}
                    style={inputStyle}
                    {...focusProps}
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveLink(key, i, -1)} disabled={i === 0}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-gray-50 disabled:opacity-30"
                      style={{ borderColor: "#E5E7EB" }}
                    >
                      <ChevronUp className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                    </button>
                    <button
                      onClick={() => moveLink(key, i, 1)} disabled={i === sections[key].length - 1}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-gray-50 disabled:opacity-30"
                      style={{ borderColor: "#E5E7EB" }}
                    >
                      <ChevronDown className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                    </button>
                    <button
                      onClick={() => removeLink(key, i)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-red-50"
                      style={{ borderColor: "#E5E7EB" }}
                    >
                      <Trash2 className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      ))}
      <div className="flex justify-end">
        <SaveButton saved={saved} loading={loading} onClick={handleSave} />
      </div>
    </div>
  );
}

/* ─────────────── MAIN ─────────────── */
export default function SettingsClient({ options }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  const renderTab = () => {
    switch (activeTab) {
      case "general":       return <GeneralTab />;
      case "navigation":    return <NavTab />;
      case "homepage":      return <HomepageTab />;
      case "footer":        return <FooterTab />;
      case "options":       return <OptionsTab options={options} />;
      case "attributes":    return <AttributesTab />;
      case "about":         return <AboutPageTab />;
      case "productpage":   return <ProductPageTab />;
      case "shipping":      return <ShippingTab />;
      case "returns":       return <ReturnsTab />;
      case "social":        return <SocialTab />;
      case "payments":      return <PaymentsTab />;
      case "sms":           return <SmsTab />;
      case "analytics":     return <AnalyticsTab />;
      case "notifications": return <NotificationsTab />;
      case "roles":         return <RolesTab />;
    }
  };

  return (
    <div className="flex gap-6 min-h-[600px]">
      <aside className="w-56 shrink-0">
        <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest font-body" style={{ color: "#9CA3AF" }}>Settings</p>
          </div>
          <nav className="p-2 space-y-0.5">
            {tabs.map(({ id, label, icon: Icon, desc }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
                  style={{ background: active ? "var(--color-primary-50)" : "transparent", color: active ? "var(--color-primary)" : "#6B7280" }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; } }}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: active ? "var(--color-primary)" : "#9CA3AF" }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium font-body leading-tight truncate">{label}</p>
                    <p className="text-[10px] font-body leading-tight truncate mt-0.5" style={{ color: active ? "var(--color-primary)" : "#9CA3AF", opacity: 0.85 }}>{desc}</p>
                  </div>
                  {active && <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-primary)" }} />}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="mb-5">
          <h1 className="text-lg font-semibold font-body" style={{ color: "#111827" }}>
            {tabs.find(t => t.id === activeTab)?.label}
          </h1>
          <p className="text-sm font-body mt-0.5" style={{ color: "#6B7280" }}>
            {tabs.find(t => t.id === activeTab)?.desc}
          </p>
        </div>
        {renderTab()}
      </div>
    </div>
  );
}
