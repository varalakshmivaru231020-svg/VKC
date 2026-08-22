// Atomic stock movement at checkout.
//
// Until this existed nothing in the codebase decremented stockQty, while the
// cancel and return paths (app/api/admin/orders/[id], app/api/admin/returns/[id],
// app/api/v1/orders/[id]/cancel) all increment it — so every cancelled or
// returned order silently inflated inventory and placing an order never moved
// it at all.
//
// Follows the same guarded-conditional-update shape as
// lib/prebooking/reserveSlots.ts: the `where` carries the precondition so that
// two concurrent checkouts for the last unit cannot both succeed. Callers must
// run this inside the same transaction as order creation, so a stock shortfall
// rolls the order back rather than leaving a half-placed order behind.

export class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockError";
  }
}

export interface StockLine {
  variantId: string;
  quantity: number;
  /**
   * PRE_BOOKING lines only: how many units were shippable from existing stock
   * when the order was placed. Anything above this is being manufactured and
   * must not touch stockQty (that capacity lives in preBookedQty instead).
   * Null/undefined for STANDARD lines, which come entirely from stock.
   */
  availableAtBooking?: number | null;
  productName?: string;
}

/** Units of a line that actually come out of on-hand stock. */
function fromStock(line: StockLine): number {
  if (line.availableAtBooking == null) return line.quantity;
  return Math.max(0, Math.min(line.quantity, line.availableAtBooking));
}

/**
 * Reduce on-hand stock for each line. Throws StockError if a variant no longer
 * has enough, which aborts the surrounding transaction.
 */
export async function decrementStock(tx: any, lines: StockLine[]): Promise<void> {
  for (const line of lines) {
    const qty = fromStock(line);
    if (qty <= 0) continue;

    const res = await tx.productVariant.updateMany({
      where: { id: line.variantId, stockQty: { gte: qty } },
      data:  { stockQty: { decrement: qty } },
    });

    if (res.count === 0) {
      throw new StockError(
        `${line.productName ?? "An item in your cart"} is no longer available in that quantity. ` +
        `Please reduce the quantity and try again.`,
      );
    }
  }
}

/** Put stock back — for a gateway payment that definitively failed. */
export async function restoreStock(tx: any, lines: StockLine[]): Promise<void> {
  for (const line of lines) {
    const qty = fromStock(line);
    if (qty <= 0) continue;
    await tx.productVariant
      .update({ where: { id: line.variantId }, data: { stockQty: { increment: qty } } })
      .catch(() => {});
  }
}
