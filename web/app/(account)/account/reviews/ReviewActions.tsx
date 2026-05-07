"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit3, Trash2 } from "lucide-react";

export default function ReviewActions({ reviewId, orderId }: { reviewId: string; orderId: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!confirm("Delete this review?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/user/reviews/${reviewId}`, { method: "DELETE" });
      if (!res.ok) { alert("Failed to delete"); return; }
      router.refresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      {orderId && (
        <Link href={`/account/orders/${orderId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-body font-medium"
          style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
          <Edit3 className="h-3 w-3" /> Edit
        </Link>
      )}
      <button onClick={remove} disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-body font-medium disabled:opacity-50"
        style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}>
        <Trash2 className="h-3 w-3" /> Delete
      </button>
    </div>
  );
}
