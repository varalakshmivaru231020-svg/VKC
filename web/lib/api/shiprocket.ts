import { db } from "@/lib/db";

interface ShiprocketConfig {
  email: string;
  password: string;
  enabled: boolean;
  channelId?: string;
}

let _tokenCache: { token: string; expiry: number } | null = null;

export async function getShiprocketConfig(): Promise<ShiprocketConfig | null> {
  const keys = ["shiprocket_enabled", "shiprocket_email", "shiprocket_password", "shiprocket_channel_id"];
  const rows = await db.siteSetting.findMany({ where: { key: { in: keys } } });
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const enabled = s.shiprocket_enabled === "true";
  const email = s.shiprocket_email || process.env.SHIPROCKET_EMAIL || "";
  const password = s.shiprocket_password || process.env.SHIPROCKET_PASSWORD || "";

  if (!email || !password) return null;
  return { email, password, enabled, channelId: s.shiprocket_channel_id || undefined };
}

async function getToken(cfg: ShiprocketConfig): Promise<string> {
  const now = Date.now();
  if (_tokenCache && _tokenCache.expiry > now + 60_000) return _tokenCache.token;

  const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: cfg.email, password: cfg.password }),
  });

  if (!res.ok) throw new Error(`Shiprocket auth failed: ${res.status}`);
  const data = await res.json();
  const token = data.token as string;
  // Shiprocket tokens are valid for 10 days; cache for 9 days
  _tokenCache = { token, expiry: now + 9 * 24 * 60 * 60 * 1000 };
  return token;
}

async function shiprocketFetch(path: string, options: RequestInit = {}): Promise<any> {
  const cfg = await getShiprocketConfig();
  if (!cfg) throw new Error("Shiprocket not configured");

  const token = await getToken(cfg);
  const res = await fetch(`https://apiv2.shiprocket.in/v1/external${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok) throw Object.assign(new Error(`Shiprocket ${path} → ${res.status}`), { data: json });
  return json;
}

export interface ShiprocketOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email?: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    hsn?: number;
  }>;
  payment_method: "Prepaid" | "COD";
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

/**
 * Create a Shiprocket order. Optionally assign a specific courier (via courierId)
 * to skip auto-cheapest selection. Returns the SR order_id, shipment_id, and AWB
 * info if a courier was successfully assigned.
 */
export async function createShiprocketOrder(
  payload: ShiprocketOrderPayload,
  opts: { courierId?: number } = {},
): Promise<{
  shiprocket_order_id: number;
  shipment_id: number;
  awb_code?: string;
  courier_name?: string;
}> {
  const cfg = await getShiprocketConfig();
  const orderPayload = {
    ...payload,
    ...(cfg?.channelId ? { channel_id: Number(cfg.channelId) } : {}),
  };

  const orderRes = await shiprocketFetch("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(orderPayload),
  });

  // Shiprocket returns either { order_id, shipment_id, ... } on success
  // or { status_code: 422, message: "..." } on validation failure.
  if (!orderRes?.order_id || !orderRes?.shipment_id) {
    throw Object.assign(
      new Error(`Shiprocket /orders/create/adhoc returned no order_id: ${JSON.stringify(orderRes)}`),
      { data: orderRes },
    );
  }

  const shiprocketOrderId = orderRes.order_id as number;
  const shipmentId        = orderRes.shipment_id as number;

  // Assign courier — pass courier_id when caller picked one explicitly,
  // otherwise Shiprocket picks the cheapest.
  let awb_code: string | undefined;
  let courier_name: string | undefined;
  try {
    const awbPayload: Record<string, unknown> = { shipment_id: shipmentId };
    if (opts.courierId) awbPayload.courier_id = opts.courierId;
    const awbRes = await shiprocketFetch("/courier/assign/awb", {
      method: "POST",
      body: JSON.stringify(awbPayload),
    });
    awb_code     = awbRes.response?.data?.awb_code;
    courier_name = awbRes.response?.data?.courier_name;
  } catch (e: any) {
    console.warn("[Shiprocket] AWB assign failed:", e?.message ?? e);
  }

  return { shiprocket_order_id: shiprocketOrderId, shipment_id: shipmentId, awb_code, courier_name };
}

/**
 * Serviceability check — returns list of couriers that can deliver between
 * the two pincodes for the given weight. Used by the admin "pick courier" UI.
 */
export async function checkServiceability(args: {
  pickupPincode:   string;
  deliveryPincode: string;
  weight:          number;
  cod:             0 | 1;
  declaredValue?:  number;
}): Promise<Array<{
  courier_company_id: number;
  courier_name:       string;
  rate:               number;
  estimated_delivery_days: string;
  rating:             number;
  cod:                number;
  is_surface:         boolean;
}>> {
  const params = new URLSearchParams({
    pickup_postcode:   args.pickupPincode,
    delivery_postcode: args.deliveryPincode,
    weight:            String(args.weight),
    cod:               String(args.cod),
  });
  if (args.declaredValue) params.set("declared_value", String(args.declaredValue));
  const res = await shiprocketFetch(`/courier/serviceability/?${params}`);
  return res?.data?.available_courier_companies ?? [];
}

/** Generate pickup request for a Shiprocket shipment */
export async function generatePickup(shipmentIds: number[]): Promise<any> {
  return shiprocketFetch("/courier/generate/pickup", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentIds }),
  });
}

/** Track a shipment by AWB */
export async function trackShipment(awbCode: string): Promise<any> {
  return shiprocketFetch(`/courier/track/awb/${awbCode}`);
}

/** Cancel a Shiprocket order */
export async function cancelShiprocketOrder(orderIds: number[]): Promise<any> {
  return shiprocketFetch("/orders/cancel", {
    method: "POST",
    body: JSON.stringify({ ids: orderIds }),
  });
}

/** Get available couriers for a shipment */
export async function getAvailableCouriers(params: {
  pickup_postcode: string;
  delivery_postcode: string;
  weight: number;
  cod: 0 | 1;
}): Promise<any> {
  const q = new URLSearchParams({
    pickup_postcode: params.pickup_postcode,
    delivery_postcode: params.delivery_postcode,
    weight: String(params.weight),
    cod: String(params.cod),
  });
  return shiprocketFetch(`/courier/serviceability/?${q}`);
}
