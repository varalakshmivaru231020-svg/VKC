import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

/**
 * Three editorial blocks under the testimonials: sourcing, process, gifting.
 * Copy is fixed; imagery comes from the catalogue (category photos uploaded in
 * admin), so the pictures are always the brand's own. A block with no image
 * falls back to a warm colour field rather than a stock photo.
 */
export interface HighlightBlock {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  imageUrl: string | null;
  imageAlt: string;
}

const C = {
  bark: "#3A1F0A",
  jaggery: "#E0961C",
  jaggeryLite: "#FFD65C",
  jaggeryDark: "#9A5B0B",
  ivory: "#FFFBF4",
  cream: "#FBF1DE",
  parchment: "#F0DCB6",
  ink: "#2B1708",
  ink2: "#5C3A1E",
};

export function HomeHighlights({ blocks }: { blocks: HighlightBlock[] }) {
  if (!blocks.length) return null;
  return (
    <section className="py-20 sm:py-24" style={{ background: C.cream }} aria-label="Highlights">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {blocks.map((b, i) => (
            <Link
              key={b.title}
              href={b.href}
              className="group relative rounded-lg overflow-hidden flex flex-col"
              style={{ background: "white", border: `1px solid ${C.parchment}`, boxShadow: "0 12px 34px -20px rgba(58,31,10,0.25)" }}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: "4 / 3", background: `linear-gradient(135deg, ${C.jaggeryLite}, ${C.jaggery} 60%, ${C.jaggeryDark})` }}>
                {b.imageUrl && (
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                    <SmartImage src={b.imageUrl} alt={b.imageAlt} fill objectFit="cover" objectPosition="center" />
                  </div>
                )}
                <span className="absolute left-4 top-4 h-9 w-9 rounded-full grid place-items-center font-body font-semibold" style={{ background: "rgba(255,251,244,0.92)", color: C.jaggeryDark, fontSize: 12 }}>
                  0{i + 1}
                </span>
              </div>
              <div className="p-6 sm:p-7 flex flex-col flex-1">
                <span className="font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.2em", color: C.jaggeryDark }}>{b.eyebrow}</span>
                <h3 className="mt-2" style={{ fontFamily: "var(--font-heading)", fontSize: 24, lineHeight: 1.12, color: C.ink, fontWeight: 500 }}>{b.title}</h3>
                <p className="font-body mt-2.5 flex-1" style={{ fontSize: 14.5, lineHeight: 1.65, color: C.ink2, textAlign: "left", hyphens: "none" }}>{b.body}</p>
                <span className="mt-5 inline-flex items-center gap-2 font-body font-semibold" style={{ fontSize: 13.5, color: C.jaggeryDark }}>
                  {b.cta}
                  <span className="grid place-items-center h-7 w-7 rounded-full transition-transform duration-300 group-hover:rotate-45" style={{ border: `1px solid ${C.jaggery}66` }}>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
