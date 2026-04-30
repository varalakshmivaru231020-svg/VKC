import Link from "next/link";
import { db } from "@/lib/db";
import { Package, Truck, ChevronRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shipments — Admin" };

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const page = parseInt(searchParams.page ?? "1");
  const limit = 20;
  const status = searchParams.status ?? "SHIPPED";

  const where: any = { status: { in: ["SHIPPED", "DELIVERED"] } };
  if (status !== "all") where.status = status;

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        items: { select: { id: true, productName: true, quantity: true, imageUrl: true } },
      },
      orderBy: { shippedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    SHIPPED:   { bg: "#EEF2FF", color: "#4338CA", label: "Shipped" },
    DELIVERED: { bg: "#DCFCE7", color: "#15803D", label: "Delivered" },
  };

  const tabs = ["all", "SHIPPED", "DELIVERED"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "#111827" }}>Shipments</h1>
          <p className="text-sm font-body text-gray-500 mt-0.5">{total} dispatched order{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "#E5E7EB" }}>
        {tabs.map((t) => (
          <Link key={t} href={`/admin/shipments?status=${t}`}
            className="px-4 py-2.5 text-sm font-medium font-body border-b-2 transition-colors capitalize"
            style={{
              borderColor: status === t ? "var(--color-primary)" : "transparent",
              color: status === t ? "var(--color-primary)" : "#6B7280",
            }}>
            {t === "all" ? "All" : STATUS_STYLES[t]?.label ?? t}
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
            const st = STATUS_STYLES[order.status] ?? { bg: "#F3F4F6", color: "#6B7280", label: order.status };
            const addr = order.shippingAddress as any;
            return (
              <Link key={order.id} href={`/admin/orders/${order.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border transition-colors hover:bg-gray-50"
                style={{ background: "white", borderColor: "#E5E7EB" }}>
                {/* Image */}
                <div className="relative w-14 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: "#F3F4F6" }}>
                  {order.items[0]?.imageUrl
                    ? <SmartImage src={order.items[0].imageUrl} alt="" fill objectFit="cover" />
                    : <Package className="h-5 w-5 m-auto mt-5.5 text-gray-300" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold font-body" style={{ color: "#111827" }}>#{order.orderNumber}</p>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    {order.courierPartner && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600">{order.courierPartner}</span>
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
                  <p className="text-xs font-body text-gray-400 mt-0.5">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    {order.shippedAt && ` · Shipped ${new Date(order.shippedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
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

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm font-body text-gray-400">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`?status=${status}&page=${page - 1}`} className="px-4 py-2 rounded-lg border text-sm font-body hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#374151" }}>Previous</Link>}
            {page * limit < total && <Link href={`?status=${status}&page=${page + 1}`} className="px-4 py-2 rounded-lg border text-sm font-body hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#374151" }}>Next</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
