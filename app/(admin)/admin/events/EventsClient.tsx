"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Image as ImageIcon } from "lucide-react";
import type { EventRow } from "./EventForm";

export default function EventsClient({ events: initial }: { events: EventRow[] }) {
  const [events, setEvents] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);

  const refreshList = async () => {
    const res = await fetch("/api/admin/events");
    if (res.ok) setEvents(await res.json());
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">Festival celebrations and store events — photos, videos, slideshow.</p>
        </div>
        <Link href="/admin/events/new" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--color-primary)" }}>
          <Plus className="h-4 w-4" /> Add Event
        </Link>
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
            <Link href={`/admin/events/${ev.id}/edit`} aria-label={`Edit ${ev.title}`} className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"><Pencil className="h-4 w-4" /></Link>
            <button onClick={() => handleDelete(ev.id)} disabled={deleting === ev.id} className="h-9 w-9 flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
              {deleting === ev.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
