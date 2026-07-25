import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function dateRange(from?: string | null, to?: string | null) {
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = to ? new Date(to) : now;
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "dashboard";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const range = dateRange(from, to);

  try {
    if (type === "dashboard") return dashboardData(range);
    if (type === "sales_summary") return salesSummary(range);
    if (type === "order_status") return orderStatusReport(range);
    if (type === "pending_orders") return pendingOrdersReport(range);
    if (type === "stock_on_hand") return stockOnHandReport();
    if (type === "low_stock") return lowStockReport();
    if (type === "gst_report") return gstReport(range);
    return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function dashboardData(range: { gte: Date; lte: Date }) {
  const [
    revenueAgg,
    orderCount,
    todayRevAgg,
    newCustomers,
    pendingCount,
    deliveredCount,
    cancelledCount,
    activeProducts,
    lowStockCount,
    ordersByStatus,
    revenueByDay,
    categoryRevenue,
    paymentModes,
    topProducts,
    recentOrders,
    lowStockItems,
  ] = await Promise.all([
    db.order.aggregate({ where: { paymentStatus: "PAID", createdAt: range }, _sum: { totalAmount: true } }),
    db.order.count({ where: { createdAt: range } }),
    db.order.aggregate({
      where: { paymentStatus: "PAID", createdAt: { gte: startOfToday(), lte: endOfToday() } },
      _sum: { totalAmount: true },
    }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: range } }),
    db.order.count({ where: { status: "PENDING", createdAt: range } }),
    db.order.count({ where: { status: "DELIVERED", createdAt: range } }),
    db.order.count({ where: { status: "CANCELLED", createdAt: range } }),
    db.product.count({ where: { isActive: true } }),
    db.productVariant.count({ where: { isActive: true, stockQty: { lte: 5, gt: 0 } } }),
    db.order.groupBy({ by: ["status"], where: { createdAt: range }, _count: { id: true } }),
    db.$queryRaw<{ date: string; revenue: number; orders: number }[]>`
      SELECT DATE("createdAt")::text AS date,
             COALESCE(SUM(CASE WHEN "paymentStatus" = 'PAID' THEN "totalAmount" ELSE 0 END), 0)::float AS revenue,
             COUNT(*)::int AS orders
      FROM orders
      WHERE "createdAt" >= ${range.gte} AND "createdAt" <= ${range.lte}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt")
    `,
    db.$queryRaw<{ category: string; revenue: number; orders: number }[]>`
      SELECT COALESCE(c.name, 'Uncategorised') AS category,
             COALESCE(SUM(CASE WHEN o."paymentStatus" = 'PAID' THEN oi."totalPrice" ELSE 0 END), 0)::float AS revenue,
             COUNT(DISTINCT o.id)::int AS orders
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN products p ON p.id = oi."productId"
      LEFT JOIN categories c ON c.id = p."categoryId"
      WHERE o."createdAt" >= ${range.gte} AND o."createdAt" <= ${range.lte}
      GROUP BY c.name
      ORDER BY revenue DESC
      LIMIT 6
    `,
    db.$queryRaw<{ method: string; count: number; amount: number }[]>`
      SELECT COALESCE("paymentMethod", 'Unknown') AS method,
             COUNT(*)::int AS count,
             COALESCE(SUM(CASE WHEN "paymentStatus" = 'PAID' THEN "totalAmount" ELSE 0 END), 0)::float AS amount
      FROM orders
      WHERE "createdAt" >= ${range.gte} AND "createdAt" <= ${range.lte}
      GROUP BY "paymentMethod"
      ORDER BY amount DESC
    `,
    db.orderItem.groupBy({
      by: ["productName"],
      where: { order: { createdAt: range } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 5,
    }),
    db.order.findMany({
      where: { createdAt: range },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        orderNumber: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true, phone: true } },
        guestEmail: true,
      },
    }),
    db.productVariant.findMany({
      where: { isActive: true, stockQty: { lte: 5 } },
      orderBy: { stockQty: "asc" },
      take: 10,
      include: { product: { select: { name: true } } },
    }),
  ]);

  const revenue = Number(revenueAgg._sum.totalAmount ?? 0);
  const todayRevenue = Number(todayRevAgg._sum.totalAmount ?? 0);
  const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

  return NextResponse.json({
    kpis: {
      revenue,
      orders: orderCount,
      avgOrderValue,
      newCustomers,
      pendingOrders: pendingCount,
      todayRevenue,
      deliveredOrders: deliveredCount,
      cancelledOrders: cancelledCount,
      activeProducts,
      lowStock: lowStockCount,
    },
    revenueTrend: revenueByDay.map((r) => ({ date: r.date, revenue: Number(r.revenue), orders: Number(r.orders) })),
    orderStatus: ordersByStatus.map((r) => ({ status: r.status, count: r._count.id })),
    categorySales: categoryRevenue.map((r) => ({ category: r.category, revenue: Number(r.revenue), orders: Number(r.orders) })),
    paymentMode: paymentModes.map((r) => ({ method: r.method, count: Number(r.count), amount: Number(r.amount) })),
    topProducts: topProducts.map((p) => ({
      name: p.productName,
      units: p._sum.quantity ?? 0,
      revenue: Number(p._sum.totalPrice ?? 0),
    })),
    recentOrders: recentOrders.map((o) => ({
      orderNumber: o.orderNumber,
      customer: o.user
        ? `${o.user.firstName ?? ""} ${o.user.lastName ?? ""}`.trim() || o.user.phone
        : o.guestEmail ?? "Guest",
      amount: Number(o.totalAmount),
      status: o.status,
      paymentStatus: o.paymentStatus,
      date: o.createdAt.toISOString(),
    })),
    lowStockItems: lowStockItems.map((v) => ({
      id: v.id,
      productName: v.product.name,
      colorName: v.colorName,
      sareeCode: v.sareeCode,
      stockQty: v.stockQty,
    })),
  });
}

