"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Trash2, Plus, Image as ImageIcon, Video } from "lucide-react";
import { uploadImageFile } from "@/lib/utils/upload";
import { parseVideoUrl } from "@/lib/utils/video";

interface StoryMedia {
  id: string;
  type: string;
  url: string;
  caption: string | null;
}

export interface StoryFormData {
  id?: string;
  name: string;
  region: string;
  fabric: string;
  categoryId: string;
  heroImage: string;
  featuredImage: string;
  shortIntro: string;
  history: string;
  origin: string;
  geographicalLocation: string;
  weavingTechnique: string;
  fabricInfo: string;
  borderDesign: string;
  motifs: string;
  traditionalUsage: string;
  occasionsToWear: string;
  culturalSignificance: string;
  interestingFacts: string; // newline-separated in the form, array in the DB
  careInstructions: string;
  isPublished: boolean;
  sortOrder: string;
  metaTitle: string;
  metaDesc: string;
  canonicalUrl: string;
  ogImage: string;
}

const emptyForm = (): StoryFormData => ({
  name: "", region: "", fabric: "", categoryId: "",
  heroImage: "", featuredImage: "", shortIntro: "",
  history: "", origin: "", geographicalLocation: "", weavingTechnique: "", fabricInfo: "",
  borderDesign: "", motifs: "", traditionalUsage: "", occasionsToWear: "", culturalSignificance: "",
  interestingFacts: "", careInstructions: "",
  isPublished: false, sortOrder: "0",
  metaTitle: "", metaDesc: "", canonicalUrl: "", ogImage: "",
});

const FIELD_CLS = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary";
const LABEL_CLS = "block text-sm font-medium text-gray-700 mb-1.5";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

