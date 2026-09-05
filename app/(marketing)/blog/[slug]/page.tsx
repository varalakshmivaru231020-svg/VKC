import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const C = { bark: "#3A1F0A", jaggery: "#E0961C", jaggeryDark: "#9A5B0B", jaggeryLite: "#FFD65C", cream: "#FBF1DE", ivory: "#FFFBF4", parchment: "#F0DCB6", ink: "#2B1708", ink2: "#5C3A1E", muted: "#8A6A4E" };

const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
const readMins = (html: string) => Math.max(2, Math.round(html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200));

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

  const related = await db.blog
    .findMany({
      where: { isPublished: true, slug: { not: blog.slug } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: { id: true, title: true, slug: true, excerpt: true, imageUrl: true, tags: true, publishedAt: true, createdAt: true },
    })
    .catch(() => []);

  const date = fmtDate(blog.publishedAt ?? blog.createdAt);

  return (
    <article style={{ background: C.ivory }}>
      {/* Article header — centred, on the cover image when there is one */}
      <header className="relative overflow-hidden border-b" style={{ background: C.cream, borderColor: C.parchment }}>
        {blog.imageUrl && (
          <>
            <div className="absolute inset-0"><SmartImage src={blog.imageUrl} alt="" fill objectFit="cover" /></div>
            <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(58,31,10,0.72) 0%, rgba(58,31,10,0.6) 55%, rgba(58,31,10,0.85) 100%)" }} />
          </>
        )}
        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 pt-14 pb-16 sm:pt-20 sm:pb-24 text-center">
          <Link href="/blog" className="inline-flex items-center gap-2 font-body text-sm mb-8 transition-opacity hover:opacity-70" style={{ color: blog.imageUrl ? C.jaggeryLite : C.jaggeryDark }}>
            <ArrowLeft className="h-4 w-4" /> All stories
          </Link>
          {blog.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-5">
              {blog.tags.map((t) => (
                <span key={t} className="font-body font-semibold uppercase rounded-full px-3 py-1" style={{ fontSize: 10.5, letterSpacing: "0.14em", background: blog.imageUrl ? "rgba(255,251,244,0.12)" : "white", color: blog.imageUrl ? C.jaggeryLite : C.jaggeryDark, border: `1px solid ${blog.imageUrl ? "rgba(255,214,92,0.35)" : C.parchment}` }}>{t}</span>
              ))}
            </div>
          )}
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.2rem,5vw,4rem)", lineHeight: 1.06, letterSpacing: "-0.02em", color: blog.imageUrl ? C.ivory : C.ink, fontWeight: 500 }}>{blog.title}</h1>
          {blog.excerpt && (
            <p className="font-body mt-5 mx-auto" style={{ fontSize: 17, lineHeight: 1.7, color: blog.imageUrl ? "rgba(255,251,244,0.85)" : C.ink2, maxWidth: 640, textAlign: "center", hyphens: "none" }}>{blog.excerpt}</p>
          )}
          <div className="mt-7 inline-flex items-center gap-4 font-body" style={{ fontSize: 13, color: blog.imageUrl ? "rgba(255,251,244,0.75)" : C.muted }}>
            <span>{date}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {readMins(blog.content)} min read</span>
            <span aria-hidden>·</span>
            <span>VKC Gold Ikshu</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <style dangerouslySetInnerHTML={{ __html:
          ".vkc-article h2{font-family:var(--font-heading);font-weight:500;font-size:clamp(1.5rem,2.6vw,2rem);line-height:1.2;letter-spacing:-0.01em;color:#2B1708;margin:2.2rem 0 0.8rem}" +
          ".vkc-article h3{font-family:var(--font-heading);font-weight:500;font-size:1.35rem;color:#2B1708;margin:1.8rem 0 0.6rem}" +
          ".vkc-article p{font-size:1.06rem;line-height:1.85;color:#5C3A1E;margin:0 0 1.1rem;text-align:left;hyphens:none}" +
          ".vkc-article > p:first-of-type::first-letter{font-family:var(--font-heading);font-size:3.4em;float:left;line-height:0.85;padding:0.08em 0.12em 0 0;color:#9A5B0B}" +
          ".vkc-article ul,.vkc-article ol{margin:0 0 1.2rem 1.25rem;color:#5C3A1E;line-height:1.8}" +
          ".vkc-article li{margin:0.35rem 0}" +
          ".vkc-article strong{color:#2B1708}" +
          ".vkc-article a{color:#9A5B0B;text-decoration:underline;text-underline-offset:3px}" +
          ".vkc-article em{color:#8A6A4E}" +
          ".vkc-article img{border-radius:12px;margin:1.5rem 0}" +
          ".vkc-article blockquote{border-left:3px solid #E0961C;padding-left:1.25rem;font-family:var(--font-heading);font-size:1.35rem;color:#2B1708;margin:1.8rem 0}"
        }} />
        <div className="vkc-article font-body" dangerouslySetInnerHTML={{ __html: blog.content }} />

        {/* Closing card */}
        <div className="mt-14 rounded-lg p-7 sm:p-8 grid sm:grid-cols-12 gap-6 items-center" style={{ background: C.cream, border: `1px solid ${C.parchment}` }}>
          <div className="sm:col-span-8">
            <div className="font-body font-semibold uppercase" style={{ fontSize: 10.5, letterSpacing: "0.2em", color: C.jaggeryDark }}>Taste it yourself</div>
            <p className="font-body mt-2" style={{ fontSize: 15, lineHeight: 1.65, color: C.ink2 }}>Pure, chemical-free jaggery and cane products from Mandya — shipped free across India.</p>
          </div>
          <div className="sm:col-span-4 sm:justify-self-end">
            <Link href="/shop" className="group inline-flex items-center gap-3 pl-6 pr-2 rounded-full font-body font-semibold text-sm" style={{ height: 48, background: C.bark, color: C.ivory }}>
              Shop now <span className="grid place-items-center h-8 w-8 rounded-full transition-transform duration-300 group-hover:translate-x-1" style={{ background: C.jaggery, color: C.bark }}><ArrowRight className="h-4 w-4" /></span>
            </Link>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t" style={{ background: C.cream, borderColor: C.parchment }}>
          <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-16">
            <div className="flex items-end justify-between gap-6 mb-8">
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.7rem,3vw,2.4rem)", lineHeight: 1.1, color: C.ink, fontWeight: 500 }}>More stories</h2>
              <Link href="/blog" className="inline-flex items-center gap-1.5 font-body font-semibold text-sm" style={{ color: C.jaggeryDark }}>All stories <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((b) => (
                <Link key={b.id} href={`/blog/${b.slug}`} className="group flex flex-col rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ background: "white", border: `1px solid ${C.parchment}` }}>
                  <div className="relative overflow-hidden" style={{ aspectRatio: "16 / 10", background: C.ivory }}>
                    {b.imageUrl && <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.05]"><SmartImage src={b.imageUrl} alt={b.title} fill objectFit="cover" /></div>}
                  </div>
                  <div className="p-6">
                    <div className="font-body" style={{ fontSize: 12.5, color: C.muted }}>{fmtDate(b.publishedAt ?? b.createdAt)}</div>
                    <h3 className="mt-2" style={{ fontFamily: "var(--font-heading)", fontSize: 21, lineHeight: 1.15, color: C.ink, fontWeight: 500 }}>{b.title}</h3>
                    {b.excerpt && <p className="font-body mt-2 line-clamp-2" style={{ fontSize: 14, lineHeight: 1.6, color: C.ink2, textAlign: "left", hyphens: "none" }}>{b.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
