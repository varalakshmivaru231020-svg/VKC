import Link from "next/link";
import { PackageSearch, Search, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pre-Booking Orders — Admin" };

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING_APPROVAL:  { bg: "var(--color-warning-bg)", color: "var(--color-warning)", label: "Pending Approval" },
  ACCEPTED:          { bg: "var(--color-primary-50)", color: "var(--color-primary)", label: "Accepted" },
  WAITING_FOR_STOCK: { bg: "var(--color-gold-light)", color: "var(--color-gold-dark)", label: "Waiting for Stock" },
  STOCK_AVAILABLE:   { bg: "#EEF2FF", color: "#4338CA", label: "Stock Available" },
  PROCESSING:        { bg: "var(--color-primary-50)", color: "var(--color-primary)", label: "Processing" },
  SHIPPED:           { bg: "#EEF2FF", color: "#4338CA", label: "Shipped" },
  DELIVERED:         { bg: "var(--color-success-bg)", color: "var(--color-success)", label: "Delivered" },
  CANCELLED:         { bg: "var(--color-error-bg)", color: "var(--color-error)", label: "Cancelled" },
};

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "pending_approval", label: "Pending Approval" },
  { id: "accepted", label: "Accepted" },
  { id: "waiting_for_stock", label: "Waiting for Stock" },
  { id: "stock_available", label: "Stock Available" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export default async function AdminPreBookingsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; status?: string };
}) {
  const page = parseInt(searchParams.page ?? "1");
  const limit = 20;
  const q = searchParams.q ?? "";
  const statusFilter = searchParams.status ?? "all";

  const where: any = { orderType: "PRE_BOOKING" };
  if (statusFilter !== "all") where.preBookingStatus = statusFilter.toUpperCase();
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { user: { firstName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        items: { select: { id: true, productName: true, variantColor: true, quantity: true, availableAtBooking: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-body flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <PackageSearch className="h-6 w-6" style={{ color: "var(--color-gold-dark)" }} />
          Pre-Booking Orders
        </h1>
        <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {total} pre-booking order{total !== 1 ? "s" : ""} — items ordered beyond current stock, kept separate from standard Orders.
        </p>
      </div>

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
          {STATUS_TABS.map((s) => (
            <Link
              key={s.id}
              href={`?${new URLSearchParams({ ...searchParams, status: s.id, page: "1" })}`}
              className="px-3 py-2 rounded-sm text-xs font-body font-medium border transition-colors whitespace-nowrap"
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

      <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--color-parchment)" }}>
        {orders.length === 0 ? (
          <div className="p-16 flex flex-col items-center text-center gap-3">
            <PackageSearch className="h-10 w-10" style={{ color: "var(--color-text-disabled)" }} />
            <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>No pre-booking orders</p>
            <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
              Orders where a customer requested more than the available stock will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-cream)", borderBottom: "1px solid var(--color-parchment)" }}>
                {["Order", "Customer", "Product(s)", "Qty (Ordered / Available / Pre-Booked)", "Status", "Expected", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-body font-semibold uppercase tracking-wide"
                    style={{ color: "var(--color-text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const statusStyle = STATUS_STYLES[order.preBookingStatus ?? "PENDING_APPROVAL"];
                const customerName = order.user
                  ? [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email
                  : "Guest";
                const orderedQty  = order.items.reduce((s, it) => s + it.quantity, 0);
                const availableQty = order.items.reduce((s, it) => s + (it.availableAtBooking ?? 0), 0);
                const preBookQty  = orderedQty - availableQty;
                return (
                  <tr key={order.id}
                    className="border-b transition-colors hover:bg-primary-50"
                    style={{ borderColor: "var(--color-parchment)", background: i % 2 === 0 ? "white" : "var(--color-ivory)" }}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>#{order.orderNumber}</p>
                      <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-body" style={{ color: "var(--color-text-primary)" }}>{customerName}</p>
                      {order.user?.phone && (
                        <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>{order.user.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.items.slice(0, 2).map((it) => (
                        <p key={it.id} className="text-xs font-body" style={{ color: "var(--color-text-secondary)" }}>
                          {it.productName} <span style={{ color: "var(--color-text-muted)" }}>({it.variantColor})</span>
                        </p>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>+{order.items.length - 2} more</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-body" style={{ color: "var(--color-text-primary)" }}>
                        {orderedQty} / {availableQty} / <span className="font-semibold" style={{ color: "var(--color-gold-dark)" }}>{preBookQty}</span>
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 text-[11px] font-body font-semibold rounded-full"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                        {order.preBookingEtaDate
                          ? new Date(order.preBookingEtaDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/pre-bookings/${order.id}`}
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
