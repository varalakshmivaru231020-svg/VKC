import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const user = await db.user.findUnique({
    where: { id: u.id },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      role: true, customerNumber: true, createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const body = await req.json();
  const updated = await db.user.update({
    where: { id: u.id },
    data: {
      firstName: typeof body.firstName === "string" ? body.firstName.trim() || null : undefined,
      lastName:  typeof body.lastName  === "string" ? body.lastName.trim()  || null : undefined,
      email:     typeof body.email     === "string" ? body.email.trim().toLowerCase() || null : undefined,
    },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      role: true, customerNumber: true, createdAt: true,
    },
  });
  return NextResponse.json({ user: updated });
}
