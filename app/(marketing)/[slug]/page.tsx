import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await db.page.findUnique({ where: { slug: params.slug, isActive: true } });
  if (!page) return {};
  return {
    title: page.metaTitle || page.title,
    description: page.metaDesc || undefined,
  };
}

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  const page = await db.page.findUnique({ where: { slug: params.slug, isActive: true } });
  if (!page) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
        {page.title}
      </h1>
      <div
        className="prose prose-sm max-w-none font-body"
        style={{ color: "var(--color-text-secondary)", lineHeight: "1.8", textAlign: "justify", textJustify: "inter-word" }}
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
      <p className="text-xs font-body mt-10" style={{ color: "var(--color-text-disabled)" }}>
        Last updated: {new Date(page.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );
}
