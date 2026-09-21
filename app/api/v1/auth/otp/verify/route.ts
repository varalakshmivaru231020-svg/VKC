import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issueTokenPair } from "@/lib/api/jwt";
import {
  clearReviewFailures,
  getReviewLogin,
  isReviewPhone,
  normalisePhone,
  recordReviewFailure,
  reviewAttemptKey,
  reviewAttemptsExhausted,
} from "@/lib/api/review-login";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawPhone = body?.phone as string | undefined;
    const otp      = body?.otp   as string | undefined;
    const fullName = (body?.name as string | undefined)?.trim() || "";

    if (!rawPhone || !otp) {
      return NextResponse.json({ error: "phone and otp are required" }, { status: 400 });
    }

    const phone = normalisePhone(rawPhone);

    // The store-review number accepts the fixed review OTP instead of an SMS
    // code (see lib/api/review-login.ts). Every other number, and every wrong
    // code, goes through the normal OTP check below.
    const review = await getReviewLogin();
    const reviewNumber = isReviewPhone(review, phone);
    const attemptKey = reviewAttemptKey(req, phone);
    if (reviewNumber && reviewAttemptsExhausted(attemptKey)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }
    const viaReviewOtp = reviewNumber && otp === review.otp;

    if (!viaReviewOtp) {
      const record = await db.otpCode.findFirst({
        where: { phone, code: otp, used: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });

      if (!record) {
        if (reviewNumber) recordReviewFailure(attemptKey);
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
      }

      await db.otpCode.update({ where: { id: record.id }, data: { used: true } });
    }

    let user = await db.user.findUnique({ where: { phone } });
    let isNew = false;

    // The fixed review OTP opens a customer account only, never staff or admin.
    if (viaReviewOtp && user && user.role !== "CUSTOMER") {
      recordReviewFailure(attemptKey);
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
    }
    if (viaReviewOtp) clearReviewFailures(attemptKey);

    if (!user) {
      isNew = true;
      const nameParts = fullName.split(/\s+/).filter(Boolean);
      user = await db.$transaction(async (tx) => {
        const last = await tx.user.findFirst({
          where: { customerNumber: { not: null } },
          orderBy: { customerNumber: "desc" },
          select: { customerNumber: true },
        });
        return tx.user.create({
          data: {
            phone,
            role:           "CUSTOMER",
            isActive:       true,
            phoneVerified:  true,
            customerNumber: (last?.customerNumber ?? 0) + 1,
            firstName:      nameParts[0] ?? null,
            lastName:       nameParts.slice(1).join(" ") || null,
          },
        });
      });
    } else if (!user.phoneVerified) {
      await db.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account is disabled" }, { status: 403 });
    }

    const tokens = await issueTokenPair({ userId: user.id, role: user.role, phone: user.phone });

    return NextResponse.json({
      success: true,
      isNew,
      user: {
        id:        user.id,
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
        phone:     user.phone,
        role:      user.role,
      },
      ...tokens,
    });
  } catch (err) {
    console.error("[v1/auth/otp/verify]", err);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
