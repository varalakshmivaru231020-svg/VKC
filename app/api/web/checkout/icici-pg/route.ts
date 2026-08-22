// POST /api/web/checkout/icici-pg
// Initiates an ICICI PG Direct (Phicommerce v2) sale.
// Returns { orderNumber, redirectUrl } — the client window.location.hrefs there.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decrementStock, restoreStock, StockError } from "@/lib/stock/adjustStock";
import {
  loadIciciPgConfig,
  missingIciciPgFields,
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
  const missing = missingIciciPgFields(cfg);
  if (!cfg.enabled || missing.length) {
    console.error(
      "[icici-pg] refusing to start a sale —",
      cfg.enabled
        ? `missing settings: ${missing.join(", ")} (Admin → Settings → Payments → ICICI PG Direct)`
        : "the ICICI PG toggle is off in Admin → Settings → Payments",
    );
    return NextResponse.json(
      { error: "ICICI payments are unavailable right now. Please choose another payment method." },
      { status: 503 },
    );
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

  // ── Create order in PENDING state, holding stock ────────────────────────────
  // Stock is taken now rather than on payment success, so two people cannot be
  // sent to the gateway for the same last unit. An abandoned payment holds it
  // until the order is cancelled, which puts it back.
  let order: { id: string; orderNumber: string };
  try {
    order = await db.$transaction(async (tx) => {
      await decrementStock(tx, itemsData.map((i: any) => ({
        variantId: i.variantId, quantity: i.quantity, productName: i.productName,
      })));
      return tx.order.create({
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
    });
  } catch (e) {
    if (e instanceof StockError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    throw e;
  }

  if (couponCode) {
    await db.coupon.updateMany({
      where: { code: couponCode },
      data:  { usedCount: { increment: 1 } },
    }).catch(() => {});
  }

  // The order never reached the gateway, so the stock it was holding goes
  // straight back rather than waiting for someone to cancel it by hand.
  const releaseHeldStock = () =>
    db.$transaction((tx) =>
      restoreStock(tx, itemsData.map((i: any) => ({ variantId: i.variantId, quantity: i.quantity }))),
    ).catch(() => {});

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
    await releaseHeldStock();
    return NextResponse.json({ error: "Payment gateway unreachable", details: err?.message }, { status: 502 });
  }

  if (response.responseCode !== "R1000" || !response.redirectURI || !response.tranCtx) {
    console.warn("[icici-pg] gateway rejected:", response);
    await db.order.update({
      where: { id: order.id },
      data:  { paymentStatus: "FAILED", status: "CANCELLED" },
    }).catch(() => {});
    await releaseHeldStock();
    return NextResponse.json({
      error: response.respDescription ?? "Gateway rejected the payment request",
    }, { status: 502 });
  }

  const redirectUrl = `${response.redirectURI}?tranCtx=${encodeURIComponent(response.tranCtx)}`;
  return NextResponse.json({
    orderNumber:   order.orderNumber,
    merchantTxnNo,
    redirectUrl,
  });
}
