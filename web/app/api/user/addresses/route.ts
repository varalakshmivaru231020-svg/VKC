import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ addresses: [] });
  }

  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { label, fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = body;

  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (isDefault) {
    await db.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  const address = await db.address.create({
    data: {
      userId: session.user.id,
      label:  label || null,
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      state,
      pincode,
      country: country || "India",
      isDefault: isDefault ?? false,
    },
  });

  return NextResponse.json({ address });
}
