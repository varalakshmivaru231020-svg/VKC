import Link from "next/link";
import { Package, ShoppingCart, Users, ArrowRight, TrendingUp, Palette, Plus, BarChart3, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Dashboard — Vijaylakshmi" };

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:    { bg: "#FEF3C7", text: "#92400E" },
  CONFIRMED:  { bg: "#DBEAFE", text: "#1E40AF" },
  PROCESSING: { bg: "#EDE9FE", text: "#5B21B6" },
  SHIPPED:    { bg: "#D1FAE5", text: "#065F46" },
  DELIVERED:  { bg: "#D1FAE5", text: "#065F46" },
  CANCELLED:  { bg: "#FEE2E2", text: "#991B1B" },
};

function StatCard({
  label, value, sub, icon: Icon, iconBg, iconColor,
}: {
  label: string; value: string; sub: string;
  icon: any; iconBg: string; iconColor: string;
}) {
  return (
    <div className="rounded-xl border p-5 flex items-start justify-between"
      style={{ background: "white", borderColor: "#E5E7EB" }}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest font-body" style={{ color: "#9CA3AF" }}>{label}</p>
        <p className="text-2xl font-bold font-body mt-2 mb-1" style={{ color: "#111827" }}>{value}</p>
        <p className="text-xs font-body" style={{ color: "#9CA3AF" }}>{sub}</p>
      </div>
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg }}>
        <Icon className="h-5 w-5" style={{ color: iconColor }} />
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalProducts, activeProducts,
    totalOrders, todayOrders,
    totalCustomers, newCustomers,
    revenueToday, revenueTotal,
    recentOrders,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { isActive: true } }),
    db.order.count(),
    db.order.count({ where: { createdAt: { gte: today } } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: today } } }),
    db.order.aggregate({
      where: { createdAt: { gte: today }, paymentStatus: "PAID" },
      _sum: { totalAmount: true },
    }),
    db.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { totalAmount: true },
    }),
    db.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        items: { select: { id: true } },
      },
    }),
  ]);

  const todayRev = Number(revenueToday._sum.totalAmount ?? 0);
  const totalRev = Number(revenueTotal._sum.totalAmount ?? 0);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold font-body" style={{ color: "#111827" }}>Admin Dashboard</h1>
        <p className="text-sm font-body mt-0.5" style={{ color: "#6B7280" }}>Overview of all operations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Revenue Today" value={formatINR(todayRev)}
          sub={`${formatINR(totalRev)} all time`}
          icon={TrendingUp} iconBg="#ECFDF5" iconColor="#059669"
        />
        <StatCard
          label="Orders Today" value={String(todayOrders)}
          sub={`${totalOrders} total orders`}
          icon={ShoppingCart} iconBg="#EFF6FF" iconColor="#3B82F6"
        />
        <StatCard
          label="Products" value={String(activeProducts)}
          sub={`${totalProducts} total in catalogue`}
          icon={Package} iconBg="#FEF3C7" iconColor="#D97706"
        />
        <StatCard
          label="Customers" value={String(totalCustomers)}
          sub={`${newCustomers} new today`}
          icon={Users} iconBg="#F5F3FF" iconColor="#7C3AED"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Add Product", href: "/admin/products/new", icon: Plus, color: "#3B82F6", bg: "#EFF6FF" },
          { label: "View Orders", href: "/admin/orders", icon: ShoppingCart, color: "#059669", bg: "#ECFDF5" },
          { label: "Design", href: "/admin/design", icon: Palette, color: "var(--color-primary)", bg: "var(--color-primary-50)" },
          { label: "Reports", href: "/admin/reports", icon: BarChart3, color: "#7C3AED", bg: "#F5F3FF" },
        ].map(({ label, href, icon: Icon, color, bg }) => (
          <Link key={label} href={href}
            className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-sm"
            style={{ background: "white", borderColor: "#E5E7EB" }}>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
              <Icon className="h-4.5 w-4.5" style={{ color }} />
            </div>
            <span className="text-sm font-semibold font-body" style={{ color: "#374151" }}>{label}</span>
            <ArrowRight className="h-3.5 w-3.5 ml-auto" style={{ color: "#D1D5DB" }} />
          </Link>
        ))}
      </div>

      {/* Recent Orders + Design tip */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Orders table */}
        <div className="xl:col-span-2 rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E5E7EB" }}>
            <h2 className="text-sm font-semibold font-body" style={{ color: "#111827" }}>Recent Orders</h2>
            <Link href="/admin/orders"
              className="text-xs font-medium font-body flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: "var(--color-primary)" }}>
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingCart className="h-10 w-10 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
              <p className="text-sm font-semibold font-body" style={{ color: "#374151" }}>No orders yet</p>
              <p className="text-xs font-body mt-1" style={{ color: "#9CA3AF" }}>Orders appear here once customers purchase</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                    {["Order #", "Customer", "Items", "Amount", "Status"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide font-body"
                        style={{ color: "#9CA3AF" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, i) => {
                    const colors = STATUS_COLORS[order.status] ?? { bg: "#F3F4F6", text: "#6B7280" };
                    const customerName = order.user
                      ? [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email
                      : "Guest";
                    return (
                      <tr key={order.id}
                        className="border-b last:border-0 transition-colors hover:bg-gray-50"
                        style={{ borderColor: "#E5E7EB" }}>
                        <td className="px-5 py-3.5">
                          <Link href={`/admin/orders`}
                            className="text-sm font-semibold font-body transition-colors hover:underline"
                            style={{ color: "var(--color-primary)" }}>
                            #{order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-body font-medium truncate max-w-[140px]" style={{ color: "#374151" }}>
                            {customerName}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-body" style={{ color: "#6B7280" }}>
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-semibold font-body" style={{ color: "#111827" }}>
                            {formatINR(Number(order.totalAmount))}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 text-[11px] font-semibold font-body rounded-full"
                            style={{ background: colors.bg, color: colors.text }}>
                            {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
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

        {/* Right sidebar cards */}
        <div className="space-y-4">
          {/* Catalogue overview */}
          <div className="rounded-xl border p-5 space-y-4" style={{ background: "white", borderColor: "#E5E7EB" }}>
            <h3 className="text-sm font-semibold font-body" style={{ color: "#111827" }}>Catalogue Overview</h3>
            {[
              { label: "Active Products", value: String(activeProducts), color: "#059669" },
              { label: "Total Orders", value: String(totalOrders), color: "#3B82F6" },
              { label: "Customers", value: String(totalCustomers), color: "#7C3AED" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm font-body" style={{ color: "#6B7280" }}>{label}</span>
                <span className="text-sm font-bold font-body" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Design tip */}
          <div className="rounded-xl border p-5" style={{ background: "var(--color-primary-50)", borderColor: "var(--color-primary)" }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--color-primary)" }}>
                <Palette className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold font-body" style={{ color: "var(--color-primary)" }}>Customise Design</p>
                <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  Change colors, fonts, and branding — no code needed.
                </p>
              </div>
            </div>
            <Link href="/admin/design"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold font-body transition-colors"
              style={{ background: "var(--color-primary)", color: "white" }}>
              Open Design Studio <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Low stock alert */}
          <div className="rounded-xl border p-5" style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#D97706" }} />
              <p className="text-sm font-semibold font-body" style={{ color: "#92400E" }}>Inventory Alert</p>
            </div>
            <p className="text-xs font-body" style={{ color: "#78350F" }}>
              Review products with low stock to avoid stockouts during peak season.
            </p>
            <Link href="/admin/products?status=active"
              className="mt-3 text-xs font-semibold font-body flex items-center gap-1"
              style={{ color: "#D97706" }}>
              Check Inventory <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
