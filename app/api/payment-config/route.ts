import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isIciciPgEnabled } from "@/lib/api/iciciPg";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.siteSetting.findMany({
    where: {
      key: {
        in: ["razorpay_enabled", "cashfree_enabled", "icici_enabled", "cod_enabled"],
      },
    },
  });
  const s: Record<string, string> = {};
  rows.forEach((r) => { s[r.key] = r.value; });

  // icici_pg is only offered when the toggle is ON *and* the credentials it needs
  // are actually present (merchant id + HMAC key + return URL) — otherwise the
  // customer picks it, fills in the whole checkout, and only then hits a 503.
  // Reads its own settings/env via loadIciciPgConfig, which is cached.
  const iciciPg = await isIciciPgEnabled();

  const res = NextResponse.json({
    razorpay: (s.razorpay_enabled ?? "true") === "true",
    cashfree: s.cashfree_enabled === "true",
    icici:    s.icici_enabled === "true",   // legacy Eazypay
    iciciPg,                                // PG Direct (new)
    cod:      (s.cod_enabled  ?? "true") === "true",
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
