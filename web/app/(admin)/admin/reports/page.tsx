"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, ShoppingCart, Package, Users, Clock, IndianRupee,
  CheckCircle, XCircle, AlertTriangle, BarChart3, Download, RefreshCw,
  ChevronUp, ChevronDown, FileSpreadsheet, FileText,
} from "lucide-react";
import { formatINR } from "@/lib/utils/format";
import { exportCSV, exportExcel, exportPDF } from "@/lib/utils/exportReport";

// ─── Types ────────────────────────────────────────────────────────────────────
type DatePreset = "today" | "yesterday" | "7d" | "30d" | "this_month" | "last_month" | "custom";

interface DateRange { from: string; to: string }

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "custom", label: "Custom" },
];

function presetToRange(p: DatePreset): DateRange {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (p) {
    case "today":
      return { from: fmt(today), to: fmt(today) };
    case "yesterday": {
      const y = new Date(today); y.setDate(y.getDate() - 1);
      return { from: fmt(y), to: fmt(y) };
    }
    case "7d": {
      const s = new Date(today); s.setDate(s.getDate() - 6);
      return { from: fmt(s), to: fmt(today) };
    }
    case "30d": {
      const s = new Date(today); s.setDate(s.getDate() - 29);
      return { from: fmt(s), to: fmt(today) };
    }
    case "this_month":
      return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(today) };
    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmt(s), to: fmt(e) };
    }
    default:
      return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(today) };
  }
}

// ─── Colour palette ───────────────────────────────────────────────────────────
const P = "var(--color-primary)";
const CHART_COLORS = ["#8B5A2B", "#C4832A", "#1B4B6B", "#2E6B47", "#7B3F9E", "#C4372A", "#2A7BC4"];

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#D97706", CONFIRMED: "#2563EB", PROCESSING: "#7C3AED",
  SHIPPED: "#0891B2", DELIVERED: "#16A34A", CANCELLED: "#DC2626",
  REFUNDED: "#6B7280",
};

