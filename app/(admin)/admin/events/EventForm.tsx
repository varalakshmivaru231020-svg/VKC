"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, Trash2, Loader2, Video, AlertCircle } from "lucide-react";
import { uploadImageFile, uploadVideoFile, MAX_VIDEO_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_LABEL } from "@/lib/utils/upload";

export interface EventMedia {
  id: string;
  type: string;
  url: string;
  caption: string | null;
  sortOrder: number;
}

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  media: EventMedia[];
}

function SectionCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
        <h2 className="text-sm font-semibold font-body" style={{ color: "#111827" }}>{title}</h2>
        {hint && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{hint}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/** Shared by the "new" and "edit" event pages. Media can only be attached once
 *  the event exists (it hangs off the event's id), so on create we save first
 *  and route to the edit page rather than trying to hold media in memory. */
export default function EventForm({ event }: { event?: EventRow }) {
  const router = useRouter();
  const isEdit = Boolean(event);

  const [form, setForm] = useState({
    title: event?.title ?? "",
    description: event?.description ?? "",
    coverImage: event?.coverImage ?? "",
    isActive: event?.isActive ?? true,
    sortOrder: String(event?.sortOrder ?? 0),
    startsAt: event?.startsAt ? event.startsAt.slice(0, 10) : "",
    endsAt: event?.endsAt ? event.endsAt.slice(0, 10) : "",
  });
  const [media, setMedia] = useState<EventMedia[]>(event?.media ?? []);
  const [mediaForm, setMediaForm] = useState({ type: "IMAGE", url: "", caption: "" });

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [addingMedia, setAddingMedia] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(event?.coverImage ?? null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploadError(null);
    setCoverPreview(URL.createObjectURL(file));
    setCoverUploading(true);
    const result = await uploadImageFile(file);
    setCoverUploading(false);
    if (!result.ok) { setCoverUploadError(`${result.error} — ${result.details}`); setCoverPreview(form.coverImage || null); return; }
    set("coverImage")(result.url);
    setCoverPreview(result.url);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert("Title is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/events/${event!.id}` : "/api/admin/events", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      const saved: EventRow = await res.json();
      if (isEdit) {
        setSavedAt(new Date().toLocaleTimeString());
        router.refresh();
      } else {
        // Straight to the edit page so photos and videos can be added right away.
        router.push(`/admin/events/${saved.id}/edit`);
      }
    } catch (e: any) {
      alert(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = mediaForm.type === "VIDEO";
    // Checked before the request goes out: an over-limit body is refused by
    // nginx with HTML the client can't parse, so otherwise the admin waits out
    // a long upload only to get "invalid response" instead of the real reason.
    if (isVideo && file.size > MAX_VIDEO_UPLOAD_BYTES) {
      alert(
        `This video is ${(file.size / 1024 / 1024).toFixed(0)}MB — the maximum is ${MAX_VIDEO_UPLOAD_LABEL}. ` +
        `Export it at a smaller size, or paste a YouTube/Facebook link instead.`
      );
      e.target.value = "";
      return;
    }
    setMediaUploading(true);
    const result = isVideo ? await uploadVideoFile(file) : await uploadImageFile(file);
    setMediaUploading(false);
    if (!result.ok) { alert(`${result.error} — ${result.details}`); return; }
    // Keep whichever type is selected — the picker is type-aware, so forcing
    // IMAGE here would mislabel an uploaded video.
    setMediaForm((f) => ({ ...f, url: result.url }));
  };

  const addMedia = async () => {
    if (!event || !mediaForm.url.trim()) return;
    setAddingMedia(true);
    try {
      const res = await fetch(`/api/admin/events/${event.id}/media`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mediaForm),
      });
      if (!res.ok) throw new Error("Failed to add media");
      const added: EventMedia = await res.json();
      setMedia((m) => [...m, added]);
      setMediaForm({ type: mediaForm.type, url: "", caption: "" });
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAddingMedia(false);
    }
  };

  const removeMedia = async (mediaId: string) => {
    if (!event) return;
    const res = await fetch(`/api/admin/events/${event.id}/media/${mediaId}`, { method: "DELETE" });
    if (res.ok) {
      setMedia((m) => m.filter((x) => x.id !== mediaId));
      router.refresh();
    }
  };

  const isVideoSelected = mediaForm.type === "VIDEO";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/events"
            className="h-9 w-9 flex items-center justify-center rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E5E7EB" }}>
            <ArrowLeft className="h-4 w-4" style={{ color: "#6B7280" }} />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-body" style={{ color: "#111827" }}>
              {isEdit ? "Edit Event" : "Add New Event"}
            </h1>
            <p className="text-sm font-body mt-0.5" style={{ color: "#6B7280" }}>
              {isEdit ? `/events/${event!.slug}` : "Create the event, then add photos and videos to it"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-xs" style={{ color: "#2E6B47" }}>Saved at {savedAt}</span>}
          <Link href="/admin/events"
            className="px-4 py-2 rounded-lg border text-sm font-medium font-body transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E5E7EB", color: "#374151" }}>
            Cancel
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "var(--color-primary)" }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? "Save Changes" : "Create & Add Media"}
          </button>
        </div>
      </div>

      <SectionCard title="Event Details">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input value={form.title} onChange={(e) => set("title")(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              placeholder="Diwali Celebrations 2026" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => set("description")(e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image</label>
            <p className="text-xs text-gray-400 mb-2">Shown on the Events page. Best size: 1600 &times; 1000 px (landscape).</p>
            <div
              onClick={() => coverFileRef.current?.click()}
              className="relative cursor-pointer border-2 border-dashed border-gray-200 rounded-xl overflow-hidden transition-colors hover:border-primary"
              style={{ height: 200 }}>
              {coverPreview
                ? <img src={coverPreview} alt="preview" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Click to upload image</span>
                  </div>}
              {coverUploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
                </div>
              )}
            </div>
            <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            {coverUploadError && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg text-xs mt-1.5" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{coverUploadError}</span>
              </div>
            )}
            <input value={form.coverImage} onChange={(e) => { set("coverImage")(e.target.value); setCoverPreview(e.target.value || null); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary mt-2"
              placeholder="or paste an image URL" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Starts</label>
              <input type="date" value={form.startsAt} onChange={(e) => set("startsAt")(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ends</label>
              <input type="date" value={form.endsAt} onChange={(e) => set("endsAt")(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive")(e.target.checked)} />
            Active (visible on site)
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Photos & Videos"
        hint={isEdit ? "Photos are shown as squares — best size 1440 × 1440 px. Videos play in a 16:9 box — best size 1920 × 1080 px." : undefined}>
        {!isEdit ? (
          <p className="text-sm text-gray-400">
            Save the event first — photos and videos are attached to it once it exists.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              {media.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100">
                  <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                    {m.type === "VIDEO"
                      ? <Video className="h-4 w-4 text-gray-400" />
                      : <img src={m.url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700">{m.type === "VIDEO" ? "Video" : "Photo"}</p>
                    <p className="text-xs text-gray-400 truncate">{m.caption || m.url}</p>
                  </div>
                  <button onClick={() => removeMedia(m.id)} aria-label="Remove"
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {media.length === 0 && <p className="text-sm text-gray-400">No photos or videos added yet.</p>}
            </div>

            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <select value={mediaForm.type} onChange={(e) => setMediaForm((f) => ({ ...f, type: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="IMAGE">Photo</option>
                  <option value="VIDEO">Video</option>
                </select>
                <label className="shrink-0 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 flex items-center gap-1.5 cursor-pointer hover:bg-gray-50">
                  {mediaUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {mediaUploading ? "Uploading…" : "Choose file"}
                  <input
                    type="file"
                    accept={isVideoSelected ? "video/mp4,video/webm,video/quicktime" : "image/*"}
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                </label>
                <input value={mediaForm.url} onChange={(e) => setMediaForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder={isVideoSelected ? "or paste a YouTube / Facebook / Vimeo link" : "or paste an image URL"}
                  className="flex-1 min-w-[12rem] border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input value={mediaForm.caption} onChange={(e) => setMediaForm((f) => ({ ...f, caption: e.target.value }))}
                  placeholder="Caption (optional)"
                  className="flex-1 min-w-[12rem] border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                {/* Disabled mid-upload too: the URL is only filled in once the
                    upload resolves, so an early click just alerts "provide a URL". */}
                <button onClick={addMedia} disabled={addingMedia || mediaUploading || !mediaForm.url.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white shrink-0 disabled:opacity-50"
                  style={{ background: "var(--color-primary)" }}>
                  {addingMedia ? "Adding…" : "Add"}
                </button>
              </div>

              {isVideoSelected && (
                <p className="text-xs text-gray-400">
                  MP4, WebM or MOV — up to {MAX_VIDEO_UPLOAD_LABEL}. For longer videos paste a YouTube or Facebook link
                  instead: no size limit, and it loads faster for customers.
                </p>
              )}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
