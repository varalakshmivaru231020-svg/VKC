import Link from "next/link";
import { db } from "@/lib/db";
import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { BlogCard } from "@/components/blog/BlogCard";
import { PageBanner } from "@/components/layout/PageBanner";
import { getPageBanner } from "@/lib/page-banners";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Blog — vkcgoldikshu",
  description: "Stories from the cane fields of Mandya: how our jaggery is made, honest guides on natural sweeteners, and festive gifting ideas.",
};

const C = { bark: "#3A1F0A", jaggery: "#E0961C", jaggeryDark: "#9A5B0B", jaggeryLite: "#FFD65C", cream: "#FBF1DE", ivory: "#FFFBF4", parchment: "#F0DCB6", ink: "#2B1708", ink2: "#5C3A1E", muted: "#8A6A4E" };

export default async function BlogListPage() {
  const pageBanner = await getPageBanner("blog");
  const blogs = await db.blog.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true, title: true, slug: true, excerpt: true, imageUrl: true, tags: true, publishedAt: true, createdAt: true, content: true },
  });

  return (
    <div style={{ background: C.ivory }}>
      {/* The standard inner-page banner (components/layout/PageBanner). */}
      <PageBanner {...pageBanner} />

      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14 sm:py-20">
        {blogs.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-14 w-14 mx-auto mb-4" style={{ color: C.parchment }} />
            <p className="font-body" style={{ color: C.muted }}>No posts yet. Check back soon.</p>
          </div>
        ) : (
          <>
            {/* Even grid — every post gets the same card */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogs.map((b) => (
                <BlogCard
                  key={b.id}
                  id={b.id}
                  title={b.title}
                  slug={b.slug}
                  excerpt={b.excerpt}
                  imageUrl={b.imageUrl}
                  publishedAt={b.publishedAt}
                  createdAt={b.createdAt}
                  tags={b.tags}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
