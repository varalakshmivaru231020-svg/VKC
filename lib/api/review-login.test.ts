import { beforeEach, describe, expect, it, vi } from "vitest";

// An in-memory stand-in for the parts of Prisma the OTP routes touch.
const h = vi.hoisted(() => {
  type Row = Record<string, any>;
  const state = {
    settings: {} as Record<string, string>,
    users: [] as Row[],
    otps: [] as Row[],
    sms: [] as string[],
  };
  const db = {
    siteSetting: {
      findMany: async ({ where }: any) =>
        Object.entries(state.settings)
          .filter(([key]) => where.key.in.includes(key))
          .map(([key, value]) => ({ key, value })),
    },
    otpCode: {
      updateMany: async ({ where, data }: any) => {
        state.otps.filter((o) => o.phone === where.phone && !o.used).forEach((o) => Object.assign(o, data));
      },
      create: async ({ data }: any) => {
        state.otps.push({ id: String(state.otps.length + 1), used: false, createdAt: new Date(), ...data });
      },
      findFirst: async ({ where }: any) =>
        state.otps.find((o) => o.phone === where.phone && o.code === where.code && !o.used && o.expiresAt > new Date()) ?? null,
      update: async ({ where, data }: any) => Object.assign(state.otps.find((o) => o.id === where.id)!, data),
    },
    user: {
      findUnique: async ({ where }: any) => state.users.find((u) => u.phone === where.phone) ?? null,
      update: async ({ where, data }: any) => Object.assign(state.users.find((u) => u.id === where.id)!, data),
      findFirst: async () => null,
      create: async ({ data }: any) => {
        const row = { id: `u${state.users.length + 1}`, email: null, ...data };
        state.users.push(row);
        return row;
      },
    },
    $transaction: async (fn: any) => fn(db),
  };
  return { state, db };
});

vi.mock("@/lib/db", () => ({ db: h.db }));
vi.mock("@/lib/api/jwt", () => ({ issueTokenPair: async () => ({ accessToken: "access", refreshToken: "refresh" }) }));
vi.mock("@/lib/api/msg91", () => ({
  sendOtpViaMSG91: async (phone: string) => {
    h.state.sms.push(phone);
    return true;
  },
}));

import {
  MAX_REVIEW_FAILURES,
  normalisePhone,
  parseReviewLogin,
  recordReviewFailure,
  reviewAttemptKey,
  reviewAttemptsExhausted,
} from "./review-login";
import { POST as sendOtp } from "@/app/api/v1/auth/otp/send/route";
import { POST as verifyOtp } from "@/app/api/v1/auth/otp/verify/route";

const REVIEW = "9000000001";
const on = (extra: Record<string, string> = {}) => {
  h.state.settings = { review_login_enabled: "true", review_login_phone: REVIEW, review_login_otp: "1995", ...extra };
};

let ipCounter = 0;
/** A fresh client address per call, so the per-client guess limit never bleeds between tests. */
const post = (handler: (r: Request) => Promise<Response>, body: object, ip = `10.0.0.${++ipCounter}`) =>
  handler(
    new Request("http://localhost/api/v1/auth/otp", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  h.state.settings = {};
  h.state.users = [];
  h.state.otps = [];
  h.state.sms = [];
});

describe("parseReviewLogin", () => {
  it("is off unless the admin switches it on", () => {
    expect(parseReviewLogin({})).toBeNull();
    expect(parseReviewLogin({ review_login_enabled: "false", review_login_phone: REVIEW })).toBeNull();
  });

  it("returns the normalised number and the OTP when on", () => {
    expect(parseReviewLogin({ review_login_enabled: "true", review_login_phone: REVIEW, review_login_otp: "1995" })).toEqual({
      phone: "+919000000001",
      otp: "1995",
    });
  });

  it("uses 1995 when the OTP field is empty", () => {
    expect(parseReviewLogin({ review_login_enabled: "true", review_login_phone: REVIEW })?.otp).toBe("1995");
  });

  it("stays off without a real number, or with an OTP the app cannot type", () => {
    expect(parseReviewLogin({ review_login_enabled: "true", review_login_phone: "" })).toBeNull();
    expect(parseReviewLogin({ review_login_enabled: "true", review_login_phone: "12345" })).toBeNull();
    expect(parseReviewLogin({ review_login_enabled: "true", review_login_phone: REVIEW, review_login_otp: "19955" })).toBeNull();
  });

  it("normalises numbers the way the routes do", () => {
    expect(normalisePhone("90000 00001")).toBe("+919000000001");
    expect(normalisePhone("+91 90000 00001")).toBe("+919000000001");
    expect(normalisePhone("919000000001")).toBe("+919000000001");
  });
});