export default function StoryForm({
  mode, initial, storyId, categories, media,
}: {
  mode: "create" | "edit";
  initial?: Partial<StoryFormData>;
  storyId?: string;
  categories: { id: string; name: string; slug: string }[];
  media?: StoryMedia[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<StoryFormData>({ ...emptyForm(), ...initial });
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<StoryMedia[]>(media ?? []);
  const [mediaForm, setMediaForm] = useState({ type: "IMAGE", url: "", caption: "" });
  const [addingMedia, setAddingMedia] = useState(false);

  const set = (k: keyof StoryFormData) => (v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageUpload = (field: "heroImage" | "featuredImage" | "ogImage") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    const result = await uploadImageFile(file);
    setUploadingField(null);
    if (!result.ok) { alert(`${result.error} — ${result.details}`); return; }
    set(field)(result.url);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert("Saree name is required"); return; }
    setSaving(true);
    try {
      const url = mode === "edit" ? `/api/admin/saree-stories/${storyId}` : "/api/admin/saree-stories";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed to save"); }
      const saved = await res.json();
      if (mode === "create") {
        router.push(`/admin/saree-stories/${saved.id}/edit`);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addMedia = async () => {
    if (!storyId || !mediaForm.url.trim()) return;
    setAddingMedia(true);
    try {
      const res = await fetch(`/api/admin/saree-stories/${storyId}/media`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mediaForm),
      });
      if (!res.ok) throw new Error("Failed to add media");
      const created: StoryMedia = await res.json();
      setMediaItems((m) => [...m, created]);
      setMediaForm({ type: "IMAGE", url: "", caption: "" });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAddingMedia(false);
    }
  };

  const removeMedia = async (mediaId: string) => {
    if (!storyId) return;
    const res = await fetch(`/api/admin/saree-stories/${storyId}/media/${mediaId}`, { method: "DELETE" });
    if (res.ok) setMediaItems((m) => m.filter((x) => x.id !== mediaId));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto pb-24">
      <Link href="/admin/saree-stories" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Saree Stories
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{mode === "edit" ? `Edit: ${form.name || "Story"}` : "Add Saree Story"}</h1>

      <div className="space-y-5">
        <Section title="Basic Info">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={LABEL_CLS}>Saree Name</label>
              <input value={form.name} onChange={(e) => set("name")(e.target.value)} className={FIELD_CLS} placeholder="Kanchipuram Silk" />
            </div>
            <div>
              <label className={LABEL_CLS}>Region</label>
              <input value={form.region} onChange={(e) => set("region")(e.target.value)} className={FIELD_CLS} placeholder="Tamil Nadu" />
            </div>
            <div>
              <label className={LABEL_CLS}>Fabric</label>
              <input value={form.fabric} onChange={(e) => set("fabric")(e.target.value)} className={FIELD_CLS} placeholder="Pure Mulberry Silk" />
            </div>
            <div className="col-span-2">
              <label className={LABEL_CLS}>Link to Shop Category (optional — powers "Related Products")</label>
              <select value={form.categoryId} onChange={(e) => set("categoryId")(e.target.value)} className={FIELD_CLS}>
                <option value="">None</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder")(e.target.value)} className={FIELD_CLS} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => set("isPublished")(e.target.checked)} />
                Published (visible on site)
              </label>
            </div>
          </div>
        </Section>

        <Section title="Hero &amp; Featured Images">
          {(["heroImage", "featuredImage"] as const).map((field) => (
            <div key={field}>
              <label className={LABEL_CLS}>{field === "heroImage" ? "Hero Banner Image" : "Featured Image (listing thumbnail)"}</label>
              <div className="flex items-center gap-3">
                {form[field] && <img src={form[field]} alt="" className="h-14 w-14 rounded-lg object-cover border border-gray-200 shrink-0" />}
                <div className="flex-1 space-y-1.5">
                  <input type="file" accept="image/*" onChange={handleImageUpload(field)} className="text-xs" />
                  {uploadingField === field && <p className="text-xs text-gray-400">Uploading…</p>}
                  <input value={form[field]} onChange={(e) => set(field)(e.target.value)} className={FIELD_CLS} placeholder="Or paste an image URL" />
                </div>
              </div>
            </div>
          ))}
          <div>
            <label className={LABEL_CLS}>Short Introduction</label>
            <textarea value={form.shortIntro} onChange={(e) => set("shortIntro")(e.target.value)} rows={3} className={FIELD_CLS + " resize-none"}
              placeholder="A one-paragraph hook shown on the listing page and hero." />
          </div>
        </Section>

        <Section title="The Story">
          {([
            ["history", "History"], ["origin", "Origin"], ["geographicalLocation", "Geographical Location"],
            ["weavingTechnique", "Weaving Technique"], ["fabricInfo", "Fabric Information"], ["borderDesign", "Border Design"],
            ["motifs", "Motifs"], ["traditionalUsage", "Traditional Usage"], ["occasionsToWear", "Occasions to Wear"],
            ["culturalSignificance", "Cultural Significance"], ["careInstructions", "Care Instructions"],
          ] as const).map(([field, label]) => (
            <div key={field}>
              <label className={LABEL_CLS}>{label}</label>
              <textarea value={form[field]} onChange={(e) => set(field)(e.target.value)} rows={3} className={FIELD_CLS + " resize-none"} />
            </div>
          ))}
          <div>
            <label className={LABEL_CLS}>Interesting Facts (one per line)</label>
            <textarea value={form.interestingFacts} onChange={(e) => set("interestingFacts")(e.target.value)} rows={4} className={FIELD_CLS + " resize-none"}
              placeholder={"A Kanchipuram saree can take up to a month to weave\nReal zari uses silver thread coated in gold"} />
          </div>
        </Section>

        <Section title="SEO">
          <div>
            <label className={LABEL_CLS}>Meta Title</label>
            <input value={form.metaTitle} onChange={(e) => set("metaTitle")(e.target.value)} className={FIELD_CLS} />
            <p className="text-xs text-gray-400 mt-1">"| Vijaylakshmi Sarees" is added automatically — no need to type it here.</p>
          </div>
          <div>
            <label className={LABEL_CLS}>Meta Description</label>
            <textarea value={form.metaDesc} onChange={(e) => set("metaDesc")(e.target.value)} rows={2} className={FIELD_CLS + " resize-none"} />
          </div>
          <div>
            <label className={LABEL_CLS}>Canonical URL (optional)</label>
            <input value={form.canonicalUrl} onChange={(e) => set("canonicalUrl")(e.target.value)} className={FIELD_CLS} placeholder="https://vijaylakshmisarees.com/saree-stories/kanchipuram" />
          </div>
          <div>
            <label className={LABEL_CLS}>Social Share Image (Open Graph / Twitter Card)</label>
            <div className="flex items-center gap-3">
              {form.ogImage && <img src={form.ogImage} alt="" className="h-14 w-14 rounded-lg object-cover border border-gray-200 shrink-0" />}
              <div className="flex-1 space-y-1.5">
                <input type="file" accept="image/*" onChange={handleImageUpload("ogImage")} className="text-xs" />
                <input value={form.ogImage} onChange={(e) => set("ogImage")(e.target.value)} className={FIELD_CLS} placeholder="Or paste an image URL" />
              </div>
            </div>
          </div>
        </Section>

        {mode === "edit" && storyId && (
          <Section title="Gallery (Photos &amp; Videos)">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {mediaItems.map((m) => (
                <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                  {m.type === "VIDEO" ? (
                    parseVideoUrl(m.url)?.thumbnailUrl
                      ? <img src={parseVideoUrl(m.url)!.thumbnailUrl!} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Video className="h-5 w-5 text-gray-400" /></div>
                  ) : (
                    <img src={m.url} alt={m.caption ?? ""} className="w-full h-full object-cover" />
                  )}
                  <button onClick={() => removeMedia(m.id)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
              {mediaItems.length === 0 && <p className="text-xs text-gray-400 col-span-4">No gallery media yet.</p>}
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <select value={mediaForm.type} onChange={(e) => setMediaForm((f) => ({ ...f, type: e.target.value }))} className="border border-gray-200 rounded-lg px-2 py-2 text-xs">
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
              </select>
              <input value={mediaForm.url} onChange={(e) => setMediaForm((f) => ({ ...f, url: e.target.value }))}
                placeholder={mediaForm.type === "VIDEO" ? "YouTube / Facebook / Vimeo / direct video URL" : "Image URL"}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs" />
              <button onClick={addMedia} disabled={addingMedia} className="px-3 rounded-lg text-xs font-semibold text-white shrink-0" style={{ background: "var(--color-primary)" }}>
                {addingMedia ? "…" : <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>
          </Section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 p-4 flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--color-primary)" }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {mode === "edit" ? "Save Changes" : "Create Story"}
        </button>
      </div>
    </div>
  );
}
