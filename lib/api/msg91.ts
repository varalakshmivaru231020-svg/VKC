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

  const authKey = s.msg91_auth_key || process.env.MSG91_AUTH_KEY || "";
  const senderId = s.msg91_sender_id || process.env.MSG91_SENDER_ID || "VIJLAK";
  const templateId = s.msg91_template_id || process.env.MSG91_TEMPLATE_ID || "";

  if (!authKey || !templateId) return null;
  return { authKey, senderId, templateId };
}

/**
 * Send OTP via MSG91's Flow API. The template's merge variable must be
 * passed inside a "recipients" array entry, not as a flat top-level field —
 * a flat payload gets accepted (200) but silently renders the placeholder
 * blank instead of failing.
 * Returns true on success, false if not configured or on error.
 */
export async function sendOtpViaMSG91(phone: string, otp: string): Promise<boolean> {
  const cfg = await getMsg91Config();
  if (!cfg) {
    console.log("[MSG91] Not configured — skipping real OTP send");
    return false;
  }

  // MSG91 expects mobile without leading +
  const mobile = phone.replace(/^\+/, "");

  const payload = {
    template_id: cfg.templateId,
    sender: cfg.senderId,
    short_url: "0",
    recipients: [
      { mobiles: mobile, OTP: otp },
    ],
  };

  try {
    const res = await fetch("https://api.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: cfg.authKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log(`[MSG91] OTP send to ${mobile} → ${res.status} ${text}`);
    return res.ok;
  } catch (err) {
    console.error("[MSG91] send error:", err);
    return false;
  }
}
