import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";
import { getRazorpayClient } from "@/lib/api/razorpay";

export const dynamic = "force-dynamic";

function generateOrderNumber(): string {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `VL${ts}${rnd}`.slice(0, 12);
}

interface CheckoutItem {
  productId: string; variantId: string;
  productName: string; variantColor: string;
  sareeCode?: string | null;
  quantity: number;
  salePrice: number;
  imageUrl?: string | null;
}

/**
 * POST — place an order. Auth required.
 * For COD/UPI/etc the order is created in PENDING status. For Razorpay the
 * server creates a Razorpay order and returns its id so the app can launch
 * the native checkout; the app then calls /checkout/razorpay/verify to confirm.
 */
export async function POST(req: Request) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const body = await req.json();
  const {
    address,
    paymentMethod,                  // "cod" | "upi" | "card" | "netbanking" | "razorpay"
    shippingAmount = 0,
    discountAmount = 0,
    couponCode = null,
    walletAmount = 0,
    items,
    notes = null,
  } = body as {
    address: any;
    paymentMethod: string;
    shippingAmount?: number; discountAmount?: number; walletAmount?: number;
    couponCode?: string | null;
    items: CheckoutItem[];
    notes?: string | null;
  };

  if (!address || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "address and items required" }, { status: 400 });
  }

  const subtotal     = items.reduce((s, i) => s + i.salePrice * i.quantity, 0);
  const grossTotal   = Math.max(0, subtotal + (shippingAmount ?? 0) - (discountAmount ?? 0));
  const walletUsed   = Math.max(0, Math.min(Number(walletAmount ?? 0), grossTotal));
  const finalTotal   = Math.max(0, grossTotal - walletUsed);
  const fullyByWallet = walletUsed > 0 && finalTotal === 0;

  const itemsData = items.map((it) => ({
    productId:    it.productId,
    variantId:    it.variantId,
    productName:  it.productName,
    variantColor: it.variantColor,
    sareeCode:    it.sareeCode ?? null,
    quantity:     it.quantity,
    unitPrice:    it.salePrice,
    totalPrice:   it.salePrice * it.quantity,
    imageUrl:     it.imageUrl ?? null,
  }));

  const orderBase: any = {
    orderNumber:     generateOrderNumber(),
    userId:          u.id,
    status:          "PENDING",
    paymentStatus:   fullyByWallet ? "PAID" : "PENDING",
    paymentMethod:   fullyByWallet ? "wallet" : (paymentMethod ?? "cod"),
    subtotal,
    discountAmount:  discountAmount ?? 0,
    shippingAmount:  shippingAmount ?? 0,
    taxAmount:       0,
    totalAmount:     finalTotal,
    walletAmountUsed: walletUsed,
    couponCode:      couponCode || null,
    shippingAddress: address,
    billingAddress:  address,
    notes:           notes,
    items:           { create: itemsData },
  };

  let order: { id: string; orderNumber: string; totalAmount: any };

  if (walletUsed > 0) {
    order = await db.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: u.id } });
      if (!wallet || Number(wallet.balance) < walletUsed) throw new Error("Insufficient wallet balance");
      const newBalance = Number(wallet.balance) - walletUsed;
      await tx.wallet.update({ where: { userId: u.id }, data: { balance: newBalance } });
      const ord = await tx.order.create({
        data: orderBase,
        select: { id: true, orderNumber: true, totalAmount: true },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id, type: "DEBIT", amount: walletUsed, balance: newBalance,
          reason: `Order #${ord.orderNumber}`, orderId: ord.id,
        },
      });
      return ord;
    });
  } else {
    order = await db.order.create({
      data: orderBase,
      select: { id: true, orderNumber: true, totalAmount: true },
    });
  }

  if (couponCode) {
    await db.coupon.updateMany({ where: { code: couponCode }, data: { usedCount: { increment: 1 } } }).catch(() => {});
  }

  // For Razorpay: create the Razorpay order so the app can launch native checkout.
  if (paymentMethod === "razorpay" && finalTotal > 0) {
    try {
      const { client, keyId } = await getRazorpayClient();
      const rzpOrder = await client.orders.create({
        amount:   Math.round(finalTotal * 100), // paise
        currency: "INR",
        receipt:  order.orderNumber,
        notes:    { orderId: order.id, userId: u.id },
      });
      return NextResponse.json({
        order,
        razorpay: { orderId: rzpOrder.id, keyId, amount: rzpOrder.amount, currency: rzpOrder.currency },
      });
    } catch (err: any) {
      console.error("[v1/checkout razorpay]", err);
      return NextResponse.json({ order, razorpay: null, warning: "Razorpay not configured" });
    }
  }

  return NextResponse.json({ order });
}
