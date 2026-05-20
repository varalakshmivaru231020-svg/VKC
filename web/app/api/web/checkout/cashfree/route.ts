import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createCashfreeOrder } from "@/lib/api/cashfree";

export const dynamic = "force-dynamic";

function generateOrderNumber() {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `VL${ts}${rnd}`.slice(0, 12);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id ?? null;

  const body = await req.json();
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

  const subtotal   = items.reduce((s: number, i: any) => s + i.salePrice * i.quantity, 0);
  const gross      = Math.max(0, subtotal + shippingAmount - discountAmount);
  const walletUsed = Math.max(0, Math.min(Number(walletAmount), gross));
  const finalTotal = Math.max(0, gross - walletUsed);

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

  const order = await db.order.create({
    data: {
      orderNumber,
      userId,
      status:          "PENDING",
      paymentStatus:   "PENDING",
      paymentMethod:   "cashfree",
      subtotal,
      discountAmount:  discountAmount ?? 0,
      shippingAmount:  shippingAmount ?? 0,
      taxAmount:       0,
      totalAmount:     finalTotal,
      walletAmountUsed: walletUsed,
      couponCode:      couponCode || null,
      shippingAddress: address,
      billingAddress:  address,
      items:           { create: itemsData },
    },
    select: { id: true, orderNumber: true },
  });

  if (couponCode) {
    await db.coupon.updateMany({
      where: { code: couponCode },
      data:  { usedCount: { increment: 1 } },
    }).catch(() => {});
  }

  // Create Cashfree payment session
  const cfOrder = await createCashfreeOrder({
    orderId:       order.orderNumber,
    amount:        finalTotal,
    customerPhone: address.phone || "9999999999",
    customerName:  address.fullName || "Customer",
    returnUrl:     `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cashfree-return?order=${order.orderNumber}`,
  });

  // Get test mode setting
  const testRow = await db.siteSetting.findUnique({ where: { key: "cashfree_test_mode" } });
  const testMode = (testRow?.value ?? "true") !== "false";

  return NextResponse.json({
    orderNumber:      order.orderNumber,
    paymentSessionId: cfOrder.payment_session_id,
    testMode,
  });
}
