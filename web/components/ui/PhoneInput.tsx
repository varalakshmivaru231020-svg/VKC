"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: "IN", name: "India",          dial: "+91",  flag: "🇮🇳" },
  { code: "US", name: "United States",  dial: "+1",   flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dial: "+44",  flag: "🇬🇧" },
  { code: "AU", name: "Australia",      dial: "+61",  flag: "🇦🇺" },
  { code: "CA", name: "Canada",         dial: "+1",   flag: "🇨🇦" },
  { code: "SG", name: "Singapore",      dial: "+65",  flag: "🇸🇬" },
  { code: "AE", name: "UAE",            dial: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia",   dial: "+966", flag: "🇸🇦" },
  { code: "MY", name: "Malaysia",       dial: "+60",  flag: "🇲🇾" },
  { code: "QA", name: "Qatar",          dial: "+974", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait",         dial: "+965", flag: "🇰🇼" },
  { code: "BH", name: "Bahrain",        dial: "+973", flag: "🇧🇭" },
  { code: "OM", name: "Oman",           dial: "+968", flag: "🇴🇲" },
  { code: "NZ", name: "New Zealand",    dial: "+64",  flag: "🇳🇿" },
  { code: "DE", name: "Germany",        dial: "+49",  flag: "🇩🇪" },
  { code: "FR", name: "France",         dial: "+33",  flag: "🇫🇷" },
  { code: "JP", name: "Japan",          dial: "+81",  flag: "🇯🇵" },
  { code: "CN", name: "China",          dial: "+86",  flag: "🇨🇳" },
  { code: "IT", name: "Italy",          dial: "+39",  flag: "🇮🇹" },
  { code: "NL", name: "Netherlands",    dial: "+31",  flag: "🇳🇱" },
  { code: "CH", name: "Switzerland",    dial: "+41",  flag: "🇨🇭" },
  { code: "MV", name: "Maldives",       dial: "+960", flag: "🇲🇻" },
  { code: "LK", name: "Sri Lanka",      dial: "+94",  flag: "🇱🇰" },
  { code: "BD", name: "Bangladesh",     dial: "+880", flag: "🇧🇩" },
  { code: "PK", name: "Pakistan",       dial: "+92",  flag: "🇵🇰" },
  { code: "NP", name: "Nepal",          dial: "+977", flag: "🇳🇵" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  dialCode: string;
  onDialCodeChange: (dial: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
  height?: string;
}

export function PhoneInput({
  value, onChange, dialCode, onDialCodeChange,
  placeholder = "Enter mobile number",
  autoFocus, onEnter, height = "h-12",
}: PhoneInputProps) {
  const [open, setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef  = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = COUNTRIES.find((c) => c.dial === dialCode) ?? COUNTRIES[0];

  const filtered = search
    ? COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search)
      )
    : COUNTRIES;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
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
    <div className="relative" ref={wrapRef}>
      <div
        className={`flex items-center gap-0 border rounded-lg overflow-visible transition-all`}
        style={{ borderColor: "var(--color-parchment)" }}
        onFocusCapture={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px var(--color-primary-50)";
        }}
        onBlurCapture={(e) => {
          if (!wrapRef.current?.contains(e.relatedTarget as Node)) {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--color-parchment)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }
        }}
      >
        {/* Country code button */}
        <button
          type="button"
          onClick={() => { setOpen((o) => !o); setSearch(""); }}
          className={`flex items-center gap-1.5 px-3 ${height} border-r shrink-0 text-sm font-body font-medium select-none transition-colors rounded-l-lg`}
          style={{
            background: "var(--color-cream)",
            borderColor: "var(--color-parchment)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="tabular-nums">{selected.dial}</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
            style={{ color: "var(--color-text-disabled)" }}
          />
        </button>

        {/* Phone number input */}
        <input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 15))}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
          placeholder={placeholder}
          className={`flex-1 ${height} px-3 text-sm font-body focus:outline-none bg-white rounded-r-lg`}
          style={{ color: "var(--color-text-primary)" }}
          autoFocus={autoFocus}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1 w-72 rounded-xl border shadow-xl overflow-hidden"
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
                placeholder="Search country or code…"
                className="flex-1 text-sm font-body bg-transparent focus:outline-none"
                style={{ color: "var(--color-text-primary)" }}
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm font-body text-center" style={{ color: "var(--color-text-muted)" }}>
                No results
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onDialCodeChange(c.dial);
                    onChange("");
                    setOpen(false);
                    setSearch("");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-body text-left transition-colors hover:bg-cream"
                  style={{
                    background: c.code === selected.code ? "var(--color-primary-50)" : "transparent",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <span className="text-base shrink-0">{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="shrink-0 tabular-nums text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                    {c.dial}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
