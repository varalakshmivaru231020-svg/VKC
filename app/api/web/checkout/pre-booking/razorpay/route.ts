import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getRazorpayClient } from "@/lib/api/razorpay";
import { reservePreBookingSlot, PreBookingSlotError } from "@/lib/prebooking/reserveSlots";

export const dynamic = "force-dynamic";

function generateOrderNumber() {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `VL${ts}${rnd}`.slice(0, 12);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId  = (session?.user as any)?.id ?? null;

  const body = await req.json();
  const {
    address, items, shippingAmount = 0, discountAmount = 0,
    couponCode = null, walletAmount = 0,
  } = body as {
    address: any; items: any[];
    shippingAmount?: number; discountAmount?: number;
    couponCode?: string | null; walletAmount?: number;
  };

  if (!address || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Re-check every item's pre-booking eligibility server-side — never trust
  // the client cart snapshot for whether an item is actually pre-bookable.
  const products = await db.product.findMany({
    where: { id: { in: items.map((i: any) => i.productId) } },
    select: {
      id: true, preBookingMode: true, preBookingEtaMinDays: true, preBookingEtaMaxDays: true,
      preBookingDisclaimer: true, preBookingReturnsAllowed: true,
    },
  });
  const productById = Object.fromEntries(products.map((p) => [p.id, p]));

  for (const item of items) {
    const p = productById[item.productId];
    if (!p || p.preBookingMode === "OFF") {
      return NextResponse.json({ error: `"${item.productName}" is not available for pre-booking` }, { status: 400 });
    }
  }

  const subtotal   = items.reduce((s: number, i: any) => s + i.salePrice * i.quantity, 0);
  const gross      = Math.max(0, subtotal + shippingAmount - discountAmount);
  const walletUsed = Math.max(0, Math.min(Number(walletAmount), gross));
  const finalTotal = Math.max(0, gross - walletUsed);
  const orderNumber = generateOrderNumber();

  // ETA = the latest (max) of the involved products' ETA windows — the whole
  // order ships together once every item is ready.
  let maxEtaDays: number | null = null;
  for (const item of items) {
    const p = productById[item.productId];
    const days = p.preBookingEtaMaxDays ?? p.preBookingEtaMinDays;
    if (days != null) maxEtaDays = maxEtaDays == null ? days : Math.max(maxEtaDays, days);
  }
  const preBookingEtaDate = maxEtaDays != null ? new Date(Date.now() + maxEtaDays * 86400000) : null;
  const disclaimers = Array.from(new Set(items.map((i: any) => productById[i.productId]?.preBookingDisclaimer).filter(Boolean)));
  const returnsAllowed = items.every((i: any) => productById[i.productId]?.preBookingReturnsAllowed !== false);

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

  let order;
  try {
    order = await db.$transaction(async (tx) => {
      for (const item of items) {
        await reservePreBookingSlot(tx, item.variantId, item.quantity);
      }
      return tx.order.create({
        data: {
          orderNumber,
          userId,
          orderType:       "PRE_BOOKING",
          status:          "PENDING",
          paymentStatus:   "PENDING",
          paymentMethod:   "razorpay",
          subtotal,
          discountAmount:  discountAmount ?? 0,
          shippingAmount:  shippingAmount ?? 0,
          taxAmount:       0,
          totalAmount:     finalTotal,
          walletAmountUsed: walletUsed,
          couponCode:      couponCode || null,
          shippingAddress: address,
          billingAddress:  address,
          preBookingEtaDate,
          preBookingDisclaimerSnap: disclaimers.join(" ") || null,
          preBookingReturnsAllowedSnap: returnsAllowed,
          items:           { create: itemsData },
        },
        select: { id: true, orderNumber: true },
      });
    });
  } catch (err: any) {
    if (err instanceof PreBookingSlotError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Pre-booking order create error:", err);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }

  if (couponCode) {
    await db.coupon.updateMany({
      where: { code: couponCode },
      data:  { usedCount: { increment: 1 } },
    }).catch(() => {});
  }

  const { client: rzp, keyId } = await getRazorpayClient();
  const rzpOrder = await rzp.orders.create({
    amount:   Math.round(finalTotal * 100), // paise
    currency: "INR",
    receipt:  order.orderNumber,
  });

  return NextResponse.json({
    orderId:        order.id,
    orderNumber:    order.orderNumber,
    razorpayOrderId: rzpOrder.id,
    amount:         Math.round(finalTotal * 100),
    keyId,
    customerName:   address.fullName  ?? "",
    customerPhone:  address.phone     ?? "",
  });
}
