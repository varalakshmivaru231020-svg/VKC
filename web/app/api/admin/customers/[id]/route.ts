import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function adminOnly() {
  const s = await auth();
  return (s?.user as any)?.role === "ADMIN" ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const err = await adminOnly(); if (err) return err;

  const user = await db.user.findUnique({
    where: { id: params.id },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { items: { select: { id: true, productName: true, quantity: true, totalPrice: true, imageUrl: true } } },
      },
      wallet: { include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } } },
      _count: { select: { orders: true, wishlist: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const err = await adminOnly(); if (err) return err;
  const body = await req.json();
  const { firstName, lastName, email, phone, isBlocked, blockedReason, isActive } = body;

  const user = await db.user.update({
    where: { id: params.id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(isBlocked !== undefined && { isBlocked }),
      ...(blockedReason !== undefined && { blockedReason }),
      ...(isActive !== undefined && { isActive }),
    },
  });
  return NextResponse.json(user);
}
