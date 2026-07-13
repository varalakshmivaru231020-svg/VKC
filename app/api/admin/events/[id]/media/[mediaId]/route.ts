import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; mediaId: string } }) {
  try {
    await db.eventMedia.delete({ where: { id: params.mediaId } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
