import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function normalisePhone(raw: string): string {
  const clean = raw.trim();
  if (clean.startsWith("+")) return "+" + clean.replace(/\D/g, "");
  const digits = clean.replace(/\D/g, "");
  if (digits.length === 10) return "+91" + digits;
  if (digits.startsWith("91") && digits.length === 12) return "+" + digits;
  return "+" + digits;
}

const USE_FIXED_OTP = process.env.MOBILE_USE_FIXED_OTP === "false" ? false : true; // keep test mode by default

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone || String(phone).replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Valid mobile number required" }, { status: 400 });
    }

    const normalised = normalisePhone(String(phone));

    // Invalidate previous unused OTPs for this number
    await db.otpCode.updateMany({ where: { phone: normalised, used: false }, data: { used: true } });

    const code = USE_FIXED_OTP ? "123456" : String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.otpCode.create({ data: { phone: normalised, code, expiresAt } });

    if (process.env.NODE_ENV !== "production") console.log(`[v1/otp/send] ${normalised} -> ${code}`);

    const existing = await db.user.findUnique({
      where: { phone: normalised },
      select: { id: true, firstName: true },
    });

    return NextResponse.json({
      success: true,
      isNew: !existing,
      // include code in dev for easier QA from mobile app
      ...(process.env.NODE_ENV !== "production" && USE_FIXED_OTP ? { devCode: code } : {}),
    });
  } catch (err) {
    console.error("[v1/auth/otp/send]", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