describe("guess limit", () => {
  it("blocks after too many wrong guesses and frees up after the window", () => {
    const key = "1.1.1.1|+919000000001";
    const t0 = 1_000_000;
    for (let i = 0; i < MAX_REVIEW_FAILURES - 1; i++) recordReviewFailure(key, t0);
    expect(reviewAttemptsExhausted(key, t0)).toBe(false);
    recordReviewFailure(key, t0);
    expect(reviewAttemptsExhausted(key, t0)).toBe(true);
    expect(reviewAttemptsExhausted(key, t0 + 15 * 60 * 1000 + 1)).toBe(false);
  });

  it("keys on the address the proxy added, not one the caller made up", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "6.6.6.6, 203.0.113.9" } });
    expect(reviewAttemptKey(req, "+91900")).toBe("203.0.113.9|+91900");
    expect(reviewAttemptKey(new Request("http://x"), "+91900")).toBe("unknown|+91900");
  });
});

describe("POST /api/v1/auth/otp/verify with the review login", () => {
  it("does nothing while the review login is off: 1995 is just a wrong OTP", async () => {
    const res = await post(verifyOtp, { phone: REVIEW, otp: "1995" });
    expect(res.status).toBe(401);
    expect(h.state.users).toHaveLength(0);
  });

  it("signs the review number in with 1995 and creates a customer account", async () => {
    on();
    const res = await post(verifyOtp, { phone: REVIEW, otp: "1995", name: "Google Reviewer" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, isNew: true, accessToken: "access", user: { phone: "+919000000001", role: "CUSTOMER" } });
    expect(h.state.users).toHaveLength(1);
  });

  it("works again on the next sign-in, when the account already exists", async () => {
    on();
    await post(verifyOtp, { phone: REVIEW, otp: "1995" });
    const res = await post(verifyOtp, { phone: REVIEW, otp: "1995" });
    expect(res.status).toBe(200);
    expect((await res.json()).isNew).toBe(false);
    expect(h.state.users).toHaveLength(1);
  });

  it("does NOT work for any other number", async () => {
    on();
    const res = await post(verifyOtp, { phone: "9876543210", otp: "1995" });
    expect(res.status).toBe(401);
    expect(h.state.users).toHaveLength(0);
  });

  it("rejects a wrong code for the review number", async () => {
    on();
    expect((await post(verifyOtp, { phone: REVIEW, otp: "1234" })).status).toBe(401);
  });

  it("honours a different OTP set in the admin", async () => {
    on({ review_login_otp: "4321" });
    expect((await post(verifyOtp, { phone: REVIEW, otp: "1995" })).status).toBe(401);
    expect((await post(verifyOtp, { phone: REVIEW, otp: "4321" })).status).toBe(200);
  });

  it("never signs in to a staff or admin account", async () => {
    on();
    h.state.users.push({ id: "admin1", phone: "+919000000001", role: "ADMIN", isActive: true, phoneVerified: true });
    const res = await post(verifyOtp, { phone: REVIEW, otp: "1995" });
    expect(res.status).toBe(401);
    expect((await res.json()).accessToken).toBeUndefined();
  });

  it("locks out a client that keeps guessing, even for the right code", async () => {
    on();
    const ip = "198.51.100.7";
    for (let i = 0; i < MAX_REVIEW_FAILURES; i++) {
      expect((await post(verifyOtp, { phone: REVIEW, otp: String(1000 + i) }, ip)).status).toBe(401);
    }
    expect((await post(verifyOtp, { phone: REVIEW, otp: "1995" }, ip)).status).toBe(429);
    // Someone else is not affected by that client's guesses.
    expect((await post(verifyOtp, { phone: REVIEW, otp: "1995" }, "198.51.100.8")).status).toBe(200);
  });

  it("leaves the normal SMS OTP flow alone for everyone else", async () => {
    on();
    h.state.otps.push({ id: "o1", phone: "+919876543210", code: "5678", used: false, expiresAt: new Date(Date.now() + 60_000), createdAt: new Date() });
    expect((await post(verifyOtp, { phone: "9876543210", otp: "5678" })).status).toBe(200);
    expect((await post(verifyOtp, { phone: "9876543210", otp: "5678" })).status).toBe(401); // single use
  });
});

describe("POST /api/v1/auth/otp/send with the review login", () => {
  it("sends no SMS and stores no code for the review number", async () => {
    on();
    const res = await post(sendOtp, { phone: REVIEW });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, isNew: true });
    expect(h.state.sms).toHaveLength(0);
    expect(h.state.otps).toHaveLength(0);
  });

  it("never reveals the fixed OTP in the response", async () => {
    on();
    const body = JSON.stringify(await (await post(sendOtp, { phone: REVIEW })).json());
    expect(body).not.toContain("1995");
  });

  it("still works as usual for every other number", async () => {
    on();
    const res = await post(sendOtp, { phone: "9876543210" });
    expect(res.status).toBe(200);
    expect(h.state.otps).toHaveLength(1);
  });

  it("does nothing special while the review login is off", async () => {
    await post(sendOtp, { phone: REVIEW });
    expect(h.state.otps).toHaveLength(1);
  });

  it("keeps sending real OTPs to an admin number even if it is entered as the review number", async () => {
    on();
    h.state.users.push({ id: "admin1", phone: "+919000000001", role: "ADMIN", isActive: true });
    await post(sendOtp, { phone: REVIEW });
    expect(h.state.otps).toHaveLength(1);
  });
});