async function salesSummary(range: { gte: Date; lte: Date }) {
  const rows = await db.$queryRaw<{
    date: string;
    orders: number;
    revenue: number;
    discount: number;
    shipping: number;
    tax: number;
    net: number;
  }[]>`
    SELECT DATE("createdAt")::text AS date,
           COUNT(*)::int AS orders,
           COALESCE(SUM(CASE WHEN "paymentStatus" = 'PAID' THEN "totalAmount" ELSE 0 END), 0)::float AS revenue,
           COALESCE(SUM("discountAmount"), 0)::float AS discount,
           COALESCE(SUM("shippingAmount"), 0)::float AS shipping,
           COALESCE(SUM("taxAmount"), 0)::float AS tax,
           COALESCE(SUM(CASE WHEN "paymentStatus" = 'PAID' THEN "totalAmount" - "taxAmount" ELSE 0 END), 0)::float AS net
    FROM orders
    WHERE "createdAt" >= ${range.gte} AND "createdAt" <= ${range.lte}
    GROUP BY DATE("createdAt")
    ORDER BY DATE("createdAt") DESC
  `;
  return NextResponse.json({
    rows: rows.map((r) => ({
      date: r.date,
      orders: Number(r.orders),
      revenue: Number(r.revenue),
      discount: Number(r.discount),
      shipping: Number(r.shipping),
      tax: Number(r.tax),
      net: Number(r.net),
    })),
  });
}

async function orderStatusReport(range: { gte: Date; lte: Date }) {
  const rows = await db.order.findMany({
    where: { createdAt: range },
    orderBy: { createdAt: "desc" },
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      totalAmount: true,
      createdAt: true,
      user: { select: { firstName: true, lastName: true, phone: true } },
      guestEmail: true,
      _count: { select: { items: true } },
    },
  });
  return NextResponse.json({
    rows: rows.map((o) => ({
      orderNumber: o.orderNumber,
      customer: o.user
        ? `${o.user.firstName ?? ""} ${o.user.lastName ?? ""}`.trim() || o.user.phone
        : o.guestEmail ?? "Guest",
      items: o._count.items,
      amount: Number(o.totalAmount),
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod ?? "—",
      date: o.createdAt.toISOString(),
    })),
  });
}

