import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseTestimonial } from "@/lib/testimonials";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const parsed = parseTestimonial(await req.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const item = await db.testimonial.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(item);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.testimonial.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
