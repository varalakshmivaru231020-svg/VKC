"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterAttribute {
  id: string;
  name: string;
  options: string[];
  inputType: string;
}

interface Props {
  attributes: FilterAttribute[];
  current: Record<string, string | undefined>;
}

const PRICE_PRESETS = [
  { label: "Under ₹5K",   min: "0",     max: "5000" },
  { label: "₹5K–₹15K",   min: "5000",  max: "15000" },
  { label: "₹15K–₹30K",  min: "15000", max: "30000" },
  { label: "Above ₹30K", min: "30000", max: "" },
];

export function attrKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export default function ShopFilters({ attributes, current }: Props) {
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

  const hasFilters = Object.entries(current).some(([k, v]) =>
    v && !["sort", "page", "q"].includes(k)
  );

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
            style={{ color: "var(--color-text-muted)", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
          />
        </button>
        {open && <div className="animate-slide-down overflow-hidden">{children}</div>}
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
      {/* Header */}
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

      {/* Price Range — always shown */}
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

      {/* Dynamic attribute filters */}
      {attributes.map((attr) => {
        if (!attr.options.length) return null;
        const key = attrKey(attr.name);
        return (
          <div key={attr.id}>
            <div className="gold-divider" />
            <Section id={attr.id} title={attr.name}>
              <div className="flex flex-wrap gap-2 mb-4">
                {attr.options.map((opt) => (
                  <CheckChip
                    key={opt}
                    label={opt}
                    active={current[key] === opt}
                    onClick={() => toggle(key, opt)}
                  />
                ))}
              </div>
            </Section>
          </div>
        );
      })}

      <div className="gold-divider" />

      {/* In Stock toggle — always shown */}
      <Section id="more" title="More Filters">
        <div className="space-y-3 mb-4">
          {(() => {
            const active = current.inStock === "true";
            return (
              <label className="flex items-center gap-3 cursor-pointer group">
                <button
                  onClick={() => update("inStock", active ? null : "true")}
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
                <span className="text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>In Stock Only</span>
              </label>
            );
          })()}
        </div>
      </Section>
    </div>
  );
}
