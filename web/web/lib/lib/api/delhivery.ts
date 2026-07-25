// Thin Delhivery B2C REST client. Mirrors the shape of lib/api/shiprocket.ts and
// is ported from salesproject (apps/api/src/lib/delhivery.ts).
//
// Auth is a single API token sent as `Authorization: Token <token>` on every
// call. Base URL differs per environment:
//   Production : https://track.delhivery.com
//   Staging    : https://staging-express.delhivery.com
//
// Flow to book a shipment:
//   1. fetchWaybill()      → reserve a waybill number
//   2. createShipment(...) → manifest the parcel against that waybill + pickup
// Then getPackingSlip() for the label, trackShipment() for status, and
// cancelShipment() to cancel.
//
// Config is stored in the `SiteSetting` key/value table (keys `delhivery_*`)
// with env-var fallbacks — same pattern as getShiprocketConfig().

import { db } from "@/lib/db";

export interface DelhiveryConfig {
  enabled:    boolean;
  baseUrl:    string;
  apiToken:   string;
  pickupName: string;
}

export async function getDelhiveryConfig(): Promise<DelhiveryConfig | null> {
  const keys = ["delhivery_enabled", "delhivery_base_url", "delhivery_api_token", "delhivery_pickup_name"];
  const rows = await db.siteSetting.findMany({ where: { key: { in: keys } } });
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const apiToken   = s.delhivery_api_token   || process.env.DELHIVERY_API_TOKEN   || "";
  const pickupName = s.delhivery_pickup_name || process.env.DELHIVERY_PICKUP_NAME || "";
  if (!apiToken || !pickupName) return null;

  return {
    enabled:  s.delhivery_enabled === "true",
    baseUrl:  s.delhivery_base_url || process.env.DELHIVERY_BASE_URL || "https://track.delhivery.com",
    apiToken,
    pickupName,
  };
}

async function requireConfig(): Promise<DelhiveryConfig> {
  const cfg = await getDelhiveryConfig();
  if (!cfg) throw new Error("Delhivery not configured (api token / pickup name missing)");
  return cfg;
}

function authHeaders(token: string, extra: Record<string, string> = {}): Record<string, string> {
  return { Authorization: `Token ${token}`, ...extra };
}

// ── Waybill reservation ──────────────────────────────────────────────────────

// GET /waybill/api/bulk/json/?count=1 → returns a (comma-separated) waybill string.
export async function fetchWaybill(): Promise<string> {
  const cfg = await requireConfig();
  const res = await fetch(`${cfg.baseUrl}/waybill/api/bulk/json/?count=1`, {
    method: "GET",
    headers: authHeaders(cfg.apiToken),
  });
  const text = await res.text();
  if (!res.ok) {
    throw Object.assign(new Error(`Delhivery waybill fetch failed (${res.status})`), { data: text });
  }
  // Response is a JSON string like "\"1234567890\"" or a bare/quoted csv.
  let waybill = text.trim();
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "string") waybill = parsed;
  } catch { /* keep raw text */ }
  waybill = waybill.replace(/^"|"$/g, "").split(",")[0].trim();
  if (!waybill) {
    throw Object.assign(new Error("Delhivery returned an empty waybill"), { data: text });
  }
  return waybill;
}

// ── Create / manifest shipment ───────────────────────────────────────────────

export interface DelhiveryShipmentInput {
  order:         string;          // our orderNumber
  name:          string;          // consignee name
  add:           string;          // consignee address
  pin:           string;
  city:          string;
  state:         string;
  phone:         string;
  paymentMode:   "Prepaid" | "COD";
  codAmount?:    number;
  totalAmount:   number;
  weightGrams:   number;          // Delhivery weight is in grams
  widthCm?:      number;
  heightCm?:     number;
  productsDesc?: string;
  quantity?:     number;
  waybill?:      string;          // pre-reserved waybill (recommended)
}

// POST /api/cmu/create.json  (body form-encoded: format=json&data=<json>)
export async function createShipment(
  input: DelhiveryShipmentInput,
): Promise<{ waybill: string; raw: unknown }> {
  const cfg = await requireConfig();
  const shipment = {
    name:            input.name,
    add:             input.add,
    pin:             input.pin,
    city:            input.city,
    state:           input.state,
    country:         "India",
    phone:           input.phone,
    order:           input.order,
    payment_mode:    input.paymentMode,
    total_amount:    input.totalAmount,
    cod_amount:      input.paymentMode === "COD" ? (input.codAmount ?? input.totalAmount) : 0,
    products_desc:   input.productsDesc ?? "",
    quantity:        input.quantity ?? 1,
    weight:          input.weightGrams,
    shipment_width:  input.widthCm ?? "",
    shipment_height: input.heightCm ?? "",
    ...(input.waybill ? { waybill: input.waybill } : {}),
  };
  const payload = {
    shipments:       [shipment],
    pickup_location: { name: cfg.pickupName },
  };
  const form = new URLSearchParams();
  form.set("format", "json");
  form.set("data", JSON.stringify(payload));

  const res = await fetch(`${cfg.baseUrl}/api/cmu/create.json`, {
    method: "POST",
    headers: authHeaders(cfg.apiToken, { "Content-Type": "application/x-www-form-urlencoded" }),
    body: form.toString(),
  });
  const body = (await res.json().catch(() => null)) as
    | { success?: boolean; error?: unknown; rmk?: string; packages?: Array<{ waybill?: string; status?: string; remarks?: string[] }> }
    | null;

  if (!res.ok) {
    throw Object.assign(new Error(`Delhivery create failed (${res.status})`), { data: body });
  }
  const pkg = body?.packages?.[0];
  const waybill = pkg?.waybill || input.waybill;
  const packageFailed = pkg && typeof pkg.status === "string" && /fail|error/i.test(pkg.status);
  if (body?.success === false || packageFailed || !waybill) {
    const reason = pkg?.remarks?.join("; ") || body?.rmk || "Delhivery did not accept the shipment";
    throw Object.assign(new Error(reason), { data: body });
  }
  return { waybill, raw: body };
}

