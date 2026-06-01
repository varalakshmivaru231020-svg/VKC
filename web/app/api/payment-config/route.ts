import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.siteSetting.findMany({
    where: {
      key: {
        in: ["razorpay_enabled", "cashfree_enabled", "icici_enabled", "icici_pg_enabled", "cod_enabled"],
      },
    },
  });
  const s: Record<string, string> = {};
  rows.forEach((r) => { s[r.key] = r.value; });

  // icici_pg can be enabled via env too (env-first config matches salesproject pattern)
  const iciciPgEnvEnabled = process.env.ICICI_PG_ENABLED === "1";

  const res = NextResponse.json({
    razorpay: (s.razorpay_enabled ?? "true") === "true",
    cashfree: s.cashfree_enabled === "true",
    icici:    s.icici_enabled === "true",                                     // legacy Eazypay
    iciciPg:  s.icici_pg_enabled === "true" || iciciPgEnvEnabled,             // PG Direct (new)
    cod:      (s.cod_enabled  ?? "true") === "true",
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
