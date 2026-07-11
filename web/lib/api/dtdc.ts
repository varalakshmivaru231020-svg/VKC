// Thin DTDC (Shipsy) REST client. Mirrors the shape of lib/api/shiprocket.ts and
// is ported from salesproject (apps/api/src/lib/dtdc.ts).
//
// DTDC exposes two separate API surfaces:
//   1. Order / label / cancel — base `dtdcapi.shipsy.io`, auth via `api-key`
//      header. Used to book a consignment (→ AWB), pull the shipping label,
//      and cancel.
//   2. Tracking — a DIFFERENT base (`blktracksvc.dtdc.com`) that returns XML
//      and authenticates with a pre-issued tracking token passed as `apikey`.
//
// Config is stored in the `SiteSetting` key/value table (keys `dtdc_*`) with
// env-var fallbacks — same pattern as getShiprocketConfig().

import { db } from "@/lib/db";

export interface DtdcConfig {
  enabled:        boolean;
  baseUrl:        string;
  apiKey:         string;
  customerCode:   string;
  defaultService: string;
  trackingBase:   string;
  trackingToken:  string;
  origin: {
    name:      string;
    phone:     string;
    address_1: string;
    address_2: string;
    pincode:   string;
    city:      string;
    state:     string;
  };
}

export async function getDtdcConfig(): Promise<DtdcConfig | null> {
  const keys = [
    "dtdc_enabled", "dtdc_base_url", "dtdc_api_key", "dtdc_customer_code",
    "dtdc_service_type", "dtdc_tracking_base_url", "dtdc_tracking_token",
    "dtdc_origin_name", "dtdc_origin_phone", "dtdc_origin_address_1",
    "dtdc_origin_address_2", "dtdc_origin_pincode", "dtdc_origin_city",
    "dtdc_origin_state",
  ];
  const rows = await db.siteSetting.findMany({ where: { key: { in: keys } } });
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const apiKey       = s.dtdc_api_key       || process.env.DTDC_API_KEY       || "";
  const customerCode = s.dtdc_customer_code || process.env.DTDC_CUSTOMER_CODE || "";
  if (!apiKey || !customerCode) return null;

  return {
    enabled:        s.dtdc_enabled === "true",
    baseUrl:        s.dtdc_base_url          || process.env.DTDC_BASE_URL          || "https://dtdcapi.shipsy.io",
    apiKey,
    customerCode,
    defaultService: s.dtdc_service_type      || process.env.DTDC_DEFAULT_SERVICE_TYPE || "B2C SMART EXPRESS",
    trackingBase:   s.dtdc_tracking_base_url || process.env.DTDC_TRACKING_BASE_URL || "https://blktracksvc.dtdc.com",
    trackingToken:  s.dtdc_tracking_token    || process.env.DTDC_TRACKING_TOKEN    || "",
    origin: {
      name:      s.dtdc_origin_name      || process.env.DTDC_ORIGIN_NAME      || "",
      phone:     s.dtdc_origin_phone     || process.env.DTDC_ORIGIN_PHONE     || "",
      address_1: s.dtdc_origin_address_1 || process.env.DTDC_ORIGIN_ADDRESS_1 || "",
      address_2: s.dtdc_origin_address_2 || process.env.DTDC_ORIGIN_ADDRESS_2 || "",
      pincode:   s.dtdc_origin_pincode   || process.env.DTDC_ORIGIN_PINCODE   || "",
      city:      s.dtdc_origin_city      || process.env.DTDC_ORIGIN_CITY      || "",
      state:     s.dtdc_origin_state     || process.env.DTDC_ORIGIN_STATE     || "",
    },
  };
}

async function requireConfig(): Promise<DtdcConfig> {
  const cfg = await getDtdcConfig();
  if (!cfg) throw new Error("DTDC not configured (api key / customer code missing)");
  return cfg;
}

// ── Order upload (create consignment) ────────────────────────────────────────

export interface DtdcAddress {
  name:      string;
  phone:     string;
  address_1: string;
  address_2?: string;
  pincode:   string;
  city:      string;
  state:     string;
}

