import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";
import { getRazorpayClient } from "@/lib/api/razorpay";
import { createCashfreeOrder } from "@/lib/api/cashfree";
import { buildIciciPaymentData } from "@/lib/api/icici";

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
    paymentMethod,                  // "cod" | "upi" | "card" | "netbanking" | "razorpay" | "cashfree" | "icici"
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

  // Razorpay: create order and return id for native SDK checkout.
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

  // Cashfree: create order and return payment_session_id for Flutter SDK.
  if (paymentMethod === "cashfree" && finalTotal > 0) {
    try {
      const user = await db.user.findUnique({ where: { id: u.id }, select: { name: true, email: true, phone: true } });
      const cfOrder = await createCashfreeOrder({
        orderId:       order.orderNumber,
        amount:        finalTotal,
        customerPhone: user?.phone ?? "9999999999",
        customerEmail: user?.email,
        customerName:  user?.name,
      });
      return NextResponse.json({
        order,
        cashfree: {
          sessionId:      cfOrder.payment_session_id,
          cashfreeOrderId: cfOrder.cf_order_id,
          orderId:        cfOrder.order_id,
        },
      });
    } catch (err: any) {
      console.error("[v1/checkout cashfree]", err);
      return NextResponse.json({ order, cashfree: null, warning: "Cashfree not configured" });
    }
  }

  // ICICI Eazypay: build encrypted payment URL for WebView.
  if (paymentMethod === "icici" && finalTotal > 0) {
    try {
      const user = await db.user.findUnique({ where: { id: u.id }, select: { name: true, email: true, phone: true } });
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
      const iciciData = await buildIciciPaymentData({
        orderId:         order.orderNumber,
        amount:          finalTotal,
        redirectUrl:     `${baseUrl}/api/v1/checkout/icici/verify`,
        cancelUrl:       `${baseUrl}/api/v1/checkout/icici/verify`,
        billingName:     user?.name ?? "",
        billingEmail:    user?.email ?? "",
        billingTel:      user?.phone ?? "",
        billingAddress:  typeof address === "object" ? (address.addressLine1 ?? "") : "",
        billingCity:     typeof address === "object" ? (address.city ?? "") : "",
        billingState:    typeof address === "object" ? (address.state ?? "") : "",
        billingZip:      typeof address === "object" ? (address.pincode ?? "") : "",
        billingCountry:  "India",
      });
      return NextResponse.json({ order, icici: iciciData });
    } catch (err: any) {
      console.error("[v1/checkout icici]", err);
      return NextResponse.json({ order, icici: null, warning: "ICICI not configured" });
    }
  }

  return NextResponse.json({ order });
}
