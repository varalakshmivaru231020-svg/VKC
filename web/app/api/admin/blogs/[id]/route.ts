import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function adminOnly() {
  const s = await auth();
  return (s?.user as any)?.role === "ADMIN" ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const err = await adminOnly(); if (err) return err;
  const blog = await db.blog.findUnique({ where: { id: params.id } });
  if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(blog);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const err = await adminOnly(); if (err) return err;
  const body = await req.json();
  const { title, content, excerpt, imageUrl, tags, isPublished, metaTitle, metaDesc } = body;

  const existing = await db.blog.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wasPublished = existing.isPublished;
  const blog = await db.blog.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(excerpt !== undefined && { excerpt: excerpt || null }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(tags !== undefined && { tags }),
      ...(isPublished !== undefined && {
        isPublished,
        publishedAt: isPublished && !wasPublished ? new Date() : existing.publishedAt,
      }),
      ...(metaTitle !== undefined && { metaTitle: metaTitle || null }),
      ...(metaDesc !== undefined && { metaDesc: metaDesc || null }),
    },
  });
  return NextResponse.json(blog);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const err = await adminOnly(); if (err) return err;
  await db.blog.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
