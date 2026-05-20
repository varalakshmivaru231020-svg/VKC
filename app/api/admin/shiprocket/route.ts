import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  createShiprocketOrder,
  generatePickup,
  trackShipment,
  cancelShiprocketOrder,
  getShiprocketConfig,
} from "@/lib/api/shiprocket";

export const dynamic = "force-dynamic";

function adminOnly() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** GET — check Shiprocket config status / track a shipment */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") return adminOnly();

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

  const cfg = await getShiprocketConfig();
  return NextResponse.json({ configured: !!cfg, enabled: cfg?.enabled ?? false });
}

/** POST — create shipment / assign AWB / generate pickup */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") return adminOnly();

  const body = await req.json();
  const { action, orderId } = body;

  // ── CREATE SHIPMENT ───────────────────────────────────────────────────────
  if (action === "create_shipment") {
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const cfg = await getShiprocketConfig();
    if (!cfg?.enabled) return NextResponse.json({ error: "Shiprocket not enabled" }, { status: 400 });

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const addr = (order.shippingAddress ?? {}) as Record<string, string>;

    const orderItems = order.items.map((item) => ({
      name: item.productName ?? "Saree",
      sku: item.sareeCode ?? item.variantId,
      units: item.quantity,
      selling_price: Number(item.unitPrice),
    }));

    try {
      const result = await createShiprocketOrder({
        order_id: order.orderNumber,
        order_date: order.createdAt.toISOString().slice(0, 10),
        pickup_location: "Primary",
        billing_customer_name: addr.fullName?.split(" ")[0] ?? "Customer",
        billing_last_name: addr.fullName?.split(" ").slice(1).join(" ") || undefined,
        billing_address: addr.addressLine1 ?? addr.address ?? "",
        billing_city: addr.city ?? "",
        billing_pincode: addr.pincode ?? addr.zip ?? "",
        billing_state: addr.state ?? "",
        billing_country: addr.country ?? "India",
        billing_phone: addr.phone ?? "",
        shipping_is_billing: true,
        order_items: orderItems,
        payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
        sub_total: Number(order.totalAmount),
        length: 40, breadth: 30, height: 5, weight: 0.5 * order.items.reduce((s, i) => s + i.quantity, 0),
      });

      // Persist AWB + courier info back to the order
      await db.order.update({
        where: { id: orderId },
        data: {
          trackingNumber: result.awb_code ?? null,
          courierPartner: result.courier_name ?? null,
          shiprocketOrderId: String(result.shiprocket_order_id),
          shiprocketShipmentId: String(result.shipment_id),
        },
      });

      return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
      console.error("[Shiprocket] createShipment error:", e);
      return NextResponse.json({ error: e.message, details: (e as any).data }, { status: 500 });
    }
  }

  // ── GENERATE PICKUP ───────────────────────────────────────────────────────
  if (action === "generate_pickup") {
    const { shipmentId } = body;
    if (!shipmentId) return NextResponse.json({ error: "shipmentId required" }, { status: 400 });
    try {
      const data = await generatePickup([Number(shipmentId)]);
      return NextResponse.json({ success: true, data });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ── CANCEL SHIPMENT ───────────────────────────────────────────────────────
  if (action === "cancel_shipment") {
    const { shiprocketOrderId } = body;
    if (!shiprocketOrderId) return NextResponse.json({ error: "shiprocketOrderId required" }, { status: 400 });
    try {
      const data = await cancelShiprocketOrder([Number(shiprocketOrderId)]);
      return NextResponse.json({ success: true, data });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
