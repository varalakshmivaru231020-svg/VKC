"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingCart, Search, Download, Calendar, Package,
  ChevronLeft, ChevronRight, Loader2, X,
} from "lucide-react";
import Link from "next/link";

interface CartVariant {
  id: string; colorName: string; colorHex: string;
  sareeCode: string | null; salePrice: number; originalPrice: number;
  product: { id: string; name: string };
  images: { url: string }[];
}
interface CartItem { id: string; quantity: number; addedAt: string; variant: CartVariant; }
interface CartUser {
  id: string; firstName: string | null; lastName: string | null;
  email: string | null; phone: string | null; customerNumber: number | null; isActive: boolean;
}
interface Cart { id: string; updatedAt: string; createdAt: string; user: CartUser | null; items: CartItem[]; }

function fmt(n: number) { return "₹" + Number(n).toLocaleString("en-IN"); }

function customerName(u: CartUser | null) {
  if (!u) return "Guest";
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "—";
}

export default function CartHistoryClient() {
  const [carts, setCarts]           = useState<Cart[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [exporting, setExporting]   = useState(false);

  // Raw filter inputs (for controlled inputs)
  const [qInput, setQInput]           = useState("");
  const [productInput, setProductInput] = useState("");
  const [from, setFrom]               = useState("");
  const [to, setTo]                   = useState("");

  // Committed filters that trigger fetch
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

    fetch(`/api/admin/cart-history?${params}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setCarts(d.data ?? []);
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

      const res  = await fetch(`/api/admin/cart-history?${params}`);
      const data = await res.json();

      const rows: string[][] = [
        ["Customer Name", "Email", "Phone", "Customer #", "Product", "Colour",
         "Product Code", "Qty", "Sale Price", "Cart Total", "Last Updated", "Status"],
      ];
      for (const cart of (data.data as Cart[])) {
        const name  = customerName(cart.user);
        const total = cart.items.reduce((s, it) => s + Number(it.variant.salePrice) * it.quantity, 0);
        const date  = new Date(cart.updatedAt).toLocaleString("en-IN");
        for (const item of cart.items) {
          rows.push([
            name,
            cart.user?.email   ?? "",
            cart.user?.phone   ?? "",
            cart.user?.customerNumber ? `#${cart.user.customerNumber}` : "",
            item.variant.product.name,
            item.variant.colorName,
            item.variant.sareeCode ?? "",
            String(item.quantity),
            String(item.variant.salePrice),
            String(total),
            date,
            "Abandoned",
          ]);
        }
      }

      const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `cart-history-${new Date().toISOString().slice(0, 10)}.csv`;
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
            Cart History
          </h1>
          <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {loading ? "Loading…" : `${total} cart${total !== 1 ? "s" : ""} with items`}
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

      {/* Filters */}
      <div className="rounded-xl border p-4 space-y-3" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Customer search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }} />
            <input
              type="text" placeholder="Customer name / email / phone"
              value={qInput} onChange={e => setQInput(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border rounded-lg text-sm font-body focus:outline-none focus:border-primary"
              style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}
            />
          </div>
          {/* Product search */}
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }} />
            <input
              type="text" placeholder="Product name"
              value={productInput} onChange={e => setProductInput(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border rounded-lg text-sm font-body focus:outline-none focus:border-primary"
              style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}
            />
          </div>
          {/* From date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }} />
            <input
              type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border rounded-lg text-sm font-body focus:outline-none focus:border-primary"
              style={{ borderColor: "var(--color-parchment)", color: from ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
            />
          </div>
          {/* To date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }} />
            <input
              type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border rounded-lg text-sm font-body focus:outline-none focus:border-primary"
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
        ) : carts.length === 0 ? (
          <div className="p-16 flex flex-col items-center gap-3">
            <ShoppingCart className="h-12 w-12" style={{ color: "var(--color-text-disabled)" }} />
            <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
              No carts found
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs font-body"
                style={{ color: "var(--color-primary)" }}>Clear filters</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr style={{ background: "var(--color-cream)", borderBottom: "1px solid var(--color-parchment)" }}>
                  {["Customer", "Phone", "Products in Cart", "Items", "Cart Value", "Last Updated", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-body font-semibold uppercase tracking-wide"
                      style={{ color: "var(--color-text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {carts.map((cart, i) => {
                  const name       = customerName(cart.user);
                  const cartValue  = cart.items.reduce((s, it) => s + Number(it.variant.salePrice) * it.quantity, 0);
                  const totalItems = cart.items.reduce((s, it) => s + it.quantity, 0);
                  const initials   = cart.user
                    ? (cart.user.firstName?.[0] ?? cart.user.email?.[0] ?? "?").toUpperCase()
                    : "G";

                  return (
                    <tr key={cart.id} className="border-b transition-colors hover:bg-amber-50/30"
                      style={{ borderColor: "var(--color-parchment)", background: i % 2 === 0 ? "white" : "var(--color-ivory)" }}>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: "var(--color-primary)" }}>
                            {initials}
                          </div>
                          <div>
                            {cart.user ? (
                              <>
                                <Link href={`/admin/customers/${cart.user.id}`}
                                  className="text-sm font-semibold font-body hover:underline"
                                  style={{ color: "var(--color-primary)" }}>
                                  {name}
                                </Link>
                                <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
                                  {cart.user.email}
                                  {cart.user.customerNumber ? ` · #${cart.user.customerNumber}` : ""}
                                </p>
                              </>
                            ) : (
                              <span className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>Guest</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 text-sm font-body whitespace-nowrap"
                        style={{ color: "var(--color-text-secondary)" }}>
                        {cart.user?.phone ?? <span style={{ color: "var(--color-text-disabled)" }}>—</span>}
                      </td>

                      {/* Products */}
                      <td className="px-4 py-3 max-w-[260px]">
                        <div className="flex flex-col gap-1">
                          {cart.items.map(item => (
                            <div key={item.id} className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full shrink-0 border"
                                style={{ background: item.variant.colorHex, borderColor: "rgba(0,0,0,0.12)" }} />
                              <span className="text-xs font-body leading-snug" style={{ color: "var(--color-text-primary)" }}>
                                {item.variant.product.name}
                                <span style={{ color: "var(--color-text-muted)" }}> · {item.variant.colorName}</span>
                                {item.variant.sareeCode && (
                                  <span style={{ color: "var(--color-text-muted)" }}> · #{item.variant.sareeCode}</span>
                                )}
                                <span className="ml-1 font-semibold" style={{ color: "var(--color-primary)" }}>
                                  × {item.quantity}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Items count */}
                      <td className="px-4 py-3 text-sm font-semibold font-body text-center"
                        style={{ color: "var(--color-text-primary)" }}>
                        {totalItems}
                      </td>

                      {/* Value */}
                      <td className="px-4 py-3 text-sm font-semibold font-body whitespace-nowrap"
                        style={{ color: "var(--color-primary)", fontStyle: "italic" }}>
                        {fmt(cartValue)}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs font-body" style={{ color: "var(--color-text-secondary)" }}>
                          {new Date(cart.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
                          {new Date(cart.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-body"
                          style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
                          Abandoned
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
            Page {page} of {totalPages} · {total} total cart{total !== 1 ? "s" : ""}
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
                  background:   p === page ? "var(--color-primary)" : "white",
                  color:        p === page ? "white" : "var(--color-text-secondary)",
                  borderColor:  "var(--color-parchment)",
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
