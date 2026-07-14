"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";

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

function Dropdown({
  label, value, valueLabel, options, onSelect, panelClassName = "w-64",
}: {
  label: string;
  value: string | undefined;
  valueLabel?: string;
  options: { label: string; value: string }[];
  onSelect: (v: string | null) => void;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buttonLabel = value ? (valueLabel ?? value) : label;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 h-9 max-w-[220px] px-3.5 rounded-lg text-sm font-body font-medium border transition-all"
        style={{
          borderColor: value ? "var(--color-primary)" : open ? "var(--color-primary)" : "var(--color-parchment)",
          color: value ? "var(--color-primary)" : "var(--color-text-secondary)",
          background: value ? "var(--color-primary-50)" : "white",
          boxShadow: open ? "0 0 0 3px var(--color-primary-50)" : "none",
        }}
      >
        <span className="truncate">{buttonLabel}</span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
          style={{ color: "var(--color-text-muted)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-1.5 ${panelClassName} max-h-80 overflow-y-auto rounded-xl border shadow-md z-30 animate-scale-in`}
          style={{ background: "white", borderColor: "var(--color-parchment)" }}
        >
          {value && (
            <button
              onClick={() => { onSelect(null); setOpen(false); }}
              className="w-full flex items-center gap-1.5 px-4 py-2.5 text-sm font-body text-left border-b transition-colors hover:bg-cream"
              style={{ color: "var(--color-error)", borderColor: "var(--color-parchment)" }}
            >
              <X className="h-3.5 w-3.5 shrink-0" /> Clear {label}
            </button>
          )}
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onSelect(o.value); setOpen(false); }}
              className="w-full flex items-start justify-between gap-2 px-4 py-2.5 text-sm font-body text-left transition-colors hover:bg-primary-50"
              style={{ color: o.value === value ? "var(--color-primary)" : "var(--color-text-secondary)" }}
            >
              <span className="leading-snug">{o.label}</span>
              {o.value === value && <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SareeStoriesFilters({ regions, fabrics, current }: Props) {
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
  const sortLabel = SORT_OPTIONS.find((o) => o.value === (current.sort ?? "newest"))?.label ?? "Sort";

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <form onSubmit={(e) => { e.preventDefault(); update("q", q || null); }} className="relative flex-1 min-w-[220px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search saree stories…"
          className="w-full h-9 pl-9 pr-3 text-sm font-body border rounded-lg focus:outline-none"
          style={{ borderColor: "var(--color-parchment)", background: "var(--color-ivory)" }} />
      </form>

      <div className="flex items-center gap-2.5 flex-wrap">
        {hasFilters && (
          <button onClick={() => { setQ(""); router.push("/saree-stories"); }} className="text-[11px] font-body font-medium hover:underline shrink-0" style={{ color: "var(--color-error)" }}>
            Clear all
          </button>
        )}

        {regions.length > 0 && (
          <Dropdown
            label="Region"
            value={current.region}
            options={regions.map((r) => ({ label: r, value: r }))}
            onSelect={(v) => update("region", v)}
            panelClassName="w-80"
          />
        )}

        {fabrics.length > 0 && (
          <Dropdown
            label="Fabric"
            value={current.fabric}
            options={fabrics.map((f) => ({ label: f, value: f }))}
            onSelect={(v) => update("fabric", v)}
            panelClassName="w-56"
          />
        )}

        <Dropdown
          label="Sort"
          value={current.sort ?? "newest"}
          valueLabel={sortLabel}
          options={SORT_OPTIONS}
          onSelect={(v) => update("sort", v)}
          panelClassName="w-56"
        />
      </div>
    </div>
  );
}
