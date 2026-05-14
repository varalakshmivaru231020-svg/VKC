import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const categories = await db.category.findMany({
    select: { id: true, name: true, parentId: true, isActive: true, sortOrder: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(categories);
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = base;
  let n = 0;
  while (true) {
    const existing = await db.category.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    n++;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, imageUrl, sortOrder, isActive, parentId } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const slug = await uniqueSlug(slugify(name));
    const category = await db.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        sortOrder: parseInt(sortOrder) || 0,
        isActive: isActive ?? true,
        parentId: parentId || null,
      },
    });
    return NextResponse.json(category);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
