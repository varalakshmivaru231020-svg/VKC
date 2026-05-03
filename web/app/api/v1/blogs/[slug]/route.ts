import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const blog = await db.blog.findFirst({
      where: { slug: params.slug, isPublished: true },
    });
    if (!blog) return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    return NextResponse.json({ blog });
  } catch (err) {
    console.error("[v1/blogs/:slug]", err);
    return NextResponse.json({ error: "Failed to load blog" }, { status: 500 });
  }
}
