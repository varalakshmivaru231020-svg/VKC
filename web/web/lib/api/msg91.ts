import { db } from "@/lib/db";

interface Msg91Config {
  authKey:    string;
  senderId:   string;
  templateId: string;
  /** When true, prefer /api/v5/flow over /api/v5/otp. Flow uses the regular
   *  SMS billing pool (the same one the MSG91 dashboard "Test DLT" button
   *  draws from), whereas /v5/otp uses a separate OTP-service pool that
   *  must be provisioned and credited independently. Default: true. */
  useFlow:    boolean;
}

async function getMsg91Config(): Promise<Msg91Config | null> {
  const keys = ["msg91_auth_key", "msg91_sender_id", "msg91_template_id", "msg91_use_flow"];
  const rows = await db.siteSetting.findMany({ where: { key: { in: keys } } });
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const authKey    = s.msg91_auth_key    || process.env.MSG91_AUTH_KEY    || "";
  const senderId   = s.msg91_sender_id   || process.env.MSG91_SENDER_ID   || "VIJLAK";
  const templateId = s.msg91_template_id || process.env.MSG91_TEMPLATE_ID || "";
  const useFlow    = s.msg91_use_flow !== "false"; // default true

  if (!authKey || !templateId) return null;
  return { authKey, senderId, templateId, useFlow };
}

/**
 * Send OTP via MSG91.
 *
 * Two endpoints; we prefer the Flow API.
 *
 * 1) /api/v5/flow — DLT template send. Same billing pool as MSG91 dashboard's
 *    "Test DLT" button. Body: { template_id, recipients:[{ mobiles, OTP }] }
 *    The template variable ##OTP## is substituted from the recipient field
 *    matching the var name. Our DLT-registered template uses ##OTP##, so we
 *    pass the field as "OTP".
 *
 * 2) /api/v5/otp — Separate OTP-service pool. Requires an OTP-specific
 *    balance allocation that's distinct from transactional SMS. If the account
 *    hasn't credited the OTP service, /v5/otp returns type:success but
 *    silently drops every message — that's the failure mode we hit earlier.
 *
 * We try Flow first; if it explicitly rejects (HTTP !ok), fall back to OTP API
 * to maximise the chance of delivery against any account configuration.
 */
export async function sendOtpViaMSG91(phone: string, otp: string): Promise<boolean> {
  const cfg = await getMsg91Config();
  if (!cfg) {
    console.log("[MSG91] Not configured — skipping real OTP send");
    return false;
  }

  // MSG91 expects mobile with country code, no '+'
  const mobile = phone.replace(/\D/g, "");

  // Try Flow first
  if (cfg.useFlow) {
    const ok = await sendViaFlow(cfg, mobile, otp);
    if (ok) return true;
    // Fall through to OTP API only if Flow rejected at HTTP level
  }

  return sendViaOtpApi(cfg, mobile, otp);
}

async function sendViaFlow(cfg: Msg91Config, mobile: string, otp: string): Promise<boolean> {
  const body = {
    template_id: cfg.templateId,
    short_url:   "0",
    recipients:  [{ mobiles: mobile, OTP: otp, otp: otp, var1: otp }],
  };

  try {
    const res  = await fetch("https://control.msg91.com/api/v5/flow", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        authkey:        cfg.authKey,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {}

    const success = res.ok && (parsed?.type === "success" || parsed?.message);
    if (!success) {
      console.error(`[MSG91 Flow] FAILED → ${mobile} | HTTP ${res.status} | body: ${text.slice(0, 500)}`);
      return false;
    }
    console.log(`[MSG91 Flow] OTP sent → ${mobile} | requestId: ${parsed?.message ?? parsed?.request_id ?? "-"}`);
    return true;
  } catch (err) {
    console.error("[MSG91 Flow] Network error:", err);
    return false;
  }
}

async function sendViaOtpApi(cfg: Msg91Config, mobile: string, otp: string): Promise<boolean> {
  const url = new URL("https://control.msg91.com/api/v5/otp");
  url.searchParams.set("template_id", cfg.templateId);
  url.searchParams.set("mobile",      mobile);
  url.searchParams.set("authkey",     cfg.authKey);
  url.searchParams.set("otp",         otp);

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey:        cfg.authKey,
      },
    });
    const text = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {}

    const success = res.ok && (parsed?.type === "success" || parsed?.message === "OTP sent successfully.");
    if (!success) {
      console.error(`[MSG91 OTP] FAILED → ${mobile} | HTTP ${res.status} | body: ${text.slice(0, 500)}`);
      return false;
    }
    console.log(`[MSG91 OTP] OTP sent → ${mobile} | requestId: ${parsed?.request_id ?? "-"}`);
    return true;
  } catch (err) {
    console.error("[MSG91 OTP] Network error:", err);
    return false;
  }
}
