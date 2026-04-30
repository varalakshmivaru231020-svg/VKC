import { db } from "@/lib/db";
import { ShoppingCart } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cart History — Admin" };

export default async function CartHistoryPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const limit = 30;

  const [total, carts] = await Promise.all([
    db.cart.count({ where: { items: { some: {} } } }),
    db.cart.findMany({
      where: { items: { some: {} } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: {
          include: {
            variant: {
              include: {
                product: { select: { name: true } },
                images: { select: { url: true }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Cart History</h1>
        <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {total} active carts with items
        </p>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-parchment)" }}>
        {carts.length === 0 ? (
          <div className="p-16 flex flex-col items-center gap-3">
            <ShoppingCart className="h-12 w-12" style={{ color: "var(--color-text-disabled)" }} />
            <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>No carts with items</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--color-parchment)" }}>
            {carts.map((cart) => (
              <div key={cart.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "var(--color-primary)" }}>
                      {cart.user
                        ? (cart.user.firstName?.[0] ?? cart.user.email?.[0] ?? "?").toUpperCase()
                        : "G"}
                    </div>
                    <div>
                      {cart.user ? (
                        <>
                          <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
                            {[cart.user.firstName, cart.user.lastName].filter(Boolean).join(" ") || cart.user.email}
                          </p>
                          <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>{cart.user.email}</p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-muted)" }}>Guest</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(cart.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-body mt-1 inline-block"
                      style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
                      {cart.items.length} item{cart.items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pl-12">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                      style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
                      {item.variant.images[0]?.url && (
                        <div className="relative h-8 w-8 rounded overflow-hidden shrink-0">
                          <SmartImage src={item.variant.images[0].url} alt="" fill objectFit="cover" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
                          {item.variant.product.name}
                        </p>
                        <p className="text-[10px] font-body" style={{ color: "var(--color-text-muted)" }}>
                          {item.variant.colorName} · Qty: {item.quantity}
                          {item.variant.sareeCode && ` · #${item.variant.sareeCode}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
