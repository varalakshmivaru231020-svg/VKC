import Link from "next/link";
import { ShoppingBag, Search, ChevronRight, Layers, Clock, CheckCircle2, Package, Truck, PackageCheck, XCircle, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders — Admin" };

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:            { bg: "var(--color-warning-bg)",  color: "var(--color-warning)",  label: "Pending" },
  CONFIRMED:          { bg: "var(--color-primary-50)",  color: "var(--color-primary)",  label: "Confirmed" },
  PROCESSING:         { bg: "var(--color-primary-50)",  color: "var(--color-primary)",  label: "Processing" },
  SHIPPED:            { bg: "#EEF2FF",                  color: "#4338CA",               label: "Shipped" },
  DELIVERED:          { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Delivered" },
  CANCELLED:          { bg: "var(--color-error-bg)",    color: "var(--color-error)",    label: "Cancelled" },
  REFUNDED:           { bg: "var(--color-error-bg)",    color: "var(--color-error)",    label: "Refunded" },
  RETURN_REQUESTED:        { bg: "#FEF3C7",                  color: "#D97706",               label: "Return Requested" },
  RETURN_PICKUP_ASSIGNED:  { bg: "#FEF3C7",                  color: "#D97706",               label: "Pickup Assigned" },
  RETURN_PICKUP_COMPLETED: { bg: "#FEF3C7",                  color: "#D97706",               label: "Pickup Completed" },
  RETURN_DELIVERED:        { bg: "#EEF2FF",                  color: "#4338CA",               label: "Return Delivered" },
  RETURN_APPROVED:         { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Return Approved" },
  EXCHANGE_REQUESTED:      { bg: "#EEF2FF",                  color: "#4338CA",               label: "Exchange Requested" },
  EXCHANGE_APPROVED:       { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Exchange Approved" },
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; status?: string };
}) {
  const page = parseInt(searchParams.page ?? "1");
  const limit = 20;
  const q = searchParams.q ?? "";
  const statusFilter = searchParams.status ?? "all";

  const where: any = {};
  if (statusFilter !== "all") where.status = statusFilter.toUpperCase();
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { user: { firstName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, orders, statusCountsRaw, allOrdersCount] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        items: { select: { id: true, productName: true, quantity: true, unitPrice: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.order.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  const countByStatus: Record<string, number> = {};
  for (const row of statusCountsRaw) countByStatus[row.status] = row._count._all;

  const STATUS_CARDS: { id: string; label: string; statuses: string[]; Icon: any; bg: string; color: string }[] = [
    { id: "all",                label: "All Orders", statuses: [],                                                      Icon: Layers,        bg: "var(--color-cream)",         color: "var(--color-text-primary)" },
    { id: "pending",            label: "Pending",    statuses: ["PENDING"],                                             Icon: Clock,         bg: "var(--color-warning-bg)",    color: "var(--color-warning)" },
    { id: "confirmed",          label: "Confirmed",  statuses: ["CONFIRMED"],                                           Icon: CheckCircle2,  bg: "var(--color-primary-50)",    color: "var(--color-primary)" },
    { id: "processing",         label: "Processing", statuses: ["PROCESSING"],                                          Icon: Package,       bg: "var(--color-primary-50)",    color: "var(--color-primary)" },
    { id: "shipped",            label: "Shipped",    statuses: ["SHIPPED"],                                             Icon: Truck,         bg: "#EEF2FF",                    color: "#4338CA" },
    { id: "delivered",          label: "Delivered",  statuses: ["DELIVERED"],                                           Icon: PackageCheck,  bg: "var(--color-success-bg)",    color: "var(--color-success)" },
    { id: "cancelled",          label: "Cancelled",  statuses: ["CANCELLED"],                                           Icon: XCircle,       bg: "var(--color-error-bg)",      color: "var(--color-error)" },
    { id: "return_requested",   label: "Return",     statuses: ["RETURN_REQUESTED", "RETURN_PICKUP_ASSIGNED", "RETURN_PICKUP_COMPLETED", "RETURN_DELIVERED", "RETURN_APPROVED"], Icon: RotateCcw, bg: "#FEF3C7", color: "#D97706" },
  ];

  const cardCount = (statuses: string[]) =>
    statuses.length === 0 ? allOrdersCount : statuses.reduce((s, st) => s + (countByStatus[st] ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Orders</h1>
          <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {total} total orders
          </p>
        </div>
      </div>

      {/* Status count cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {STATUS_CARDS.map(({ id, label, statuses, Icon, bg, color }) => {
          const active = statusFilter === id;
          const count = cardCount(statuses);
          return (
            <Link
              key={id}
              href={`?${new URLSearchParams({ ...searchParams, status: id, page: "1" })}`}
              className="rounded-md border p-3 transition-all hover:shadow-sm"
              style={{
                background: "white",
                borderColor: active ? "var(--color-primary)" : "var(--color-parchment)",
                borderWidth: active ? 2 : 1,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="h-7 w-7 flex items-center justify-center rounded-md shrink-0" style={{ background: bg }}>
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                </span>
                <p className="text-[11px] font-body font-semibold uppercase tracking-wide truncate" style={{ color: "var(--color-text-muted)" }}>
                  {label}
                </p>
              </div>
              <p className="text-xl font-body font-bold" style={{ color: active ? "var(--color-primary)" : "var(--color-text-primary)" }}>
                {count}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search order number, customer email…"
            className="w-full h-10 pl-9 pr-4 border rounded-sm text-sm font-body focus:outline-none"
            style={{ borderColor: "var(--color-parchment)", background: "white" }}
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "all",               label: "All" },
            { id: "pending",           label: "Pending" },
            { id: "confirmed",         label: "Confirmed" },
            { id: "processing",        label: "Processing" },
            { id: "shipped",           label: "Shipped" },
            { id: "delivered",         label: "Delivered" },
            { id: "cancelled",         label: "Cancelled" },
            { id: "return_requested",  label: "Return" },
          ].map((s) => (
            <Link
              key={s.id}
              href={`?${new URLSearchParams({ ...searchParams, status: s.id, page: "1" })}`}
              className="px-3 py-2 rounded-sm text-xs font-body font-medium border transition-colors"
              style={
                statusFilter === s.id
                  ? { background: "var(--color-primary)", color: "white", borderColor: "var(--color-primary)" }
                  : { borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)", background: "white" }
              }
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--color-parchment)" }}>
        {orders.length === 0 ? (
          <div className="p-16 flex flex-col items-center text-center gap-3">
            <ShoppingBag className="h-10 w-10" style={{ color: "var(--color-text-disabled)" }} />
            <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>No orders yet</p>
            <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
              Orders will appear here once customers start purchasing
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-cream)", borderBottom: "1px solid var(--color-parchment)" }}>
                {["Order", "Customer", "Items", "Total", "Status", "Date", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-body font-semibold uppercase tracking-wide"
                    style={{ color: "var(--color-text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const statusStyle = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
                const customerName = order.user
                  ? [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email
                  : "Guest";
                return (
                  <tr key={order.id}
                    className="border-b transition-colors hover:bg-primary-50"
                    style={{ borderColor: "var(--color-parchment)", background: i % 2 === 0 ? "white" : "var(--color-ivory)" }}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-body font-semibold flex items-center gap-1.5" style={{ color: "var(--color-text-primary)" }}>
                        #{order.orderNumber}
                      </p>
                      {order.shippingAddress && typeof order.shippingAddress === "object" && (
                        <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                          {(order.shippingAddress as any).city}, {(order.shippingAddress as any).state}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.user?.id && (
                        <p className="text-[10px] font-body font-bold mb-0.5" style={{ color: "var(--color-primary)" }}>
                          {order.user.id.slice(0, 8).toUpperCase()}
                        </p>
                      )}
                      <p className="text-sm font-body" style={{ color: "var(--color-text-primary)" }}>{customerName}</p>
                      {order.user?.phone && (
                        <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>{order.user.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {order.items.length}
                      </span>
                      <span className="text-xs font-body ml-1" style={{ color: "var(--color-text-muted)" }}>
                        item{order.items.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "13px", color: "var(--color-primary)" }}>
                        {formatINR(Number(order.totalAmount))}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 text-[11px] font-body font-semibold rounded-full"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs font-body font-medium transition-colors"
                        style={{ color: "var(--color-primary)" }}>
                        View <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
                className="h-8 w-8 flex items-center justify-center rounded-sm text-xs font-body font-medium border transition-colors"
                style={p === page
                  ? { background: "var(--color-primary)", color: "white", borderColor: "var(--color-primary)" }
                  : { borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)", background: "white" }
                }
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
