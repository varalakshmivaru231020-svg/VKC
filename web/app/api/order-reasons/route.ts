import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Public endpoint — returns cancel/return reasons from admin settings.
// (Exchange flow has been removed.)
export async function GET() {
  const keys = ["cancel_reasons", "return_reasons"];
  const rows = await db.siteSetting.findMany({ where: { key: { in: keys } } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const parse = (key: string, fallback: string) =>
    (map[key] ?? fallback).split("\n").map((s) => s.trim()).filter(Boolean);

  return NextResponse.json({
    cancelReasons: parse("cancel_reasons", "Changed my mind\nOrdered by mistake\nFound better price elsewhere\nItem no longer needed\nDelivery time too long"),
    returnReasons: parse("return_reasons", "Item received is damaged\nWrong item delivered\nQuality not as expected\nItem not as described"),
  });
}
