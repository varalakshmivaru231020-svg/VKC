import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const blog = await db.blog.findUnique({ where: { slug: params.slug, isPublished: true } });
  if (!blog) return {};
  return {
    title: blog.metaTitle || blog.title,
    description: blog.metaDesc || blog.excerpt || undefined,
    openGraph: blog.imageUrl ? { images: [blog.imageUrl] } : undefined,
  };
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const blog = await db.blog.findUnique({ where: { slug: params.slug, isPublished: true } });
  if (!blog) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/blog"
        className="inline-flex items-center gap-2 text-sm font-body mb-8 transition-colors hover:opacity-70"
        style={{ color: "var(--color-primary)" }}>
        <ArrowLeft className="h-4 w-4" /> Back to Blog
      </Link>

      {blog.imageUrl && (
        <div className="relative rounded-2xl overflow-hidden mb-8 h-72 sm:h-96">
          <SmartImage src={blog.imageUrl} alt={blog.title} fill objectFit="cover" />
        </div>
      )}

      {blog.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {blog.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 px-3 py-1 text-xs font-body font-semibold rounded-full"
              style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
              <Tag className="h-3 w-3" />{tag}
            </span>
          ))}
        </div>
      )}

      <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
        {blog.title}
      </h1>

      <div className="flex items-center gap-2 text-xs font-body mb-8 pb-8 border-b"
        style={{ color: "var(--color-text-muted)", borderColor: "var(--color-parchment)" }}>
        <Calendar className="h-3.5 w-3.5" />
        {new Date(blog.publishedAt ?? blog.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
      </div>

      <div
        className="prose prose-sm max-w-none font-body"
        style={{ color: "var(--color-text-secondary)", lineHeight: "1.9" }}
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </div>
  );
}
