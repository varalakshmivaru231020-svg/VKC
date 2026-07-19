import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

function generateOrderNumber(): string {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `VL${ts}${rnd}`.slice(0, 12);
}

// GET: look up order by number (for track order page)
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")?.trim().toUpperCase();
  if (!q) return NextResponse.json({ error: "Query required" }, { status: 400 });

  const order = await db.order.findFirst({
    where: { orderNumber: q },
    include: {
      items: { select: { id: true, productName: true, variantColor: true, quantity: true, imageUrl: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id ?? null;

  const { address, paymentMethod, shippingAmount, discountAmount, couponCode, walletAmount, items } = await req.json();

  if (!address || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const subtotal = items.reduce(
    (sum: number, item: { salePrice: number; quantity: number }) => sum + item.salePrice * item.quantity,
    0
  );

  // GST is informational — prices are treated as tax-inclusive, so it's a
  // breakup within the total (not added on top). Rate comes from the DB,
  // not the client, keyed by each item's variant → product.
  const variantProducts = await db.productVariant.findMany({
    where: { id: { in: items.map((i: { variantId: string }) => i.variantId) } },
    select: { id: true, product: { select: { gstPercent: true } } },
  });
  const gstRateByVariant = new Map(variantProducts.map((v) => [v.id, Number(v.product.gstPercent)]));
  const taxAmount = items.reduce((sum: number, item: { variantId: string; salePrice: number; quantity: number }) => {
    const rate = gstRateByVariant.get(item.variantId) ?? 5;
    const lineTotal = item.salePrice * item.quantity;
    return sum + (lineTotal - lineTotal / (1 + rate / 100));
  }, 0);

  const grossTotal   = Math.max(0, subtotal + (shippingAmount ?? 0) - (discountAmount ?? 0));
  const walletUsed   = Math.max(0, Math.min(Number(walletAmount ?? 0), grossTotal));
  const finalTotal   = Math.max(0, grossTotal - walletUsed);
  const fullyByWallet = walletUsed > 0 && finalTotal === 0;

  const itemsData = items.map((item: {
    productId: string; variantId: string; productName: string;
    variantColor: string; sareeCode?: string; quantity: number;
    salePrice: number; imageUrl?: string;
  }) => ({
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

  const orderBase = {
    orderNumber:     generateOrderNumber(),
    userId,
    status:          "PENDING" as const,
    paymentStatus:   fullyByWallet ? "PAID" as const : "PENDING" as const,
    paymentMethod:   fullyByWallet ? "wallet" : (paymentMethod ?? "upi"),
    subtotal,
    discountAmount:  discountAmount ?? 0,
    shippingAmount:  shippingAmount ?? 0,
    taxAmount,
    totalAmount:     finalTotal,
    walletAmountUsed: walletUsed,
    couponCode:      couponCode || null,
    shippingAddress: address,
    billingAddress:  address,
    items:           { create: itemsData },
  };

  let order: { id: string; orderNumber: string };

  if (walletUsed > 0 && userId) {
    // Deduct wallet in same transaction as order creation
    const result = await db.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || Number(wallet.balance) < walletUsed) {
        throw new Error("Insufficient wallet balance");
      }
      const newBalance = Number(wallet.balance) - walletUsed;

      await tx.wallet.update({ where: { userId }, data: { balance: newBalance } });

      const ord = await tx.order.create({ data: orderBase, select: { id: true, orderNumber: true } });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type:     "DEBIT",
          amount:   walletUsed,
          balance:  newBalance,
          reason:   `Order #${ord.orderNumber}`,
          orderId:  ord.id,
        },
      });

      return ord;
    });
    order = result;
  } else {
    order = await db.order.create({ data: orderBase, select: { id: true, orderNumber: true } });
  }

  // Increment coupon usage
  if (couponCode) {
    await db.coupon.updateMany({
      where: { code: couponCode },
      data: { usedCount: { increment: 1 } },
    }).catch(() => {});
  }

  return NextResponse.json({ order });
}
