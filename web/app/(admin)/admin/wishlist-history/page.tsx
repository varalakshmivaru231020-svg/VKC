import { db } from "@/lib/db";
import { Heart } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wishlist History — Admin" };

export default async function WishlistHistoryPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const limit = 30;

  const [total, items, topProducts] = await Promise.all([
    db.wishlistItem.count(),
    db.wishlistItem.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        variant: {
          include: {
            product: { select: { id: true, name: true } },
            images: { select: { url: true }, take: 1 },
          },
        },
      },
      orderBy: { addedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.wishlistItem.groupBy({
      by: ["variantId"],
      _count: { variantId: true },
      orderBy: { _count: { variantId: "desc" } },
      take: 5,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const topVariantIds = topProducts.map(t => t.variantId);
  const topVariants = await db.productVariant.findMany({
    where: { id: { in: topVariantIds } },
    include: {
      product: { select: { name: true } },
      images: { select: { url: true }, take: 1 },
    },
  });
  const topVariantMap = Object.fromEntries(topVariants.map(v => [v.id, v]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Wishlist / Favourites</h1>
        <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>{total} items wishlisted across all customers</p>
      </div>

      {/* Most Wishlisted */}
      {topProducts.length > 0 && (
        <div className="rounded-xl border p-5" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
          <h2 className="text-sm font-semibold font-body mb-4" style={{ color: "var(--color-text-primary)" }}>Most Wishlisted Products</h2>
          <div className="flex flex-wrap gap-3">
            {topProducts.map((tp) => {
              const v = topVariantMap[tp.variantId];
              if (!v) return null;
              return (
                <div key={tp.variantId} className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                  style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
                  {v.images[0]?.url && (
                    <div className="relative h-10 w-10 rounded overflow-hidden shrink-0">
                      <SmartImage src={v.images[0].url} alt="" fill objectFit="cover" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>{v.product.name}</p>
                    <p className="text-[10px] font-body" style={{ color: "var(--color-text-muted)" }}>{v.colorName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Heart className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
                      <span className="text-[10px] font-semibold font-body" style={{ color: "var(--color-primary)" }}>
                        {tp._count.variantId}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-parchment)" }}>
        {items.length === 0 ? (
          <div className="p-16 flex flex-col items-center gap-3">
            <Heart className="h-12 w-12" style={{ color: "var(--color-text-disabled)" }} />
            <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>No wishlist items yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-cream)", borderBottom: "1px solid var(--color-parchment)" }}>
                {["Customer", "Product", "Colour", "Added On"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-body font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="border-b" style={{ borderColor: "var(--color-parchment)", background: i % 2 === 0 ? "white" : "var(--color-ivory)" }}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {[item.user.firstName, item.user.lastName].filter(Boolean).join(" ") || item.user.email}
                    </p>
                    <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>{item.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.variant.images[0]?.url && (
                        <div className="relative h-9 w-9 rounded overflow-hidden shrink-0">
                          <SmartImage src={item.variant.images[0].url} alt="" fill objectFit="cover" />
                        </div>
                      )}
                      <p className="text-sm font-body" style={{ color: "var(--color-text-primary)" }}>{item.variant.product.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-body"
                      style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
                      {item.variant.colorName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(item.addedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a key={p} href={`?page=${p}`}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-sm font-body font-medium"
              style={{ background: p === page ? "var(--color-primary)" : "white", color: p === page ? "white" : "var(--color-text-secondary)", border: "1px solid var(--color-parchment)" }}>
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
