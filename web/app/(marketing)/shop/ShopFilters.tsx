"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  fabrics: string[];
  occasions: string[];
  regions: string[];
  current: Record<string, string | undefined>;
}

const PRICE_PRESETS = [
  { label: "Under ₹5K",   min: "0",     max: "5000" },
  { label: "₹5K–₹15K",   min: "5000",  max: "15000" },
  { label: "₹15K–₹30K",  min: "15000", max: "30000" },
  { label: "Above ₹30K", min: "30000", max: "" },
];

export default function ShopFilters({ fabrics, occasions, regions, current }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const update = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(sp.toString());
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, sp]);

  const toggle = (key: string, value: string) => {
    update(key, current[key] === value ? null : value);
  };

  const toggleSection = (key: string) => {
    setCollapsed((s) => ({ ...s, [key]: !s[key] }));
  };

  const hasFilters = Object.values(current).some(Boolean);

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => {
    const open = !collapsed[id];
    return (
      <div>
        <button
          onClick={() => toggleSection(id)}
          className="flex items-center justify-between w-full py-1 mb-3 group"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] font-body" style={{ color: "var(--color-text-primary)" }}>
            {title}
          </p>
          <ChevronDown
            className="h-3.5 w-3.5 transition-transform duration-200"
            style={{
              color: "var(--color-text-muted)",
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            }}
          />
        </button>
        {open && (
          <div className="animate-slide-down overflow-hidden">
            {children}
          </div>
        )}
      </div>
    );
  };

  const CheckChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium border transition-all duration-150 cursor-pointer",
        active
          ? "border-primary text-primary bg-primary-50"
          : "border-parchment text-text-secondary hover:border-primary/40 hover:bg-white"
      )}
    >
      {active && <X className="h-3 w-3 shrink-0" />}
      {label}
    </button>
  );

  return (
    <div className="space-y-6 pb-8">

      {/* Header row */}
      <div className="flex items-center justify-between pb-1">
        <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Filters</p>
        {hasFilters && (
          <button
            onClick={() => router.push("/shop")}
            className="text-[11px] font-body font-medium transition-colors hover:underline"
            style={{ color: "var(--color-error)" }}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="gold-divider" />

      {/* Price */}
      <Section id="price" title="Price Range">
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              defaultValue={current.minPrice}
              onBlur={(e) => update("minPrice", e.target.value || null)}
              className="w-full h-9 px-3 text-sm font-body border rounded-md focus:outline-none transition-colors"
              style={{ borderColor: "var(--color-parchment)", background: "var(--color-ivory)", color: "var(--color-text-primary)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
              onBlurCapture={(e) => { e.currentTarget.style.borderColor = "var(--color-parchment)"; }}
            />
            <span className="text-xs font-body shrink-0" style={{ color: "var(--color-text-muted)" }}>to</span>
            <input
              type="number"
              placeholder="Max"
              defaultValue={current.maxPrice}
              onBlur={(e) => update("maxPrice", e.target.value || null)}
              className="w-full h-9 px-3 text-sm font-body border rounded-md focus:outline-none transition-colors"
              style={{ borderColor: "var(--color-parchment)", background: "var(--color-ivory)", color: "var(--color-text-primary)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
              onBlurCapture={(e) => { e.currentTarget.style.borderColor = "var(--color-parchment)"; }}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PRICE_PRESETS.map(({ label, min, max }) => {
              const active = current.minPrice === min && (current.maxPrice === max || (!current.maxPrice && !max));
              return (
                <button
                  key={label}
                  onClick={() => { update("minPrice", min); update("maxPrice", max || null); }}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-body font-medium rounded-full border transition-all",
                    active ? "border-primary text-primary bg-primary-50" : "border-parchment text-text-muted hover:border-primary/40"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      <div className="gold-divider" />

      {/* Occasion */}
      <Section id="occasion" title="Occasion">
        <div className="flex flex-wrap gap-2 mb-4">
          {occasions.map((o) => (
            <CheckChip key={o} label={o} active={current.occasion === o} onClick={() => toggle("occasion", o)} />
          ))}
        </div>
      </Section>

      <div className="gold-divider" />

      {/* Fabric */}
      <Section id="fabric" title="Fabric">
        <div className="flex flex-wrap gap-2 mb-4">
          {fabrics.map((f) => (
            <CheckChip key={f} label={f} active={current.fabric === f} onClick={() => toggle("fabric", f)} />
          ))}
        </div>
      </Section>

      <div className="gold-divider" />

      {/* Region */}
      <Section id="region" title="Region">
        <div className="space-y-2.5 mb-4">
          {regions.map((r) => {
            const active = current.region === r;
            return (
              <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => toggle("region", r)}
                  className={cn(
                    "w-4 h-4 rounded-sm border flex items-center justify-center transition-all shrink-0",
                    active ? "border-primary bg-primary" : "border-parchment group-hover:border-primary/50"
                  )}
                >
                  {active && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1,5 4,8 11,1" />
                    </svg>
                  )}
                </div>
                <span
                  className="text-sm font-body transition-colors"
                  style={{ color: active ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                >
                  {r}
                </span>
              </label>
            );
          })}
        </div>
      </Section>

      <div className="gold-divider" />

      {/* More Filters */}
      <Section id="more" title="More Filters">
        <div className="space-y-3 mb-4">
          {[
            { key: "inStock", label: "In Stock Only" },
          ].map(({ key, label }) => {
            const active = current[key] === "true";
            return (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <button
                  onClick={() => update(key, active ? null : "true")}
                  className={cn(
                    "relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0",
                    active ? "bg-primary" : "bg-parchment"
                  )}
                  role="switch"
                  aria-checked={active}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                      active ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
                <span className="text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
              </label>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
