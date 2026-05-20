import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const attributes = await db.attribute.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(attributes);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, inputType, options, optionImages, imageUrl, sortOrder } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const attribute = await db.attribute.create({
      data: {
        name: name.trim(),
        inputType: inputType || "SINGLE",
        options: Array.isArray(options) ? options : [],
        optionImages: Array.isArray(optionImages) ? optionImages : [],
        imageUrl: imageUrl || null,
        sortOrder: sortOrder ?? 0,
        isActive: true,
      },
    });
    return NextResponse.json(attribute);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
