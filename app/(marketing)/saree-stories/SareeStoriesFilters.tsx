"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  regions: string[];
  fabrics: string[];
  categories: { id: string; name: string; slug: string }[];
  current: Record<string, string | undefined>;
}

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Name: A → Z", value: "name-asc" },
  { label: "Name: Z → A", value: "name-desc" },
];

export default function SareeStoriesFilters({ regions, fabrics, categories, current }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(current.q ?? "");

  const update = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(sp.toString());
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, sp]);

  const hasFilters = Object.entries(current).some(([k, v]) => v && !["sort", "page"].includes(k));

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick}
      className={cn("px-3 py-1.5 rounded-full text-xs font-body font-medium border transition-all",
        active ? "border-primary text-primary bg-primary-50" : "border-parchment text-text-secondary hover:border-primary/40")}>
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); update("q", q || null); }} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search saree stories…"
          className="w-full h-10 pl-9 pr-3 text-sm font-body border rounded-lg focus:outline-none"
          style={{ borderColor: "var(--color-parchment)", background: "var(--color-ivory)" }} />
      </form>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Filters</p>
        {hasFilters && (
          <button onClick={() => router.push("/saree-stories")} className="text-[11px] font-body font-medium hover:underline" style={{ color: "var(--color-error)" }}>
            Clear all
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] font-body mb-2.5" style={{ color: "var(--color-text-primary)" }}>Category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Chip key={c.id} label={c.name} active={current.category === c.slug} onClick={() => update("category", current.category === c.slug ? null : c.slug)} />
            ))}
          </div>
        </div>
      )}

      {regions.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] font-body mb-2.5" style={{ color: "var(--color-text-primary)" }}>Region</p>
          <div className="flex flex-wrap gap-2">
            {regions.map((r) => (
              <Chip key={r} label={r} active={current.region === r} onClick={() => update("region", current.region === r ? null : r)} />
            ))}
          </div>
        </div>
      )}

      {fabrics.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] font-body mb-2.5" style={{ color: "var(--color-text-primary)" }}>Fabric</p>
          <div className="flex flex-wrap gap-2">
            {fabrics.map((f) => (
              <Chip key={f} label={f} active={current.fabric === f} onClick={() => update("fabric", current.fabric === f ? null : f)} />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] font-body mb-2.5" style={{ color: "var(--color-text-primary)" }}>Sort By</p>
        <select value={current.sort ?? "newest"} onChange={(e) => update("sort", e.target.value)}
          className="w-full h-9 px-3 text-sm font-body border rounded-lg focus:outline-none"
          style={{ borderColor: "var(--color-parchment)", background: "var(--color-ivory)" }}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );
}
