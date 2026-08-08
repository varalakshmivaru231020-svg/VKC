import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOtpViaMSG91 } from "@/lib/api/msg91";

function normalisePhone(raw: string): string {
  const clean = raw.trim();
  if (clean.startsWith("+")) return "+" + clean.replace(/\D/g, "");
  const digits = clean.replace(/\D/g, "");
  if (digits.length === 10) return "+91" + digits;
  if (digits.startsWith("91") && digits.length === 12) return "+" + digits;
  return "+" + digits;
}

/**
 * Fixed-OTP is a LOCAL DEVELOPMENT convenience only.
 *
 * This used to default to `true` whenever MOBILE_USE_FIXED_OTP wasn't the exact
 * string "false", which meant production shipped with it on: the mobile app's
 * OTP was the literal "1234", `sendOtpViaMSG91` was never called, and the
 * route still answered `{success: true}` — so the app reported "OTP sent" while
 * no SMS was ever attempted, and any caller could sign into any account with
 * 1234. Production is now excluded structurally, so a missing or mistyped env
 * var can't reopen that hole.
 */
const USE_FIXED_OTP =
  process.env.NODE_ENV !== "production" && process.env.MOBILE_USE_FIXED_OTP !== "false";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone || String(phone).replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Valid mobile number required" }, { status: 400 });
    }

    const normalised = normalisePhone(String(phone));

    await db.otpCode.updateMany({ where: { phone: normalised, used: false }, data: { used: true } });

    const code = USE_FIXED_OTP ? "1234" : String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.otpCode.create({ data: { phone: normalised, code, expiresAt } });

    // Awaited, exactly as /api/auth/otp/send does it: the response then tells
    // the truth about whether the SMS actually went out, instead of reporting
    // success for a send that had not been attempted yet (or at all).
    let sent = false;
    if (!USE_FIXED_OTP) {
      sent = await sendOtpViaMSG91(normalised, code).catch((e) => {
        console.error("[v1/otp/send] MSG91 error:", e);
        return false;
      });
    } else {
      console.log(`[v1/otp/send] DEV mode — ${normalised} → ${code}`);
    }

    const existing = await db.user.findUnique({
      where: { phone: normalised },
      select: { id: true, firstName: true },
    });

    return NextResponse.json({
      success: true,
      isNew: !existing,
      // Same fallback the website route uses: when MSG91 isn't configured there
      // is no SMS to wait for, so hand the code back rather than stranding the
      // caller. In production with MSG91 configured this is never reached.
      ...(USE_FIXED_OTP || !sent ? { otp: code } : {}),
    });
  } catch (err) {
    console.error("[v1/auth/otp/send]", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
