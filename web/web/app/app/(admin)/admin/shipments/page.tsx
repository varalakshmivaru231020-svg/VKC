import Link from "next/link";
import { db } from "@/lib/db";
import { Package, Truck, ChevronRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shipments — Admin" };

/* ────────────────────────────────────────────────────────────────────────
 * Each tab maps to a set of order statuses we want to surface. Return tabs
 * (REQUESTED / PICKUP_ASSIGNED / etc.) reuse the same list view because the
 * admin journey is the same: pick an order, take the next action.
 * ──────────────────────────────────────────────────────────────────────── */

type TabKey =
  | "all" | "SHIPPED" | "DELIVERED"
  | "RETURN_REQUESTED" | "RETURN_PICKUP_ASSIGNED" | "RETURN_PICKUP_COMPLETED"
  | "RETURN_DELIVERED" | "REFUNDED";

const TAB_DEFS: { key: TabKey; label: string; statuses: string[] }[] = [
  { key: "all",                       label: "All",            statuses: ["SHIPPED", "DELIVERED", "RETURN_REQUESTED", "RETURN_PICKUP_ASSIGNED", "RETURN_PICKUP_COMPLETED", "RETURN_DELIVERED", "RETURN_APPROVED", "REFUNDED"] },
  { key: "SHIPPED",                   label: "Shipped",        statuses: ["SHIPPED"] },
  { key: "DELIVERED",                 label: "Delivered",      statuses: ["DELIVERED"] },
  { key: "RETURN_REQUESTED",          label: "Return Requested",       statuses: ["RETURN_REQUESTED"] },
  { key: "RETURN_PICKUP_ASSIGNED",    label: "Pickup Assigned",        statuses: ["RETURN_PICKUP_ASSIGNED"] },
  { key: "RETURN_PICKUP_COMPLETED",   label: "Pickup Completed",       statuses: ["RETURN_PICKUP_COMPLETED"] },
  { key: "RETURN_DELIVERED",          label: "Return Delivered",       statuses: ["RETURN_DELIVERED", "RETURN_APPROVED"] },
  { key: "REFUNDED",                  label: "Refunded",       statuses: ["REFUNDED"] },
];

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const page = parseInt(searchParams.page ?? "1");
  const limit = 20;
  const tabKey = (searchParams.status ?? "SHIPPED") as TabKey;
  const tab = TAB_DEFS.find((t) => t.key === tabKey) ?? TAB_DEFS[1];

  const where: any = { status: { in: tab.statuses as any } };

  // Sort by the most relevant timestamp for the active tab.
  const orderBy =
    tab.key === "DELIVERED"      ? { deliveredAt: "desc" as const } :
    tab.key === "REFUNDED"       ? { updatedAt:   "desc" as const } :
    tab.key.startsWith("RETURN") ? { updatedAt:   "desc" as const } :
                                   { shippedAt:   "desc" as const };

  const [total, orders, tabCounts] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      include: {
        user:    { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        items:   { select: { id: true, productName: true, quantity: true, imageUrl: true } },
        returns: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { returnNumber: true, status: true, pickupCourier: true, pickupTracking: true },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    // Counts per tab for the small numeric pill next to each label.
    Promise.all(
      TAB_DEFS.map((t) =>
        db.order.count({ where: { status: { in: t.statuses as any } } }).then((c) => [t.key, c] as const)
      )
    ).then((rows) => Object.fromEntries(rows) as Record<TabKey, number>),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "#111827" }}>Shipments</h1>
          <p className="text-sm font-body text-gray-500 mt-0.5">{total} order{total !== 1 ? "s" : ""} in {tab.label}</p>
        </div>
      </div>

      {/* Tabs — each shipment status (incl. return workflow) gets its own. */}
      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: "#E5E7EB" }}>
        {TAB_DEFS.map((t) => (
          <Link key={t.key} href={`/admin/shipments?status=${t.key}`}
            className="px-4 py-2.5 text-sm font-medium font-body border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap"
            style={{
              borderColor: tab.key === t.key ? "var(--color-primary)" : "transparent",
              color:       tab.key === t.key ? "var(--color-primary)" : "#6B7280",
            }}>
            {t.label}
            {tabCounts[t.key] > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: tab.key === t.key ? "var(--color-primary-50)" : "#F3F4F6",
                  color:      tab.key === t.key ? "var(--color-primary)"     : "#6B7280",
                }}>
                {tabCounts[t.key]}
              </span>
            )}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border p-16 flex flex-col items-center gap-4" style={{ background: "white", borderColor: "#E5E7EB" }}>
          <Truck className="h-12 w-12 text-gray-200" />
          <p className="text-sm font-body text-gray-400">No shipments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const addr = order.shippingAddress as any;
            const ret  = order.returns[0] ?? null;
            return (
              <Link key={order.id} href={`/admin/orders/${order.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border transition-colors hover:bg-gray-50"
                style={{ background: "white", borderColor: "#E5E7EB" }}>
                <div className="relative w-14 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: "#F3F4F6" }}>
                  {order.items[0]?.imageUrl
                    ? <SmartImage src={order.items[0].imageUrl} alt="" fill objectFit="cover" />
                    : <Package className="h-5 w-5 m-auto mt-5.5 text-gray-300" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold font-body" style={{ color: "#111827" }}>#{order.orderNumber}</p>
                    {ret?.returnNumber && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded font-mono"
                        style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
                        {ret.returnNumber}
                      </span>
                    )}
                    {order.courierPartner && tab.key !== "RETURN_REQUESTED" && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600">
                        {order.courierPartner}
                      </span>
                    )}
                    {ret?.pickupCourier && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600">
                        Return courier: {ret.pickupCourier}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-body text-gray-400 mt-0.5">
                    {[order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") || order.user?.email || "Guest"}
                    {addr && ` · ${addr.city}, ${addr.state}`}
                  </p>
                  {order.trackingNumber && (
                    <p className="text-xs font-body text-gray-500 mt-0.5">
                      Tracking: <span className="font-mono font-medium">{order.trackingNumber}</span>
                    </p>
                  )}
                  {ret?.pickupTracking && (
                    <p className="text-xs font-body text-gray-500 mt-0.5">
                      Pickup tracking: <span className="font-mono font-medium">{ret.pickupTracking}</span>
                    </p>
                  )}
                  <p className="text-xs font-body text-gray-400 mt-0.5">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    {order.shippedAt   && ` · Shipped ${new Date(order.shippedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                    {order.deliveredAt && ` · Delivered ${new Date(order.deliveredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold font-body" style={{ color: "var(--color-primary)" }}>
                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {total > limit && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm font-body text-gray-400">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`?status=${tab.key}&page=${page - 1}`} className="px-4 py-2 rounded-lg border text-sm font-body hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#374151" }}>Previous</Link>}
            {page * limit < total && <Link href={`?status=${tab.key}&page=${page + 1}`} className="px-4 py-2 rounded-lg border text-sm font-body hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#374151" }}>Next</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
