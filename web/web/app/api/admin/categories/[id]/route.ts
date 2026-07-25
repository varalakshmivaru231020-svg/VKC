import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string, excludeId: string) {
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, description, imageUrl, sortOrder, isActive, parentId } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const slug = await uniqueSlug(slugify(name), params.id);
    const category = await db.category.update({
      where: { id: params.id },
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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.category.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
