"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Landing point after an ICICI payment (both Eazypay and PG Direct).
// The gateway is opened in a popup so the customer never leaves the store, so
// the common case here is: post the result to the checkout tab and close.
// If the popup was blocked the gateway took over the whole tab instead, and
// there is no opener — then this navigates on to the right page itself.
export default function IciciReturnPage() {
  const params = useSearchParams();
  const status = params.get("status");
  const order  = params.get("order");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: "icici_payment_complete", status, orderNumber: order },
        window.location.origin,
      );
      window.close();
      return;
    }

    if (status === "success") {
      window.location.href = order
        ? `/account/orders?paid=${encodeURIComponent(order)}`
        : "/account/orders";
    } else {
      const qs = new URLSearchParams({
        error: status || "failed",
        ...(order ? { order } : {}),
      });
      window.location.href = `/checkout?${qs.toString()}`;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ivory)" }}>
      <div className="text-center space-y-3">
        <span className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin inline-block" />
        <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>Processing payment…</p>
      </div>
    </div>
  );
}
