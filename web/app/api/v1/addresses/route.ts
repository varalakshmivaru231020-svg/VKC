import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const addresses = await db.address.findMany({
    where: { userId: u.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const body = await req.json();
  const { label, fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = body;

  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (isDefault) {
    await db.address.updateMany({ where: { userId: u.id }, data: { isDefault: false } });
  }

  const address = await db.address.create({
    data: {
      userId:       u.id,
      label:        label || null,
      fullName, phone, addressLine1,
      addressLine2: addressLine2 || null,
      city, state, pincode,
      country:      country || "India",
      isDefault:    isDefault ?? false,
    },
  });
  return NextResponse.json({ address });
}
