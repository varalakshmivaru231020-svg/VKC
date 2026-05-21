import crypto from "crypto";
import { db } from "@/lib/db";

async function getCashfreeSettings() {
  const rows = await db.siteSetting.findMany({
    where: { key: { in: ["cashfree_app_id", "cashfree_secret_key", "cashfree_enabled", "cashfree_test_mode"] } },
  });
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value;
  return {
    appId:     m.cashfree_app_id     || process.env.CASHFREE_APP_ID     || "",
    secretKey: m.cashfree_secret_key || process.env.CASHFREE_SECRET_KEY || "",
    enabled:   m.cashfree_enabled === "true",
    testMode:  (m.cashfree_test_mode ?? "true") !== "false",
  };
}

export async function getCashfreeConfig() {
  const cfg = await getCashfreeSettings();
  if (!cfg.enabled || !cfg.appId || !cfg.secretKey) {
    throw new Error("Cashfree is not configured");
  }
  return {
    ...cfg,
    baseUrl: cfg.testMode
      ? "https://sandbox.cashfree.com/pg"
      : "https://api.cashfree.com/pg",
  };
}

export async function createCashfreeOrder(params: {
  orderId: string;
  amount: number;        // in rupees (not paise)
  currency?: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerName?: string | null;
  returnUrl?: string;
}) {
  const { appId, secretKey, baseUrl } = await getCashfreeConfig();

  const res = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: {
      "x-client-id":      appId,
      "x-client-secret":  secretKey,
      "x-api-version":    "2022-09-01",
      "Content-Type":     "application/json",
    },
    body: JSON.stringify({
      order_id:       params.orderId,
      order_amount:   params.amount,
      order_currency: params.currency ?? "INR",
      customer_details: {
        customer_id:    params.orderId,
        customer_phone: params.customerPhone,
        customer_email: params.customerEmail || "customer@example.com",
        customer_name:  params.customerName  || "Customer",
      },
      order_meta: {
        return_url: params.returnUrl ?? `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cashfree/return?order_id={order_id}`,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Cashfree order creation failed: ${JSON.stringify(err)}`);
  }
  return res.json() as Promise<{ cf_order_id: string; order_id: string; payment_session_id: string; payment_link: string; order_status: string }>;
}

/** Verify Cashfree webhook signature. */
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  secretKey: string,
): boolean {
  const data = timestamp + rawBody;
  const computed = crypto.createHmac("sha256", secretKey).update(data).digest("base64");
  return computed === signature;
}

/** Poll Cashfree order payment status after redirect. */
export async function getCashfreePayments(orderId: string) {
  const { appId, secretKey, baseUrl } = await getCashfreeConfig();

  const res = await fetch(`${baseUrl}/orders/${orderId}/payments`, {
    headers: {
      "x-client-id":     appId,
      "x-client-secret": secretKey,
      "x-api-version":   "2022-09-01",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch Cashfree payment status");

  const payments: any[] = await res.json();
  const success = payments.find((p) => p.payment_status === "SUCCESS");
  const failed  = payments.find((p) => p.payment_status === "FAILED");

  return {
    status:    success ? "SUCCESS" : failed ? "FAILED" : "PENDING",
    paymentId: success?.cf_payment_id?.toString() ?? null,
  };
}

export async function isCashfreeEnabled(): Promise<boolean> {
  const s = await getCashfreeSettings();
  return s.enabled && !!s.appId && !!s.secretKey;
}
