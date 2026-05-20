import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptIciciResponse } from "@/lib/api/icici";

export const dynamic = "force-dynamic";

/**
 * POST { encResp }
 * ICICI Eazypay posts the encrypted response to this URL after payment.
 * Decrypts the response, verifies order_status, and marks the order as paid/failed.
 *
 * This endpoint is public (no auth) because ICICI posts to it directly.
 * Security is provided by the AES-encrypted response itself.
 */
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
      return NextResponse.json({ error: "encResp is required" }, { status: 400 });
    }

    const response = await decryptIciciResponse(encResp);

    const order = await db.order.findFirst({
      where: { orderNumber: response.orderId },
    });

    if (!order) {
      console.error("[icici/verify] Order not found for orderId:", response.orderId);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/failed`);
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
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?orderId=${order.id}`,
      );
    }

    await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failed?orderId=${order.id}`,
    );
  } catch (err: any) {
    console.error("[icici/verify]", err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/failed`);
  }
}
