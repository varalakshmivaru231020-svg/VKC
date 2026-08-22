// ICICI Bank PG Direct Integration (Phicommerce-powered v2 API).
// Ported from salesproject's iciciPg.ts.
//
// Endpoints:
//   POST {baseUrl}/initiateSale        JSON                 — start a SALE
//   POST {commandUrl} REFUND/STATUS    x-www-form-urlencoded — refund / status / settl
//
// HMAC contract:
//   1. Take the body, sort keys alphabetically (excluding secureHash).
//   2. Concatenate the values (no separators, no key names).
//   3. HMAC-SHA256 with merchant secretKey, hex-encoded lowercase.
//
// IMPORTANT: This is DIFFERENT from ICICI Eazypay (lib/api/icici.ts).
//   - Eazypay → AES-128-CBC encrypted form POST to eazypay.icicibank.com
//   - PG Direct → JSON + HMAC-SHA256 to pgpayuat.icicibank.com (UAT) / pgpay (live)
// Use whichever your merchant agreement is for. The credentials shapes differ.

import crypto from "node:crypto";
import { db } from "@/lib/db";

function randomShort(): string {
  return crypto.randomBytes(4).readUInt32BE(0).toString(36).padStart(7, "0").slice(-6);
}

export interface IciciPgConfig {
  enabled:              boolean;
  testMode:             boolean; // true → UAT hosts, false → live hosts
  baseUrl:              string;  // .../tsp/pg/api/v2 (UAT) or .../pg/api/v2 (Live)
  commandUrl:           string;  // .../tsp/pg/api/command
  settlementDetailsUrl: string;  // .../tsp/pg/api/settlementDetails
  merchantId:           string;
  aggregatorId:         string;
  secretKey:            string;  // HMAC key
  returnUrl:            string;  // public, browser-facing — points to our verify endpoint
  allowedPaymentModes:  string;  // CSV: CARD, NB, WALLET, UPI ('' = all)
}

// UAT sits behind the /tsp/ prefix; per the API doc comment at the top of this
// file, live does not.
//
// UNVERIFIED against ICICI's own docs, and the repo disagrees with itself: the
// old .env.example said live was just "pgpayuat" → "pgpay" with /tsp/ intact.
// Confirm the live root against the onboarding pack before switching off Test
// Mode — if it turns out to keep /tsp/, either fix LIVE_API_ROOT here or set the
// Base/Command URL overrides in Admin → Settings → Payments, which win over these.
const UAT_API_ROOT  = "https://pgpayuat.icicibank.com/tsp/pg/api";
const LIVE_API_ROOT = "https://pgpay.icicibank.com/pg/api";

// The URL trio for a given mode. Used both as runtime defaults and by the admin
// UI so an operator can see which host a save will actually transact against.
export function iciciPgDefaultUrls(testMode: boolean): {
  baseUrl: string; commandUrl: string; settlementDetailsUrl: string;
} {
  const root = testMode ? UAT_API_ROOT : LIVE_API_ROOT;
  return {
    baseUrl:              `${root}/v2`,
    commandUrl:           `${root}/command`,
    settlementDetailsUrl: `${root}/settlementDetails`,
  };
}

// The path ICICI must be told to redirect the customer back to.
export const ICICI_PG_RETURN_PATH = "/api/web/checkout/icici-pg/return";

function isTruthy(v: string | undefined | null): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

