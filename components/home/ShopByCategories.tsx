import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

/**
 * "Shop by Categories" — round image tiles under the hero.
 *
 * Categories come from Admin → Categories. Admin → Settings → Homepage can
 * pin and order a subset; otherwise every active category with an image is
 * shown. Renders nothing when there is nothing to show.
 */
export interface HomeCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

const C = {
  jaggery: "#E0961C",
  jaggeryDark: "#9A5B0B",
  ivory: "#FFFBF4",
  cream: "#FBF1DE",
  parchment: "#F0DCB6",
  ink: "#2B1708",
  muted: "#8A6A4E",
};

export function ShopByCategories({ categories, eyebrow = "Collections", heading = "Shop by Categories" }: { categories: HomeCategory[]; eyebrow?: string; heading?: string }) {
  if (!categories.length) return null;
  // A centred, wrapping row: one category sits in the middle, four sit in a
  // line, and larger catalogues wrap into further centred rows.

  return (
    <section className="py-16 sm:py-20" style={{ background: C.ivory }} aria-labelledby="shop-by-categories-heading">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="font-body font-semibold uppercase" style={{ fontSize: 11.5, letterSpacing: "0.26em", color: C.jaggeryDark }}>{eyebrow}</span>
          <h2 id="shop-by-categories-heading" className="mt-4" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.1rem,4.4vw,3.4rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: C.ink, fontWeight: 500 }}>
            {heading}
          </h2>
          <span className="block mx-auto mt-5 h-[2px] w-16" style={{ background: `linear-gradient(90deg, transparent, ${C.jaggery}, transparent)` }} />
        </div>

        <ul className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-10 lg:gap-x-10 list-none m-0 p-0">
          {categories.map((cat) => (
            <li key={cat.id} className="w-[calc(50%-0.75rem)] sm:w-[220px] lg:w-[250px]">
              <Link href={`/category/${cat.slug}`} className="group block text-center" aria-label={`Shop ${cat.name}`}>
                {/* Round tile: soft cream ring, image zooms gently on hover. */}
                <div className="relative mx-auto aspect-square w-full rounded-full overflow-hidden transition-transform duration-500 group-hover:-translate-y-1.5"
                  style={{ background: C.cream, boxShadow: `0 0 0 6px ${C.ivory}, 0 0 0 7px ${C.parchment}, 0 24px 48px -28px rgba(58,31,10,0.45)` }}>
                  {cat.imageUrl ? (
                    <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.06]">
                      <SmartImage src={cat.imageUrl} alt={cat.name} fill objectFit="cover" objectPosition="center" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 grid place-items-center p-6">
                      <span className="text-center font-heading" style={{ fontSize: 22, lineHeight: 1.15, color: C.jaggeryDark }}>{cat.name}</span>
                    </div>
                  )}
                </div>
                <div className="mt-5 inline-flex items-center gap-1.5 font-body font-semibold transition-colors duration-300 group-hover:text-[#9A5B0B]" style={{ fontSize: 15.5, color: C.ink }}>
                  {cat.name}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" style={{ color: C.jaggeryDark }} />
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 text-center">
          <Link href="/shop" className="inline-flex items-center gap-2 font-body font-semibold text-sm rounded-full px-6 transition-colors duration-300 hover:text-white"
            style={{ height: 46, border: `1px solid ${C.jaggery}66`, color: C.jaggeryDark }}>
            View all products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
