import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ orders: [] });

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        select: {
          id: true, productName: true, variantColor: true,
          quantity: true, unitPrice: true, totalPrice: true, imageUrl: true,
        },
      },
    },
  });

  return NextResponse.json({ orders });
}
