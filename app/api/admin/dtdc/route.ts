import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  getDtdcConfig,
  createConsignment,
  getShippingLabel,
  cancelConsignment,
  trackConsignment,
  mapDtdcStatus,
} from "@/lib/api/dtdc";

export const dynamic = "force-dynamic";

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** GET — config status / track a shipment by AWB */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") return forbidden();

  const { searchParams } = new URL(req.url);
  const awb = searchParams.get("awb");
  if (awb) {
    try {
      const data = await trackConsignment(awb);
      return NextResponse.json({ tracking: data });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  const cfg = await getDtdcConfig();
  return NextResponse.json({ configured: !!cfg, enabled: cfg?.enabled ?? false });
}

/** POST — create shipment / fetch label / cancel */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") return forbidden();

  const body = await req.json();
  const { action, orderId } = body;

  // ── CREATE SHIPMENT ──────────────────────────────────────────────────────
  if (action === "create_shipment") {
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const cfg = await getDtdcConfig();
    if (!cfg?.enabled) return NextResponse.json({ error: "DTDC not enabled" }, { status: 400 });

    const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const addr = (order.shippingAddress ?? {}) as Record<string, string>;
    const dims = (body.dimensions ?? {}) as { length?: number; breadth?: number; height?: number; weight?: number };

    const pincode = addr.pincode ?? addr.zip ?? "";
    if (!addr.addressLine1 && !addr.address) return NextResponse.json({ error: "Order delivery address not set" }, { status: 400 });
    if (!pincode)                            return NextResponse.json({ error: "Order delivery pincode not set" }, { status: 400 });

    // Carrier needs exactly 10 digits.
    const phone = (addr.phone ?? "").replace(/\D+/g, "").slice(-10);
    if (phone.length !== 10) {
      return NextResponse.json({
        error: `Delivery address phone is invalid (got "${addr.phone ?? ""}"). DTDC needs exactly 10 digits.`,
      }, { status: 400 });
    }

    const paymentMode: "Prepaid" | "COD" =
      order.paymentStatus === "PAID" ? "Prepaid" : order.paymentMethod === "COD" ? "COD" : "Prepaid";
    const subTotal = Number(order.totalAmount);
    const declaredValue = Number(body.declaredValue) > 0 ? Number(body.declaredValue) : Math.max(subTotal, 1);
    const codAmount = paymentMode === "COD" ? subTotal : 0;
    const description = order.items.map((i) => i.sareeCode ?? i.productName).filter(Boolean).join(", ") || "Saree";
    const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

    try {
      const result = await createConsignment({
        referenceNumber: order.orderNumber,
        serviceType:     body.serviceType || cfg.defaultService,
        destination: {
          name:      (addr.fullName ?? "Customer").trim(),
          phone,
          address_1: addr.addressLine1 ?? addr.address ?? "",
          address_2: addr.addressLine2 ?? "",
          pincode:   String(pincode),
          city:      addr.city ?? "",
          state:     addr.state ?? "",
        },
        weight:        Number(dims.weight)  || Math.max(0.5, 0.5 * totalQty),
        length:        Number(dims.length)  || 40,
        width:         Number(dims.breadth) || 30,
        height:        Number(dims.height)  || 5,
        declaredValue,
        numPieces:     1,
        description,
        paymentMode,
        codAmount,
        invoiceNumber: order.orderNumber,
      });

      const courierLabel = `DTDC${body.serviceType ? ` · ${body.serviceType}` : ""}`;
      await db.order.update({
        where: { id: orderId },
        data: {
          trackingNumber: result.awb,
          courierPartner: courierLabel,
        },
      });

      return NextResponse.json({ success: true, awb: result.awb, courier_name: courierLabel });
    } catch (e: any) {
      console.error("[DTDC] createShipment error:", e?.message ?? e, e?.data);
      return NextResponse.json({ error: e?.message ?? "Create shipment failed", details: e?.data }, { status: 500 });
    }
  }

  // ── SHIPPING LABEL ───────────────────────────────────────────────────────
  if (action === "label") {
    const awb = body.awb || (orderId ? (await db.order.findUnique({ where: { id: orderId }, select: { trackingNumber: true } }))?.trackingNumber : null);
    if (!awb) return NextResponse.json({ error: "No AWB for this order" }, { status: 400 });
    try {
      const { pdfBase64 } = await getShippingLabel(awb);
      return NextResponse.json({ success: true, awb, pdfBase64 });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ── TRACK ────────────────────────────────────────────────────────────────
  // Live status pull for an order's AWB. Returns the raw carrier status plus
  // our mapped internal event so the admin sees where the parcel is.
  if (action === "track") {
    const awb = body.awb || (orderId ? (await db.order.findUnique({ where: { id: orderId }, select: { trackingNumber: true } }))?.trackingNumber : null);
    if (!awb) return NextResponse.json({ error: "No AWB for this order" }, { status: 400 });
    try {
      const { status } = await trackConsignment(awb);
      return NextResponse.json({ success: true, awb, status, mapped: mapDtdcStatus(status) });
    } catch (e: any) {
      return NextResponse.json({ error: e.message, details: e?.data }, { status: 500 });
    }
  }

  // ── CANCEL / DELETE DISPATCH ───────────────────────────────────────────────
  // Cancels the consignment with DTDC AND clears the wrongly-dispatched
  // shipment off the order (tracking fields), reverting SHIPPED → PROCESSING so
  // it can be re-dispatched. `force:true` clears the order locally even when the
  // carrier cancel fails (e.g. AWB already gone) so a bad booking never sticks.
  if (action === "cancel_shipment") {
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
    const order = await db.order.findUnique({ where: { id: orderId }, select: { trackingNumber: true, status: true, courierPartner: true } });
    const awb = body.awb || order?.trackingNumber;
    if (!awb) return NextResponse.json({ error: "No AWB for this order" }, { status: 400 });

    let carrierError: string | null = null;
    try {
      await cancelConsignment([awb]);
    } catch (e: any) {
      carrierError = e?.message ?? "DTDC cancel failed";
      if (!body.force) {
        return NextResponse.json({ error: carrierError, details: e?.data, canForceClear: true }, { status: 502 });
      }
    }

    await db.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: null,
        trackingUrl:    null,
        courierPartner: null,
        ...(order?.status === "SHIPPED" ? { status: "PROCESSING", shippedAt: null, shippedById: null } : {}),
      },
    });

    return NextResponse.json({ success: true, awb, cleared: true, carrierError });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
