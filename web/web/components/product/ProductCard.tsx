"use client";

import Link from "next/link";
import { Heart, Eye, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR, discountPercent } from "@/lib/utils/format";
import { useWishlistStore } from "@/lib/store/cart";
import { useUIStore } from "@/lib/store/ui";
import { SmartImage } from "@/components/ui/SmartImage";
import type { ProductData } from "@/lib/types/product";

interface Props {
  product: ProductData;
  className?: string;
}

export function ProductCard({ product, className }: Props) {
  const { toggle, isWishlisted } = useWishlistStore();
  const { openQuickView } = useUIStore();
  const firstVariant = product.variants[0];
  if (!firstVariant) return null;

  const primaryImage = firstVariant.images.find((i) => i.isPrimary) ?? firstVariant.images[0];
  const hasDiscount = firstVariant.originalPrice > firstVariant.salePrice;
  const pct = discountPercent(firstVariant.originalPrice, firstVariant.salePrice);
  const wishlisted = isWishlisted(firstVariant.id);

  const lowestPrice = Math.min(...product.variants.map((v) => v.salePrice));
  const multiPrice = product.variants.some((v) => v.salePrice !== firstVariant.salePrice);
  const outOfStock = product.variants.every((v) => v.stockQty <= 0);

  return (
    <div className={cn("group flex flex-col cursor-pointer", className)}>
      {/* Image — tall 2:3 ratio for full saree portrait display */}
      <div
        className="relative overflow-hidden rounded-xl flex-shrink-0"
        style={{
          paddingBottom: "150%",
          background: primaryImage ? (firstVariant.colorHex + "18") : (firstVariant.colorHex + "28"),
          border: "1px solid rgba(0,0,0,0.06)",
        }}
        onClick={() => openQuickView(product)}
      >
        <div className="absolute inset-0">
          {/* Top badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            {product.isFeatured && !hasDiscount && (
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm"
                style={{ background: "#1B4B6B", color: "white" }}>
                New
              </span>
            )}
            {hasDiscount && pct > 0 && (
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm"
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

          {/* Wishlist */}
          <button
            onClick={(e) => { e.stopPropagation(); toggle(firstVariant.id); }}
            className={cn(
              "absolute top-3 right-3 z-10 h-9 w-9 rounded-full flex items-center justify-center shadow-md",
              "transition-all duration-200",
              wishlisted ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
            style={{ background: wishlisted ? "var(--color-primary)" : "rgba(255,255,255,0.95)" }}
            aria-label="Wishlist"
          >
            <Heart className={cn("h-4 w-4", wishlisted ? "text-white fill-white" : "text-gray-600")} />
          </button>

          {/* Product image */}
          {primaryImage ? (
            <SmartImage
              src={primaryImage.url}
              alt={primaryImage.altText ?? product.name}
              fill
              className="transition-transform duration-700 group-hover:scale-105"
            />
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

          {/* Bottom gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Action buttons */}
          <div className="absolute inset-x-0 bottom-0 p-3 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={(e) => { e.stopPropagation(); openQuickView(product); }}
              className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold font-body backdrop-blur-sm transition-all hover:opacity-90"
              style={{ background: "var(--color-primary)", color: "white" }}
            >
              <Eye className="h-3.5 w-3.5" /> Quick View
            </button>
            <Link
              href={`/shop/${product.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="h-10 w-10 flex items-center justify-center rounded-lg backdrop-blur-sm border-2 transition-all hover:border-white"
              style={{ background: "rgba(255,255,255,0.15)", color: "white", borderColor: "rgba(255,255,255,0.6)" }}
              title="View full details"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
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
            className="text-sm font-semibold leading-snug line-clamp-2 transition-colors hover:text-primary font-body"
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
        <div className="flex items-center gap-2 flex-wrap mt-auto pt-1">
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
    </div>
  );
}
