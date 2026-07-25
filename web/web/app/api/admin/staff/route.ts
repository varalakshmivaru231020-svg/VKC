import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

/** GET — list all STAFF + ADMIN users */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await db.user.findMany({
    where: { role: { in: ["STAFF", "ADMIN"] } },
    include: { roleTemplate: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      role: true, isActive: true, createdAt: true,
      roleTemplate: true,
    },
  });
  return NextResponse.json({ users });
}

/** POST — create a new staff/admin user */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { firstName, lastName, email, phone, password, role, roleTemplateId } = await req.json();
  if (!email?.trim() || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: {
      firstName:      firstName?.trim() || null,
      lastName:       lastName?.trim()  || null,
      email:          email.trim().toLowerCase(),
      phone:          phone?.trim()     || null,
      passwordHash,
      role:           role ?? "STAFF",
      roleTemplateId: roleTemplateId    || null,
      isActive:       true,
    },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true, createdAt: true },
  });
  return NextResponse.json({ user });
}

/** PUT — update staff user */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, firstName, lastName, email, phone, role, roleTemplateId, isActive, password } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: any = {};
  if (firstName       !== undefined) data.firstName      = firstName?.trim()  || null;
  if (lastName        !== undefined) data.lastName       = lastName?.trim()   || null;
  if (email           !== undefined) data.email          = email.trim().toLowerCase();
  if (phone           !== undefined) data.phone          = phone?.trim()      || null;
  if (role            !== undefined) data.role           = role;
  if (roleTemplateId  !== undefined) data.roleTemplateId = roleTemplateId     || null;
  if (isActive        !== undefined) data.isActive       = isActive;
  if (password)                      data.passwordHash   = await bcrypt.hash(password, 12);

  const user = await db.user.update({ where: { id }, data });
  return NextResponse.json({ user });
}

/** DELETE — deactivate (soft delete) staff user */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.user.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
