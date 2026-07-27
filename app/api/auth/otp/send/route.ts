import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOtpViaMSG91 } from "@/lib/api/msg91";

function generateOTP(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function normalisePhone(raw: string): string {
  const clean = raw.trim();
  if (clean.startsWith("+")) return "+" + clean.replace(/\D/g, "");
  const digits = clean.replace(/\D/g, "");
  if (digits.length === 10) return "+91" + digits;
  if (digits.startsWith("91") && digits.length === 12) return "+" + digits;
  return "+" + digits;
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone || String(phone).replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Valid mobile number required" }, { status: 400 });
    }

    const normalised = normalisePhone(String(phone));

    // Invalidate any existing unused OTPs for this number
    await db.otpCode.updateMany({
      where: { phone: normalised, used: false },
      data: { used: true },
    });

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await db.otpCode.create({ data: { phone: normalised, code, expiresAt } });

    console.log(`[OTP] ${normalised} → ${code}`);

    // Try to send via MSG91 — if not configured, fall back to dev mode (show OTP on screen)
    const sent = await sendOtpViaMSG91(normalised, code);

    const existingUser = await db.user.findUnique({
      where: { phone: normalised },
      select: { id: true, firstName: true },
    });

    return NextResponse.json({
      success: true,
      isNew: !existingUser,
      // Only expose OTP in response when MSG91 is not configured (dev/testing)
      ...(sent ? {} : { otp: code }),
    });
  } catch (err) {
    console.error("[OTP send]", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
