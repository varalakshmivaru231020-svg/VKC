import crypto from "crypto";
import { db } from "@/lib/db";

async function getIciciSettings() {
  const rows = await db.siteSetting.findMany({
    where: {
      key: {
        in: [
          "icici_merchant_id", "icici_access_code", "icici_working_key",
          "icici_enabled", "icici_test_mode",
        ],
      },
    },
  });
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value;
  return {
    merchantId:  m.icici_merchant_id  || process.env.ICICI_MERCHANT_ID  || "",
    accessCode:  m.icici_access_code  || process.env.ICICI_ACCESS_CODE  || "",
    workingKey:  m.icici_working_key  || process.env.ICICI_WORKING_KEY  || "",
    enabled:     m.icici_enabled === "true",
    testMode:    (m.icici_test_mode ?? "true") !== "false",
  };
}

export async function getIciciConfig() {
  const cfg = await getIciciSettings();
  if (!cfg.enabled || !cfg.merchantId || !cfg.accessCode || !cfg.workingKey) {
    throw new Error("ICICI Eazypay is not configured");
  }
  return cfg;
}

// AES-128-CBC encryption used by ICICI Eazypay
function encrypt(plainText: string, workingKey: string): string {
  const key = crypto.createHash("md5").update(workingKey).digest();   // 16 bytes
  const iv  = Buffer.alloc(16, 0);                                    // 16 zero bytes
  const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
  cipher.setAutoPadding(true);
  return cipher.update(plainText, "utf8", "hex") + cipher.final("hex");
}

function decrypt(encText: string, workingKey: string): string {
  const key = crypto.createHash("md5").update(workingKey).digest();
  const iv  = Buffer.alloc(16, 0);
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
  decipher.setAutoPadding(true);
  return decipher.update(encText, "hex", "utf8") + decipher.final("utf8");
}

export interface IciciPaymentParams {
  orderId: string;
  amount: number;          // in rupees
  currency?: string;
  redirectUrl: string;    // where ICICI posts the response
  cancelUrl:   string;
  language?:   string;
  billingName?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  billingTel?: string;
  billingEmail?: string;
}

export interface IciciPaymentData {
  /** Encrypted request string to POST to Eazypay */
  encRequest: string;
  accessCode: string;
  paymentUrl: string;
}

/**
 * Build encrypted payment request for ICICI Eazypay.
 * The Flutter app opens a WebView pointing to paymentUrl and POSTs encRequest.
 */
export async function buildIciciPaymentData(params: IciciPaymentParams): Promise<IciciPaymentData> {
  const cfg = await getIciciConfig();

  const plainData = [
    `merchant_id=${cfg.merchantId}`,
    `order_id=${params.orderId}`,
    `currency=${params.currency ?? "INR"}`,
    `amount=${params.amount.toFixed(2)}`,
    `redirect_url=${params.redirectUrl}`,
    `cancel_url=${params.cancelUrl}`,
    `language=${params.language ?? "EN"}`,
    `billing_name=${params.billingName ?? ""}`,
    `billing_address=${params.billingAddress ?? ""}`,
    `billing_city=${params.billingCity ?? ""}`,
    `billing_state=${params.billingState ?? ""}`,
    `billing_zip=${params.billingZip ?? ""}`,
    `billing_country=${params.billingCountry ?? "India"}`,
    `billing_tel=${params.billingTel ?? ""}`,
    `billing_email=${params.billingEmail ?? ""}`,
  ].join("&");

  const encRequest = encrypt(plainData, cfg.workingKey);
  const paymentUrl = cfg.testMode
    ? "https://eazypay.icicibank.com/EazyPG"
    : "https://eazypay.icicibank.com/EazyPG";

  return { encRequest, accessCode: cfg.accessCode, paymentUrl };
}

export interface IciciResponse {
  orderId:       string;
  trackingId:    string;
  bankRefNo:     string;
  orderStatus:   string;   // "Success" | "Failure" | "Aborted" | "Invalid"
  failureMessage: string;
  paymentMode:   string;
  cardName:      string;
  statusCode:    string;
  statusMessage: string;
  currency:      string;
  amount:        string;
  billingName:   string;
  billingAddress: string;
  billingCity:   string;
  billingState:  string;
  billingZip:    string;
  billingCountry: string;
  billingTel:    string;
  billingEmail:  string;
  deliveryName:  string;
  deliveryAddress: string;
  deliveryCity:  string;
  deliveryState: string;
  deliveryZip:   string;
  deliveryCountry: string;
  deliveryTel:   string;
  merchantParam1: string;
  merchantParam2: string;
  merchantParam3: string;
  merchantParam4: string;
  merchantParam5: string;
  vault:         string;
  offerId:       string;
  discountValue: string;
  merRupeeAmount: string;
}

/** Decrypt and parse the encrypted response from ICICI Eazypay. */
export async function decryptIciciResponse(encResponse: string): Promise<IciciResponse> {
  const cfg = await getIciciSettings();
  const plain = decrypt(encResponse, cfg.workingKey);

  const parsed: Record<string, string> = {};
  plain.split("&").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx > -1) parsed[pair.slice(0, idx)] = pair.slice(idx + 1);
  });

  return {
    orderId:         parsed.order_id        ?? "",
    trackingId:      parsed.tracking_id     ?? "",
    bankRefNo:       parsed.bank_ref_no     ?? "",
    orderStatus:     parsed.order_status    ?? "",
    failureMessage:  parsed.failure_message ?? "",
    paymentMode:     parsed.payment_mode    ?? "",
    cardName:        parsed.card_name       ?? "",
    statusCode:      parsed.status_code     ?? "",
    statusMessage:   parsed.status_message  ?? "",
    currency:        parsed.currency        ?? "",
    amount:          parsed.amount          ?? "",
    billingName:     parsed.billing_name    ?? "",
    billingAddress:  parsed.billing_address ?? "",
    billingCity:     parsed.billing_city    ?? "",
    billingState:    parsed.billing_state   ?? "",
    billingZip:      parsed.billing_zip     ?? "",
    billingCountry:  parsed.billing_country ?? "",
    billingTel:      parsed.billing_tel     ?? "",
    billingEmail:    parsed.billing_email   ?? "",
    deliveryName:    parsed.delivery_name   ?? "",
    deliveryAddress: parsed.delivery_address ?? "",
    deliveryCity:    parsed.delivery_city   ?? "",
    deliveryState:   parsed.delivery_state  ?? "",
    deliveryZip:     parsed.delivery_zip    ?? "",
    deliveryCountry: parsed.delivery_country ?? "",
    deliveryTel:     parsed.delivery_tel    ?? "",
    merchantParam1:  parsed.merchant_param1 ?? "",
    merchantParam2:  parsed.merchant_param2 ?? "",
    merchantParam3:  parsed.merchant_param3 ?? "",
    merchantParam4:  parsed.merchant_param4 ?? "",
    merchantParam5:  parsed.merchant_param5 ?? "",
    vault:           parsed.vault           ?? "",
    offerId:         parsed.offer_id        ?? "",
    discountValue:   parsed.discount_value  ?? "",
    merRupeeAmount:  parsed.mer_rupee_amount ?? "",
  };
}

export async function isIciciEnabled(): Promise<boolean> {
  const s = await getIciciSettings();
  return s.enabled && !!s.merchantId && !!s.accessCode && !!s.workingKey;
}
