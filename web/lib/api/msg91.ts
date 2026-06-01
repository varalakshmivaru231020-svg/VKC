import { db } from "@/lib/db";

interface Msg91Config {
  authKey: string;
  senderId: string;
  templateId: string;
}

async function getMsg91Config(): Promise<Msg91Config | null> {
  const keys = ["msg91_auth_key", "msg91_sender_id", "msg91_template_id"];
  const rows = await db.siteSetting.findMany({ where: { key: { in: keys } } });
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const authKey    = s.msg91_auth_key    || process.env.MSG91_AUTH_KEY    || "";
  const senderId   = s.msg91_sender_id   || process.env.MSG91_SENDER_ID   || "VIJLAK";
  const templateId = s.msg91_template_id || process.env.MSG91_TEMPLATE_ID || "";

  if (!authKey || !templateId) return null;
  return { authKey, senderId, templateId };
}

/**
 * Send OTP via MSG91 v5.
 *
 * MSG91 v5 OTP API:
 *   POST https://control.msg91.com/api/v5/otp
 *     ?template_id=XXX&mobile=919XXXXXXXXX&authkey=YYY&otp=123456
 *
 * Important gotchas:
 *   - URL is control.msg91.com, NOT api.msg91.com (that 404s / 400s)
 *   - mobile must be country-code prefixed digits only, no '+'
 *   - otp goes in the QUERY STRING for v5 (or as body var1, but query is universal)
 *   - DLT template_id and sender_id must already be approved on MSG91 dashboard;
 *     a mismatch returns 400 with `{type:"error", message:"Template Not Found"}` etc.
 */
export async function sendOtpViaMSG91(phone: string, otp: string): Promise<boolean> {
  const cfg = await getMsg91Config();
  if (!cfg) {
    console.log("[MSG91] Not configured — skipping real OTP send");
    return false;
  }

  // MSG91 expects mobile with country code and NO leading +
  const mobile = phone.replace(/\D/g, "");

  // Use query string — works whether the account is on v5 with template DLT or fallback.
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
        authkey: cfg.authKey,
      },
    });

    const text = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {}

    // MSG91 returns 200 with { type: "success" | "error" }
    // Treat type=error or HTTP !ok as failure.
    const success = res.ok && (parsed?.type === "success" || parsed?.message === "OTP sent successfully.");

    if (!success) {
      console.error(`[MSG91] OTP send FAILED → ${mobile} | HTTP ${res.status} | body: ${text.slice(0, 500)}`);
      return false;
    }

    console.log(`[MSG91] OTP sent → ${mobile} | requestId: ${parsed?.request_id ?? "-"}`);
    return true;
  } catch (err) {
    console.error("[MSG91] Network/send error:", err);
    return false;
  }
}
