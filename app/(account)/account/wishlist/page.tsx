"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useWishlistStore, useCartStore } from "@/lib/store/cart";
import { useUIStore } from "@/lib/store/ui";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductData } from "@/lib/types/product";

export default function WishlistPage() {
  const { variantIds, toggle } = useWishlistStore();
  const { addItem } = useCartStore();
  const { openCart } = useUIStore();

  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch product data whenever wishlist changes
  useEffect(() => {
    if (variantIds.length === 0) { setProducts([]); return; }
    setLoading(true);
    fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantIds }),
    })
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [variantIds]);

  // Products whose wishlisted variant is still in the store
  const visibleProducts = products.filter(p =>
    p.variants.some(v => variantIds.includes(v.id))
  );

  const handleMoveToCart = (product: ProductData) => {
    // Add the wishlisted variant (or first available)
    const variant = product.variants.find(v => variantIds.includes(v.id)) ?? product.variants[0];
    if (!variant || variant.stockQty <= 0) return;
    const primaryImage = variant.images.find(i => i.isPrimary) ?? variant.images[0];
    addItem({
      id: `${product.id}-${variant.id}`,
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantColor: variant.colorName,
      colorHex: variant.colorHex,
      sareeCode: variant.sareeCode ?? null,
      imageUrl: primaryImage?.url,
      salePrice: variant.salePrice,
      originalPrice: variant.originalPrice,
      quantity: 1,
      stockQty: variant.stockQty,
      gstPercent: product.gstPercent,
    });
    toggle(variant.id);   // remove from wishlist
    openCart();
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!loading && variantIds.length === 0) {
    return (
      <div className="px-6 sm:px-8 lg:px-10 py-8 space-y-4">
        <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>My Wishlist</h1>
        <div className="rounded-xl border p-14 flex flex-col items-center text-center gap-4"
          style={{ background: "white", borderColor: "var(--color-parchment)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "var(--color-primary-50)" }}>
            <Heart className="h-7 w-7" style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <p className="text-base font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>Your wishlist is empty</p>
            <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-muted)" }}>Save sarees you love by tapping the heart icon</p>
          </div>
          <Link href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-body font-semibold"
            style={{ background: "var(--color-primary)", color: "white" }}>
            Discover Sarees
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-8 lg:px-10 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
          My Wishlist
          <span className="text-base font-normal ml-2" style={{ color: "var(--color-text-muted)" }}>
            ({variantIds.length} item{variantIds.length !== 1 ? "s" : ""})
          </span>
        </h1>
        <Link href="/shop"
          className="text-sm font-body font-medium transition-colors hover:opacity-80"
          style={{ color: "var(--color-primary)" }}>
          + Add more
        </Link>
      </div>

      {/* Loading skeleton */}
      {loading && visibleProducts.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: variantIds.length }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="rounded-xl" style={{ paddingBottom: "150%", background: "#F3F4F6" }} />
              <div className="mt-3 space-y-2">
                <div className="h-3 rounded" style={{ background: "#F3F4F6", width: "80%" }} />
                <div className="h-3 rounded" style={{ background: "#F3F4F6", width: "50%" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product grid — same layout as homepage */}
      {visibleProducts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {visibleProducts.map(product => {
            const wishlistedVariant = product.variants.find(v => variantIds.includes(v.id)) ?? product.variants[0];
            const inStock = wishlistedVariant.stockQty > 0;
            return (
              <div key={product.id} className="flex flex-col gap-2">
                <ProductCard product={product} />
                {/* Move to Cart */}
                <button
                  onClick={() => handleMoveToCart(product)}
                  disabled={!inStock}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-semibold font-body border transition-all disabled:opacity-40"
                  style={{
                    borderColor: "var(--color-primary)",
                    color: "var(--color-primary)",
                    background: "transparent",
                  }}
                  onMouseEnter={e => {
                    if (inStock) {
                      (e.currentTarget as HTMLElement).style.background = "var(--color-primary)";
                      (e.currentTarget as HTMLElement).style.color = "white";
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--color-primary)";
                  }}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {inStock ? "Move to Cart" : "Out of Stock"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
