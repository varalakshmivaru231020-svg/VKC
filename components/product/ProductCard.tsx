"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, Eye, Share2, Check, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR, discountPercent } from "@/lib/utils/format";
import { useCartStore, useWishlistStore } from "@/lib/store/cart";
import { useUIStore } from "@/lib/store/ui";
import { SmartImage } from "@/components/ui/SmartImage";
import type { ProductData } from "@/lib/types/product";

interface Props {
  product: ProductData;
  className?: string;
  /** Position within the grid — drives the entrance-animation stagger delay. */
  index?: number;
}

export function ProductCard({ product, className, index = 0 }: Props) {
  const { toggle, isWishlisted } = useWishlistStore();
  const { addItem } = useCartStore();
  const { openQuickView } = useUIStore();
  const reduceMotion = useReducedMotion();

  const [added, setAdded] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [justWishlisted, setJustWishlisted] = useState(false);
  const [shared, setShared] = useState(false);

  const firstVariant = product.variants[0];
  if (!firstVariant) return null;

  const primaryImage = firstVariant.images.find((i) => i.isPrimary) ?? firstVariant.images[0];
  const hasDiscount = firstVariant.originalPrice > firstVariant.salePrice;
  const pct = discountPercent(firstVariant.originalPrice, firstVariant.salePrice);
  const wishlisted = isWishlisted(firstVariant.id);

  const lowestPrice = Math.min(...product.variants.map((v) => v.salePrice));
  const multiPrice = product.variants.some((v) => v.salePrice !== firstVariant.salePrice);
  const outOfStock = product.variants.every((v) => v.stockQty <= 0);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    const willBeWishlisted = !wishlisted;
    toggle(firstVariant.id);
    if (willBeWishlisted) {
      setJustWishlisted(true);
      setTimeout(() => setJustWishlisted(false), 700);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock || added) return;
    addItem({
      id: `${product.id}-${firstVariant.id}`,
      productId: product.id,
      variantId: firstVariant.id,
      productName: product.name,
      variantColor: firstVariant.colorName,
      colorHex: firstVariant.colorHex,
      sareeCode: firstVariant.sareeCode,
      imageUrl: primaryImage?.url,
      salePrice: firstVariant.salePrice,
      originalPrice: firstVariant.originalPrice,
      quantity: 1,
      stockQty: firstVariant.stockQty,
      gstPercent: product.gstPercent,
    });
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 650);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = typeof window !== "undefined" ? `${window.location.origin}/shop/${product.slug}` : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
        return;
      } catch {
        // cancelled — fall through to clipboard copy
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <motion.div
      className={cn("group flex flex-col cursor-pointer", className)}
      initial={reduceMotion ? undefined : { opacity: 0, y: 30 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: Math.min(index % 8, 7) * 0.06 }}
    >
      {/* Image — tall 2:3 ratio for full saree portrait display */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl flex-shrink-0",
          "transition-all duration-[400ms] ease-premium",
          "shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
          "group-hover:-translate-y-2.5 group-hover:scale-[1.02]",
          "group-hover:shadow-[0_0_0_1.5px_var(--color-primary),0_24px_48px_-14px_rgba(0,0,0,0.28)]"
        )}
        style={{
          paddingBottom: "150%",
          background: primaryImage ? (firstVariant.colorHex + "18") : (firstVariant.colorHex + "28"),
          border: "1px solid rgba(0,0,0,0.06)",
        }}
        onClick={() => openQuickView(product)}
      >
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          {/* Top badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            {product.isFeatured && !hasDiscount && (
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm"
                style={{ background: "#1B4B6B", color: "white" }}>
                New
              </span>
            )}
            {hasDiscount && pct > 0 && (
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm animate-pulse-soft"
                style={{ background: "var(--color-error)", color: "white" }}>
                {pct}% Off
              </span>
            )}
            {outOfStock && (
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm"
                style={{ background: "rgba(0,0,0,0.6)", color: "white" }}>
                Sold Out
              </span>
            )}
          </div>

          {/* Quick actions — wishlist / quick view / share, staggered reveal on hover */}
          <div className="quick-actions-cluster absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 -translate-y-2 transition-all duration-300 ease-premium group-hover:opacity-100 group-hover:translate-y-0">
            <button
              onClick={handleToggleWishlist}
              className="relative h-9 w-9 rounded-full flex items-center justify-center shadow-md transition-transform duration-200 hover:scale-110 active:scale-90"
              style={{
                background: wishlisted ? "var(--color-primary)" : "rgba(255,255,255,0.95)",
                transitionDelay: "0ms",
              }}
              aria-label="Wishlist"
            >
              {justWishlisted && (
                <span className="absolute inset-0 rounded-full animate-ping-slow" style={{ background: "var(--color-primary)" }} aria-hidden />
              )}
              <Heart className={cn("h-4 w-4 transition-transform duration-200", wishlisted ? "text-white fill-white scale-110" : "text-gray-600")} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); openQuickView(product); }}
              className="h-9 w-9 rounded-full flex items-center justify-center shadow-md bg-white/95 text-gray-600 transition-all duration-200 hover:scale-110 hover:text-primary active:scale-90"
              style={{ transitionDelay: "80ms" }}
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={handleShare}
              className="h-9 w-9 rounded-full flex items-center justify-center shadow-md bg-white/95 text-gray-600 transition-all duration-200 hover:scale-110 hover:text-primary active:scale-90"
              style={{ transitionDelay: "160ms" }}
              aria-label="Share"
            >
              {shared ? <Check className="h-4 w-4 text-success animate-check-pop" /> : <Share2 className="h-4 w-4" />}
            </button>
          </div>

          {/* Product image */}
          {primaryImage ? (
            <>
              <SmartImage
                src={primaryImage.url}
                alt={primaryImage.altText ?? product.name}
                fill
                className="transition-transform duration-[400ms] ease-premium group-hover:scale-[1.08] group-hover:-translate-y-1.5"
              />
              {/* Shine sweep */}
              <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shine z-[1]" aria-hidden />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className="w-24 h-24 rounded-full opacity-30 transition-opacity group-hover:opacity-45"
                style={{ background: firstVariant.colorHex }}
              />
              <span className="text-xs font-body mt-3 opacity-50" style={{ color: "var(--color-text-muted)" }}>
                {firstVariant.colorName}
              </span>
            </div>
          )}

          {/* Bottom gradient overlay (legibility for the quick-add pill) */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Quick add */}
          {!outOfStock && (
            <div className="quick-add-pill absolute inset-x-3 bottom-3 opacity-0 translate-y-2 transition-all duration-300 ease-premium group-hover:opacity-100 group-hover:translate-y-0">
              <button
                onClick={handleQuickAdd}
                className={cn(
                  "relative w-full h-10 flex items-center justify-center gap-1.5 rounded-full text-xs font-semibold font-body overflow-hidden",
                  "transition-all duration-300 ease-premium shadow-md",
                  "hover:scale-[1.05] hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.96]",
                  added ? "bg-success" : "bg-gradient-to-r from-primary to-primary-dark"
                )}
                style={{ color: "white" }}
              >
                {showRipple && (
                  <span className="absolute h-full aspect-square rounded-full bg-white/40 animate-ripple" aria-hidden />
                )}
                {added ? (
                  <>
                    <Check className="h-3.5 w-3.5 shrink-0 animate-bounce-in" /> Added!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-3.5 w-3.5 shrink-0" /> Add to Cart
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 pt-3 px-0.5 space-y-1.5">
        {/* Color swatches */}
        {product.variants.length > 1 && (
          <div className="flex items-center gap-1.5">
            {product.variants.slice(0, 7).map((v) => (
              <div
                key={v.id}
                title={v.colorName}
                className="w-3.5 h-3.5 rounded-full border-2 border-white transition-transform hover:scale-125 cursor-pointer"
                style={{ background: v.colorHex, boxShadow: "0 0 0 1px var(--color-parchment)" }}
                onClick={() => openQuickView(product)}
              />
            ))}
            {product.variants.length > 7 && (
              <span className="text-[10px] font-body" style={{ color: "var(--color-text-muted)" }}>
                +{product.variants.length - 7}
              </span>
            )}
          </div>
        )}

        {/* Name */}
        <Link href={`/shop/${product.slug}`}>
          <p
            className="text-sm font-semibold leading-snug line-clamp-2 transition-colors duration-200 group-hover:text-primary font-body"
            style={{ color: "var(--color-text-primary)" }}
          >
            {product.name}
          </p>
        </Link>

        {/* Fabric */}
        {product.fabric && (
          <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
            {product.fabric}{product.weaveType ? ` · ${product.weaveType}` : ""}
          </p>
        )}

        {/* Price row */}
        <div className="flex items-center gap-2 flex-wrap mt-auto pt-1 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <span
            style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "var(--text-price-sm)", color: "var(--color-primary)" }}
          >
            {multiPrice ? `From ${formatINR(lowestPrice)}` : formatINR(firstVariant.salePrice)}
          </span>
          {hasDiscount && !multiPrice && (
            <span className="text-xs line-through font-body" style={{ color: "var(--color-text-muted)" }}>
              {formatINR(firstVariant.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
