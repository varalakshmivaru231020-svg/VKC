import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Blog — vkcgoldikshu",
  description: "Stories from the cane fields of Mandya: how our jaggery is made, honest guides on natural sweeteners, and festive gifting ideas.",
};

const C = { bark: "#3A1F0A", jaggery: "#E0961C", jaggeryDark: "#9A5B0B", jaggeryLite: "#FFD65C", cream: "#FBF1DE", ivory: "#FFFBF4", parchment: "#F0DCB6", ink: "#2B1708", ink2: "#5C3A1E", muted: "#8A6A4E" };

const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
const readMins = (html: string) => Math.max(2, Math.round(html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200));

export default async function BlogListPage() {
  const blogs = await db.blog.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true, title: true, slug: true, excerpt: true, imageUrl: true, tags: true, publishedAt: true, createdAt: true, content: true },
  });

  return (
    <div style={{ background: C.ivory }}>
      {/* Header band — centred, matching the Contact page */}
      <section className="py-16 sm:py-20 text-center border-b" style={{ background: C.cream, borderColor: C.parchment }}>
        <div className="max-w-2xl mx-auto px-5">
          <span className="font-body font-semibold uppercase" style={{ fontSize: 11.5, letterSpacing: "0.26em", color: C.jaggeryDark }}>From the cane fields</span>
          <h1 className="mt-4" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.4rem,5vw,4rem)", lineHeight: 1.04, letterSpacing: "-0.02em", color: C.ink, fontWeight: 500 }}>Blogs</h1>
          <p className="font-body mt-4" style={{ fontSize: 16.5, lineHeight: 1.7, color: C.ink2, textAlign: "center", hyphens: "none" }}>
            How our jaggery is made, honest notes on natural sweeteners, and ideas for gifting and everyday cooking.
          </p>
        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-16 sm:py-20">
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
                  <Link key={b.id} href={`/blog/${b.slug}`} className="group flex flex-col rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ background: "white", border: `1px solid ${C.parchment}` }}>
                    <div className="relative overflow-hidden" style={{ aspectRatio: "16 / 10", background: C.cream }}>
                      {b.imageUrl
                        ? <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.05]"><SmartImage src={b.imageUrl} alt={b.title} fill objectFit="cover" /></div>
                        : <div className="absolute inset-0 grid place-items-center"><BookOpen className="h-10 w-10" style={{ color: C.parchment }} /></div>}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex flex-wrap gap-2">{b.tags.slice(0, 2).map((t) => <span key={t} className="font-body font-semibold uppercase rounded-full px-2.5 py-1" style={{ fontSize: 10, letterSpacing: "0.14em", background: C.cream, color: C.jaggeryDark, border: `1px solid ${C.parchment}` }}>{t}</span>)}</div>
                      <h3 className="mt-3" style={{ fontFamily: "var(--font-heading)", fontSize: 22, lineHeight: 1.15, color: C.ink, fontWeight: 500 }}>{b.title}</h3>
                      {b.excerpt && <p className="font-body mt-2 line-clamp-3" style={{ fontSize: 14.5, lineHeight: 1.65, color: C.ink2, textAlign: "left", hyphens: "none" }}>{b.excerpt}</p>}
                      <div className="mt-auto pt-5 flex items-center justify-between font-body" style={{ fontSize: 12.5, color: C.muted }}>
                        <span>{fmtDate(b.publishedAt ?? b.createdAt)}</span>
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {readMins(b.content)} min</span>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
