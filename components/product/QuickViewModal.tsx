"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, Heart, ShoppingBag, ArrowRight, Check, Minus, Plus, Star } from "lucide-react";
import { useUIStore } from "@/lib/store/ui";
import { useCartStore, useWishlistStore } from "@/lib/store/cart";
import { formatINR, discountPercent } from "@/lib/utils/format";
import { SmartImage } from "@/components/ui/SmartImage";
import type { ProductVariantData } from "@/lib/types/product";
import { productHasChosenColours } from "@/lib/utils/variantColour";

export function QuickViewModal() {
  const { quickViewProduct, closeQuickView } = useUIStore();
  const { addItem } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const pathname = usePathname();
  const router = useRouter();
  const navigatingAway = useRef(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantData | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  // Live rating summary from the same endpoint the product page uses. null
  // while loading so the row can stay hidden instead of flashing zero stars.
  const [rating, setRating] = useState<{ average: number; total: number } | null>(null);

  useEffect(() => {
    const slug = quickViewProduct?.slug;
    setRating(null);
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/v1/products/${slug}/reviews?limit=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.summary) return;
        setRating({ average: Number(d.summary.averageRating || 0), total: Number(d.summary.totalReviews || 0) });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [quickViewProduct?.slug]);

  useEffect(() => {
    if (quickViewProduct) {
      setSelectedVariant(quickViewProduct.variants[0] ?? null);
      setQty(1);
      setAdded(false);
      document.body.style.overflow = "hidden";
      // Kick off the detail page fetch the instant Quick View opens, rather
      // than waiting on the "View Full Details" link's own viewport-based
      // prefetch — that link only exists once the modal is already mounted,
      // so a fast click can otherwise beat the passive prefetch to the punch.
      router.prefetch(`/shop/${quickViewProduct.slug}`);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [quickViewProduct, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeQuickView(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeQuickView]);

  // "View Full Details" only closes the modal once the destination route has
  // actually mounted — closing on a click-time timer instead let the overlay
  // disappear before the new page was ready, flashing whatever page sat
  // behind the modal (the grid, or the homepage) before the redirect landed.
  useEffect(() => {
    if (navigatingAway.current) {
      navigatingAway.current = false;
      closeQuickView();
    }
  }, [pathname, closeQuickView]);

  if (!quickViewProduct || !selectedVariant) return null;

  const p = quickViewProduct;
  // Colour swatches only when the admin chose a colour; placeholder hexes stay hidden.
  const hasColours = productHasChosenColours(p.variants);
  const v = selectedVariant;
  const primaryImage = v.images.find((i) => i.isPrimary) ?? v.images[0];
  const hasDiscount = v.originalPrice > v.salePrice;
  const pct = discountPercent(v.originalPrice, v.salePrice);
  const wishlisted = isWishlisted(v.id);
  const outOfStock = v.stockQty <= 0;
  const available = v.stockQty - v.reservedQty;
  const standardQtyCap = available;

  const handleAddToCart = () => {
    addItem({
      id: `${p.id}-${v.id}`,
      productId: p.slug,
      variantId: v.id,
      productName: p.name,
      variantColor: v.colorName,
      colorHex: v.colorHex,
      sareeCode: v.sareeCode,
      imageUrl: primaryImage?.url,
      salePrice: v.salePrice,
      originalPrice: v.originalPrice,
      quantity: qty,
      stockQty: v.stockQty,
      qtyCap: standardQtyCap,
      gstPercent: p.gstPercent,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      {/* Backdrop — bottom sheet on mobile, centered on sm+ */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
        onClick={closeQuickView}
      >
        {/* Modal */}
        <div
          className="relative w-full sm:max-w-[900px] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col sm:flex-row overflow-hidden"
          style={{ background: "var(--color-ivory)", maxHeight: "90vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle — mobile only */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ background: "var(--color-parchment)" }} />
          </div>

          {/* Close */}
          <button
            onClick={closeQuickView}
            className="absolute top-3 right-3 z-10 h-9 w-9 flex items-center justify-center rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.92)", color: "var(--color-text-muted)" }}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Image Panel — compact height on mobile, tall on sm+ */}
          <div
            className="relative shrink-0 overflow-hidden sm:w-[45%] h-[45vw] sm:h-auto"
            style={{ minHeight: undefined, background: hasColours ? v.colorHex + "18" : "var(--color-cream)" }}
          >
            <div className="absolute inset-0 sm:min-h-[380px]">
              {primaryImage ? (
                // "contain" so the whole product image is visible, including
                // its edges — jaggery packshots are not uploaded 1:1, and
                // "cover" was cropping the label and bottle top.
                <SmartImage
                  src={primaryImage.url}
                  alt={primaryImage.altText ?? p.name}
                  fill
                  objectFit="contain"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full opacity-40" style={{ background: v.colorHex }} />
                  <span className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>{v.colorName}</span>
                </div>
              )}
            </div>

            {/* Color thumbnails */}
            {hasColours && p.variants.length > 1 && (
              <div className="absolute bottom-2 left-2 flex gap-1.5 z-10">
                {p.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => { setSelectedVariant(variant); setQty(1); setAdded(false); }}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all"
                    style={{
                      background: variant.colorHex,
                      borderColor: selectedVariant.id === variant.id ? "white" : "transparent",
                      boxShadow: selectedVariant.id === variant.id ? `0 0 0 2px var(--color-primary)` : "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                    title={variant.colorName}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info Panel — scrollable */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 flex flex-col gap-3 sm:gap-4 min-h-0">
            {/* Category + New badge */}
            <div className="flex items-center gap-2 flex-wrap">
              {p.category && (
                <span className="text-xs font-body font-semibold uppercase tracking-widest" style={{ color: "var(--color-gold)" }}>
                  {p.category.name}
                </span>
              )}
              {p.isFeatured && (
                <span className="px-2 py-0.5 text-[10px] font-body font-bold uppercase tracking-wide rounded-xs text-white bg-[#1B4B6B]">
                  New
                </span>
              )}
            </div>

            {/* Name */}
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.15rem, 2vw, 1.75rem)", fontWeight: "var(--weight-heading)", color: "var(--color-text-primary)", lineHeight: 1.25 }}>
              {p.name}
            </h2>

            {/* Rating — rendered only when approved customer reviews exist.
                Products with zero reviews show nothing here: no empty stars,
                no "No reviews yet". */}
            {rating && rating.total > 0 && (
              <div className="flex items-center gap-1" aria-label={`Rated ${rating.average.toFixed(1)} out of 5 from ${rating.total} ${rating.total === 1 ? "review" : "reviews"}`}>
                {[1,2,3,4,5].map((s) => (
                  <Star
                    key={s}
                    className="h-3.5 w-3.5 fill-current"
                    style={{ color: s <= Math.round(rating.average) ? "var(--color-gold)" : "var(--color-parchment)" }}
                  />
                ))}
                <span className="text-xs font-body ml-1" style={{ color: "var(--color-text-muted)" }}>
                  {rating.average.toFixed(1)} · {rating.total} {rating.total === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "1.6rem", color: "var(--color-primary)" }}>
                {formatINR(v.salePrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm font-body line-through" style={{ color: "var(--color-text-muted)" }}>
                    {formatINR(v.originalPrice)}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-body font-bold rounded-xs text-white" style={{ background: "var(--color-success)" }}>
                    {pct}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Product code */}
            {v.sareeCode && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>Code:</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-xs" style={{ background: "var(--color-cream)", color: "var(--color-text-secondary)", border: "1px solid var(--color-parchment)" }}>
                  {v.sareeCode}
                </span>
              </div>
            )}

            {/* Color selector */}
            {hasColours && p.variants.length > 1 && (
              <div>
                <p className="text-xs font-body font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>
                  Colour: <span style={{ color: "var(--color-text-primary)" }}>{v.colorName}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.variants.map((variant) => {
                    const selected = selectedVariant.id === variant.id;
                    const oos = variant.stockQty <= 0;
                    return (
                      <button
                        key={variant.id}
                        onClick={() => { if (!oos) { setSelectedVariant(variant); setQty(1); setAdded(false); } }}
                        title={variant.colorName}
                        className="relative w-8 h-8 rounded-full border-2 transition-all"
                        style={{
                          background: variant.colorHex,
                          borderColor: selected ? "var(--color-primary)" : "transparent",
                          boxShadow: selected ? `0 0 0 2px var(--color-primary)` : "0 0 0 1px var(--color-parchment)",
                          opacity: oos ? 0.4 : 1,
                          cursor: oos ? "not-allowed" : "pointer",
                        }}
                      >
                        {oos && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-full h-px rotate-45 absolute" style={{ background: "rgba(255,255,255,0.6)" }} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Details chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                p.fabric,
                p.weaveType,
                p.regionOfOrigin,
                p.sareeLengthCm ? `${p.sareeLengthCm / 100}m` : null,
              ].filter(Boolean).map((detail) => (
                <span key={detail} className="px-2.5 py-1 text-xs font-body rounded-full border"
                  style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)", background: "var(--color-cream)" }}>
                  {detail}
                </span>
              ))}
            </div>

            {/* Qty + Add to cart */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center border rounded-sm overflow-hidden shrink-0" style={{ borderColor: "var(--color-parchment)" }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="h-11 w-10 flex items-center justify-center transition-colors hover:bg-cream">
                  <Minus className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
                </button>
                <span className="h-11 w-10 flex items-center justify-center text-sm font-body font-semibold border-x"
                  style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}>
                  {qty}
                </span>
                <button onClick={() => setQty(Math.min(standardQtyCap, qty + 1))}
                  className="h-11 w-10 flex items-center justify-center transition-colors hover:bg-cream"
                  disabled={qty >= standardQtyCap}>
                  <Plus className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-sm text-sm font-body font-semibold transition-all whitespace-nowrap"
                style={{
                  background: added ? "var(--color-success)" : outOfStock ? "var(--color-parchment)" : "var(--color-primary)",
                  color: outOfStock ? "var(--color-text-muted)" : "white",
                }}
              >
                {added ? <><Check className="h-4 w-4 shrink-0" /> Added!</> : outOfStock ? "Out of Stock" : <><ShoppingBag className="h-4 w-4 shrink-0" /> Add to Cart</>}
              </button>

              <button
                onClick={() => toggle(v.id)}
                className="h-11 w-11 flex items-center justify-center rounded-sm border transition-colors shrink-0"
                style={{
                  borderColor: wishlisted ? "var(--color-primary)" : "var(--color-parchment)",
                  background: wishlisted ? "var(--color-primary-50)" : "transparent",
                  color: wishlisted ? "var(--color-primary)" : "var(--color-text-muted)",
                }}
                aria-label="Wishlist"
              >
                <Heart className={wishlisted ? "h-4 w-4 fill-current" : "h-4 w-4"} />
              </button>
            </div>

            {/* Stock warning */}
            {!outOfStock && v.stockQty <= 5 && (
              <p className="text-xs font-body font-semibold" style={{ color: "var(--color-warning)" }}>
                Only {v.stockQty} left in stock
              </p>
            )}

            {/* View full details */}
            <Link
              href={`/shop/${p.slug}`}
              onClick={() => { navigatingAway.current = true; }}
              className="flex items-center gap-1.5 text-sm font-body font-medium transition-colors hover:gap-2.5 mt-auto"
              style={{ color: "var(--color-primary)" }}
            >
              View Full Details <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>

            {/* Safe area spacer for mobile */}
            <div className="sm:hidden h-2" />
          </div>
        </div>
      </div>
    </>
  );
}
