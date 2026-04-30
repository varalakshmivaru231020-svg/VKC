import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function adminOnly() {
  const s = await auth();
  return (s?.user as any)?.role === "ADMIN" ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const err = await adminOnly(); if (err) return err;
  const page = await db.page.findUnique({ where: { id: params.id } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const err = await adminOnly(); if (err) return err;
  const body = await req.json();
  const page = await db.page.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.metaTitle !== undefined && { metaTitle: body.metaTitle || null }),
      ...(body.metaDesc !== undefined && { metaDesc: body.metaDesc || null }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  });
  return NextResponse.json(page);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const err = await adminOnly(); if (err) return err;
  await db.page.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