// ─── Sort helper ──────────────────────────────────────────────────────────────
function useSortedRows<T extends Record<string, any>>(data: T[]) {
  const [col, setCol] = useState<keyof T | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const toggle = (c: keyof T) => {
    if (col === c) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setCol(c); setDir("asc"); }
  };

  const sorted = col == null ? data : [...data].sort((a, b) => {
    const av = a[col], bv = b[col];
    const n = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
    return dir === "asc" ? n : -n;
  });

  const Th = ({ k, label }: { k: keyof T; label: string }) => (
    <th
      className="text-left px-4 py-3 text-xs font-body font-semibold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"
      style={{ color: "var(--color-text-muted)" }}
      onClick={() => toggle(k)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {col === k ? (dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
      </span>
    </th>
  );

  return { sorted, Th };
}

// ─── Main component ───────────────────────────────────────────────────────────
type Tab = "dashboard" | "sales_summary" | "order_status" | "pending_orders" | "stock_on_hand" | "low_stock" | "gst_report";

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "sales_summary", label: "Sales Summary" },
  { key: "order_status", label: "Order Status" },
  { key: "pending_orders", label: "Pending Orders" },
  { key: "stock_on_hand", label: "Stock On Hand" },
  { key: "low_stock", label: "Low Stock Alert" },
  { key: "gst_report", label: "GST Report" },
];

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [preset, setPreset] = useState<DatePreset>("this_month");
  const [customRange, setCustomRange] = useState<DateRange>(presetToRange("this_month"));
  const [range, setRange] = useState<DateRange>(presetToRange("this_month"));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setData(null);
    setError(null);
    try {
      const qs = tab === "stock_on_hand" || tab === "low_stock"
        ? `type=${tab}`
        : `type=${tab}&from=${range.from}&to=${range.to}`;
      const res = await fetch(`/api/admin/reports?${qs}`);
      const json = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
      if (!res.ok || 'error' in json) throw new Error(json.error || `Server error ${res.status}`);
      setData(json);
    } catch (e: any) {
      setError(e.message ?? "Failed to load report");
    }
    setLoading(false);
  }, [tab, range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const applyPreset = (p: DatePreset) => {
    setPreset(p);
    if (p !== "custom") setRange(presetToRange(p));
  };

  const applyCustom = () => { setPreset("custom"); setRange(customRange); };

  const card = (label: string, value: string, icon: React.ReactNode, color: string, sub?: string) => (
    <div className="p-5 rounded-md border" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-body font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{label}</p>
          <p className="text-xl font-body font-semibold mt-1" style={{ color: "var(--color-text-primary)" }}>{value}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{sub}</p>}
        </div>
        <div className="h-9 w-9 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: color + "20", color }}>
          {icon}
        </div>
      </div>
    </div>
  );

  const chartCard = (title: string, children: React.ReactNode) => (
    <div className="p-5 rounded-md border" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
      <p className="text-sm font-body font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>{title}</p>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Reports & Analytics</h1>
          <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>Vijaylakshmi Sarees performance overview</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border" style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-muted)" }}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b" style={{ borderColor: "var(--color-parchment)" }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-2 text-sm font-body font-medium border-b-2 -mb-px transition-colors"
            style={{
              borderBottomColor: tab === key ? P : "transparent",
              color: tab === key ? P : "var(--color-text-muted)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date range filter (not for stock reports) */}
      {tab !== "stock_on_hand" && tab !== "low_stock" && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-md border" style={{ background: "var(--color-cream)", borderColor: "var(--color-parchment)" }}>
          {PRESETS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="px-3 py-1 text-xs font-body font-medium rounded"
              style={{
                background: preset === key ? P : "white",
                color: preset === key ? "white" : "var(--color-text-muted)",
                border: `1px solid ${preset === key ? P : "var(--color-parchment)"}`,
              }}
            >
              {label}
            </button>
          ))}
          {preset === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customRange.from}
                onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value }))}
                className="text-xs px-2 py-1 border rounded"
                style={{ borderColor: "var(--color-parchment)" }}
              />
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>to</span>
              <input
                type="date"
                value={customRange.to}
                onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value }))}
                className="text-xs px-2 py-1 border rounded"
                style={{ borderColor: "var(--color-parchment)" }}
              />
              <button
                onClick={applyCustom}
                className="text-xs px-3 py-1 rounded text-white font-medium"
                style={{ background: P }}
              >
                Apply
              </button>
            </div>
          )}
          <span className="ml-auto text-xs" style={{ color: "var(--color-text-muted)" }}>
            {range.from} – {range.to}
          </span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin" style={{ color: P }} />
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-red-600 font-body">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {tab === "dashboard" && <DashboardTab data={data} card={card} chartCard={chartCard} range={range} mounted={mounted} />}
          {tab === "sales_summary" && <SalesSummaryTab data={data} range={range} />}
          {tab === "order_status" && <OrderStatusTab data={data} range={range} />}
          {tab === "pending_orders" && <PendingOrdersTab data={data} range={range} />}
          {tab === "stock_on_hand" && <StockOnHandTab data={data} />}
          {tab === "low_stock" && <LowStockTab data={data} />}
          {tab === "gst_report" && <GSTReportTab data={data} range={range} />}
        </>
      )}
    </div>
  );
}

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab({ data, card, chartCard, range, mounted }: any) {
  const k = data?.kpis;
  if (!k) return <p className="text-center py-8 text-sm" style={{ color: "var(--color-text-muted)" }}>No data available for selected period.</p>;
  return (
    <div className="space-y-6">
      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {card("Revenue", formatINR(k.revenue), <IndianRupee className="h-4 w-4" />, "#8B5A2B", `Avg ${formatINR(Math.round(k.avgOrderValue))}/order`)}
        {card("Total Orders", String(k.orders), <ShoppingCart className="h-4 w-4" />, "#1B4B6B")}
        {card("Today's Revenue", formatINR(k.todayRevenue), <TrendingUp className="h-4 w-4" />, "#2E6B47")}
        {card("New Customers", String(k.newCustomers), <Users className="h-4 w-4" />, "#7B3F9E")}
        {card("Pending Orders", String(k.pendingOrders), <Clock className="h-4 w-4" />, "#D97706")}
      </div>
      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {card("Delivered", String(k.deliveredOrders), <CheckCircle className="h-4 w-4" />, "#16A34A")}
        {card("Cancelled", String(k.cancelledOrders), <XCircle className="h-4 w-4" />, "#DC2626")}
        {card("Active Products", String(k.activeProducts), <Package className="h-4 w-4" />, "#0891B2")}
        {card("Low Stock Items", String(k.lowStock), <AlertTriangle className="h-4 w-4" />, "#F59E0B")}
        {card("Avg Order Value", formatINR(Math.round(k.avgOrderValue)), <BarChart3 className="h-4 w-4" />, "#8B5A2B")}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {chartCard("Revenue Trend", mounted ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8da" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => "₹" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)} />
              <Tooltip formatter={(v: number) => formatINR(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#8B5A2B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="h-[220px]" />)}
        {chartCard("Order Status Distribution", mounted ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.orderStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {data.orderStatus.map((entry: any, i: number) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] ?? CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : <div className="h-[220px]" />)}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {chartCard("Revenue by Category", mounted ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.categorySales} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8da" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => "₹" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={(v: number) => formatINR(v)} />
              <Bar dataKey="revenue" fill="#8B5A2B" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-[220px]" />)}
        {chartCard("Payment Mode Split", mounted ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.paymentMode} dataKey="amount" nameKey="method" cx="50%" cy="50%" outerRadius={80} label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {data.paymentMode.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatINR(v)} />
            </PieChart>
          </ResponsiveContainer>
        ) : <div className="h-[220px]" />)}
      </div>

      {/* Top Products */}
      <div className="p-5 rounded-md border" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
        <p className="text-sm font-body font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Top 5 Products by Revenue</p>
        <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--color-parchment)" }}>
          <table className="w-full">
            <thead><tr style={{ background: "var(--color-cream)" }}>
              {["#", "Product", "Units Sold", "Revenue"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-body font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.topProducts.map((p: any, i: number) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--color-parchment)" }}>
                  <td className="px-4 py-2.5 text-xs font-body font-semibold" style={{ color: "var(--color-text-muted)" }}>#{i + 1}</td>
                  <td className="px-4 py-2.5 text-sm font-body" style={{ color: "var(--color-text-primary)" }}>{p.name}</td>
                  <td className="px-4 py-2.5 text-sm font-body font-semibold" style={{ color: P }}>{p.units}</td>
                  <td className="px-4 py-2.5 text-sm font-body font-semibold" style={{ color: P }}>{formatINR(p.revenue)}</td>
                </tr>
              ))}
              {data.topProducts.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>No data for selected period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-md border" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
          <p className="text-sm font-body font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Recent Orders</p>
          <div className="space-y-2">
            {data.recentOrders.slice(0, 8).map((o: any) => (
              <div key={o.orderNumber} className="flex items-center justify-between text-xs font-body py-1.5 border-b" style={{ borderColor: "var(--color-parchment)" }}>
                <div>
                  <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{o.orderNumber}</span>
                  <span className="ml-2" style={{ color: "var(--color-text-muted)" }}>{o.customer}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: P, fontWeight: 600 }}>{formatINR(o.amount)}</span>
                  <span className="px-1.5 py-0.5 rounded text-white" style={{ fontSize: 10, background: STATUS_COLORS[o.status] ?? "#6B7280" }}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-md border" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
          <p className="text-sm font-body font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Low Stock Alerts</p>
          <div className="space-y-2">
            {data.lowStockItems.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between text-xs font-body py-1.5 border-b" style={{ borderColor: "var(--color-parchment)" }}>
                <div>
                  <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{v.productName}</span>
                  <span className="ml-1" style={{ color: "var(--color-text-muted)" }}>· {v.colorName}</span>
                </div>
                <span className={`font-semibold ${v.stockQty === 0 ? "text-red-600" : "text-amber-600"}`}>
                  {v.stockQty === 0 ? "Out of Stock" : `${v.stockQty} left`}
                </span>
              </div>
            ))}
            {data.lowStockItems.length === 0 && (
              <p className="text-xs text-center py-6" style={{ color: "var(--color-text-muted)" }}>All products are sufficiently stocked</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export bar ───────────────────────────────────────────────────────────────
function ExportBar({ onCSV, onExcel, onPDF }: { onCSV(): void; onExcel(): void; onPDF(): void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>Download:</span>
      <button onClick={onCSV} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border font-medium" style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-muted)" }}>
        <Download className="h-3 w-3" /> CSV
      </button>
      <button onClick={onExcel} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border font-medium" style={{ borderColor: "#16A34A", color: "#16A34A" }}>
        <FileSpreadsheet className="h-3 w-3" /> Excel
      </button>
      <button onClick={onPDF} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border font-medium" style={{ borderColor: "#DC2626", color: "#DC2626" }}>
        <FileText className="h-3 w-3" /> PDF
      </button>
    </div>
  );
}

// ─── Sales Summary Tab ─────────────────────────────────────────────────────────
function SalesSummaryTab({ data, range }: any) {
  const HEADERS = ["Date", "Orders", "Revenue (₹)", "Discount (₹)", "Shipping (₹)", "Tax (₹)", "Net Revenue (₹)"];
  const toRows = (rows: any[]) => rows.map((r: any) => [r.date, r.orders, (r.revenue ?? 0).toFixed(2), (r.discount ?? 0).toFixed(2), (r.shipping ?? 0).toFixed(2), (r.tax ?? 0).toFixed(2), (r.net ?? 0).toFixed(2)]);
  const fname = `sales_summary_${range.from}_${range.to}`;
  const { sorted, Th } = useSortedRows(data.rows ?? []);

  const totals = (data.rows ?? []).reduce((acc: any, r: any) => ({
    orders: acc.orders + r.orders,
    revenue: acc.revenue + r.revenue,
    discount: acc.discount + r.discount,
    shipping: acc.shipping + r.shipping,
    tax: acc.tax + r.tax,
    net: acc.net + r.net,
  }), { orders: 0, revenue: 0, discount: 0, shipping: 0, tax: 0, net: 0 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>Sales Summary · {range.from} to {range.to}</p>
        <ExportBar
          onCSV={() => exportCSV(fname, HEADERS, toRows(data.rows ?? []))}
          onExcel={() => exportExcel(fname, HEADERS, toRows(data.rows ?? []))}
          onPDF={() => exportPDF(fname, "Sales Summary", HEADERS, toRows(data.rows ?? []), `${range.from} to ${range.to}`)}
        />
      </div>
      <div className="rounded-md border overflow-x-auto" style={{ borderColor: "var(--color-parchment)" }}>
        <table className="w-full whitespace-nowrap">
          <thead><tr style={{ background: "var(--color-cream)" }}>
            <Th k="date" label="Date" />
            <Th k="orders" label="Orders" />
            <Th k="revenue" label="Revenue" />
            <Th k="discount" label="Discount" />
            <Th k="shipping" label="Shipping" />
            <Th k="tax" label="Tax" />
            <Th k="net" label="Net Revenue" />
          </tr></thead>
          <tbody>
            {sorted.map((r: any, i: number) => (
              <tr key={r.date} className="border-t" style={{ borderColor: "var(--color-parchment)", background: i % 2 === 0 ? "white" : "var(--color-ivory)" }}>
                <td className="px-4 py-2.5 text-sm font-body font-medium" style={{ color: "var(--color-text-primary)" }}>{r.date}</td>
                <td className="px-4 py-2.5 text-sm font-body text-center">{r.orders}</td>
                <td className="px-4 py-2.5 text-sm font-body font-semibold" style={{ color: P }}>{formatINR(r.revenue)}</td>
                <td className="px-4 py-2.5 text-sm font-body text-red-600">{formatINR(r.discount)}</td>
                <td className="px-4 py-2.5 text-sm font-body">{formatINR(r.shipping)}</td>
                <td className="px-4 py-2.5 text-sm font-body">{formatINR(r.tax)}</td>
                <td className="px-4 py-2.5 text-sm font-body font-semibold text-green-700">{formatINR(r.net)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>No sales data for selected period</td></tr>
            )}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr style={{ background: "var(--color-cream)", borderTop: "2px solid var(--color-parchment)" }}>
                <td className="px-4 py-2.5 text-xs font-body font-bold uppercase" style={{ color: "var(--color-text-muted)" }}>TOTAL</td>
                <td className="px-4 py-2.5 text-sm font-body font-bold">{totals.orders}</td>
                <td className="px-4 py-2.5 text-sm font-body font-bold" style={{ color: P }}>{formatINR(totals.revenue)}</td>
                <td className="px-4 py-2.5 text-sm font-body font-bold text-red-600">{formatINR(totals.discount)}</td>
                <td className="px-4 py-2.5 text-sm font-body font-bold">{formatINR(totals.shipping)}</td>
                <td className="px-4 py-2.5 text-sm font-body font-bold">{formatINR(totals.tax)}</td>
                <td className="px-4 py-2.5 text-sm font-body font-bold text-green-700">{formatINR(totals.net)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ─── Order Status Tab ──────────────────────────────────────────────────────────
function OrderStatusTab({ data, range }: any) {
  const HEADERS = ["Order #", "Customer", "Items", "Amount (₹)", "Status", "Payment", "Method", "Date"];
  const toRows = (rows: any[]) => rows.map((r: any) => [r.orderNumber, r.customer, r.items, (r.amount ?? 0).toFixed(2), r.status, r.paymentStatus, r.paymentMethod, r.date.slice(0, 10)]);
  const fname = `order_status_${range.from}_${range.to}`;
  const { sorted, Th } = useSortedRows(data.rows ?? []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>Order Status Report · {range.from} to {range.to} · {(data.rows ?? []).length} orders</p>
        <ExportBar
          onCSV={() => exportCSV(fname, HEADERS, toRows(data.rows ?? []))}
          onExcel={() => exportExcel(fname, HEADERS, toRows(data.rows ?? []))}
          onPDF={() => exportPDF(fname, "Order Status Report", HEADERS, toRows(data.rows ?? []), `${range.from} to ${range.to}`)}
        />
      </div>
      <div className="rounded-md border overflow-x-auto" style={{ borderColor: "var(--color-parchment)" }}>
        <table className="w-full whitespace-nowrap">
          <thead><tr style={{ background: "var(--color-cream)" }}>
            <Th k="orderNumber" label="Order #" />
            <Th k="customer" label="Customer" />
            <Th k="items" label="Items" />
            <Th k="amount" label="Amount" />
            <Th k="status" label="Status" />
            <Th k="paymentStatus" label="Payment" />
            <Th k="paymentMethod" label="Method" />
            <Th k="date" label="Date" />
          </tr></thead>
          <tbody>
            {sorted.map((o: any, i: number) => (
              <tr key={o.orderNumber} className="border-t" style={{ borderColor: "var(--color-parchment)", background: i % 2 === 0 ? "white" : "var(--color-ivory)" }}>
                <td className="px-4 py-2.5 text-sm font-body font-semibold" style={{ color: P }}>{o.orderNumber}</td>
                <td className="px-4 py-2.5 text-sm font-body">{o.customer}</td>
                <td className="px-4 py-2.5 text-sm font-body text-center">{o.items}</td>
                <td className="px-4 py-2.5 text-sm font-body font-semibold">{formatINR(o.amount)}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 rounded text-white text-xs" style={{ background: STATUS_COLORS[o.status] ?? "#6B7280" }}>{o.status}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium ${o.paymentStatus === "PAID" ? "text-green-700" : o.paymentStatus === "FAILED" ? "text-red-600" : "text-amber-600"}`}>{o.paymentStatus}</span>
                </td>
                <td className="px-4 py-2.5 text-sm font-body" style={{ color: "var(--color-text-muted)" }}>{o.paymentMethod}</td>
                <td className="px-4 py-2.5 text-xs font-body" style={{ color: "var(--color-text-muted)" }}>{o.date.slice(0, 10)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>No orders for selected period</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Pending Orders Tab ────────────────────────────────────────────────────────
function PendingOrdersTab({ data, range }: any) {
  const HEADERS = ["Order #", "Customer", "Products", "Amount (₹)", "Status", "Date", "Age (Days)"];
  const toRows = (rows: any[]) => rows.map((r: any) => [r.orderNumber, r.customer, r.products, (r.amount ?? 0).toFixed(2), r.status, r.date.slice(0, 10), r.ageDays]);
  const fname = `pending_orders_${range.from}_${range.to}`;
  const { sorted, Th } = useSortedRows(data.rows ?? []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Pending Orders · {(data.rows ?? []).length} orders requiring action
        </p>
        <ExportBar
          onCSV={() => exportCSV(fname, HEADERS, toRows(data.rows ?? []))}
          onExcel={() => exportExcel(fname, HEADERS, toRows(data.rows ?? []))}
          onPDF={() => exportPDF(fname, "Pending Orders", HEADERS, toRows(data.rows ?? []), `${range.from} to ${range.to}`)}
        />
      </div>
      <div className="rounded-md border overflow-x-auto" style={{ borderColor: "var(--color-parchment)" }}>
        <table className="w-full whitespace-nowrap">
          <thead><tr style={{ background: "var(--color-cream)" }}>
            <Th k="orderNumber" label="Order #" />
            <Th k="customer" label="Customer" />
            <th className="text-left px-4 py-3 text-xs font-body font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Products</th>
            <Th k="amount" label="Amount" />
            <Th k="status" label="Status" />
            <Th k="date" label="Date" />
            <Th k="ageDays" label="Age" />
          </tr></thead>
          <tbody>
            {sorted.map((o: any, i: number) => (
              <tr key={o.orderNumber} className="border-t" style={{ borderColor: "var(--color-parchment)", background: i % 2 === 0 ? "white" : "var(--color-ivory)" }}>
                <td className="px-4 py-2.5 text-sm font-body font-semibold" style={{ color: P }}>{o.orderNumber}</td>
                <td className="px-4 py-2.5 text-sm font-body">{o.customer}</td>
                <td className="px-4 py-2.5 text-xs font-body max-w-xs truncate" style={{ color: "var(--color-text-muted)" }}>{o.products}</td>
                <td className="px-4 py-2.5 text-sm font-body font-semibold">{formatINR(o.amount)}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 rounded text-white text-xs" style={{ background: STATUS_COLORS[o.status] ?? "#6B7280" }}>{o.status}</span>
                </td>
                <td className="px-4 py-2.5 text-xs font-body" style={{ color: "var(--color-text-muted)" }}>{o.date.slice(0, 10)}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-semibold ${o.ageDays > 3 ? "text-red-600" : o.ageDays > 1 ? "text-amber-600" : "text-green-700"}`}>
                    {o.ageDays}d
                  </span>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>No pending orders</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Stock On Hand Tab ─────────────────────────────────────────────────────────
function StockOnHandTab({ data }: any) {
  const HEADERS = ["Product", "Category", "Colour", "Saree Code", "Sale Price (₹)", "Cost Price (₹)", "Stock", "Reserved", "Available", "Stock Value (₹)"];
  const toRows = (rows: any[]) => rows.map((r: any) => [r.productName, r.category, r.colorName, r.sareeCode, (r.salePrice ?? 0).toFixed(2), (r.costPrice ?? 0).toFixed(2), r.stockQty, r.reservedQty, r.availableQty, (r.stockValue ?? 0).toFixed(2)]);
  const fname = `stock_on_hand_${new Date().toISOString().slice(0, 10)}`;
  const { sorted, Th } = useSortedRows(data.rows ?? []);

  const totalValue = (data.rows ?? []).reduce((s: number, r: any) => s + r.stockValue, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Stock On Hand · {(data.rows ?? []).length} variants · Total Value: <span style={{ color: P }}>{formatINR(Math.round(totalValue))}</span>
        </p>
        <ExportBar
          onCSV={() => exportCSV(fname, HEADERS, toRows(data.rows ?? []))}
          onExcel={() => exportExcel(fname, HEADERS, toRows(data.rows ?? []))}
          onPDF={() => exportPDF(fname, "Stock On Hand", HEADERS, toRows(data.rows ?? []))}
        />
      </div>
      <div className="rounded-md border overflow-x-auto" style={{ borderColor: "var(--color-parchment)" }}>
        <table className="w-full whitespace-nowrap">
          <thead><tr style={{ background: "var(--color-cream)" }}>
            <Th k="productName" label="Product" />
            <Th k="category" label="Category" />
            <Th k="colorName" label="Colour" />
            <Th k="sareeCode" label="Code" />
            <Th k="salePrice" label="Sale Price" />
            <Th k="costPrice" label="Cost Price" />
            <Th k="stockQty" label="Stock" />
            <Th k="reservedQty" label="Reserved" />
            <Th k="availableQty" label="Available" />
            <Th k="stockValue" label="Value" />
          </tr></thead>
          <tbody>
            {sorted.map((r: any, i: number) => (
              <tr key={r.id} className="border-t" style={{ borderColor: "var(--color-parchment)", background: i % 2 === 0 ? "white" : "var(--color-ivory)" }}>
                <td className="px-4 py-2.5 text-sm font-body font-medium max-w-xs truncate" style={{ color: "var(--color-text-primary)" }}>{r.productName}</td>
                <td className="px-4 py-2.5 text-xs font-body" style={{ color: "var(--color-text-muted)" }}>{r.category}</td>
                <td className="px-4 py-2.5 text-sm font-body">{r.colorName}</td>
                <td className="px-4 py-2.5 text-xs font-body font-mono" style={{ color: "var(--color-text-muted)" }}>{r.sareeCode}</td>
                <td className="px-4 py-2.5 text-sm font-body">{formatINR(r.salePrice)}</td>
                <td className="px-4 py-2.5 text-sm font-body">{formatINR(r.costPrice)}</td>
                <td className="px-4 py-2.5 text-sm font-body font-semibold text-center">{r.stockQty}</td>
                <td className="px-4 py-2.5 text-sm font-body text-center text-amber-600">{r.reservedQty}</td>
                <td className="px-4 py-2.5 text-sm font-body font-semibold text-center text-green-700">{r.availableQty}</td>
                <td className="px-4 py-2.5 text-sm font-body font-semibold" style={{ color: P }}>{formatINR(Math.round(r.stockValue))}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>No variants found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Low Stock Tab ─────────────────────────────────────────────────────────────
function LowStockTab({ data }: any) {
  const HEADERS = ["Product", "Category", "Colour", "Saree Code", "Sale Price (₹)", "Stock Qty", "Status"];
  const toRows = (rows: any[]) => rows.map((r: any) => [r.productName, r.category, r.colorName, r.sareeCode, (r.salePrice ?? 0).toFixed(2), r.stockQty, r.status]);
  const fname = `low_stock_alert_${new Date().toISOString().slice(0, 10)}`;
  const { sorted, Th } = useSortedRows(data.rows ?? []);

  const outOfStock = (data.rows ?? []).filter((r: any) => r.stockQty === 0).length;
  const lowStock = (data.rows ?? []).filter((r: any) => r.stockQty > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>Low Stock Alert</p>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">{outOfStock} Out of Stock</span>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">{lowStock} Low Stock (≤5)</span>
        </div>
        <ExportBar
          onCSV={() => exportCSV(fname, HEADERS, toRows(data.rows ?? []))}
          onExcel={() => exportExcel(fname, HEADERS, toRows(data.rows ?? []))}
          onPDF={() => exportPDF(fname, "Low Stock Alert", HEADERS, toRows(data.rows ?? []))}
        />
      </div>
      <div className="rounded-md border overflow-x-auto" style={{ borderColor: "var(--color-parchment)" }}>
        <table className="w-full whitespace-nowrap">
          <thead><tr style={{ background: "var(--color-cream)" }}>
            <Th k="productName" label="Product" />
            <Th k="category" label="Category" />
            <Th k="colorName" label="Colour" />
            <Th k="sareeCode" label="Code" />
            <Th k="salePrice" label="Sale Price" />
            <Th k="stockQty" label="Stock" />
            <Th k="status" label="Status" />
          </tr></thead>
          <tbody>
            {sorted.map((r: any, i: number) => (
              <tr key={r.id} className="border-t" style={{ borderColor: "var(--color-parchment)", background: r.stockQty === 0 ? "#FEF2F2" : i % 2 === 0 ? "white" : "var(--color-ivory)" }}>
                <td className="px-4 py-2.5 text-sm font-body font-medium" style={{ color: "var(--color-text-primary)" }}>{r.productName}</td>
                <td className="px-4 py-2.5 text-xs font-body" style={{ color: "var(--color-text-muted)" }}>{r.category}</td>
                <td className="px-4 py-2.5 text-sm font-body">{r.colorName}</td>
                <td className="px-4 py-2.5 text-xs font-body font-mono" style={{ color: "var(--color-text-muted)" }}>{r.sareeCode}</td>
                <td className="px-4 py-2.5 text-sm font-body">{formatINR(r.salePrice)}</td>
                <td className="px-4 py-2.5 text-sm font-body font-bold text-center" style={{ color: r.stockQty === 0 ? "#DC2626" : "#D97706" }}>{r.stockQty}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.stockQty === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-green-700">All products are well stocked</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── GST Report Tab ───────────────────────────────────────────────────────────
function GSTReportTab({ data, range }: any) {
  const HEADERS = ["Date", "Orders", "Taxable Amount (₹)", "CGST (₹)", "SGST (₹)", "Total Tax (₹)", "Invoice Total (₹)"];
  const toRows = (rows: any[]) => rows.map((r: any) => [r.date, r.orders, (r.subtotal ?? 0).toFixed(2), (r.cgst ?? 0).toFixed(2), (r.sgst ?? 0).toFixed(2), (r.tax ?? 0).toFixed(2), (r.total ?? 0).toFixed(2)]);
  const fname = `gst_report_${range.from}_${range.to}`;
  const { sorted, Th } = useSortedRows(data.rows ?? []);

  const totals = (data.rows ?? []).reduce((acc: any, r: any) => ({
    orders: acc.orders + r.orders,
    subtotal: acc.subtotal + r.subtotal,
    tax: acc.tax + r.tax,
    cgst: acc.cgst + r.cgst,
    sgst: acc.sgst + r.sgst,
    total: acc.total + r.total,
  }), { orders: 0, subtotal: 0, tax: 0, cgst: 0, sgst: 0, total: 0 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>GST Report · {range.from} to {range.to}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Tax split: 50% CGST + 50% SGST (intra-state). Update as per actual rates.</p>
        </div>
        <ExportBar
          onCSV={() => exportCSV(fname, HEADERS, toRows(data.rows ?? []))}
          onExcel={() => exportExcel(fname, HEADERS, toRows(data.rows ?? []))}
          onPDF={() => exportPDF(fname, "GST Report", HEADERS, toRows(data.rows ?? []), `${range.from} to ${range.to}`)}
        />
      </div>
      <div className="rounded-md border overflow-x-auto" style={{ borderColor: "var(--color-parchment)" }}>
        <table className="w-full whitespace-nowrap">
          <thead><tr style={{ background: "var(--color-cream)" }}>
            <Th k="date" label="Date" />
            <Th k="orders" label="Orders" />
            <Th k="subtotal" label="Taxable Amount" />
            <Th k="cgst" label="CGST" />
            <Th k="sgst" label="SGST" />
            <Th k="tax" label="Total Tax" />
            <Th k="total" label="Invoice Total" />
          </tr></thead>
          <tbody>
            {sorted.map((r: any, i: number) => (
              <tr key={r.date} className="border-t" style={{ borderColor: "var(--color-parchment)", background: i % 2 === 0 ? "white" : "var(--color-ivory)" }}>
                <td className="px-4 py-2.5 text-sm font-body font-medium">{r.date}</td>
                <td className="px-4 py-2.5 text-sm font-body text-center">{r.orders}</td>
                <td className="px-4 py-2.5 text-sm font-body">{formatINR(r.subtotal)}</td>
                <td className="px-4 py-2.5 text-sm font-body">{formatINR(r.cgst)}</td>
                <td className="px-4 py-2.5 text-sm font-body">{formatINR(r.sgst)}</td>
                <td className="px-4 py-2.5 text-sm font-body font-semibold" style={{ color: P }}>{formatINR(r.tax)}</td>
                <td className="px-4 py-2.5 text-sm font-body font-semibold text-green-700">{formatINR(r.total)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>No paid orders for selected period</td></tr>
            )}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr style={{ background: "var(--color-cream)", borderTop: "2px solid var(--color-parchment)" }}>
                <td className="px-4 py-2.5 text-xs font-body font-bold uppercase" style={{ color: "var(--color-text-muted)" }}>TOTAL</td>
                <td className="px-4 py-2.5 text-sm font-body font-bold">{totals.orders}</td>
                <td className="px-4 py-2.5 text-sm font-body font-bold">{formatINR(totals.subtotal)}</td>
                <td className="px-4 py-2.5 text-sm font-body font-bold">{formatINR(totals.cgst)}</td>
                <td className="px-4 py-2.5 text-sm font-body font-bold">{formatINR(totals.sgst)}</td>
                <td className="px-4 py-2.5 text-sm font-body font-bold" style={{ color: P }}>{formatINR(totals.tax)}</td>
                <td className="px-4 py-2.5 text-sm font-body font-bold text-green-700">{formatINR(totals.total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