let _cached: { value: IciciPgConfig; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

export function invalidateIciciPgConfigCache(): void { _cached = null; }

export async function loadIciciPgConfig(): Promise<IciciPgConfig> {
  if (_cached && _cached.expiresAt > Date.now()) return _cached.value;

  const keys = [
    "icici_pg_enabled", "icici_pg_test_mode", "icici_pg_base_url", "icici_pg_command_url",
    "icici_pg_settlement_details_url", "icici_pg_merchant_id", "icici_pg_aggregator_id",
    "icici_pg_key", "icici_pg_return_url", "icici_pg_allowed_modes",
  ];
  const rows = await db.siteSetting.findMany({ where: { key: { in: keys } } }).catch(() => []);
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string | undefined>;

  // Default to UAT — a missing or blank value must never silently point at live.
  const testModeSetting = s.icici_pg_test_mode?.trim() || process.env.ICICI_PG_TEST_MODE?.trim() || "";
  const testMode = testModeSetting === "" ? true : isTruthy(testModeSetting);
  const urls = iciciPgDefaultUrls(testMode);

  // Return URL is derivable from our own origin — only needs setting to override.
  const siteOrigin = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
  const derivedReturnUrl = siteOrigin ? `${siteOrigin}${ICICI_PG_RETURN_PATH}` : "";

  const cfg: IciciPgConfig = {
    enabled:              isTruthy(s.icici_pg_enabled?.trim() || process.env.ICICI_PG_ENABLED),
    testMode,
    baseUrl:              s.icici_pg_base_url            || process.env.ICICI_PG_BASE_URL              || urls.baseUrl,
    commandUrl:           s.icici_pg_command_url         || process.env.ICICI_PG_COMMAND_URL           || urls.commandUrl,
    settlementDetailsUrl: s.icici_pg_settlement_details_url || process.env.ICICI_PG_SETTLEMENT_DETAILS_URL || urls.settlementDetailsUrl,
    merchantId:           s.icici_pg_merchant_id         || process.env.ICICI_PG_MERCHANT_ID           || "",
    aggregatorId:         s.icici_pg_aggregator_id       || process.env.ICICI_PG_AGGREGATOR_ID         || "",
    secretKey:            s.icici_pg_key                 || process.env.ICICI_PG_KEY                   || "",
    returnUrl:            s.icici_pg_return_url          || process.env.ICICI_PG_RETURN_URL            || derivedReturnUrl,
    allowedPaymentModes:  s.icici_pg_allowed_modes       || process.env.ICICI_PG_ALLOWED_MODES         || "",
  };

  _cached = { value: cfg, expiresAt: Date.now() + CACHE_TTL_MS };
  return cfg;
}

// Human-readable list of the credentials still needed before a sale can start.
// Empty array = ready to transact.
export function missingIciciPgFields(cfg: IciciPgConfig): string[] {
  const missing: string[] = [];
  if (!cfg.merchantId) missing.push("Merchant ID");
  if (!cfg.secretKey)  missing.push("Secret Key (HMAC)");
  if (!cfg.returnUrl)  missing.push("Return URL");
  return missing;
}

// Sort keys alphabetically, concat values, HMAC-SHA256, hex-encoded.
export function buildSecureHash(payload: Record<string, unknown>, key: string): string {
  const sortedKeys = Object.keys(payload).filter((k) => k !== "secureHash").sort();
  const concat = sortedKeys
    .map((k) => {
      const v = payload[k];
      return v === null || v === undefined ? "" : String(v);
    })
    .join("");
  return crypto.createHmac("sha256", key).update(concat).digest("hex");
}

export function verifySecureHash(payload: Record<string, unknown>, key: string, claimed?: string): boolean {
  if (!claimed || !key) return false;
  // Buffer.from(..., "hex") silently truncates on the first invalid pair, which
  // would make timingSafeEqual throw on a malformed callback. Reject up front.
  if (!/^[0-9a-fA-F]+$/.test(claimed)) return false;
  const expected = buildSecureHash(payload, key);
  if (expected.length !== claimed.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(claimed.toLowerCase(), "hex"));
}

// ≤ 20 chars. 'pg' + base36 ms-time + 6-char rnd.
export function generateMerchantTxnNo(): string {
  return `pg${Date.now().toString(36)}${randomShort()}`;
}

// YYYYMMDDHHMMSS in IST, +5 minutes to satisfy the "greater than current time" rule.
export function formatTxnDate(d: Date = new Date()): string {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000 + 5 * 60 * 1000);
  const y  = ist.getUTCFullYear();
  const m  = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(ist.getUTCDate()).padStart(2, "0");
  const hh = String(ist.getUTCHours()).padStart(2, "0");
  const mm = String(ist.getUTCMinutes()).padStart(2, "0");
  const ss = String(ist.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${dd}${hh}${mm}${ss}`;
}

export interface InitiateSaleArgs {
  amount:          number;
  merchantTxnNo:   string;
  customerEmail:   string;
  customerMobile?: string;
  customerName?:   string;
  addlParam1?:     string;  // we use this for our internal orderId
  addlParam2?:     string;  // we use this for orderNumber
}

export interface InitiateSaleRequest {
  merchantId:        string;
  merchantTxnNo:     string;
  amount:            string;
  aggregatorID:      string;
  currencyCode:      string;
  payType:           string;
  customerEmailID:   string;
  transactionType:   string;
  txnDate:           string;
  returnURL:         string;
  customerMobileNo?: string;
  customerName?:     string;
  paymentMode?:      string;
  addlParam1?:       string;
  addlParam2?:       string;
  secureHash:        string;
}

export interface InitiateSaleResponse {
  responseCode:  string;  // R1000 = success
  merchantId?:   string;
  aggregatorID?: string | null;
  merchantTxnNo: string;
  redirectURI?:  string;
  tranCtx?:      string;
  secureHash?:   string;
  respDescription?: string;
  [k: string]: unknown;
}

export function buildInitiateSaleRequest(cfg: IciciPgConfig, args: InitiateSaleArgs): InitiateSaleRequest {
  const VALID_MODES = ["CARD", "NB", "WALLET", "UPI"] as const;
  const selected = (cfg.allowedPaymentModes ?? "")
    .split(",")
    .map((m) => m.trim().toUpperCase())
    .filter((m) => (VALID_MODES as readonly string[]).includes(m))
    .filter((m, i, arr) => arr.indexOf(m) === i)
    .sort();
  // All-selected OR empty → no restriction (omit the field)
  const paymentMode =
    selected.length === 0 || selected.length === VALID_MODES.length
      ? ""
      : selected.join(",");

  const body: Omit<InitiateSaleRequest, "secureHash"> = {
    merchantId:      cfg.merchantId,
    merchantTxnNo:   args.merchantTxnNo,
    amount:          args.amount.toFixed(2),
    aggregatorID:    cfg.aggregatorId,
    currencyCode:    "356", // INR
    payType:         "0",
    customerEmailID: args.customerEmail,
    transactionType: "SALE",
    txnDate:         formatTxnDate(),
    returnURL:       cfg.returnUrl,
    ...(args.customerMobile
      ? { customerMobileNo: args.customerMobile.replace(/\D+/g, "").slice(-10) }
      : {}),
    ...(args.customerName
      ? { customerName: args.customerName.replace(/[^a-zA-Z ]+/g, "").trim().replace(/\s+/g, " ").slice(0, 45) }
      : {}),
    ...(paymentMode      ? { paymentMode } : {}),
    ...(args.addlParam1  ? { addlParam1:  args.addlParam1  } : {}),
    ...(args.addlParam2  ? { addlParam2:  args.addlParam2  } : {}),
  };

  const secureHash = buildSecureHash(body as Record<string, unknown>, cfg.secretKey);
  return { ...body, secureHash };
}

export async function callInitiateSale(cfg: IciciPgConfig, req: InitiateSaleRequest): Promise<InitiateSaleResponse> {
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/initiateSale`;
  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(req),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); }
  catch { throw new Error(`ICICI initiateSale: non-JSON response: ${text.slice(0, 200)}`); }
  if (!res.ok) {
    throw new Error(`ICICI initiateSale HTTP ${res.status}: ${json?.respDescription ?? text.slice(0, 200)}`);
  }
  return json as InitiateSaleResponse;
}

