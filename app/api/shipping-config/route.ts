import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.siteSetting.findMany({
    where: {
      key: {
        in: [
          "free_shipping_threshold",
          "shipping_first_saree_rate",
          "shipping_additional_saree_rate",
          "domestic_delivery_title",
          "domestic_delivery_notes",
        ],
      },
    },
  });
  const s: Record<string, string> = {};
  rows.forEach((r) => { s[r.key] = r.value; });

  return NextResponse.json({
    freeShippingThreshold:    Number(s["free_shipping_threshold"] ?? 2999),
    firstSareeRate:           Number(s["shipping_first_saree_rate"] ?? 100),
    additionalSareeRate:      Number(s["shipping_additional_saree_rate"] ?? 50),
    deliveryTitle:            s["domestic_delivery_title"] ?? "Standard Delivery",
    deliveryNotes:            s["domestic_delivery_notes"] ?? "4–7 business days",
  });
}
