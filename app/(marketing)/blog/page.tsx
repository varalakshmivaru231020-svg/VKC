import Link from "next/link";
import { db } from "@/lib/db";
import { BookOpen, Calendar } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog — VKC Gold" };

export default async function BlogListPage() {
  const blogs = await db.blog.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, slug: true, excerpt: true, imageUrl: true, tags: true, publishedAt: true, createdAt: true },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
          Our Blog
        </h1>
        <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
          Recipes, wellness notes & stories from the cane fields of Mandya
        </p>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--color-text-disabled)" }} />
          <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>No blog posts yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <Link key={blog.id} href={`/blog/${blog.slug}`}
              className="group rounded-2xl border overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: "white", borderColor: "var(--color-parchment)" }}>
              <div className="relative h-48 overflow-hidden" style={{ background: "var(--color-cream)" }}>
                {blog.imageUrl
                  ? <SmartImage src={blog.imageUrl} alt={blog.title} fill objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-12 w-12" style={{ color: "var(--color-text-disabled)" }} />
                    </div>}
              </div>
              <div className="p-5">
                {blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {blog.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 text-[10px] font-body font-semibold rounded-full"
                        style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <h2 className="text-base font-semibold font-body mb-2 line-clamp-2" style={{ color: "var(--color-text-primary)" }}>
                  {blog.title}
                </h2>
                {blog.excerpt && (
                  <p className="text-xs font-body line-clamp-2 mb-3" style={{ color: "var(--color-text-muted)" }}>
                    {blog.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs font-body" style={{ color: "var(--color-text-disabled)" }}>
                  <Calendar className="h-3 w-3" />
                  {new Date(blog.publishedAt ?? blog.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
