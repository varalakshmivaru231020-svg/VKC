import crypto from "crypto";
import Razorpay from "razorpay";
import { db } from "@/lib/db";

async function getRazorpaySettings(): Promise<{ keyId: string; keySecret: string; enabled: boolean }> {
  const rows = await db.siteSetting.findMany({
    where: { key: { in: ["razorpay_key_id", "razorpay_key_secret", "razorpay_enabled"] } },
  });
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value;
  return {
    keyId:     m.razorpay_key_id     || process.env.RAZORPAY_KEY_ID     || "",
    keySecret: m.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET || "",
    enabled:   (m.razorpay_enabled === "true") || !!process.env.RAZORPAY_KEY_ID,
  };
}

export async function getRazorpayClient() {
  const { keyId, keySecret, enabled } = await getRazorpaySettings();
  if (!enabled || !keyId || !keySecret) {
    throw new Error("Razorpay is not configured");
  }
  return { client: new Razorpay({ key_id: keyId, key_secret: keySecret }), keyId, keySecret };
}

/** Verify the signature returned by the Razorpay checkout. */
export function verifyRazorpaySignature(input: {
  orderId: string;          // razorpay_order_id
  paymentId: string;        // razorpay_payment_id
  signature: string;        // razorpay_signature
  keySecret: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", input.keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return expected === input.signature;
}
