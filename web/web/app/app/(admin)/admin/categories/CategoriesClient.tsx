"use client";

import { useState, useRef } from "react";
import { Tag, Plus, Pencil, Trash2, X, Save, Loader2, Upload, ImageIcon, ChevronRight, AlertCircle } from "lucide-react";
import { uploadImageFile } from "@/lib/utils/upload";
import { SmartImage } from "@/components/ui/SmartImage";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number };
}

interface Props { categories: Category[] }

const emptyForm = () => ({
  name: "", description: "", imageUrl: "", sortOrder: "0", isActive: true, parentId: "",
});

function treeSort(cats: Category[]): Array<{ cat: Category; depth: number }> {
  const result: Array<{ cat: Category; depth: number }> = [];
  function addLevel(parentId: string | null, depth: number) {
    cats
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .forEach(c => { result.push({ cat: c, depth }); addLevel(c.id, depth + 1); });
  }
  addLevel(null, 0);
  return result;
}

function getDescendantIds(cats: Category[], id: string): Set<string> {
  const result = new Set<string>();
  function traverse(pid: string) {
    cats.filter(c => c.parentId === pid).forEach(c => { result.add(c.id); traverse(c.id); });
  }
  traverse(id);
  return result;
}

export default function CategoriesClient({ categories: initial }: Props) {
  const [categories, setCategories] = useState(initial);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (v: any) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setForm(emptyForm());
    setImagePreview(null);
    setEditTarget(null);
    setModal("add");
  };

  const openEdit = (cat: Category) => {
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      imageUrl: cat.imageUrl ?? "",
      sortOrder: String(cat.sortOrder),
      isActive: cat.isActive,
      parentId: cat.parentId ?? "",
    });
    setImagePreview(cat.imageUrl ?? null);
    setEditTarget(cat);
    setModal("edit");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    const result = await uploadImageFile(file);
    setUploading(false);
    if (!result.ok) { setUploadError(`${result.error} — ${result.details}`); setImagePreview(null); return; }
    setForm((f) => ({ ...f, imageUrl: result.url }));
    setImagePreview(result.url);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert("Category name is required"); return; }
    setSaving(true);
    try {
      const url = modal === "edit" ? `/api/admin/categories/${editTarget!.id}` : "/api/admin/categories";
      const method = modal === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, parentId: form.parentId || null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      const saved = await res.json();
      // Supplement relations not returned by API
      const parentCat = form.parentId ? (categories.find(c => c.id === form.parentId) ?? null) : null;
      const full: Category = {
        ...saved,
        parent: parentCat ? { id: parentCat.id, name: parentCat.name } : null,
        _count: modal === "edit" ? editTarget!._count : { products: 0 },
      };
      if (modal === "add") {
        setCategories((p) => [...p, full].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
      } else {
        setCategories((p) => p.map((c) => c.id === full.id ? full : c));
      }
      setModal(null);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (cat: Category) => {
    if (cat._count.products > 0) {
      alert(`Cannot delete "${cat.name}" — it has ${cat._count.products} product(s). Move them first.`);
      return;
    }
    const children = categories.filter(c => c.parentId === cat.id);
    if (children.length > 0) {
      alert(`Cannot delete "${cat.name}" — it has ${children.length} subcategory(ies). Delete or reassign them first.`);
      return;
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    setDeleting(cat.id);
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setCategories((p) => p.filter((c) => c.id !== cat.id));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally { setDeleting(null); }
  };

  const focusStyle = {
    onFocus: (e: React.FocusEvent<any>) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)"; },
    onBlur: (e: React.FocusEvent<any>) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; },
  };

  const validParents = editTarget
    ? categories.filter(c => c.id !== editTarget.id && !getDescendantIds(categories, editTarget.id).has(c.id))
    : categories;

  const sorted = treeSort(categories);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Categories</h1>
            <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {categories.length} categor{categories.length === 1 ? "y" : "ies"} · multilevel supported
            </p>
          </div>
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-body font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--color-primary)", color: "white" }}>
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E5E7EB", background: "white" }}>
          {categories.length === 0 ? (
            <div className="p-16 flex flex-col items-center text-center gap-3">
              <Tag className="h-10 w-10" style={{ color: "#D1D5DB" }} />
              <p className="text-sm font-body font-semibold" style={{ color: "#111827" }}>No categories yet</p>
              <button onClick={openAdd} className="text-sm font-body font-medium" style={{ color: "var(--color-primary)" }}>
                Add your first category →
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  {["Category", "Parent", "Products", "Status", "Order", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest font-body" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ cat, depth }) => (
                  <tr key={cat.id} className="border-b last:border-0 transition-colors hover:bg-gray-50" style={{ borderColor: "#E5E7EB" }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3" style={{ paddingLeft: depth * 20 }}>
                        {depth > 0 && (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 -ml-1" style={{ color: "#D1D5DB" }} />
                        )}
                        {cat.imageUrl ? (
                          <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
                            <SmartImage src={cat.imageUrl} alt={cat.name} fill objectFit="cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--color-primary-50)" }}>
                            <Tag className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold font-body" style={{ color: "#111827" }}>{cat.name}</p>
                          <p className="text-[10px] font-mono" style={{ color: "#9CA3AF" }}>{cat.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {cat.parent ? (
                        <span className="text-xs font-body px-2 py-1 rounded-full" style={{ background: "#F3F4F6", color: "#6B7280" }}>
                          {cat.parent.name}
                        </span>
                      ) : (
                        <span className="text-xs font-body" style={{ color: "#D1D5DB" }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold font-body" style={{ color: "var(--color-primary)" }}>{cat._count.products}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold font-body rounded-full"
                        style={{ background: cat.isActive ? "#D1FAE5" : "#F3F4F6", color: cat.isActive ? "#065F46" : "#6B7280" }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: cat.isActive ? "#059669" : "#9CA3AF" }} />
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-body" style={{ color: "#9CA3AF" }}>{cat.sortOrder}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(cat)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-blue-50"
                          style={{ borderColor: "#E5E7EB" }} title="Edit">
                          <Pencil className="h-3.5 w-3.5" style={{ color: "#3B82F6" }} />
                        </button>
                        <button onClick={() => handleDelete(cat)} disabled={deleting === cat.id}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-red-50"
                          style={{ borderColor: "#E5E7EB" }} title="Delete">
                          {deleting === cat.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#EF4444" }} />
                            : <Trash2 className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" style={{ background: "white" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
              <h2 className="text-base font-semibold font-body" style={{ color: "#111827" }}>
                {modal === "add" ? "Add Category" : `Edit: ${editTarget?.name}`}
              </h2>
              <button onClick={() => setModal(null)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" style={{ color: "#6B7280" }} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Category Name *</label>
                <input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Silk Sarees"
                  className="w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none transition-all"
                  style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} {...focusStyle} />
              </div>

              {/* Parent category */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Parent Category</label>
                <select value={form.parentId} onChange={(e) => set("parentId")(e.target.value)}
                  className="w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none transition-all"
                  style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} {...focusStyle}>
                  <option value="">None (top-level)</option>
                  {validParents.map(cat => {
                    const indent = cat.parentId ? "  ↳ " : "";
                    return <option key={cat.id} value={cat.id}>{indent}{cat.name}</option>;
                  })}
                </select>
                <p className="text-[10px] font-body" style={{ color: "#9CA3AF" }}>
                  Leave empty to create a top-level category shown in the header nav.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Description</label>
                <textarea value={form.description} onChange={(e) => set("description")(e.target.value)} rows={2}
                  placeholder="Short description of this category"
                  className="w-full px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none transition-all resize-none"
                  style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} {...focusStyle} />
              </div>

              {/* Image */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Category Image</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
                    style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}
                    onClick={() => fileRef.current?.click()}>
                    {imagePreview
                      ? <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                      : <ImageIcon className="h-5 w-5" style={{ color: "#D1D5DB" }} />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <button onClick={() => { setUploadError(null); fileRef.current?.click(); }} disabled={uploading}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium font-body transition-colors hover:bg-gray-50"
                      style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {uploading ? "Converting & uploading…" : "Upload Image"}
                    </button>
                    <p className="text-[10px] font-body" style={{ color: "#9CA3AF" }}>Any image · Auto-converted to WebP</p>
                    {uploadError && (
                      <div className="flex items-start gap-1.5 p-2 rounded-lg text-[10px] font-body" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                        <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" /><span>{uploadError}</span>
                      </div>
                    )}
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              {/* Sort Order + Active */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder")(e.target.value)}
                    className="w-full h-10 px-4 border rounded-lg text-sm font-body focus:outline-none transition-all"
                    style={{ borderColor: "#E5E7EB", background: "white", color: "#111827" }} {...focusStyle} />
                </div>
                <div className="space-y-1.5 flex flex-col justify-end pb-0.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => set("isActive")(!form.isActive)}
                      className="relative w-10 h-6 rounded-full transition-all cursor-pointer"
                      style={{ background: form.isActive ? "var(--color-primary)" : "#D1D5DB" }}>
                      <div className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all"
                        style={{ left: form.isActive ? "calc(100% - 18px)" : "2px" }} />
                    </div>
                    <span className="text-sm font-medium font-body" style={{ color: "#374151" }}>
                      {form.isActive ? "Active" : "Inactive"}
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
                {saving ? "Saving…" : modal === "add" ? "Create Category" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
