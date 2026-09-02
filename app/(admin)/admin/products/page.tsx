import Link from "next/link";
import { Plus, Search, Package, Edit2, Eye } from "lucide-react";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils/format";
import { DeleteProductButton } from "./DeleteProductButton";
import { SmartImage } from "@/components/ui/SmartImage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products — Admin" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; category?: string; status?: string };
}) {
  const page = parseInt(searchParams.page ?? "1");
  const limit = 20;
  const q = searchParams.q ?? "";
  const categoryFilter = searchParams.category ?? "";
  const status = searchParams.status ?? "all";

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { fabric: { contains: q, mode: "insensitive" } },
      { variants: { some: { sareeCode: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (categoryFilter) where.categoryId = categoryFilter;
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;
  if (status === "featured") where.isFeatured = true;

  const [total, products, categories] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        variants: {
          where: { isActive: true },
          select: {
            id: true, colorName: true, colorHex: true, salePrice: true, originalPrice: true, stockQty: true, sareeCode: true,
            images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { variants: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Products</h1>
          <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {total} products in catalogue
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-body font-medium"
          style={{ background: "var(--color-primary)", color: "white" }}
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
        {/* Row 1: Search + Status */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#E5E7EB" }}>
          <form className="flex-1 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9CA3AF" }} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search products, type, code…"
              className="w-full h-9 pl-9 pr-4 border rounded-lg text-sm font-body focus:outline-none transition-all"
              style={{ borderColor: "#E5E7EB", background: "#F9FAFB", color: "#111827" }}
            />
          </form>

          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs font-semibold uppercase tracking-wide mr-2 font-body" style={{ color: "#9CA3AF" }}>Status</span>
            {[
              { label: "All",      value: "all" },
              { label: "Active",   value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Featured", value: "featured" },
            ].map((s) => (
              <Link
                key={s.value}
                href={`?${new URLSearchParams({ ...searchParams, status: s.value, page: "1" })}`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium font-body border transition-all"
                style={status === s.value
                  ? { background: "var(--color-primary)", color: "white", borderColor: "var(--color-primary)" }
                  : { borderColor: "#E5E7EB", color: "#6B7280", background: "white" }}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Row 2: Category filters */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto" style={{ background: "#F9FAFB" }}>
            <span className="text-xs font-semibold uppercase tracking-wide shrink-0 font-body" style={{ color: "#9CA3AF" }}>
              Category
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap">
              <Link
                href={`?${new URLSearchParams({ ...searchParams, category: "", page: "1" })}`}
                className="px-3 py-1 rounded-full text-xs font-medium font-body border whitespace-nowrap transition-all"
                style={!categoryFilter
                  ? { background: "var(--color-primary)", color: "white", borderColor: "var(--color-primary)" }
                  : { borderColor: "#E5E7EB", color: "#6B7280", background: "white" }}
              >
                All Categories
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`?${new URLSearchParams({ ...searchParams, category: c.id, page: "1" })}`}
                  className="px-3 py-1 rounded-full text-xs font-medium font-body border whitespace-nowrap transition-all"
                  style={categoryFilter === c.id
                    ? { background: "var(--color-primary)", color: "white", borderColor: "var(--color-primary)" }
                    : { borderColor: "#E5E7EB", color: "#6B7280", background: "white" }}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
              {["Product", "Category", "Variants", "Price Range", "Stock", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest font-body"
                  style={{ color: "#9CA3AF" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <Package className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--color-text-disabled)" }} />
                  <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>No products found</p>
                  <p className="text-xs font-body mt-1" style={{ color: "var(--color-text-muted)" }}>
                    {q ? `No results for "${q}"` : "Add your first product to get started"}
                  </p>
                </td>
              </tr>
            ) : (
              products.map((product, i) => {
                const prices = product.variants.map((v) => Number(v.salePrice));
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const totalStock = product.variants.reduce((s, v) => s + v.stockQty, 0);
                const activeVariants = product.variants.length;

                return (
                  <tr key={product.id}
                    className="border-b last:border-0 transition-colors hover:bg-gray-50"
                    style={{ borderColor: "#E5E7EB" }}>
                    {/* Product */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border" style={{ borderColor: "#E5E7EB" }}>
                          <SmartImage
                            src={product.variants[0]?.images[0]?.url}
                            alt={product.name}
                            objectFit="cover"
                          />
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          {product.variants.slice(0, 5).map((v) => (
                            <div key={v.id} className="w-2 h-10 rounded-sm" style={{ background: String(v.colorHex) }} />
                          ))}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold font-body line-clamp-1" style={{ color: "#111827" }}>
                            {product.name}
                          </p>
                          {product.fabric && (
                            <p className="text-xs font-body mt-0.5" style={{ color: "#9CA3AF" }}>
                              {product.fabric}{product.weaveType ? ` · ${product.weaveType}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium font-body px-2.5 py-1 rounded-full"
                        style={{ background: "#EFF6FF", color: "#3B82F6" }}>
                        {product.category?.name ?? "Uncategorised"}
                      </span>
                    </td>
                    {/* Variants */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold font-body" style={{ color: "#374151" }}>{activeVariants}</span>
                      <span className="text-xs font-body ml-1" style={{ color: "#9CA3AF" }}>colors</span>
                    </td>
                    {/* Price Range */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold font-body" style={{ color: "var(--color-primary)" }}>
                        {minPrice === maxPrice ? formatINR(minPrice) : `${formatINR(minPrice)} – ${formatINR(maxPrice)}`}
                      </span>
                    </td>
                    {/* Stock */}
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 text-xs font-semibold font-body rounded-full"
                        style={{
                          background: totalStock === 0 ? "#FEE2E2" : totalStock < 5 ? "#FEF3C7" : "#D1FAE5",
                          color: totalStock === 0 ? "#991B1B" : totalStock < 5 ? "#92400E" : "#065F46",
                        }}>
                        {totalStock} units
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold font-body px-2.5 py-1 rounded-full w-fit"
                          style={{
                            background: product.isActive ? "#D1FAE5" : "#F3F4F6",
                            color: product.isActive ? "#065F46" : "#6B7280",
                          }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: product.isActive ? "#059669" : "#9CA3AF" }} />
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                        {product.isFeatured && (
                          <span className="text-[10px] font-semibold font-body px-2 py-0.5 rounded-full w-fit"
                            style={{ background: "#FEF3C7", color: "#92400E" }}>
                            ★ Featured
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/shop/${product.slug}`} target="_blank"
                          className="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-gray-50"
                          style={{ borderColor: "#E5E7EB" }}
                          title="View on site">
                          <Eye className="h-3.5 w-3.5" style={{ color: "#9CA3AF" }} />
                        </Link>
                        <Link href={`/admin/products/${product.id}/edit`}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border transition-all hover:bg-blue-50"
                          style={{ borderColor: "#E5E7EB" }}
                          title="Edit product">
                          <Edit2 className="h-3.5 w-3.5" style={{ color: "#3B82F6" }} />
                        </Link>
                        <DeleteProductButton id={product.id} name={product.name} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} products
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
