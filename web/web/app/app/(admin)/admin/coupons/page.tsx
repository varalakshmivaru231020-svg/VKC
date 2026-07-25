import { db } from "@/lib/db";
import CouponsClient from "./CouponsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Coupons — Admin" };

export default async function CouponsPage() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return <CouponsClient coupons={coupons as any} />;
}
