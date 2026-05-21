import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptIciciResponse } from "@/lib/api/icici";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "";

export async function POST(req: Request) {
  try {
    const formData = await req.formData().catch(() => null);
    let encResp: string | null = null;
    if (formData) {
      encResp = formData.get("encResp") as string | null;
    } else {
      const body = await req.json().catch(() => ({}));
      encResp = body.encResp ?? null;
    }

    if (!encResp) {
      return NextResponse.redirect(`${BASE}/checkout/icici-return?status=failed`);
    }

    const response = await decryptIciciResponse(encResp);
    const order = await db.order.findFirst({ where: { orderNumber: response.orderId } });

    if (!order) {
      return NextResponse.redirect(`${BASE}/checkout/icici-return?status=failed`);
    }

    if (response.orderStatus === "Success") {
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          paymentId:     response.trackingId || response.bankRefNo,
          paymentMethod: "icici",
          status:        order.status === "PENDING" ? "CONFIRMED" : order.status,
        },
      });
      return NextResponse.redirect(`${BASE}/checkout/icici-return?status=success&order=${order.orderNumber}`);
    }

    await db.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
    return NextResponse.redirect(`${BASE}/checkout/icici-return?status=failed&order=${order.orderNumber}`);
  } catch (err) {
    console.error("[web/icici/verify]", err);
    return NextResponse.redirect(`${BASE}/checkout/icici-return?status=failed`);
  }
}