export interface CreateConsignmentInput {
  referenceNumber: string;        // our orderNumber (customer_reference_number)
  serviceType?:    string;        // defaults to configured service type
  destination:     DtdcAddress;
  weight:          number;        // kg
  length:          number;        // cm
  width:           number;        // cm
  height:          number;        // cm
  declaredValue:   number;
  numPieces?:      number;
  description?:    string;
  paymentMode:     "Prepaid" | "COD";
  codAmount?:      number;
  invoiceNumber?:  string;
}

// POST /api/customer/integration/consignment/softdata
export async function createConsignment(
  input: CreateConsignmentInput,
): Promise<{ awb: string; raw: unknown }> {
  const cfg = await requireConfig();
  const isCod = input.paymentMode === "COD";
  const consignment = {
    customer_code:   cfg.customerCode,
    service_type_id: input.serviceType || cfg.defaultService,
    load_type:       "NON-DOCUMENT",
    description:     input.description ?? "",
    dimension_unit:  "cm",
    length:          String(input.length),
    width:           String(input.width),
    height:          String(input.height),
    weight_unit:     "kg",
    weight:          String(input.weight),
    declared_value:  String(input.declaredValue),
    num_pieces:      String(input.numPieces ?? 1),
    origin_details: {
      name:           cfg.origin.name,
      phone:          cfg.origin.phone,
      address_line_1: cfg.origin.address_1,
      address_line_2: cfg.origin.address_2,
      pincode:        cfg.origin.pincode,
      city:           cfg.origin.city,
      state:          cfg.origin.state,
    },
    destination_details: {
      name:           input.destination.name,
      phone:          input.destination.phone,
      address_line_1: input.destination.address_1,
      address_line_2: input.destination.address_2 ?? "",
      pincode:        input.destination.pincode,
      city:           input.destination.city,
      state:          input.destination.state,
    },
    customer_reference_number:   input.referenceNumber,
    cod_collection_mode:         isCod ? "CASH" : "",
    cod_amount:                  isCod ? String(input.codAmount ?? 0) : "",
    commodity_id:                "99",
    is_risk_surcharge_applicable: "false",
    invoice_number:              input.invoiceNumber ?? "",
    reference_number:            "",
  };

  const res = await fetch(`${cfg.baseUrl}/api/customer/integration/consignment/softdata`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": cfg.apiKey },
    body: JSON.stringify({ consignments: [consignment] }),
  });
  const body = (await res.json().catch(() => null)) as
    | { status?: string; data?: Array<{ success?: boolean; reference_number?: string; reason?: string; message?: string }> }
    | null;

  if (!res.ok) {
    throw Object.assign(new Error(`DTDC create failed (${res.status})`), { data: body });
  }
  const row = body?.data?.[0];
  if (!row?.success || !row.reference_number) {
    const reason = row?.reason ?? row?.message ?? "DTDC did not accept the consignment";
    throw Object.assign(new Error(reason), { data: body });
  }
  return { awb: row.reference_number, raw: body };
}

// ── Shipping label ───────────────────────────────────────────────────────────

// GET /api/customer/integration/consignment/shippinglabel/stream
// Returns a base64-encoded PDF (label_format=base64 → { label: "<b64>" }).
export async function getShippingLabel(
  awb: string,
  opts: { labelCode?: string } = {},
): Promise<{ pdfBase64: string }> {
  const cfg = await requireConfig();
  const params = new URLSearchParams({
    reference_number: awb,
    label_code:       opts.labelCode ?? "SHIP_LABEL_4X6",
    label_format:     "base64",
  });
  const res = await fetch(
    `${cfg.baseUrl}/api/customer/integration/consignment/shippinglabel/stream?${params.toString()}`,
    { method: "GET", headers: { "api-key": cfg.apiKey } },
  );
  const body = (await res.json().catch(() => null)) as { label?: string; message?: string } | null;
  if (!res.ok || !body?.label) {
    throw Object.assign(new Error(body?.message ?? `DTDC label fetch failed (${res.status})`), { data: body });
  }
  return { pdfBase64: body.label };
}

