"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, Check, ArrowUpDown } from "lucide-react";
import ShopFilters, { type FilterAttribute, type ColorSwatch } from "./ShopFilters";

interface Props {
  total: number;
  sortOptions: { label: string; value: string }[];
  currentSort: string;
  activeFilters: string[];
  attributes: FilterAttribute[];
  colors?: ColorSwatch[];
  current: Record<string, string | undefined>;
}

export default function ShopHeader({
  total, sortOptions, currentSort, activeFilters,
  attributes, colors = [], current,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const currentLabel = sortOptions.find((o) => o.value === currentSort)?.label ?? "Sort";

  const updateSort = (sort: string) => {
    const params = new URLSearchParams(sp.toString());
    params.set("sort", sort);
    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
    setSortOpen(false);
    setMobileSortOpen(false);
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

  // Lock body scroll when any sheet is open
  useEffect(() => {
    const open = filtersOpen || mobileSortOpen;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [filtersOpen, mobileSortOpen]);

  return (
    <>
      <div className="hidden sm:flex items-center justify-between gap-4 flex-wrap">
        {/* Left: count + active filter pills */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{total.toLocaleString("en-IN")}</span>
            {" "}products
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

        {/* Right: sort dropdown — visible from sm upward; mobile uses the bottom bar */}
        <div className="hidden sm:flex items-center gap-2.5">
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

      {/* ── Mobile fixed bottom bar: SORT | FILTER (sits above bottom nav) ── */}
      <div
        className="lg:hidden fixed bottom-16 inset-x-0 z-30 grid grid-cols-2 border-t shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
        style={{ background: "white", borderColor: "var(--color-parchment)" }}
      >
        <button
          onClick={() => setMobileSortOpen(true)}
          className="flex items-center justify-center gap-2 h-14 text-sm font-body font-semibold border-r transition-colors active:bg-cream"
          style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}
        >
          <ArrowUpDown className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
          SORT
        </button>
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex items-center justify-center gap-2 h-14 text-sm font-body font-semibold transition-colors active:bg-cream relative"
          style={{ color: "var(--color-text-primary)" }}
        >
          <SlidersHorizontal className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
          FILTER
          {activeFilters.length > 0 && (
            <span
              className="absolute top-3 right-6 h-4 min-w-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: "var(--color-primary)", color: "white" }}
            >
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* Spacer so page content isn't hidden behind the bottom bar on mobile */}
      <div className="lg:hidden h-14" aria-hidden />

      {/* ── Mobile SORT bottom sheet ── */}
      {mobileSortOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileSortOpen(false)}
          />
          <div
            className="relative w-full max-w-2xl rounded-t-2xl overflow-hidden animate-slide-up"
            style={{ background: "white", maxHeight: "80vh" }}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <p className="text-sm font-body font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-primary)" }}>
                Sort By
              </p>
              <button
                onClick={() => setMobileSortOpen(false)}
                aria-label="Close"
                className="h-8 w-8 flex items-center justify-center rounded-full transition-colors hover:bg-cream"
              >
                <X className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
              </button>
            </div>
            <div className="border-t" style={{ borderColor: "var(--color-parchment)" }}>
              <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 100px)" }}>
                {sortOptions.map((o) => {
                  const active = o.value === currentSort;
                  return (
                    <button
                      key={o.value}
                      onClick={() => updateSort(o.value)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left border-b transition-colors active:bg-cream"
                      style={{
                        borderColor: "var(--color-parchment)",
                        background: active ? "var(--color-primary-50)" : "white",
                      }}
                    >
                      <span
                        className="text-sm font-body"
                        style={{
                          color: active ? "var(--color-primary)" : "var(--color-text-primary)",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {o.label}
                      </span>
                      {active && (
                        <span
                          className="h-6 w-6 flex items-center justify-center rounded-full"
                          style={{ background: "var(--color-primary)" }}
                        >
                          <Check className="h-3.5 w-3.5" style={{ color: "white" }} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile FILTER bottom sheet ── */}
      {filtersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)}
          />
          <div
            className="relative w-full max-w-3xl rounded-t-2xl overflow-hidden flex flex-col animate-slide-up"
            style={{ background: "var(--color-ivory)", maxHeight: "92vh" }}
          >
            {/* Header with title, reset, and right-aligned close */}
            <div
              className="flex items-center justify-between gap-3 px-5 py-4 border-b shrink-0"
              style={{ background: "white", borderColor: "var(--color-parchment)" }}
            >
              <p className="text-sm font-body font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-primary)" }}>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/shop")}
                  className="inline-flex items-center gap-1 text-xs font-body font-medium transition-colors"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close"
                  className="h-8 w-8 flex items-center justify-center rounded-full transition-colors hover:bg-cream"
                >
                  <X className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
                </button>
              </div>
            </div>

            {/* Scrollable filter body */}
            <div className="flex-1 overflow-y-auto px-5 pt-4">
              <ShopFilters attributes={attributes} colors={colors} current={current} />
            </div>

            {/* Sticky footer: CLOSE | APPLY FILTERS */}
            <div
              className="grid grid-cols-2 gap-3 px-4 py-3 border-t shrink-0"
              style={{ background: "white", borderColor: "var(--color-parchment)" }}
            >
              <button
                onClick={() => setFiltersOpen(false)}
                className="h-12 rounded-md text-sm font-body font-semibold uppercase tracking-wide transition-colors active:bg-cream"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Close
              </button>
              <button
                onClick={() => setFiltersOpen(false)}
                className="h-12 rounded-md text-sm font-body font-semibold uppercase tracking-wide transition-colors"
                style={{ background: "var(--color-primary)", color: "white" }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
