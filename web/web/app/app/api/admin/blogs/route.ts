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

export async function GET(req: NextRequest) {
  const err = await adminOnly(); if (err) return err;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const [total, blogs] = await Promise.all([
    db.blog.count(),
    db.blog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
  ]);
  return NextResponse.json({ blogs, total });
}

export async function POST(req: NextRequest) {
  const err = await adminOnly(); if (err) return err;
  const body = await req.json();
  const { title, content, excerpt, imageUrl, tags, isPublished, metaTitle, metaDesc } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  }

  const baseSlug = toSlug(title);
  let slug = baseSlug;
  let i = 1;
  while (await db.blog.findUnique({ where: { slug } })) slug = `${baseSlug}-${i++}`;

  const blog = await db.blog.create({
    data: {
      title, content, slug,
      excerpt: excerpt || null,
      imageUrl: imageUrl || null,
      tags: tags || [],
      isPublished: !!isPublished,
      publishedAt: isPublished ? new Date() : null,
      metaTitle: metaTitle || null,
      metaDesc: metaDesc || null,
    },
  });
  return NextResponse.json(blog);
}
