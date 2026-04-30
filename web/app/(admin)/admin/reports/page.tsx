import { db } from "@/lib/db";
import { BarChart3, TrendingUp, ShoppingCart, Package } from "lucide-react";
import { formatINR } from "@/lib/utils/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports — Admin" };

export default async function ReportsPage() {
  const [totalRevenue, totalOrders, totalProducts, topProducts] = await Promise.all([
    db.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { totalAmount: true } }),
    db.order.count(),
    db.product.count({ where: { isActive: true } }),
    db.orderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
  ]);

  const revenue = Number(totalRevenue._sum.totalAmount ?? 0);

  const stats = [
    { label: "Total Revenue", value: formatINR(revenue), icon: TrendingUp, color: "var(--color-primary)" },
    { label: "Total Orders", value: String(totalOrders), icon: ShoppingCart, color: "#1B4B6B" },
    { label: "Active Products", value: String(totalProducts), icon: Package, color: "#2E6B47" },
    { label: "Avg Order Value", value: totalOrders > 0 ? formatINR(Math.round(revenue / totalOrders)) : "₹0", icon: BarChart3, color: "var(--color-gold)" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Reports</h1>
        <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>Overview of store performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-md border" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-body font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                <p className="text-2xl font-body font-semibold mt-1" style={{ color: "var(--color-text-primary)" }}>{value}</p>
              </div>
              <div className="h-9 w-9 rounded-sm flex items-center justify-center" style={{ background: color + "15", color }}>
                <Icon className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top products */}
      {topProducts.length > 0 && (
        <div>
          <h2 className="text-base font-body font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Top Selling Products</h2>
          <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--color-parchment)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--color-cream)", borderBottom: "1px solid var(--color-parchment)" }}>
                  {["#", "Product", "Units Sold", "Revenue"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-body font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.productName} className="border-b" style={{ borderColor: "var(--color-parchment)", background: i % 2 === 0 ? "white" : "var(--color-ivory)" }}>
                    <td className="px-4 py-3 text-sm font-body font-semibold" style={{ color: "var(--color-text-muted)" }}>#{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-body font-medium" style={{ color: "var(--color-text-primary)" }}>{p.productName}</td>
                    <td className="px-4 py-3 text-sm font-body font-semibold" style={{ color: "var(--color-primary)" }}>{p._sum.quantity}</td>
                    <td className="px-4 py-3">
                      <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "13px", color: "var(--color-primary)" }}>
                        {formatINR(Number(p._sum.totalPrice ?? 0))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
