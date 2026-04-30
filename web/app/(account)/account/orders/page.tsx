import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Package, ChevronRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Orders" };

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:    { bg: "var(--color-warning-bg)",  color: "var(--color-warning)",  label: "Order Placed" },
  CONFIRMED:  { bg: "var(--color-primary-50)",  color: "var(--color-primary)",  label: "Confirmed" },
  PROCESSING: { bg: "var(--color-primary-50)",  color: "var(--color-primary)",  label: "Processing" },
  SHIPPED:    { bg: "#EEF2FF",                  color: "#4338CA",               label: "Shipped" },
  DELIVERED:  { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Delivered" },
  CANCELLED:  { bg: "var(--color-error-bg)",    color: "var(--color-error)",    label: "Cancelled" },
};

export default async function OrdersPage() {
  const session = await auth();
  const orders  = session?.user?.id
    ? await db.order.findMany({
        where:   { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            select: { id: true, productName: true, variantColor: true, quantity: true, imageUrl: true },
          },
        },
      })
    : [];

  return (
    <div className="px-6 sm:px-8 lg:px-10 py-8 space-y-6">
      <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>My Orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-md border p-12 flex flex-col items-center text-center gap-4"
          style={{ background: "white", borderColor: "var(--color-parchment)" }}>
          <Package className="h-12 w-12" style={{ color: "var(--color-text-disabled)" }} />
          <div>
            <p className="text-base font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>No orders yet</p>
            <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-muted)" }}>
              Your orders will appear here once you make a purchase
            </p>
          </div>
          <Link href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-sm text-sm font-body font-semibold transition-colors"
            style={{ background: "var(--color-primary)", color: "white" }}>
            Browse Sarees
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusStyle = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
            const itemCount   = order.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <Link key={order.id} href={`/account/orders/${order.id}`} className="block p-5 rounded-md border transition-shadow hover:shadow-md"
                style={{ background: "white", borderColor: "var(--color-parchment)" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      Order #{order.orderNumber}
                    </p>
                    <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-semibold font-body rounded-full"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}>
                    {statusStyle.label}
                  </span>
                </div>

                {/* Item thumbnails */}
                {order.items.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {order.items.slice(0, 4).map((item) => (
                      <div key={item.id} className="relative shrink-0 w-12 h-16 rounded-sm overflow-hidden border"
                        style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
                        {item.imageUrl
                          ? <SmartImage src={item.imageUrl} alt={item.productName} fill objectFit="cover" />
                          : <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-4 w-4" style={{ color: "var(--color-text-disabled)" }} />
                            </div>}
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="shrink-0 w-12 h-16 rounded-sm border flex items-center justify-center text-xs font-body"
                        style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-muted)", background: "var(--color-cream)" }}>
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>
                    {itemCount} item{itemCount !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "var(--text-price-sm)", color: "var(--color-primary)" }}>
                      ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                    </span>
                    <ChevronRight className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
