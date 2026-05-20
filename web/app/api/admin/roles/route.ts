import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const MODULES = [
  "dashboard","orders","products","categories","customers","reviews",
  "coupons","banners","reports","settings","stock","shipments",
];

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const roles = await db.roleTemplate.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ roles });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description, permissions } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const role = await db.roleTemplate.create({
    data: { name: name.trim(), description: description?.trim() || null, permissions: permissions ?? {} },
  });
  return NextResponse.json({ role });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, description, permissions, isActive } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const role = await db.roleTemplate.update({
    where: { id },
    data: {
      ...(name        !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(permissions !== undefined && { permissions }),
      ...(isActive    !== undefined && { isActive }),
    },
  });
  return NextResponse.json({ role });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.user.updateMany({ where: { roleTemplateId: id }, data: { roleTemplateId: null } });
  await db.roleTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
