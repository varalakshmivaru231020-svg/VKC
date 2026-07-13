"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, BookOpen } from "lucide-react";

interface StoryRow {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  fabric: string | null;
  featuredImage: string | null;
  isPublished: boolean;
  sortOrder: number;
  category: { id: string; name: string; slug: string } | null;
}

export default function SareeStoriesListClient({ stories: initial }: { stories: StoryRow[] }) {
  const [stories, setStories] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  const togglePublish = async (story: StoryRow) => {
    setBusyId(story.id);
    const res = await fetch(`/api/admin/saree-stories/${story.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !story.isPublished }),
    });
    if (res.ok) setStories((s) => s.map((x) => (x.id === story.id ? { ...x, isPublished: !x.isPublished } : x)));
    setBusyId(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this saree story? This also deletes its gallery media.")) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/saree-stories/${id}`, { method: "DELETE" });
    if (res.ok) setStories((s) => s.filter((x) => x.id !== id));
    setBusyId(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saree Stories</h1>
          <p className="text-sm text-gray-500 mt-1">The heritage &amp; craftsmanship story behind each saree type.</p>
        </div>
        <Link href="/admin/saree-stories/new" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--color-primary)" }}>
          <Plus className="h-4 w-4" /> Add Story
        </Link>
      </div>

      <div className="space-y-3">
        {stories.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">No saree stories yet.</p>}
        {stories.map((story) => (
          <div key={story.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white">
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
              {story.featuredImage ? <img src={story.featuredImage} alt={story.name} className="w-full h-full object-cover" /> : <BookOpen className="h-5 w-5 text-gray-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{story.name}</p>
              <p className="text-xs text-gray-500">
                /saree-stories/{story.slug}
                {story.region && ` · ${story.region}`}
                {story.fabric && ` · ${story.fabric}`}
                {story.category && ` · linked to ${story.category.name}`}
              </p>
            </div>
            <button onClick={() => togglePublish(story)} disabled={busyId === story.id}
              className="h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5"
              style={{ background: story.isPublished ? "#EDF7F2" : "#F3F4F6", color: story.isPublished ? "#2E6B47" : "#6B7280" }}>
              {story.isPublished ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {story.isPublished ? "Published" : "Draft"}
            </button>
            <Link href={`/admin/saree-stories/${story.id}/edit`} className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
              <Pencil className="h-4 w-4" />
            </Link>
            <button onClick={() => remove(story.id)} disabled={busyId === story.id} className="h-9 w-9 flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
              {busyId === story.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
