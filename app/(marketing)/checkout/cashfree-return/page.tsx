"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function CashfreeReturnPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const orderNumber  = searchParams.get("order");

  const [status, setStatus]   = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!orderNumber) { setStatus("failed"); setMessage("Order not found."); return; }

    fetch(`/api/web/checkout/cashfree/verify-return?order=${orderNumber}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setStatus("success");
        } else {
          setStatus("failed");
          setMessage("Payment was not completed. Your order is on hold.");
        }
      })
      .catch(() => {
        setStatus("failed");
        setMessage("Could not verify payment. Please contact support.");
      });
  }, [orderNumber]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-cream)" }}>
      <div className="max-w-md w-full text-center p-8 rounded-2xl shadow-sm border" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: "var(--color-primary)" }} />
            <p className="text-base font-body" style={{ color: "var(--color-text-muted)" }}>Verifying your payment…</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-14 w-14 mx-auto mb-4" style={{ color: "#16A34A" }} />
            <h1 className="text-2xl font-semibold font-body mb-2" style={{ color: "var(--color-text-primary)" }}>
              Payment Successful!
            </h1>
            <p className="text-sm font-body mb-1" style={{ color: "var(--color-text-muted)" }}>
              Order <strong>{orderNumber}</strong> has been confirmed.
            </p>
            <p className="text-sm font-body mb-6" style={{ color: "var(--color-text-muted)" }}>
              You will receive an SMS/email confirmation shortly.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/account/orders"
                className="w-full py-3 rounded-lg text-white text-sm font-semibold font-body"
                style={{ background: "var(--color-primary)" }}>
                View My Orders
              </Link>
              <Link href="/shop"
                className="w-full py-3 rounded-lg text-sm font-semibold font-body border"
                style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}>
                Continue Shopping
              </Link>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="h-14 w-14 mx-auto mb-4" style={{ color: "#DC2626" }} />
            <h1 className="text-2xl font-semibold font-body mb-2" style={{ color: "var(--color-text-primary)" }}>
              Payment Failed
            </h1>
            <p className="text-sm font-body mb-6" style={{ color: "var(--color-text-muted)" }}>
              {message || "Your payment could not be processed."}
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/checkout"
                className="w-full py-3 rounded-lg text-white text-sm font-semibold font-body"
                style={{ background: "var(--color-primary)" }}>
                Try Again
              </Link>
              <Link href="/account/orders"
                className="w-full py-3 rounded-lg text-sm font-semibold font-body border"
                style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}>
                My Orders
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
