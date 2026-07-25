/** Format a number as Indian Rupees: ₹1,18,500 */
export function formatINR(amount: number | null | undefined): string {
  return "₹" + (amount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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
