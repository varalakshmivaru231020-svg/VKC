"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function IciciReturnPage() {
  const params = useSearchParams();
  const status = params.get("status");
  const order  = params.get("order");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.opener) {
      // Opened as popup — send result to parent and close
      window.opener.postMessage(
        { type: "icici_payment_complete", status, orderNumber: order },
        window.location.origin,
      );
      window.close();
    } else {
      // Direct navigation (popup was blocked) — redirect
      if (status === "success") {
        window.location.href = "/account/orders";
      } else {
        window.location.href = "/checkout";
      }
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
