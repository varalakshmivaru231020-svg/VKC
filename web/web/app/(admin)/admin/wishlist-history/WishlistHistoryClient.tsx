"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Heart, Search, Download, Calendar, Package,
  ChevronLeft, ChevronRight, Loader2, X,
} from "lucide-react";
import Link from "next/link";

interface WishlistVariant {
  id: string; colorName: string; colorHex: string;
  sareeCode: string | null; salePrice: number; originalPrice: number;
  product: { id: string; name: string };
  images: { url: string }[];
}
interface WishlistUser {
  id: string; firstName: string | null; lastName: string | null;
  email: string | null; phone: string | null; customerNumber: number | null; isActive: boolean;
}
interface WishlistItem { id: string; addedAt: string; user: WishlistUser; variant: WishlistVariant; }
interface TopProduct { count: number; variant: { id: string; colorName: string; product: { name: string }; images: { url: string }[] } }

function customerName(u: WishlistUser) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "—";
}
function fmt(n: number) { return "₹" + Number(n).toLocaleString("en-IN"); }

export default function WishlistHistoryClient() {
  const [items, setItems]           = useState<WishlistItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [exporting, setExporting]   = useState(false);

  const [qInput, setQInput]             = useState("");
  const [productInput, setProductInput] = useState("");
  const [from, setFrom]                 = useState("");
  const [to, setTo]                     = useState("");

  const [filters, setFilters] = useState({ q: "", product: "", from: "", to: "", page: 1 });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const commitText = useCallback((q: string, product: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters(f => ({ ...f, q, product, page: 1 }));
    }, 400);
  }, []);

  useEffect(() => { commitText(qInput, productInput); }, [qInput, productInput, commitText]);
  useEffect(() => { setFilters(f => ({ ...f, from, to, page: 1 })); }, [from, to]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ page: String(filters.page) });
    if (filters.q)       params.set("q", filters.q);
    if (filters.product) params.set("product", filters.product);
    if (filters.from)    params.set("from", filters.from);
    if (filters.to)      params.set("to", filters.to);

    fetch(`/api/admin/wishlist-history?${params}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setItems(d.data ?? []);
        setTopProducts(d.topProducts ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
        setPage(d.page ?? 1);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const handlePageChange = (p: number) => setFilters(f => ({ ...f, page: p }));

  const clearFilters = () => {
    setQInput(""); setProductInput(""); setFrom(""); setTo("");
    setFilters({ q: "", product: "", from: "", to: "", page: 1 });
  };

  const hasFilters = qInput || productInput || from || to;

  const exportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ export: "1" });
      if (filters.q)       params.set("q", filters.q);
      if (filters.product) params.set("product", filters.product);
      if (filters.from)    params.set("from", filters.from);
      if (filters.to)      params.set("to", filters.to);

      const res  = await fetch(`/api/admin/wishlist-history?${params}`);
      const data = await res.json();

      const rows: string[][] = [
        ["Customer Name", "Email", "Phone", "Customer #", "Product", "Colour",
         "Saree Code", "Sale Price", "Added On"],
      ];
      for (const item of (data.data as WishlistItem[])) {
        rows.push([
          customerName(item.user),
          item.user.email   ?? "",
          item.user.phone   ?? "",
          item.user.customerNumber ? `#${item.user.customerNumber}` : "",
          item.variant.product.name,
          item.variant.colorName,
          item.variant.sareeCode ?? "",
          String(item.variant.salePrice),
          new Date(item.addedAt).toLocaleString("en-IN"),
        ]);
      }

      const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `wishlist-history-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setExporting(false);
  };

  const pages = (() => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  })();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
            Wishlist / Favourites
          </h1>
          <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {loading ? "Loading…" : `${total} item${total !== 1 ? "s" : ""} wishlisted across all customers`}
          </p>
        </div>
        <button
          onClick={exportCSV} disabled={exporting || loading || total === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-body transition-all disabled:opacity-50"
          style={{ background: "var(--color-primary)", color: "white" }}
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export CSV
        </button>
      </div>

      {/* Most Wishlisted */}
      {topProducts.length > 0 && !hasFilters && (
        <div className="rounded-xl border p-4" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
          <h2 className="text-sm font-semibold font-body mb-3" style={{ color: "var(--color-text-primary)" }}>
            Most Wishlisted Products
          </h2>
          <div className="flex flex-wrap gap-2">
            {topProducts.map((tp, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
                <div>
                  <p className="text-xs font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
                    {tp.variant.product.name}
                  </p>
                  <p className="text-[10px] font-body" style={{ color: "var(--color-text-muted)" }}>
                    {tp.variant.colorName}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Heart className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
                    <span className="text-[10px] font-semibold font-body" style={{ color: "var(--color-primary)" }}>
                      {tp.count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border p-4 space-y-3" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }} />
            <input
              type="text" placeholder="Customer name / email / phone"
              value={qInput} onChange={e => setQInput(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border rounded-lg text-sm font-body focus:outline-none"
              style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}
            />
          </div>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }} />
            <input
              type="text" placeholder="Product name"
              value={productInput} onChange={e => setProductInput(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border rounded-lg text-sm font-body focus:outline-none"
              style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }} />
            <input
              type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border rounded-lg text-sm font-body focus:outline-none"
              style={{ borderColor: "var(--color-parchment)", color: from ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }} />
            <input
              type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border rounded-lg text-sm font-body focus:outline-none"
              style={{ borderColor: "var(--color-parchment)", color: to ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
            />
          </div>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-body font-medium"
            style={{ color: "var(--color-primary)" }}>
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-parchment)" }}>
        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-primary)" }} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 flex flex-col items-center gap-3">
            <Heart className="h-12 w-12" style={{ color: "var(--color-text-disabled)" }} />
            <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
              No wishlist items found
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs font-body"
                style={{ color: "var(--color-primary)" }}>Clear filters</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr style={{ background: "var(--color-cream)", borderBottom: "1px solid var(--color-parchment)" }}>
                  {["Customer", "Phone", "Product", "Colour", "Saree Code", "Price", "Added On"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-body font-semibold uppercase tracking-wide"
                      style={{ color: "var(--color-text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className="border-b transition-colors hover:bg-amber-50/30"
                    style={{ borderColor: "var(--color-parchment)", background: i % 2 === 0 ? "white" : "var(--color-ivory)" }}>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: "var(--color-primary)" }}>
                          {(item.user.firstName?.[0] ?? item.user.email?.[0] ?? "?").toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/admin/customers/${item.user.id}`}
                            className="text-sm font-semibold font-body hover:underline"
                            style={{ color: "var(--color-primary)" }}>
                            {customerName(item.user)}
                          </Link>
                          <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
                            {item.user.email}
                            {item.user.customerNumber ? ` · #${item.user.customerNumber}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-sm font-body whitespace-nowrap"
                      style={{ color: "var(--color-text-secondary)" }}>
                      {item.user.phone ?? <span style={{ color: "var(--color-text-disabled)" }}>—</span>}
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {item.variant.product.name}
                      </p>
                    </td>

                    {/* Colour */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded-full border shrink-0"
                          style={{ background: item.variant.colorHex, borderColor: "rgba(0,0,0,0.12)" }} />
                        <span className="text-xs font-body px-2 py-0.5 rounded-full"
                          style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
                          {item.variant.colorName}
                        </span>
                      </div>
                    </td>

                    {/* Saree Code */}
                    <td className="px-4 py-3 text-xs font-body font-mono"
                      style={{ color: "var(--color-text-muted)" }}>
                      {item.variant.sareeCode ?? "—"}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-sm font-semibold font-body whitespace-nowrap"
                      style={{ color: "var(--color-primary)", fontStyle: "italic" }}>
                      {fmt(item.variant.salePrice)}
                    </td>

                    {/* Added On */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs font-body" style={{ color: "var(--color-text-secondary)" }}>
                        {new Date(item.addedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
                        {new Date(item.addedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
            Page {page} of {totalPages} · {total} total item{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page === 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg border disabled:opacity-40 transition-opacity"
              style={{ borderColor: "var(--color-parchment)" }}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pages.map(p => (
              <button key={p} onClick={() => handlePageChange(p)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-sm font-body font-medium border transition-colors"
                style={{
                  background:  p === page ? "var(--color-primary)" : "white",
                  color:       p === page ? "white" : "var(--color-text-secondary)",
                  borderColor: "var(--color-parchment)",
                }}>
                {p}
              </button>
            ))}
            <button onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-lg border disabled:opacity-40 transition-opacity"
              style={{ borderColor: "var(--color-parchment)" }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
