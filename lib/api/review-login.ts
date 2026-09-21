import { db } from "@/lib/db";

/**
 * "Store review login": ONE designated test phone number that signs in to the
 * mobile app with a fixed 4-digit OTP, so Google Play (or App Store) reviewers
 * can get past the login without an SMS.
 *
 * It is deliberately narrow, because a fixed OTP once shipped to production
 * here (see the note in /api/v1/auth/otp/send) and let anyone into any account:
 *  - OFF unless an admin switches it on (Admin → Settings → SMS);
 *  - it applies to the single number saved there, never to any other number;
 *  - it never signs in to a staff or admin account, only a customer's;
 *  - wrong guesses are rate-limited per client and number.
 *
 * It lives in SiteSetting, so adding or removing the credentials in the admin
 * panel takes effect immediately, with no deploy and no new app build.
 */

export const REVIEW_LOGIN_KEYS = ["review_login_enabled", "review_login_phone", "review_login_otp"] as const;

/** The OTP used when the admin leaves the field empty. */
export const DEFAULT_REVIEW_OTP = "1995";

export function normalisePhone(raw: string): string {
  const clean = raw.trim();
  if (clean.startsWith("+")) return "+" + clean.replace(/\D/g, "");
  const digits = clean.replace(/\D/g, "");
  if (digits.length === 10) return "+91" + digits;
  if (digits.startsWith("91") && digits.length === 12) return "+" + digits;
  return "+" + digits;
}

export interface ReviewLogin {
  /** The test number, normalised like every stored phone ("+91…"). */
  phone: string;
  otp: string;
}

/**
 * The active review login from the stored settings, or null when it is off,
 * has no valid number, or has an OTP the app could not type (it takes 4 digits).
 */
export function parseReviewLogin(s: Record<string, string | undefined>): ReviewLogin | null {
  if (s.review_login_enabled !== "true") return null;
  const phone = s.review_login_phone ?? "";
  if (phone.replace(/\D/g, "").length < 10) return null;
  const otp = (s.review_login_otp ?? "").replace(/\D/g, "") || DEFAULT_REVIEW_OTP;
  if (otp.length !== 4) return null;
  return { phone: normalisePhone(phone), otp };
}

export async function getReviewLogin(): Promise<ReviewLogin | null> {
  const rows = await db.siteSetting.findMany({ where: { key: { in: [...REVIEW_LOGIN_KEYS] } } });
  return parseReviewLogin(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}

/** True when [phone] (already normalised) is the review number. */
export function isReviewPhone(review: ReviewLogin | null, phone: string): review is ReviewLogin {
  return review !== null && review.phone === phone;
}

// ── Guessing limit ───────────────────────────────────────────────────────────
// A fixed 4-digit code has 10,000 possibilities, so wrong guesses are counted
// per client and number. In memory: it resets on a restart, which is fine for
// a switch that is only on while a store review is under way.
export const MAX_REVIEW_FAILURES = 8;
export const REVIEW_FAILURE_WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, { count: number; resetAt: number }>();

export function reviewAttemptsExhausted(key: string, now = Date.now()): boolean {
  const f = failures.get(key);
  if (!f) return false;
  if (f.resetAt <= now) {
    failures.delete(key);
    return false;
  }
  return f.count >= MAX_REVIEW_FAILURES;
}

export function recordReviewFailure(key: string, now = Date.now()): void {
  const f = failures.get(key);
  if (!f || f.resetAt <= now) {
    failures.set(key, { count: 1, resetAt: now + REVIEW_FAILURE_WINDOW_MS });
    return;
  }
  f.count += 1;
}

export function clearReviewFailures(key: string): void {
  failures.delete(key);
}

/**
 * Key for the guessing limit: the client address plus the number. Behind nginx
 * the LAST X-Forwarded-For entry is the one the proxy added; earlier entries
 * can be forged by the caller.
 */
export function reviewAttemptKey(req: Request, phone: string): string {
  const xff = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ip = xff[xff.length - 1] ?? req.headers.get("x-real-ip") ?? "unknown";
  return `${ip}|${phone}`;
}
