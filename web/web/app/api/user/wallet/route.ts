import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let wallet = await db.wallet.findUnique({
    where: { userId: uid },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  if (!wallet) {
    wallet = await db.wallet.create({
      data: { userId: uid, balance: 0 },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
    }) as any;
  }
  return NextResponse.json(wallet);
}
