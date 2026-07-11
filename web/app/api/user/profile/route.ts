import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      dob: true, anniversary: true, motherTongue: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { firstName, lastName, email, dob, anniversary, motherTongue } = await req.json();

  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      firstName:    firstName?.trim()    || null,
      lastName:     lastName?.trim()     || null,
      email:        email?.trim()        || null,
      dob:          dob                  ? new Date(dob)         : null,
      anniversary:  anniversary          ? new Date(anniversary) : null,
      motherTongue: motherTongue?.trim() || null,
    },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      dob: true, anniversary: true, motherTongue: true,
    },
  });

  return NextResponse.json({ user });
}
