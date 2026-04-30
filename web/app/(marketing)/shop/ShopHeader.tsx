"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import ShopFilters, { type FilterAttribute } from "./ShopFilters";

interface Props {
  total: number;
  sortOptions: { label: string; value: string }[];
  currentSort: string;
  activeFilters: string[];
  attributes: FilterAttribute[];
  current: Record<string, string | undefined>;
}

export default function ShopHeader({
  total, sortOptions, currentSort, activeFilters,
  attributes, current,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const currentLabel = sortOptions.find((o) => o.value === currentSort)?.label ?? "Sort";

  const updateSort = (sort: string) => {
    const params = new URLSearchParams(sp.toString());
    params.set("sort", sort);
    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
    setSortOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: count + active filter pills */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{total.toLocaleString("en-IN")}</span>
            {" "}sarees
          </p>
          {activeFilters.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-body font-medium border"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", background: "var(--color-primary-50)" }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* Right: mobile filter button + sort */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-body font-medium border transition-colors hover:border-primary/50 hover:text-primary"
            style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)", background: "white" }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilters.length > 0 && (
              <span
                className="ml-0.5 h-4 w-4 flex items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: "var(--color-primary)", color: "white" }}
              >
                {activeFilters.length}
              </span>
            )}
          </button>

          {/* Custom sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="inline-flex items-center gap-2 h-9 px-3.5 pr-3 rounded-lg text-sm font-body font-medium border transition-all"
              style={{
                borderColor: sortOpen ? "var(--color-primary)" : "var(--color-parchment)",
                color: "var(--color-text-secondary)",
                background: "white",
                boxShadow: sortOpen ? "0 0 0 3px var(--color-primary-50)" : "none",
              }}
            >
              <span style={{ color: "var(--color-text-primary)" }}>{currentLabel}</span>
              <ChevronDown
                className="h-3.5 w-3.5 transition-transform duration-200"
                style={{
                  color: "var(--color-text-muted)",
                  transform: sortOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {sortOpen && (
              <div
                className="absolute right-0 mt-1.5 w-52 rounded-xl border shadow-md z-30 overflow-hidden animate-scale-in"
                style={{ background: "white", borderColor: "var(--color-parchment)" }}
              >
                {sortOptions.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => updateSort(o.value)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-body text-left transition-colors hover:bg-primary-50"
                    style={{ color: o.value === currentSort ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                  >
                    {o.label}
                    {o.value === currentSort && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-primary)" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div
            className="fixed inset-y-0 left-0 z-50 w-[min(320px,90vw)] overflow-y-auto shadow-xl animate-slide-in-left"
            style={{ background: "var(--color-ivory)" }}
          >
            <div
              className="sticky top-0 flex items-center justify-between px-5 py-4 border-b z-10"
              style={{ background: "var(--color-ivory)", borderColor: "var(--color-parchment)" }}
            >
              <p className="font-body font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
                Filters
                {activeFilters.length > 0 && (
                  <span
                    className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full"
                    style={{ background: "var(--color-primary)", color: "white" }}
                  >
                    {activeFilters.length}
                  </span>
                )}
              </p>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full transition-colors hover:bg-parchment"
              >
                <X className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
              </button>
            </div>
            <div className="px-5 pt-4">
              <ShopFilters attributes={attributes} current={current} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