export function classifyResponseCode(code?: string | null): "SUCCESS" | "FAILED" | "PENDING" {
  if (!code) return "PENDING";
  return code === "0000" ? "SUCCESS" : "FAILED";
}

export function mapPaymentMode(paymentMode?: string | null): "CARD" | "UPI" | "BANK_TRANSFER" | "OTHER" {
  if (!paymentMode) return "OTHER";
  const m = paymentMode.toUpperCase();
  if (m === "CARD") return "CARD";
  if (m === "UPI")  return "UPI";
  if (m === "NB")   return "BANK_TRANSFER";
  return "OTHER";
}

// ── Form-urlencoded helpers (REFUND / STATUS) ──────────────────────────

function toFormBody(payload: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const k of Object.keys(payload).sort()) {
    const v = payload[k];
    if (v === null || v === undefined) continue;
    params.append(k, String(v));
  }
  return params.toString();
}

async function postForm(url: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const body = toFormBody(payload);
  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); }
  catch { throw new Error(`ICICI gateway: non-JSON response from ${url}: ${text.slice(0, 200)}`); }
  if (!res.ok) {
    throw new Error(`ICICI HTTP ${res.status}: ${json?.respDescription ?? text.slice(0, 200)}`);
  }
  return json;
}

export interface RefundArgs {
  merchantTxnNo: string;
  originalTxnNo: string;
  amount:        number;
}

export async function callRefund(cfg: IciciPgConfig, args: RefundArgs): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = {
    merchantId:      cfg.merchantId,
    merchantTxnNo:   args.merchantTxnNo,
    originalTxnNo:   args.originalTxnNo,
    amount:          args.amount.toFixed(2),
    transactionType: "REFUND",
    ...(cfg.aggregatorId ? { aggregatorID: cfg.aggregatorId } : {}),
  };
  const secureHash = buildSecureHash(body, cfg.secretKey);
  return postForm(cfg.commandUrl, { ...body, secureHash });
}

export async function callStatusCheck(cfg: IciciPgConfig, merchantTxnNo: string): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = {
    merchantId:      cfg.merchantId,
    merchantTxnNo,
    originalTxnNo:   merchantTxnNo,
    transactionType: "STATUS",
    ...(cfg.aggregatorId ? { aggregatorID: cfg.aggregatorId } : {}),
  };
  const secureHash = buildSecureHash(body, cfg.secretKey);
  return postForm(cfg.commandUrl, { ...body, secureHash });
}

export async function isIciciPgEnabled(): Promise<boolean> {
  const cfg = await loadIciciPgConfig();
  return cfg.enabled && missingIciciPgFields(cfg).length === 0;
}
