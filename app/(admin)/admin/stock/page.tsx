"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search, RefreshCw, Save, AlertTriangle, Package,
  ChevronDown, ChevronUp, Filter, Download,
} from "lucide-react";

interface Category { id: string; name: string }

interface StockVariant {
  id: string;
  colorName: string;
  colorHex: string;
  size: string | null;
  sareeCode: string | null;
  stockQty: number;
  reservedQty: number;
  product: { id: string; name: string; slug: string; category: Category | null };
  images: { url: string }[];
  // local editing state
  _draft?: number;
  _dirty?: boolean;
}

type SortKey = "product" | "color" | "stock" | "reserved" | "available";
type SortDir = "asc" | "desc";

export default function StockPage() {
  const [variants, setVariants] = useState<StockVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("product");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchVariants = useCallback(async (q = search, low = lowOnly) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (low) params.set("lowStock", "true");
      const res = await fetch(`/api/admin/stock?${params}`);
      const data = await res.json();
      setVariants(
        (data.variants ?? []).map((v: StockVariant) => ({ ...v, _draft: v.stockQty, _dirty: false }))
      );
    } catch {
      showToast("Failed to load stock data", "err");
    } finally {
      setLoading(false);
    }
  }, [search, lowOnly]);

  useEffect(() => { fetchVariants(); }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => fetchVariants(val, lowOnly), 500);
  };

  const handleLowToggle = (val: boolean) => {
    setLowOnly(val);
    fetchVariants(search, val);
  };

  const setDraft = (id: string, qty: number) => {
    setVariants(prev =>
      prev.map(v =>
        v.id === id ? { ...v, _draft: qty, _dirty: qty !== v.stockQty } : v
      )
    );
  };

  const saveSingle = async (v: StockVariant) => {
    try {
      const res = await fetch("/api/admin/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: v.id, stockQty: v._draft ?? v.stockQty }),
      });
      if (!res.ok) throw new Error();
      setVariants(prev =>
        prev.map(x => x.id === v.id ? { ...x, stockQty: x._draft ?? x.stockQty, _dirty: false } : x)
      );
      showToast("Stock updated");
    } catch {
      showToast("Failed to save", "err");
    }
  };

  const saveAll = async () => {
    const dirty = variants.filter(v => v._dirty);
    if (!dirty.length) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: dirty.map(v => ({ id: v.id, stockQty: v._draft ?? v.stockQty })),
        }),
      });
      if (!res.ok) throw new Error();
      setVariants(prev =>
        prev.map(v => v._dirty ? { ...v, stockQty: v._draft ?? v.stockQty, _dirty: false } : v)
      );
      showToast(`${dirty.length} item${dirty.length > 1 ? "s" : ""} saved`);
    } catch {
      showToast("Failed to save", "err");
    } finally {
      setSaving(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...variants].sort((a, b) => {
    let va: string | number = 0, vb: string | number = 0;
    if (sortKey === "product") { va = a.product.name; vb = b.product.name; }
    else if (sortKey === "color") { va = a.colorName; vb = b.colorName; }
    else if (sortKey === "stock") { va = a._draft ?? a.stockQty; vb = b._draft ?? b.stockQty; }
    else if (sortKey === "reserved") { va = a.reservedQty; vb = b.reservedQty; }
    else if (sortKey === "available") {
      va = (a._draft ?? a.stockQty) - a.reservedQty;
      vb = (b._draft ?? b.stockQty) - b.reservedQty;
    }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const dirtyCount = variants.filter(v => v._dirty).length;

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === "asc" ? <ChevronUp className="h-3 w-3 ml-0.5 inline" /> : <ChevronDown className="h-3 w-3 ml-0.5 inline" />
      : null;

  const stockColor = (qty: number) => {
    if (qty <= 0) return "text-red-600 font-semibold";
    if (qty <= 5) return "text-orange-500 font-semibold";
    return "text-green-600";
  };

  const exportCSV = () => {
    const rows = [
      ["Product", "Color", "Size", "Product Code", "Stock", "Reserved", "Available"],
      ...sorted.map(v => [
        v.product.name, v.colorName, v.size ?? "", v.sareeCode ?? "",
        v._draft ?? v.stockQty, v.reservedQty,
        (v._draft ?? v.stockQty) - v.reservedQty,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `stock-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Update</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {variants.length} variant{variants.length !== 1 ? "s" : ""} &mdash; click any stock field to edit
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={() => fetchVariants()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {dirtyCount > 0 && (
            <button
              onClick={saveAll}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : `Save ${dirtyCount} change${dirtyCount > 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search product name…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={e => handleLowToggle(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <Filter className="h-4 w-4 text-orange-500" />
          Low stock only (≤ 5)
        </label>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Out of Stock",
            count: variants.filter(v => (v._draft ?? v.stockQty) <= 0).length,
            color: "red",
          },
          {
            label: "Low Stock (1–5)",
            count: variants.filter(v => { const q = v._draft ?? v.stockQty; return q >= 1 && q <= 5; }).length,
            color: "orange",
          },
          {
            label: "In Stock",
            count: variants.filter(v => (v._draft ?? v.stockQty) > 5).length,
            color: "green",
          },
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-100 rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold text-${s.color}-600`}>{s.count}</p>
            <p className={`text-xs text-${s.color}-700 mt-0.5`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400 gap-2">
            <Package className="h-10 w-10" />
            <p>No variants found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 w-10">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    <button onClick={() => toggleSort("product")} className="hover:text-gray-900">
                      Product <SortIcon k="product" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    <button onClick={() => toggleSort("color")} className="hover:text-gray-900">
                      Color / Size <SortIcon k="color" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">
                    <button onClick={() => toggleSort("stock")} className="hover:text-gray-900">
                      Stock <SortIcon k="stock" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">
                    <button onClick={() => toggleSort("reserved")} className="hover:text-gray-900">
                      Reserved <SortIcon k="reserved" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">
                    <button onClick={() => toggleSort("available")} className="hover:text-gray-900">
                      Available <SortIcon k="available" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((v, i) => {
                  const stock = v._draft ?? v.stockQty;
                  const available = stock - v.reservedQty;
                  return (
                    <tr key={v.id} className={`hover:bg-gray-50 transition ${v._dirty ? "bg-indigo-50" : ""}`}>
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {v.images[0] ? (
                            <img src={v.images[0].url} alt="" className="h-9 w-9 rounded-md object-cover shrink-0 border border-gray-100" />
                          ) : (
                            <div className="h-9 w-9 rounded-md bg-gray-100 shrink-0 flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 leading-tight">{v.product.name}</p>
                            {v.product.category && (
                              <p className="text-xs text-gray-400">{v.product.category.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-4 w-4 rounded-full border border-gray-200 shrink-0"
                            style={{ backgroundColor: v.colorHex }}
                          />
                          <span className="text-gray-700">{v.colorName}</span>
                          {v.size && <span className="text-gray-400">/ {v.size}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{v.sareeCode ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={v._draft ?? v.stockQty}
                          onChange={e => setDraft(v.id, parseInt(e.target.value) || 0)}
                          className={`w-20 text-center py-1 px-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            v._dirty ? "border-indigo-400 bg-indigo-50" : "border-gray-200"
                          } ${stockColor(stock)}`}
                        />
                        {stock <= 0 && (
                          <span className="ml-1" title="Out of stock">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 inline" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">{v.reservedQty}</td>
                      <td className={`px-4 py-3 text-center font-medium ${available <= 0 ? "text-red-600" : available <= 5 ? "text-orange-500" : "text-green-600"}`}>
                        {available}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {v._dirty ? (
                          <button
                            onClick={() => saveSingle(v)}
                            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                          >
                            Save
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
