import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

/**
 * "Shop by Categories" — four circular category images under the hero.
 *
 * Each image IS the circle: the photo is clipped to a disc (cover, centred),
 * with no ring or panel behind it, so it reads as one round picture rather
 * than a square sitting inside a frame. Cards share one structure — image,
 * title, arrow — with two lines reserved for the title so a wrapped name
 * doesn't push its arrow out of line with the others.
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

        {/* Desktop: four across. Tablet and phones: two across. Every cell is the
            same width, so all four discs are exactly the same size. */}
        <ul className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10 sm:gap-x-8 lg:gap-x-10 justify-items-center list-none m-0 p-0">
          {categories.map((cat) => (
            <li key={cat.id} className="w-full flex justify-center min-w-0">
              <Link href={`/category/${cat.slug}`} className="group flex w-full flex-col items-center text-center" style={{ maxWidth: "clamp(220px, 20vw, 300px)" }} aria-label={`Shop ${cat.name}`}>
                {/* The circular image. Square wrapper, clipped to a disc; the photo
                    fills it (cover, centred) and zooms gently inside it on hover while
                    the disc itself stays put. The radial mask keeps Safari clipping the
                    scaled image to the circle. */}
                <div className="relative w-full aspect-square rounded-full overflow-hidden"
                  style={{ background: C.cream, boxShadow: "0 18px 40px -28px rgba(58,31,10,0.4)", WebkitMaskImage: "-webkit-radial-gradient(white, black)" }}>
                  {cat.imageUrl ? (
                    <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.05]">
                      <SmartImage src={cat.imageUrl} alt={cat.name} fill objectFit="cover" objectPosition="center" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 grid place-items-center p-6">
                      <span className="text-center font-heading" style={{ fontSize: 22, lineHeight: 1.15, color: C.jaggeryDark }}>{cat.name}</span>
                    </div>
                  )}
                </div>

                {/* Title: top-aligned in a two-line slot, so single-line names sit on
                    the same line as the first line of a wrapped one, and the arrow
                    row below lands at the same height on every card. */}
                <div className="mt-4 flex w-full items-start justify-center font-body font-semibold text-[14px] sm:text-[15.5px]"
                  style={{ lineHeight: 1.3, minHeight: "2.6em", color: C.ink }}>
                  <span className="transition-colors duration-300 group-hover:text-[#9A5B0B]">{cat.name}</span>
                </div>

                {/* Arrow row. */}
                <span className="mt-4 inline-flex items-center gap-1.5 font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.16em", color: C.jaggeryDark }}>
                  Shop <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
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
