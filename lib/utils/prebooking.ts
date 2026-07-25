// Pure helpers for the Pre-Booking MVP — no DB/network access, safe to import
// from both server code (lib/db/products.ts) and client components.

export interface PreBookingProductLike {
  preBookingMode: "OFF" | "AUTO_ON_OUT_OF_STOCK" | "ALWAYS_ON";
  preBookingEtaMinDays?: number | null;
  preBookingEtaMaxDays?: number | null;
  preBookingMaxQtyPerOrder?: number | null;
  preBookingMaxTotalQty?: number | null;
}

export interface PreBookingVariantLike {
  stockQty: number;
  reservedQty: number;
  preBookedQty: number;
}

/** Whether this specific variant should show the Pre-Book CTA right now. */
export function isPreBookingAvailable(
  product: PreBookingProductLike,
  variant: PreBookingVariantLike
): boolean {
  if (product.preBookingMode === "ALWAYS_ON") return true;
  if (product.preBookingMode === "AUTO_ON_OUT_OF_STOCK") {
    return variant.stockQty - variant.reservedQty <= 0;
  }
  return false;
}

/** Remaining pre-booking slots for this variant, or null if uncapped. */
export function preBookingRemainingSlots(
  product: PreBookingProductLike,
  variant: PreBookingVariantLike
): number | null {
  if (product.preBookingMaxTotalQty == null) return null;
  return Math.max(0, product.preBookingMaxTotalQty - variant.preBookedQty);
}

/** Customer-facing ETA copy, e.g. "Ships in 15–25 days". Null if not configured. */
export function preBookingEtaLabel(product: PreBookingProductLike): string | null {
  const { preBookingEtaMinDays: min, preBookingEtaMaxDays: max } = product;
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `Ships in ${min}–${max} days`;
  const days = max ?? min;
  return `Ships in ${days} day${days === 1 ? "" : "s"}`;
}