async function pendingOrdersReport(range: { gte: Date; lte: Date }) {
  const rows = await db.order.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] },
      createdAt: range,
    },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { firstName: true, lastName: true, phone: true } },
      items: { select: { productName: true, quantity: true, totalPrice: true } },
    },
  });
  return NextResponse.json({
    rows: rows.map((o) => ({
      orderNumber: o.orderNumber,
      customer: o.user
        ? `${o.user.firstName ?? ""} ${o.user.lastName ?? ""}`.trim() || o.user.phone
        : o.guestEmail ?? "Guest",
      items: o.items.length,
      products: o.items.map((i) => `${i.productName} (${i.quantity})`).join(", "),
      amount: Number(o.totalAmount),
      status: o.status,
      date: o.createdAt.toISOString(),
      ageDays: Math.floor((Date.now() - o.createdAt.getTime()) / 86400000),
    })),
  });
}

async function stockOnHandReport() {
  const rows = await db.productVariant.findMany({
    where: { isActive: true },
    orderBy: [{ product: { name: "asc" } }, { colorName: "asc" }],
    include: { product: { select: { name: true, category: { select: { name: true } } } } },
  });
  return NextResponse.json({
    rows: rows.map((v) => ({
      id: v.id,
      productName: v.product.name,
      category: v.product.category?.name ?? "Uncategorised",
      colorName: v.colorName,
      sareeCode: v.sareeCode ?? "—",
      salePrice: Number(v.salePrice),
      costPrice: Number(v.costPrice),
      stockQty: v.stockQty,
      reservedQty: v.reservedQty,
      availableQty: v.stockQty - v.reservedQty,
      stockValue: Number(v.costPrice) * v.stockQty,
    })),
  });
}

async function lowStockReport() {
  const rows = await db.productVariant.findMany({
    where: { isActive: true, stockQty: { lte: 5 } },
    orderBy: { stockQty: "asc" },
    include: { product: { select: { name: true, category: { select: { name: true } } } } },
  });
  return NextResponse.json({
    rows: rows.map((v) => ({
      id: v.id,
      productName: v.product.name,
      category: v.product.category?.name ?? "Uncategorised",
      colorName: v.colorName,
      sareeCode: v.sareeCode ?? "—",
      salePrice: Number(v.salePrice),
      stockQty: v.stockQty,
      status: v.stockQty === 0 ? "Out of Stock" : "Low Stock",
    })),
  });
}

async function gstReport(range: { gte: Date; lte: Date }) {
  const rows = await db.$queryRaw<{
    date: string;
    orders: number;
    subtotal: number;
    tax: number;
    cgst: number;
    sgst: number;
    total: number;
  }[]>`
    SELECT DATE("createdAt")::text AS date,
           COUNT(*)::int AS orders,
           COALESCE(SUM("subtotal"), 0)::float AS subtotal,
           COALESCE(SUM("taxAmount"), 0)::float AS tax,
           COALESCE(SUM("taxAmount") / 2, 0)::float AS cgst,
           COALESCE(SUM("taxAmount") / 2, 0)::float AS sgst,
           COALESCE(SUM("totalAmount"), 0)::float AS total
    FROM orders
    WHERE "paymentStatus" = 'PAID'
      AND "createdAt" >= ${range.gte} AND "createdAt" <= ${range.lte}
    GROUP BY DATE("createdAt")
    ORDER BY DATE("createdAt") DESC
  `;
  return NextResponse.json({
    rows: rows.map((r) => ({
      date: r.date,
      orders: Number(r.orders),
      subtotal: Number(r.subtotal),
      tax: Number(r.tax),
      cgst: Number(r.cgst),
      sgst: Number(r.sgst),
      total: Number(r.total),
    })),
  });
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