// ── Packing slip / shipping label ────────────────────────────────────────────

// GET /api/p/packing_slip?wbns=<waybill>&pdf=true
export async function getPackingSlip(waybill: string): Promise<{ pdfUrl: string | null; raw: unknown }> {
  const cfg = await requireConfig();
  const params = new URLSearchParams({ wbns: waybill, pdf: "true" });
  const res = await fetch(`${cfg.baseUrl}/api/p/packing_slip?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(cfg.apiToken),
  });
  const body = (await res.json().catch(() => null)) as
    | { packages?: Array<{ pdf_download_link?: string }> }
    | null;
  if (!res.ok) {
    throw Object.assign(new Error(`Delhivery packing slip failed (${res.status})`), { data: body });
  }
  return { pdfUrl: body?.packages?.[0]?.pdf_download_link ?? null, raw: body };
}

// ── Tracking ─────────────────────────────────────────────────────────────────

// GET /api/v1/packages/json/?waybill=<waybill>
export async function trackShipment(waybill: string): Promise<{ status: string | null; raw: unknown }> {
  const cfg = await requireConfig();
  const params = new URLSearchParams({ waybill });
  const res = await fetch(`${cfg.baseUrl}/api/v1/packages/json/?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(cfg.apiToken),
  });
  const body = (await res.json().catch(() => null)) as
    | { ShipmentData?: Array<{ Shipment?: { Status?: { Status?: string } } }> }
    | null;
  if (!res.ok) {
    throw Object.assign(new Error(`Delhivery track failed (${res.status})`), { data: body });
  }
  const status = body?.ShipmentData?.[0]?.Shipment?.Status?.Status ?? null;
  return { status, raw: body };
}

// ── Cancellation ─────────────────────────────────────────────────────────────

// POST /api/p/edit  (form-encoded: format=json&data={waybill, cancellation:"true"})
export async function cancelShipment(waybill: string): Promise<unknown> {
  const cfg = await requireConfig();
  const form = new URLSearchParams();
  form.set("format", "json");
  form.set("data", JSON.stringify({ waybill, cancellation: "true" }));
  const res = await fetch(`${cfg.baseUrl}/api/p/edit`, {
    method: "POST",
    headers: authHeaders(cfg.apiToken, { "Content-Type": "application/x-www-form-urlencoded" }),
    body: form.toString(),
  });
  const body = (await res.json().catch(() => null)) as { status?: boolean; error?: unknown } | null;
  if (!res.ok || body?.status === false) {
    throw Object.assign(new Error(`Delhivery cancel failed (${res.status})`), { data: body });
  }
  return body;
}

// ── Status mapping ───────────────────────────────────────────────────────────

export type InternalDeliveryEvent =
  | "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED"
  | "NDR" | "RTO_INITIATED" | "RTO_DELIVERED" | "CANCELLED" | "UNKNOWN";

export function mapDelhiveryStatus(status: string | undefined | null): InternalDeliveryEvent {
  const s = String(status ?? "").trim().toUpperCase();
  if (!s) return "UNKNOWN";
  if (s.includes("RTO") && s.includes("DELIVER"))       return "RTO_DELIVERED";
  if (s.includes("RTO"))                                return "RTO_INITIATED";
  if (s.includes("DELIVERED"))                          return "DELIVERED";
  if (s.includes("DISPATCHED") || s.includes("OUT FOR DELIVERY")) return "OUT_FOR_DELIVERY";
  if (s.includes("IN TRANSIT") || s.includes("IN-TRANSIT") || s.includes("TRANSIT")) return "IN_TRANSIT";
  if (s.includes("PICKED") || s.includes("MANIFEST"))   return "PICKED_UP";
  if (s.includes("CANCEL"))                             return "CANCELLED";
  if (s.includes("PENDING") || s.includes("NOT PICKED") || s.includes("UNDELIVERED")) return "NDR";
  return "UNKNOWN";
}
