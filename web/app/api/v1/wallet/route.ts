import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const wallet = await db.wallet.findUnique({
    where: { userId: u.id },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  return NextResponse.json({
    balance:      Number(wallet?.balance ?? 0),
    transactions: (wallet?.transactions ?? []).map((t) => ({ ...t, amount: Number(t.amount) })),
  });
}
