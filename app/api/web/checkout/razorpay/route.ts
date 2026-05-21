import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getRazorpayClient } from "@/lib/api/razorpay";

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
    address, items, paymentMethod = "razorpay",
    shippingAmount = 0, discountAmount = 0,
    couponCode = null, walletAmount = 0,
  } = body as {
    address: any; items: any[]; paymentMethod?: string;
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
      paymentMethod,
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

  // Create Razorpay order
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