// ── Cancellation ─────────────────────────────────────────────────────────────

// POST /api/customer/integration/consignment/cancel
export async function cancelConsignment(awbs: string[]): Promise<unknown> {
  const cfg = await requireConfig();
  const res = await fetch(`${cfg.baseUrl}/api/customer/integration/consignment/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": cfg.apiKey },
    body: JSON.stringify({ AWBNo: awbs, customerCode: cfg.customerCode }),
  });
  const body = (await res.json().catch(() => null)) as
    | { status?: string; success?: boolean; error?: string; message?: string; failures?: Array<{ reason?: string; message?: string }> }
    | null;
  if (!res.ok || body?.success === false) {
    const reason = body?.failures?.[0]?.message
      ?? body?.failures?.[0]?.reason
      ?? body?.error ?? body?.message ?? `DTDC cancel failed (${res.status})`;
    throw Object.assign(new Error(reason), { data: body });
  }
  return body;
}

// ── Tracking (separate token-based XML API) ──────────────────────────────────

// GET <tracking_base>/dtdc-api/rest/XMLCnTrk/getDetails?strcnno=<awb>&TrkType=cnno&addtnlDtl=Y&apikey=<token>
export async function trackConsignment(awb: string): Promise<{ status: string | null; raw: string }> {
  const cfg = await requireConfig();
  if (!cfg.trackingToken) {
    throw new Error("DTDC tracking token is not set (Settings → DTDC → Tracking Token)");
  }
  const params = new URLSearchParams({
    strcnno:   awb,
    TrkType:   "cnno",
    addtnlDtl: "Y",
    apikey:    cfg.trackingToken,
  });
  const res = await fetch(
    `${cfg.trackingBase}/dtdc-api/rest/XMLCnTrk/getDetails?${params.toString()}`,
    { method: "GET" },
  );
  const xml = await res.text();
  if (!res.ok) {
    throw Object.assign(new Error(`DTDC track failed (${res.status})`), { data: xml });
  }
  // Response is XML with <FIELD name="strStatus" value="Delivered"/> nodes.
  const status = extractField(xml, "strStatus");
  return { status, raw: xml };
}

function extractField(xml: string, fieldName: string): string | null {
  const re = new RegExp(`name="${fieldName}"\\s+value="([^"]*)"`, "i");
  const m = xml.match(re);
  return m ? m[1] : null;
}

// ── Status mapping ───────────────────────────────────────────────────────────
// Maps DTDC's strStatus strings to our internal delivery events.

export type InternalDeliveryEvent =
  | "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED"
  | "NDR" | "RTO_INITIATED" | "RTO_DELIVERED" | "CANCELLED" | "UNKNOWN";

export function mapDtdcStatus(status: string | undefined | null): InternalDeliveryEvent {
  const s = String(status ?? "").trim().toUpperCase();
  if (!s) return "UNKNOWN";
  if (s.includes("RTO") && s.includes("DELIVER"))            return "RTO_DELIVERED";
  if (s.includes("RTO") || s.includes("RETURNED"))           return "RTO_INITIATED";
  if (s.includes("OUT FOR DELIVERY"))                        return "OUT_FOR_DELIVERY";
  // Check non-delivery states BEFORE 'DELIVERED' — "NOT DELIVERED" and
  // "UNDELIVERED" both contain the substring "DELIVERED".
  if (s.includes("NOT DELIVERED") || s.includes("UNDELIVERED")
      || s.includes("HELDUP") || s.includes("HELD UP"))      return "NDR";
  if (s.includes("DELIVERED"))                               return "DELIVERED";
  if (s.includes("CANCEL"))                                  return "CANCELLED";
  if (s.includes("IN TRANSIT") || s.includes("DISPATCH")
      || s.includes("RECEIVED") || s.includes("ARRIVAL"))    return "IN_TRANSIT";
  if (s.includes("BOOKED") || s.includes("PICKED")
      || s.includes("SOFTDATA") || s.includes("MANIFEST"))   return "PICKED_UP";
  return "UNKNOWN";
}
