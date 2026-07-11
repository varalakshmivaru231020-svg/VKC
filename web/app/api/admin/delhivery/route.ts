import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  getDelhiveryConfig,
  fetchWaybill,
  createShipment,
  getPackingSlip,
  cancelShipment,
  trackShipment,
  mapDelhiveryStatus,
} from "@/lib/api/delhivery";

export const dynamic = "force-dynamic";

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** GET — config status / track a shipment by AWB (waybill) */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") return forbidden();

  const { searchParams } = new URL(req.url);
  const awb = searchParams.get("awb");
  if (awb) {
    try {
      const data = await trackShipment(awb);
      return NextResponse.json({ tracking: data });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  const cfg = await getDelhiveryConfig();
  return NextResponse.json({ configured: !!cfg, enabled: cfg?.enabled ?? false });
}

/** POST — create shipment / fetch packing slip / cancel */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") return forbidden();

  const body = await req.json();
  const { action, orderId } = body;

  // ── CREATE SHIPMENT ──────────────────────────────────────────────────────
  if (action === "create_shipment") {
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const cfg = await getDelhiveryConfig();
    if (!cfg?.enabled) return NextResponse.json({ error: "Delhivery not enabled" }, { status: 400 });

    const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const addr = (order.shippingAddress ?? {}) as Record<string, string>;
    const dims = (body.dimensions ?? {}) as { length?: number; breadth?: number; height?: number; weight?: number };

    const pincode = addr.pincode ?? addr.zip ?? "";
    if (!addr.addressLine1 && !addr.address) return NextResponse.json({ error: "Order delivery address not set" }, { status: 400 });
    if (!pincode)                            return NextResponse.json({ error: "Order delivery pincode not set" }, { status: 400 });

    const phone = (addr.phone ?? "").replace(/\D+/g, "").slice(-10);
    if (phone.length !== 10) {
      return NextResponse.json({
        error: `Delivery address phone is invalid (got "${addr.phone ?? ""}"). Delhivery needs exactly 10 digits.`,
      }, { status: 400 });
    }

    const paymentMode: "Prepaid" | "COD" =
      order.paymentStatus === "PAID" ? "Prepaid" : order.paymentMethod === "COD" ? "COD" : "Prepaid";
    const subTotal = Number(order.totalAmount);
    const codAmount = paymentMode === "COD" ? subTotal : 0;
    const description = order.items.map((i) => i.sareeCode ?? i.productName).filter(Boolean).join(", ") || "Saree";
    const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
    const weightKg = Number(dims.weight) || Math.max(0.5, 0.5 * totalQty);

    try {
      // Reserve a waybill first, then manifest against it.
      const waybill = await fetchWaybill().catch(() => undefined);
      const result = await createShipment({
        order:       order.orderNumber,
        name:        (addr.fullName ?? "Customer").trim(),
        add:         [addr.addressLine1 ?? addr.address, addr.addressLine2].filter(Boolean).join(", "),
        pin:         String(pincode),
        city:        addr.city ?? "",
        state:       addr.state ?? "",
        phone,
        paymentMode,
        codAmount,
        totalAmount: subTotal,
        weightGrams: Math.round(weightKg * 1000),
        widthCm:     Number(dims.breadth) || 30,
        heightCm:    Number(dims.height)  || 5,
        productsDesc: description,
        quantity:    totalQty || 1,
        waybill,
      });

      const trackingUrl = `https://www.delhivery.com/track/package/${encodeURIComponent(result.waybill)}`;
      await db.order.update({
        where: { id: orderId },
        data: {
          trackingNumber: result.waybill,
          trackingUrl,
          courierPartner: "Delhivery",
        },
      });

      return NextResponse.json({ success: true, awb: result.waybill, courier_name: "Delhivery", trackingUrl });
    } catch (e: any) {
      console.error("[Delhivery] createShipment error:", e?.message ?? e, e?.data);
      return NextResponse.json({ error: e?.message ?? "Create shipment failed", details: e?.data }, { status: 500 });
    }
  }

  // ── PACKING SLIP (label) ─────────────────────────────────────────────────
  if (action === "label") {
    const awb = body.awb || (orderId ? (await db.order.findUnique({ where: { id: orderId }, select: { trackingNumber: true } }))?.trackingNumber : null);
    if (!awb) return NextResponse.json({ error: "No AWB for this order" }, { status: 400 });
    try {
      const { pdfUrl } = await getPackingSlip(awb);
      return NextResponse.json({ success: true, awb, pdfUrl });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ── TRACK ────────────────────────────────────────────────────────────────
  if (action === "track") {
    const awb = body.awb || (orderId ? (await db.order.findUnique({ where: { id: orderId }, select: { trackingNumber: true } }))?.trackingNumber : null);
    if (!awb) return NextResponse.json({ error: "No AWB for this order" }, { status: 400 });
    try {
      const { status } = await trackShipment(awb);
      return NextResponse.json({ success: true, awb, status, mapped: mapDelhiveryStatus(status) });
    } catch (e: any) {
      return NextResponse.json({ error: e.message, details: e?.data }, { status: 500 });
    }
  }

  // ── CANCEL / DELETE DISPATCH ───────────────────────────────────────────────
  // Cancels the shipment with Delhivery AND clears the wrongly-dispatched
  // shipment off the order, reverting SHIPPED → PROCESSING so it can be
  // re-dispatched. `force:true` clears locally even if the carrier cancel fails.
  if (action === "cancel_shipment") {
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
    const order = await db.order.findUnique({ where: { id: orderId }, select: { trackingNumber: true, status: true, courierPartner: true } });
    const awb = body.awb || order?.trackingNumber;
    if (!awb) return NextResponse.json({ error: "No AWB for this order" }, { status: 400 });

    let carrierError: string | null = null;
    try {
      await cancelShipment(awb);
    } catch (e: any) {
      carrierError = e?.message ?? "Delhivery cancel failed";
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
