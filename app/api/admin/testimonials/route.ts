import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseTestimonial } from "@/lib/testimonials";

export async function GET() {
  try {
    const items = await db.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = parseTestimonial(await req.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const item = await db.testimonial.create({ data: parsed.data });
    return NextResponse.json(item);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
