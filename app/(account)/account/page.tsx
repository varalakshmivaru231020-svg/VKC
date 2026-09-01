import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  ShoppingBag, Heart, MapPin, Settings, ArrowRight,
  Package, ChevronRight, Gift, TrendingUp,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Account" };

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:    { bg: "var(--color-warning-bg)",  color: "var(--color-warning)",  label: "Order Placed" },
  CONFIRMED:  { bg: "var(--color-primary-50)",  color: "var(--color-primary)",  label: "Confirmed" },
  PROCESSING: { bg: "var(--color-primary-50)",  color: "var(--color-primary)",  label: "Processing" },
  SHIPPED:    { bg: "#EEF2FF",                  color: "#4338CA",               label: "Shipped" },
  DELIVERED:  { bg: "var(--color-success-bg)",  color: "var(--color-success)",  label: "Delivered" },
  CANCELLED:  { bg: "var(--color-error-bg)",    color: "var(--color-error)",    label: "Cancelled" },
};

export default async function AccountDashboard() {
  const session = await auth();
  const user    = session?.user;
  const uid     = user?.id;

  // Fetch account data
  const [orderCount, recentOrders, addressCount] = await Promise.all([
    uid ? db.order.count({ where: { userId: uid } }) : Promise.resolve(0),
    uid
      ? db.order.findMany({
          where: { userId: uid },
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { items: { select: { id: true, imageUrl: true, productName: true, quantity: true }, take: 3 } },
        })
      : Promise.resolve([]),
    uid ? db.address.count({ where: { userId: uid } }) : Promise.resolve(0),
  ]);

  const quickActions = [
    {
      href: "/account/orders",
      label: "My Orders",
      desc: `${orderCount} order${orderCount !== 1 ? "s" : ""} placed`,
      icon: ShoppingBag,
      accent: "#8B1A2E",
      bg: "#FDF0F2",
    },
    {
      href: "/account/wishlist",
      label: "Wishlist",
      desc: "Products saved for later",
      icon: Heart,
      accent: "#92400E",
      bg: "#FEF5E7",
    },
    {
      href: "/account/addresses",
      label: "Addresses",
      desc: `${addressCount} address${addressCount !== 1 ? "es" : ""} saved`,
      icon: MapPin,
      accent: "#065F46",
      bg: "#EDF7F2",
    },
    {
      href: "/account/profile",
      label: "Profile",
      desc: "Manage your details",
      icon: Settings,
      accent: "#4C1D95",
      bg: "#EDE8F5",
    },
  ];

  return (
    <div className="min-h-full">

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="px-6 sm:px-8 lg:px-12 py-8 space-y-8">

        {/* ── Quick action cards ── */}
        <div>
          <h2 className="text-sm font-body font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--color-text-muted)" }}>
            Quick Access
          </h2>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {quickActions.map(({ href, label, desc, icon: Icon, accent, bg }) => (
              <Link key={href} href={href}
                className="group relative p-5 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: "white", borderColor: "var(--color-parchment)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: bg }}>
                  <Icon className="h-5 w-5" style={{ color: accent }} />
                </div>
                <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {label}
                </p>
                <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
                <div
                  className="absolute bottom-4 right-4 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0"
                  style={{ background: bg }}>
                  <ArrowRight className="h-3.5 w-3.5" style={{ color: accent }} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Recent orders ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-body font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-text-muted)" }}>
              Recent Orders
            </h2>
            {orderCount > 0 && (
              <Link href="/account/orders"
                className="flex items-center gap-1 text-xs font-body font-semibold transition-colors hover:gap-1.5"
                style={{ color: "var(--color-primary)" }}>
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <div className="rounded-2xl border p-12 flex flex-col items-center text-center gap-4"
              style={{ background: "white", borderColor: "var(--color-parchment)" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-cream)" }}>
                <Package className="h-7 w-7" style={{ color: "var(--color-text-disabled)" }} />
              </div>
              <div>
                <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  No orders yet
                </p>
                <p className="text-xs font-body mt-1" style={{ color: "var(--color-text-muted)" }}>
                  Your orders will appear here once you make a purchase
                </p>
              </div>
              <Link href="/shop"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-body font-semibold transition-colors"
                style={{ background: "var(--color-primary)", color: "white" }}>
                <Gift className="h-4 w-4" /> Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
                const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
                return (
                  <Link key={order.id} href={`/account/orders/${order.id}`}
                    className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md hover:border-primary/20"
                    style={{ background: "white", borderColor: "var(--color-parchment)" }}>
                    {/* Thumbnails */}
                    <div className="flex gap-1.5 shrink-0">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id}
                          className="relative w-12 h-14 rounded-lg overflow-hidden border"
                          style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
                          {item.imageUrl
                            ? <SmartImage src={item.imageUrl} alt={item.productName} fill objectFit="cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-4 w-4" style={{ color: "var(--color-text-disabled)" }} />
                              </div>}
                        </div>
                      ))}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
                          #{order.orderNumber}
                        </p>
                        <span className="px-2 py-0.5 text-[10px] font-body font-semibold rounded-full"
                          style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}{itemCount} item{itemCount !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Amount + arrow */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "var(--text-price-sm)", color: "var(--color-primary)" }}>
                        ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                      </span>
                      <ChevronRight className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
                    </div>
                  </Link>
                );
              })}

              {orderCount > 3 && (
                <Link href="/account/orders"
                  className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed text-sm font-body font-medium transition-colors hover:border-primary hover:text-primary"
                  style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-muted)" }}>
                  <TrendingUp className="h-4 w-4" />
                  View all {orderCount} orders
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Promotions strip ── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--color-cream) 0%, var(--color-parchment) 100%)", border: "1px solid var(--color-parchment)" }}>
          <div className="px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-body font-semibold uppercase tracking-widest mb-1"
                style={{ color: "var(--color-gold)" }}>
                New Arrivals
              </p>
              <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
                Discover the latest products
              </p>
              <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-muted)" }}>
                Fresh batches from our unit in Mandya
              </p>
            </div>
            <Link href="/shop"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-body font-semibold transition-all hover:gap-3"
              style={{ background: "var(--color-primary)", color: "white" }}>
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
