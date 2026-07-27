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
 * Send OTP via MSG91.
 * Returns true on success, false if not configured or on error.
 *
 * KNOWN ISSUE: the OTP placeholder is not being substituted into the
 * delivered SMS (recipients get "Your OTP for VL Group is . Valid for
 * 10 minutes..." with the code missing). Two alternate request shapes were
 * tried and reverted because they made things worse:
 *   - control.msg91.com/api/v5/otp (dedicated OTP API): returned 200/success
 *     but never actually delivered anything.
 *   - recipients: [{ mobiles, OTP }] (nested Flow payload): rejected with a
 *     400 "template ID missing/incorrect/archived" API-Failed alert.
 * This flat shape is the only one confirmed to actually deliver a message
 * end-to-end, so it's restored as the safe baseline. The real fix requires
 * checking template 6a649dc438a51fe8ba0dd883 in the MSG91 dashboard (SMS →
 * Templates) for its exact variable placeholder name and template type.
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
    mobiles: mobile,
    OTP: otp,
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
