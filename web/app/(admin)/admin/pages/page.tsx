"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Save, Loader2, FileText } from "lucide-react";

interface CmsPage {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const emptyForm = () => ({ title: "", slug: "", content: "", isActive: true, metaTitle: "", metaDesc: "", sortOrder: "0" });
const inputCls = "w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none";
const inputStyle = { borderColor: "#E5E7EB", background: "white", color: "#111827" };

export default function PagesAdminPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<CmsPage & { content?: string } | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const set = (k: string) => (v: any) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    fetch("/api/admin/pages").then((r) => r.json()).then(setPages).finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setForm(emptyForm()); setEditTarget(null); setModal("add"); };
  const openEdit = (p: CmsPage) => {
    setForm({ title: p.title, slug: p.slug, content: "", isActive: p.isActive, metaTitle: "", metaDesc: "", sortOrder: String(p.sortOrder) });
    // Fetch full page content
    fetch(`/api/admin/pages/${p.id}`).then((r) => r.json()).then((d: any) => {
      setForm((f) => ({ ...f, content: d.content ?? "", metaTitle: d.metaTitle ?? "", metaDesc: d.metaDesc ?? "" }));
    });
    setEditTarget(p);
    setModal("edit");
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert("Title required"); return; }
    setSaving(true);
    const url = modal === "edit" ? `/api/admin/pages/${editTarget!.id}` : "/api/admin/pages";
    const method = modal === "edit" ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sortOrder: parseInt(form.sortOrder) || 0 }),
    });
    if (res.ok) {
      const saved = await res.json();
      if (modal === "add") setPages((p) => [...p, saved].sort((a, b) => a.sortOrder - b.sortOrder));
      else setPages((p) => p.map((x) => x.id === saved.id ? { ...x, ...saved } : x));
      setModal(null);
    } else { const d = await res.json(); alert(d.error ?? "Failed"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this page?")) return;
    setDeleting(id);
    await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    setPages((p) => p.filter((x) => x.id !== id));
    setDeleting(null);
  };

  const toggleActive = async (p: CmsPage) => {
    const res = await fetch(`/api/admin/pages/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (res.ok) setPages((prev) => prev.map((x) => x.id === p.id ? { ...x, isActive: !p.isActive } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "#111827" }}>CMS Pages</h1>
          <p className="text-sm font-body text-gray-500 mt-0.5">Terms, Privacy, Refund & other static pages</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-body text-white"
          style={{ background: "var(--color-primary)" }}>
          <Plus className="h-4 w-4" /> New Page
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-gray-300" /></div>
      ) : pages.length === 0 ? (
        <div className="rounded-xl border p-16 flex flex-col items-center gap-4" style={{ background: "white", borderColor: "#E5E7EB" }}>
          <FileText className="h-12 w-12 text-gray-200" />
          <div className="text-center">
            <p className="text-sm font-semibold font-body text-gray-700">No pages yet</p>
            <p className="text-xs font-body text-gray-400 mt-1">Create Terms, Privacy, Refund Policy and other static pages</p>
          </div>
          <button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-semibold font-body text-white" style={{ background: "var(--color-primary)" }}>
            Create First Page
          </button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                {["Title", "URL Slug", "Status", "Sort", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold font-body uppercase tracking-wide text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map((p, i) => (
                <tr key={p.id} className={i > 0 ? "border-t" : ""} style={{ borderColor: "#E5E7EB" }}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold font-body" style={{ color: "#111827" }}>{p.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-gray-500">/{p.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${p.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-body text-gray-500">{p.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <a href={`/${p.slug}`} target="_blank" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Preview">
                        <Eye className="h-3.5 w-3.5 text-gray-400" />
                      </a>
                      <button onClick={() => toggleActive(p)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        {p.isActive ? <EyeOff className="h-3.5 w-3.5 text-gray-400" /> : <Eye className="h-3.5 w-3.5 text-green-500" />}
                      </button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                        <Pencil className="h-3.5 w-3.5 text-blue-400" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        {deleting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" /> : <Trash2 className="h-3.5 w-3.5 text-red-400" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-3xl rounded-xl shadow-2xl my-8" style={{ background: "white" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="text-base font-semibold font-body" style={{ color: "#111827" }}>
                {modal === "add" ? "Create Page" : "Edit Page"}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">Page Title *</label>
                  <input value={form.title} onChange={(e) => set("title")(e.target.value)} className={inputCls} style={inputStyle} placeholder="Terms & Conditions" />
                </div>
                <div>
                  <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">URL Slug</label>
                  <input value={form.slug} onChange={(e) => set("slug")(e.target.value)} className={inputCls} style={inputStyle} placeholder="terms-and-conditions (auto-generated)" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">Page Content * (HTML supported)</label>
                <textarea value={form.content} onChange={(e) => set("content")(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg text-sm font-body focus:outline-none font-mono resize-y"
                  style={inputStyle} rows={14} placeholder="<h2>Section Title</h2><p>Content goes here...</p>" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">Meta Title</label>
                  <input value={form.metaTitle} onChange={(e) => set("metaTitle")(e.target.value)} className={inputCls} style={inputStyle} placeholder="SEO title" />
                </div>
                <div>
                  <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder")(e.target.value)} className={inputCls} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium font-body text-gray-700 mb-1.5">Meta Description</label>
                <textarea value={form.metaDesc} onChange={(e) => set("metaDesc")(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm font-body focus:outline-none resize-none"
                  style={inputStyle} rows={2} placeholder="SEO description" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => set("isActive")(!form.isActive)}
                  className="relative w-10 h-6 rounded-full transition-all cursor-pointer"
                  style={{ background: form.isActive ? "var(--color-primary)" : "#D1D5DB" }}>
                  <div className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all"
                    style={{ left: form.isActive ? "calc(100% - 18px)" : "2px" }} />
                </div>
                <span className="text-sm font-medium font-body text-gray-700">{form.isActive ? "Active (visible on site)" : "Hidden"}</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg text-sm font-body text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold font-body text-white disabled:opacity-60"
                style={{ background: "var(--color-primary)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving…" : "Save Page"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
