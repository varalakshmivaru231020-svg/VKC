"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Save, Image as ImageIcon, Video, Loader2 } from "lucide-react";

interface EventMedia {
  id: string;
  type: string;
  url: string;
  caption: string | null;
  sortOrder: number;
}

interface EventRow {
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

const emptyForm = () => ({
  title: "", description: "", coverImage: "",
  isActive: true, sortOrder: "0", startsAt: "", endsAt: "",
});

export default function EventsClient({ events: initial }: { events: EventRow[] }) {
  const [events, setEvents] = useState(initial);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<EventRow | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [mediaForm, setMediaForm] = useState({ type: "IMAGE", url: "", caption: "" });
  const [addingMedia, setAddingMedia] = useState(false);

  const set = (k: keyof ReturnType<typeof emptyForm>) => (v: any) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => { setForm(emptyForm()); setEditTarget(null); setModal("add"); };
  const openEdit = (ev: EventRow) => {
    setForm({
      title: ev.title, description: ev.description ?? "", coverImage: ev.coverImage ?? "",
      isActive: ev.isActive, sortOrder: String(ev.sortOrder),
      startsAt: ev.startsAt ? ev.startsAt.slice(0, 10) : "", endsAt: ev.endsAt ? ev.endsAt.slice(0, 10) : "",
    });
    setEditTarget(ev);
    setModal("edit");
  };
  const close = () => { setModal(null); setEditTarget(null); };

  const refreshList = async () => {
    const res = await fetch("/api/admin/events");
    if (res.ok) setEvents(await res.json());
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert("Title is required"); return; }
    setSaving(true);
    try {
      const url = modal === "edit" ? `/api/admin/events/${editTarget!.id}` : "/api/admin/events";
      const method = modal === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      const saved: EventRow = await res.json();
      await refreshList();
      // Switch straight into edit mode on the saved record so media can be added right away
      setEditTarget(saved);
      setModal("edit");
    } catch (e: any) {
      alert(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event and all its media?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setEvents((s) => s.filter((e) => e.id !== id));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (ev: EventRow) => {
    const res = await fetch(`/api/admin/events/${ev.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ev, isActive: !ev.isActive }),
    });
    if (res.ok) refreshList();
  };

  const addMedia = async () => {
    if (!editTarget || !mediaForm.url.trim()) return;
    setAddingMedia(true);
    try {
      const res = await fetch(`/api/admin/events/${editTarget.id}/media`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mediaForm),
      });
      if (!res.ok) throw new Error("Failed to add media");
      const media: EventMedia = await res.json();
      setEditTarget((t) => (t ? { ...t, media: [...t.media, media] } : t));
      setMediaForm({ type: "IMAGE", url: "", caption: "" });
      refreshList();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAddingMedia(false);
    }
  };

  const removeMedia = async (mediaId: string) => {
    if (!editTarget) return;
    const res = await fetch(`/api/admin/events/${editTarget.id}/media/${mediaId}`, { method: "DELETE" });
    if (res.ok) {
      setEditTarget((t) => (t ? { ...t, media: t.media.filter((m) => m.id !== mediaId) } : t));
      refreshList();
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">Festival celebrations and store events — photos, videos, slideshow.</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--color-primary)" }}>
          <Plus className="h-4 w-4" /> Add Event
        </button>
      </div>

      <div className="space-y-3">
        {events.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">No events yet.</p>}
        {events.map((ev) => (
          <div key={ev.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white">
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
              {ev.coverImage ? <img src={ev.coverImage} alt={ev.title} className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 text-gray-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{ev.title}</p>
              <p className="text-xs text-gray-500">{ev.media.length} media items · /events/{ev.slug}</p>
            </div>
            <button onClick={() => toggleActive(ev)} className="h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5" style={{ background: ev.isActive ? "#EDF7F2" : "#F3F4F6", color: ev.isActive ? "#2E6B47" : "#6B7280" }}>
              {ev.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {ev.isActive ? "Active" : "Hidden"}
            </button>
            <button onClick={() => openEdit(ev)} className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => handleDelete(ev.id)} disabled={deleting === ev.id} className="h-9 w-9 flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
              {deleting === ev.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={close}>
          <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{modal === "edit" ? "Edit Event" : "Add Event"}</h2>
              <button onClick={close}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input value={form.title} onChange={(e) => set("title")(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Diwali Celebrations 2026" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => set("description")(e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image URL</label>
                <input value={form.coverImage} onChange={(e) => set("coverImage")(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive")(e.target.checked)} /> Active (visible on site)
              </label>

              <button onClick={handleSave} disabled={saving}
                className="w-full h-11 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: "var(--color-primary)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {modal === "edit" ? "Save Changes" : "Create & Add Media"}
              </button>

              {modal === "edit" && editTarget && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Photos &amp; Videos</p>
                  <div className="space-y-2 mb-4">
                    {editTarget.media.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100">
                        <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                          {m.type === "VIDEO" ? <Video className="h-4 w-4 text-gray-400" /> : <img src={m.url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-xs text-gray-500 flex-1 truncate">{m.caption || m.url}</span>
                        <button onClick={() => removeMedia(m.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                      </div>
                    ))}
                    {editTarget.media.length === 0 && <p className="text-xs text-gray-400">No media added yet.</p>}
                  </div>
                  <div className="flex gap-2">
                    <select value={mediaForm.type} onChange={(e) => setMediaForm((f) => ({ ...f, type: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-2 py-2 text-xs">
                      <option value="IMAGE">Image</option>
                      <option value="VIDEO">Video</option>
                    </select>
                    <input value={mediaForm.url} onChange={(e) => setMediaForm((f) => ({ ...f, url: e.target.value }))}
                      placeholder="Media URL" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs" />
                    <button onClick={addMedia} disabled={addingMedia} className="px-3 rounded-lg text-xs font-semibold text-white shrink-0" style={{ background: "var(--color-primary)" }}>
                      {addingMedia ? "…" : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
