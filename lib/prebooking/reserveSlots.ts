// Atomic pre-booking capacity reservation. Unlike stockQty elsewhere in this
// codebase (never decremented atomically at checkout), pre-booking slots are
// a real manufacturing promise — oversell here is a direct cost to the
// merchant, so this uses a guarded conditional update inside the same
// transaction as order creation. See PRE_BOOKING_PLAN.md §4.1.

export class PreBookingSlotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PreBookingSlotError";
  }
}

export async function reservePreBookingSlot(tx: any, variantId: string, qty: number) {
  const variant = await tx.productVariant.findUnique({
    where: { id: variantId },
    select: {
      preBookedQty: true,
      stockQty: true,
      reservedQty: true,
      product: { select: { preBookingMode: true, preBookingMaxTotalQty: true } },
    },
  });
  if (!variant) throw new PreBookingSlotError("Item not found");

  const mode = variant.product.preBookingMode;
  const eligible =
    mode === "ALWAYS_ON" ||
    (mode === "AUTO_ON_OUT_OF_STOCK" && variant.stockQty - variant.reservedQty <= 0);
  if (!eligible) throw new PreBookingSlotError("This item is not available for pre-booking");

  const cap = variant.product.preBookingMaxTotalQty;
  const result = await tx.productVariant.updateMany({
    where: cap != null
      ? { id: variantId, preBookedQty: { lte: cap - qty } }
      : { id: variantId },
    data: { preBookedQty: { increment: qty } },
  });
  if (result.count === 0) {
    throw new PreBookingSlotError("These pre-booking slots just sold out — please reduce quantity");
  }
}

export async function releasePreBookingSlot(tx: any, variantId: string, qty: number) {
  await tx.productVariant.update({
    where: { id: variantId },
    data: { preBookedQty: { decrement: qty } },
  }).catch(() => {});
}
