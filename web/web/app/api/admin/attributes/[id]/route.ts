import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, inputType, options, optionImages, imageUrl, sortOrder, isActive } = await req.json();
    const attribute = await db.attribute.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(inputType !== undefined && { inputType }),
        ...(options !== undefined && { options: Array.isArray(options) ? options : [] }),
        ...(optionImages !== undefined && { optionImages: Array.isArray(optionImages) ? optionImages : [] }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return NextResponse.json(attribute);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.attribute.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
