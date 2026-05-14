"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function SearchableSelect({
  label, value, onChange, options, placeholder = "Select…", error, required, disabled,
}: SearchableSelectProps) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref       = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 10);
  }, [open]);

  return (
    <div className="space-y-1.5" ref={ref}>
      <label className="block text-sm font-medium font-body" style={{ color: "var(--color-text-primary)" }}>
        {label}{required && " *"}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => { if (!disabled) { setOpen((o) => !o); setSearch(""); } }}
          className="w-full h-11 px-4 border rounded-md text-sm font-body text-left flex items-center justify-between focus:outline-none transition-all"
          style={{
            borderColor: error ? "var(--color-error)" : open ? "var(--color-primary)" : "var(--color-parchment)",
            background: disabled ? "var(--color-cream)" : "white",
            color: value ? "var(--color-text-primary)" : "var(--color-text-disabled)",
            boxShadow: open ? "0 0 0 3px var(--color-primary-50)" : "0 1px 2px rgba(0,0,0,0.04)",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.7 : 1,
          }}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
            style={{ color: "var(--color-text-muted)" }}
          />
        </button>

        {open && (
          <div
            className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border shadow-xl overflow-hidden"
            style={{ background: "white", borderColor: "var(--color-parchment)" }}
          >
            {/* Search */}
            <div className="p-2 border-b" style={{ borderColor: "var(--color-parchment)" }}>
              <div
                className="flex items-center gap-2 px-3 h-9 rounded-lg border"
                style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}
              >
                <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-text-disabled)" }} />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="flex-1 text-sm font-body bg-transparent focus:outline-none"
                  style={{ color: "var(--color-text-primary)" }}
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm font-body text-center" style={{ color: "var(--color-text-muted)" }}>
                  No results
                </p>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => { onChange(o); setOpen(false); setSearch(""); }}
                    className="w-full px-4 py-2.5 text-sm font-body text-left transition-colors hover:bg-cream"
                    style={{
                      background: o === value ? "var(--color-primary-50)" : "transparent",
                      color: o === value ? "var(--color-primary)" : "var(--color-text-primary)",
                      fontWeight: o === value ? 600 : 400,
                    }}
                  >
                    {o}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs font-medium" style={{ color: "var(--color-error)" }}>{error}</p>}
    </div>
  );
}

export const COUNTRY_NAMES = [
  "India", "United States", "United Kingdom", "Australia", "Canada",
  "Singapore", "UAE", "Saudi Arabia", "Malaysia", "Qatar",
  "Kuwait", "Bahrain", "Oman", "New Zealand", "Germany",
  "France", "Japan", "China", "Italy", "Netherlands",
  "Switzerland", "Maldives", "Sri Lanka", "Bangladesh", "Pakistan", "Nepal",
  "South Africa", "Kenya", "Nigeria", "Indonesia", "Thailand",
  "Philippines", "Vietnam", "South Korea", "Israel", "Turkey",
  "Russia", "Brazil", "Mexico", "Argentina", "Spain", "Portugal",
];
