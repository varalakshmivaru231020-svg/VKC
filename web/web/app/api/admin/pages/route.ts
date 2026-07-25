import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function adminOnly() {
  const s = await auth();
  return (s?.user as any)?.role === "ADMIN" ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET() {
  const err = await adminOnly(); if (err) return err;
  const pages = await db.page.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const err = await adminOnly(); if (err) return err;
  const { title, slug: rawSlug, content, isActive, metaTitle, metaDesc, sortOrder } = await req.json();

  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const baseSlug = rawSlug?.trim() ? toSlug(rawSlug) : toSlug(title);
  let slug = baseSlug;
  let i = 1;
  while (await db.page.findUnique({ where: { slug } })) slug = `${baseSlug}-${i++}`;

  const page = await db.page.create({
    data: {
      title, slug,
      content: content || "",
      isActive: isActive !== false,
      metaTitle: metaTitle || null,
      metaDesc: metaDesc || null,
      sortOrder: sortOrder || 0,
    },
  });
  return NextResponse.json(page);
}
