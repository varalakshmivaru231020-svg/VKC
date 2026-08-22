"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Landing point after an ICICI payment (both Eazypay and PG Direct).
// Normally the gateway took over the whole tab, so this just forwards on to the
// right page. If it was opened as a popup instead, it posts the result to the
// checkout tab and closes.
//
// useSearchParams() must sit inside a Suspense boundary — outside one it
// returns null during prerender and `.get()` throws, which is exactly what
// happened when this page started receiving real ICICI returns.

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ivory)" }}>
      <div className="text-center space-y-3">
        <span className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin inline-block" />
        <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>Processing payment…</p>
      </div>
    </div>
  );
}

function IciciReturnInner() {
  const params = useSearchParams();
  const status = params?.get("status") ?? null;
  const order  = params?.get("order")  ?? null;

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: "icici_payment_complete", status, orderNumber: order },
          window.location.origin,
        );
        window.close();
        return;
      }
    } catch {
      // Cross-origin or already-closed opener — fall through to redirecting.
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
  }, [status, order]);

  return <Spinner />;
}

export default function IciciReturnPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <IciciReturnInner />
    </Suspense>
  );
}
