// POST /api/web/checkout/icici-pg
// Initiates an ICICI PG Direct (Phicommerce v2) sale.
// Returns { orderNumber, redirectUrl } — the client window.location.hrefs there.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  loadIciciPgConfig,
  buildInitiateSaleRequest,
  callInitiateSale,
  generateMerchantTxnNo,
} from "@/lib/api/iciciPg";

export const dynamic = "force-dynamic";

function generateOrderNumber() {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `VL${ts}${rnd}`.slice(0, 12);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId  = (session?.user as any)?.id ?? null;

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const {
    address, items,
    shippingAmount = 0, discountAmount = 0,
    couponCode = null, walletAmount = 0,
  } = body as {
    address: any; items: any[];
    shippingAmount?: number; discountAmount?: number;
    couponCode?: string | null; walletAmount?: number;
  };

  if (!address || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const cfg = await loadIciciPgConfig();
  if (!cfg.enabled || !cfg.merchantId || !cfg.secretKey || !cfg.returnUrl) {
    return NextResponse.json({ error: "ICICI PG not configured" }, { status: 503 });
  }

  // ── Amount calc ─────────────────────────────────────────────────────────────
  const subtotal   = items.reduce((s: number, i: any) => s + i.salePrice * i.quantity, 0);
  const gross      = Math.max(0, subtotal + shippingAmount - discountAmount);
  const walletUsed = Math.max(0, Math.min(Number(walletAmount), gross));
  const finalTotal = Math.max(0, gross - walletUsed);
  if (finalTotal <= 0) {
    return NextResponse.json({ error: "Final amount is zero — use a different payment method" }, { status: 400 });
  }
  const orderNumber = generateOrderNumber();

  const itemsData = items.map((item: any) => ({
    productId:    item.productId,
    variantId:    item.variantId,
    productName:  item.productName,
    variantColor: item.variantColor,
    sareeCode:    item.sareeCode ?? null,
    quantity:     item.quantity,
    unitPrice:    item.salePrice,
    totalPrice:   item.salePrice * item.quantity,
    imageUrl:     item.imageUrl ?? null,
  }));

  // ── Create order in PENDING state ───────────────────────────────────────────
  const order = await db.order.create({
    data: {
      orderNumber,
      userId,
      status:           "PENDING",
      paymentStatus:    "PENDING",
      paymentMethod:    "icici_pg",
      subtotal,
      discountAmount:   discountAmount ?? 0,
      shippingAmount:   shippingAmount ?? 0,
      taxAmount:        0,
      totalAmount:      finalTotal,
      walletAmountUsed: walletUsed,
      couponCode:       couponCode || null,
      shippingAddress:  address,
      billingAddress:   address,
      items:            { create: itemsData },
    },
    select: { id: true, orderNumber: true },
  });

  if (couponCode) {
    await db.coupon.updateMany({
      where: { code: couponCode },
      data:  { usedCount: { increment: 1 } },
    }).catch(() => {});
  }

  // ── Build & call initiateSale ───────────────────────────────────────────────
  const merchantTxnNo = generateMerchantTxnNo();
  const requestPayload = buildInitiateSaleRequest(cfg, {
    amount:         finalTotal,
    merchantTxnNo,
    customerEmail:  address.email || `noreply.${order.id.slice(0, 8)}@example.com`,
    customerMobile: address.phone || undefined,
    customerName:   address.fullName || undefined,
    addlParam1:     order.id,
    addlParam2:     order.orderNumber,
  });

  let response;
  try {
    response = await callInitiateSale(cfg, requestPayload);
  } catch (err: any) {
    console.error("[icici-pg] gateway call failed:", err?.message ?? err);
    // Mark order failed
    await db.order.update({
      where: { id: order.id },
      data:  { paymentStatus: "FAILED", status: "CANCELLED" },
    }).catch(() => {});
    return NextResponse.json({ error: "Payment gateway unreachable", details: err?.message }, { status: 502 });
  }

  if (response.responseCode !== "R1000" || !response.redirectURI || !response.tranCtx) {
    console.warn("[icici-pg] gateway rejected:", response);
    await db.order.update({
      where: { id: order.id },
      data:  { paymentStatus: "FAILED", status: "CANCELLED" },
    }).catch(() => {});
    return NextResponse.json({
      error: response.respDescription ?? "Gateway rejected the payment request",
      response,
    }, { status: 502 });
  }

  const redirectUrl = `${response.redirectURI}?tranCtx=${encodeURIComponent(response.tranCtx)}`;
  return NextResponse.json({
    orderNumber:   order.orderNumber,
    merchantTxnNo,
    redirectUrl,
  });
}
