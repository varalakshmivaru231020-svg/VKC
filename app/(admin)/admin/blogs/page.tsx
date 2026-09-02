"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, X, Save, Loader2,
  BookOpen, Upload, ImageIcon, AlertCircle,
} from "lucide-react";
import { uploadImageFile } from "@/lib/utils/upload";
import { SmartImage } from "@/components/ui/SmartImage";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  tags: string[];
  createdAt: string;
}

const emptyForm = () => ({
  title: "", excerpt: "", content: "", imageUrl: "",
  tags: "", isPublished: false, metaTitle: "", metaDesc: "",
});

const inputCls = "w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none";
const inputStyle = { borderColor: "#E5E7EB", background: "white", color: "#111827" };

export default function BlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Blog | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string) => (v: any) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    fetch("/api/admin/blogs")
      .then((r) => r.json())
      .then((d) => setBlogs(d.blogs ?? []))
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setForm(emptyForm()); setEditTarget(null); setUploadError(null); setModal("add"); };
  const openEdit = (b: Blog) => {
    setUploadError(null);
    setForm({ title: b.title, excerpt: b.excerpt ?? "", content: "", imageUrl: b.imageUrl ?? "", tags: b.tags.join(", "), isPublished: b.isPublished, metaTitle: "", metaDesc: "" });
    fetch(`/api/admin/blogs/${b.id}`).then((r) => r.json()).then((d) => setForm((f) => ({ ...f, content: d.content, metaTitle: d.metaTitle ?? "", metaDesc: d.metaDesc ?? "" })));
    setEditTarget(b);
    setModal("edit");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    setUploadError(null);
    const result = await uploadImageFile(file);
    setUploading(false);
    if (!result.ok) { setUploadError(`${result.error} — ${result.details}`); return; }
    set("imageUrl")(result.url);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert("Title required"); return; }
    if (!form.content.trim()) { alert("Content required"); return; }
    setSaving(true);
    const url = modal === "edit" ? `/api/admin/blogs/${editTarget!.id}` : "/api/admin/blogs";
    const method = modal === "edit" ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) }),
    });
    if (res.ok) {
      const saved = await res.json();
      if (modal === "add") setBlogs((p) => [saved, ...p]);
      else setBlogs((p) => p.map((b) => b.id === saved.id ? { ...b, ...saved } : b));
      setModal(null);
    } else {
      const d = await res.json(); alert(d.error ?? "Failed");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    setDeleting(id);
    await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
    setBlogs((p) => p.filter((b) => b.id !== id));
    setDeleting(null);
  };

  const togglePublish = async (b: Blog) => {
    const res = await fetch(`/api/admin/blogs/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !b.isPublished }),
    });
    if (res.ok) setBlogs((p) => p.map((x) => x.id === b.id ? { ...x, isPublished: !b.isPublished } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "#111827" }}>Blog Posts</h1>
          <p className="text-sm font-body text-gray-500 mt-0.5">{blogs.length} post{blogs.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-body text-white"
          style={{ background: "var(--color-primary)" }}>
          <Plus className="h-4 w-4" /> New Post
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-gray-300" /></div>
      ) : blogs.length === 0 ? (
        <div className="rounded-xl border p-16 flex flex-col items-center gap-4" style={{ background: "white", borderColor: "#E5E7EB" }}>
          <BookOpen className="h-12 w-12 text-gray-200" />
          <div className="text-center">
            <p className="text-sm font-semibold font-body text-gray-700">No blog posts yet</p>
            <p className="text-xs font-body text-gray-400 mt-1">Create your first blog post to engage customers</p>
          </div>
          <button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-semibold font-body text-white" style={{ background: "var(--color-primary)" }}>
            <Plus className="h-4 w-4 inline mr-1" />Create Post
          </button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
          {blogs.map((blog, i) => (
            <div key={blog.id} className={`flex gap-4 p-4 items-center ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "#E5E7EB" }}>
              <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "#F3F4F6" }}>
                {blog.imageUrl
                  ? <SmartImage src={blog.imageUrl} alt="" fill objectFit="cover" />
                  : <ImageIcon className="h-5 w-5 m-auto mt-3.5 text-gray-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold font-body truncate" style={{ color: "#111827" }}>{blog.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${blog.isPublished ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {blog.isPublished ? "Published" : "Draft"}
                  </span>
                  <span className="text-xs font-body text-gray-400">
                    {new Date(blog.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  {blog.tags.length > 0 && (
                    <span className="text-xs font-body text-gray-400">{blog.tags.slice(0, 2).join(", ")}{blog.tags.length > 2 ? "…" : ""}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => togglePublish(blog)} className="p-2 rounded-lg hover:bg-gray-50 transition-colors" title={blog.isPublished ? "Unpublish" : "Publish"}>
                  {blog.isPublished ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
                <button onClick={() => openEdit(blog)} className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Pencil className="h-4 w-4 text-blue-400" />
                </button>
                <button onClick={() => handleDelete(blog.id)} disabled={deleting === blog.id} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                  {deleting === blog.id ? <Loader2 className="h-4 w-4 animate-spin text-red-400" /> : <Trash2 className="h-4 w-4 text-red-400" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-2xl rounded-xl shadow-2xl my-8" style={{ background: "white" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="text-base font-semibold font-body" style={{ color: "#111827" }}>
                {modal === "add" ? "New Blog Post" : "Edit Blog Post"}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">Title *</label>
                <input value={form.title} onChange={(e) => set("title")(e.target.value)} className={inputCls} style={inputStyle} placeholder="Blog post title" />
              </div>
              <div>
                <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">Excerpt</label>
                <textarea value={form.excerpt} onChange={(e) => set("excerpt")(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm font-body focus:outline-none resize-y"
                  style={inputStyle} rows={2} placeholder="Brief summary shown on listing page" />
              </div>
              <div>
                <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">Content *</label>
                <textarea value={form.content} onChange={(e) => set("content")(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm font-body focus:outline-none resize-y"
                  style={inputStyle} rows={10} placeholder="Write your blog content here... (HTML supported)" />
              </div>
              <div>
                <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">Featured Image</label>
                {form.imageUrl && <img src={form.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg mb-2 border" style={{ borderColor: "#E5E7EB" }} />}
                <div className="flex items-center gap-3">
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium font-body hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploading ? "Converting & uploading…" : "Upload Image"}
                  </button>
                  <input value={form.imageUrl} onChange={(e) => set("imageUrl")(e.target.value)}
                    className="flex-1 h-8 px-3 border rounded-lg text-xs font-body focus:outline-none"
                    style={inputStyle} placeholder="Or paste image URL" />
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                {uploadError && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg text-xs font-body mt-2" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{uploadError}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">Tags (comma separated)</label>
                  <input value={form.tags} onChange={(e) => set("tags")(e.target.value)} className={inputCls} style={inputStyle} placeholder="jaggery, health, recipes" />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => set("isPublished")(!form.isPublished)}
                      className="relative w-10 h-6 rounded-full transition-all cursor-pointer"
                      style={{ background: form.isPublished ? "#059669" : "#D1D5DB" }}>
                      <div className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all"
                        style={{ left: form.isPublished ? "calc(100% - 18px)" : "2px" }} />
                    </div>
                    <span className="text-sm font-medium font-body text-gray-700">
                      {form.isPublished ? "Published" : "Draft"}
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg text-sm font-body text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold font-body text-white disabled:opacity-60"
                style={{ background: "var(--color-primary)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving…" : "Save Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
