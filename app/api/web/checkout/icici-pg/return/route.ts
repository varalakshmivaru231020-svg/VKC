// POST/GET /api/web/checkout/icici-pg/return
// ICICI redirects the customer's browser here after payment.
// We verify the secureHash, update the order, and redirect the user to a
// success/failure page.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  loadIciciPgConfig,
  verifySecureHash,
  classifyResponseCode,
} from "@/lib/api/iciciPg";

export const dynamic = "force-dynamic";

async function handle(payload: Record<string, string>) {
  const cfg = await loadIciciPgConfig();
  const claimedHash = payload.secureHash;
  const ok = verifySecureHash(payload as any, cfg.secretKey, claimedHash);

  const merchantTxnNo = payload.merchantTxnNo ?? "";
  const orderInternalId = payload.addlParam1 ?? "";
  const responseCode  = payload.responseCode ?? null;
  const status        = classifyResponseCode(responseCode);

  let order = null;
  if (orderInternalId) {
    order = await db.order.findUnique({ where: { id: orderInternalId } }).catch(() => null);
  }

  // Always hand back to the in-site bridge page rather than a final destination:
  // when the gateway was opened in a popup it posts the result to the checkout
  // tab and closes itself, and when it wasn't it redirects on as normal.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const bridge = (params: Record<string, string>) =>
    `${baseUrl}/checkout/icici-return?${new URLSearchParams(params).toString()}`;

  if (!order || !ok) {
    console.error("[icici-pg/return] verification failed", {
      hashOk: ok, orderFound: !!order, merchantTxnNo, responseCode,
    });
    return NextResponse.redirect(bridge({ status: "failed", reason: "verify_failed" }), { status: 303 });
  }

  // Update order status
  const newPaymentStatus = status === "SUCCESS" ? "PAID" : status === "FAILED" ? "FAILED" : "PENDING";
  const newOrderStatus   = status === "SUCCESS" ? "CONFIRMED" : status === "FAILED" ? "CANCELLED" : order.status;

  await db.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: newPaymentStatus,
      status:        newOrderStatus,
      paymentId:     payload.txnID ?? payload.tranCtx ?? merchantTxnNo,
      notes:         order.notes
        ? `${order.notes}\n[icici-pg] ${responseCode ?? "?"} ${payload.respDescription ?? ""}`
        : `[icici-pg] ${responseCode ?? "?"} ${payload.respDescription ?? ""}`,
    },
  }).catch((e) => { console.error("[icici-pg/return] order update failed:", e); });

  return NextResponse.redirect(bridge({
    status: status.toLowerCase(),          // success | failed | pending
    order:  order.orderNumber,
    ...(responseCode ? { code: responseCode } : {}),
  }), { status: 303 });
}

export async function POST(req: NextRequest) {
  // ICICI posts back as x-www-form-urlencoded
  const form = await req.formData();
  const payload: Record<string, string> = {};
  form.forEach((v, k) => { payload[k] = String(v); });
  return handle(payload);
}

export async function GET(req: NextRequest) {
  const payload: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => { payload[k] = v; });
  return handle(payload);
}
