import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  createShiprocketOrder,
  generatePickup,
  trackShipment,
  cancelShiprocketOrder,
  getShiprocketConfig,
  checkServiceability,
  mapShiprocketStatus,
  extractShiprocketStatus,
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

  // ── SERVICEABILITY ────────────────────────────────────────────────────────
  // Returns list of couriers available for the route. Used by the admin dialog
  // (Step 2) so the admin can pick a specific courier before creating the order.
  if (action === "serviceability") {
    const { pickupPincode, deliveryPincode, weight, cod } = body;
    if (!pickupPincode || !deliveryPincode || !weight) {
      return NextResponse.json({ error: "pickupPincode, deliveryPincode, weight required" }, { status: 400 });
    }
    const cfg = await getShiprocketConfig();
    if (!cfg?.enabled) return NextResponse.json({ error: "Shiprocket not enabled" }, { status: 400 });

    try {
      const couriers = await checkServiceability({
        pickupPincode:   String(pickupPincode),
        deliveryPincode: String(deliveryPincode),
        weight:          Number(weight),
        cod:             cod === 1 || cod === "1" ? 1 : 0,
      });
      return NextResponse.json({ couriers });
    } catch (e: any) {
      console.error("[Shiprocket] serviceability error:", e?.message ?? e);
      return NextResponse.json({ error: e?.message ?? "Serviceability check failed" }, { status: 500 });
    }
  }

  // ── CREATE SHIPMENT ───────────────────────────────────────────────────────
  // Accepts optional `dimensions` (length/breadth/height/weight in cm/kg) and
  // `courierId` (from the serviceability list). When omitted, falls back to
  // the legacy defaults + cheapest-courier auto-assign.
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
    const dims = (body.dimensions ?? {}) as { length?: number; breadth?: number; height?: number; weight?: number };
    const courierId = body.courierId ? Number(body.courierId) : undefined;
    // Fall back to configured pickup location name if client didn't override
    const pickupLocation = (body.pickupLocation ?? cfg.pickupLocation ?? "Primary") as string;

    const orderItems = order.items.map((item) => ({
      name: item.productName ?? "Saree",
      sku: item.sareeCode ?? item.variantId,
      units: item.quantity,
      selling_price: Number(item.unitPrice),
    }));

    // Shiprocket REQUIRES billing_last_name as a present field (even if empty
    // string). Returning undefined → "validation.present" 422 error.
    const nameParts  = (addr.fullName ?? "Customer").trim().split(/\s+/).filter(Boolean);
    const firstName  = nameParts[0] ?? "Customer";
    const lastName   = nameParts.slice(1).join(" "); // may be empty string — that's fine

    try {
      // Determine payment method based on payment status
      const paymentMethod = order.paymentStatus === "PAID" ? "Prepaid" : order.paymentMethod === "COD" ? "COD" : "Prepaid";

      const result = await createShiprocketOrder({
        order_id:              order.orderNumber,
        order_date:            order.createdAt.toISOString().slice(0, 10),
        pickup_location:       pickupLocation,
        billing_customer_name: firstName,
        billing_last_name:     lastName, // always present; empty string ok
        billing_address:       addr.addressLine1 ?? addr.address ?? "",
        billing_city:          addr.city ?? "",
        billing_pincode:       addr.pincode ?? addr.zip ?? "",
        billing_state:         addr.state ?? "",
        billing_country:       addr.country ?? "India",
        billing_email:         addr.email || addr.billingEmail || undefined,
        billing_phone:         addr.phone ?? "",
        shipping_is_billing:   true,
        order_items:           orderItems,
        payment_method:        paymentMethod,
        sub_total:             Number(order.totalAmount),
        length:  Number(dims.length)  || 40,
        breadth: Number(dims.breadth) || 30,
        height:  Number(dims.height)  || 5,
        weight:  Number(dims.weight)  || Math.max(0.5, 0.5 * order.items.reduce((s, i) => s + i.quantity, 0)),
      }, { courierId });

      // Persist AWB + courier info back to the order
      await db.order.update({
        where: { id: orderId },
        data: {
          trackingNumber:       result.awb_code ?? null,
          courierPartner:       result.courier_name ?? null,
          shiprocketOrderId:    String(result.shiprocket_order_id),
          shiprocketShipmentId: String(result.shipment_id),
        },
      });

      return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
      console.error("[Shiprocket] createShipment error:", e?.message ?? e, e?.data);

      // When Shiprocket rejects with "Wrong Pickup location", they include the
      // list of valid pickup locations in `data.data[]`. Surface those names so
      // the admin can fix the setting in one click instead of guessing.
      const data = e?.data;
      let helpfulError = e?.message ?? "Create shipment failed";
      if (typeof data?.message === "string" && /pickup location/i.test(data.message)) {
        const names = Array.isArray(data?.data?.data)
          ? data.data.data.map((p: any) => p?.pickup_location).filter(Boolean)
          : [];
        if (names.length) {
          helpfulError = `${data.message}. Available pickup locations on your Shiprocket account: ${names.map((n: string) => `"${n}"`).join(", ")}. Update Settings → Shiprocket → Pickup Location Name.`;
        }
      } else if (data?.errors) {
        // Validation-error case: pull field names out of { field: ["validation.xxx"] }
        const fields = Object.keys(data.errors);
        if (fields.length) helpfulError = `${data.message ?? "Validation failed"} — fields: ${fields.join(", ")}`;
      }

      return NextResponse.json({
        error:   helpfulError,
        details: data,
      }, { status: 500 });
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

  // ── TRACK ───────────────────────────────────────────────────────────────
  // Live status pull for an order's AWB, returning the raw Shiprocket status
  // plus our mapped internal event (same shape as the DTDC/Delhivery routes).
  if (action === "track") {
    const awb = body.awb || (orderId ? (await db.order.findUnique({ where: { id: orderId }, select: { trackingNumber: true } }))?.trackingNumber : null);
    if (!awb) return NextResponse.json({ error: "No AWB for this order" }, { status: 400 });
    try {
      const data = await trackShipment(awb);
      const status = extractShiprocketStatus(data);
      return NextResponse.json({ success: true, awb, status, mapped: mapShiprocketStatus(status) });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ── CANCEL / DELETE DISPATCH ───────────────────────────────────────────────
  // Cancels the order with Shiprocket AND clears the wrongly-dispatched shipment
  // off the order (AWB, courier, shiprocket ids), reverting SHIPPED → PROCESSING
  // so it can be re-dispatched. Accepts orderId (preferred) or a raw
  // shiprocketOrderId. `force:true` clears locally even if the carrier cancel
  // fails, so a bad booking never sticks.
  if (action === "cancel_shipment") {
    const order = orderId
      ? await db.order.findUnique({ where: { id: orderId }, select: { status: true, shiprocketOrderId: true } })
      : null;
    const srOrderId = body.shiprocketOrderId ?? order?.shiprocketOrderId;
    if (!srOrderId) return NextResponse.json({ error: "shiprocketOrderId required" }, { status: 400 });

    let carrierError: string | null = null;
    try {
      await cancelShiprocketOrder([Number(srOrderId)]);
    } catch (e: any) {
      carrierError = e?.message ?? "Shiprocket cancel failed";
      if (!body.force) {
        return NextResponse.json({ error: carrierError, canForceClear: !!orderId }, { status: 502 });
      }
    }

    if (orderId) {
      await db.order.update({
        where: { id: orderId },
        data: {
          trackingNumber:       null,
          trackingUrl:          null,
          courierPartner:       null,
          shiprocketOrderId:    null,
          shiprocketShipmentId: null,
          ...(order?.status === "SHIPPED" ? { status: "PROCESSING", shippedAt: null, shippedById: null } : {}),
        },
      });
    }

    return NextResponse.json({ success: true, cleared: !!orderId, carrierError });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
