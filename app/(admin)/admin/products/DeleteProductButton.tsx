"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert("Error: " + (data.error ?? "Could not delete"));
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-red-50 disabled:opacity-50"
      style={{ borderColor: "#E5E7EB" }}
      title="Delete product"
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#EF4444" }} />
        : <Trash2 className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />}
    </button>
  );
}
