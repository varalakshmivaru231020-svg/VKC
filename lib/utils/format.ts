/** Format a number as Indian Rupees: ₹1,18,500 */
export function formatINR(amount: number | null | undefined): string {
  return "₹" + (amount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Parse a `<input type="datetime-local">` value (no timezone info, e.g.
 * "2026-07-27T16:16") as IST — the store is India-only. Parsing it with a
 * bare `new Date(str)` instead treats it as the server's own timezone
 * (UTC on prod), silently shifting every admin-picked time by 5.5 hours.
 */
export function parseISTDateTimeLocal(value: string | null | undefined): Date | null {
  if (!value) return null;
  return new Date(`${value}+05:30`);
}

/** Inverse of parseISTDateTimeLocal — format a stored Date/ISO string back into
 * the IST wall-clock reading a datetime-local input expects. */
export function toISTDateTimeLocal(value: string | Date | null | undefined): string {
  if (!value) return "";
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  return new Date(new Date(value).getTime() + IST_OFFSET_MS).toISOString().slice(0, 16);
}

export function discountPercent(original: number, sale: number): number {
  if (original <= sale) return 0;
  return Math.round(((original - sale) / original) * 100);
}

export function savedAmount(original: number, sale: number): number {
  return Math.max(0, original - sale);
}

export function orderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING:     "Order Placed",
    CONFIRMED:   "Confirmed",
    PROCESSING:  "Processing",
    SHIPPED:     "Shipped",
    DELIVERED:   "Delivered",
    CANCELLED:   "Cancelled",
    REFUNDED:    "Refunded",
  };
  return map[status] ?? status;
}

export function orderStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING:    "warning",
    CONFIRMED:  "info",
    PROCESSING: "info",
    SHIPPED:    "primary",
    DELIVERED:  "success",
    CANCELLED:  "error",
    REFUNDED:   "error",
  };
  return map[status] ?? "default";
}
