import Link from "next/link";

/**
 * The one banner every inner page opens with — About, Leadership,
 * Credentials, Shop, Blogs, Gallery, Contact. (Home keeps its own hero.)
 *
 * A medium band, the same height everywhere: 300px on desktop and tablet,
 * 215px on phones. The photograph comes from Admin → Banners (one position
 * per page, see lib/page-banners.ts) and fills the band as a cover crop. The
 * words sit on the left, vertically centred, over a wash that is solid under
 * the text — uploaded artwork often carries its own lettering, which must not
 * ghost through a headline — and opens over the right quarter so the picture
 * reads. With nothing uploaded the band is plain cream.
 *
 * No hooks and no "use client": it renders the same from server pages and
 * from client page components, and the heading is never hidden waiting for an
 * animation.
 */

export interface PageBannerProps {
  /** Breadcrumb label for this page, shown as "Home / {crumb}". */
  crumb: string;
  title: string;
  description?: string;
  image?: string | null;
  mobileImage?: string | null;
  imageAlt?: string;
  headingId?: string;
}

const WASH_CSS =
  ".page-banner-wash{background:linear-gradient(90deg,#2B1708 0%,#2B1708 58%,rgba(43,23,8,0.9) 100%)}" +
  "@media (min-width:768px){.page-banner-wash{background:linear-gradient(90deg,#2B1708 0%,#2B1708 69%,rgba(43,23,8,0.7) 77%,rgba(43,23,8,0.3) 88%,rgba(43,23,8,0.18) 100%)}}" +
  ".marketing-layout .page-banner p{text-align:left;hyphens:none;text-justify:auto}";

export function PageBanner({ crumb, title, description, image = null, mobileImage = null, imageAlt = "", headingId = "page-banner-heading" }: PageBannerProps) {
  const desktop = image?.trim() || mobileImage?.trim() || null;
  const mobile = mobileImage?.trim() || null;
  const on = Boolean(desktop);
  const ink = on ? "#FFFBF4" : "#2B1708";
  const soft = on ? "rgba(255,251,244,0.72)" : "#5C3A1E";
  const accent = on ? "#E0961C" : "#B8860B";

  return (
    <section
      aria-labelledby={headingId}
      className="page-banner relative isolate flex items-center overflow-hidden min-h-[215px] md:min-h-[300px]"
      style={{ background: on ? "#2B1708" : "#FBF1DE", borderBottom: on ? undefined : "1px solid #EADFCB" }}
    >
      <style dangerouslySetInnerHTML={{ __html: WASH_CSS }} />
      {desktop && (
        <>
          <picture>
            {mobile && mobile !== desktop && <source media="(max-width: 767px)" srcSet={mobile} />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={desktop} alt={imageAlt} fetchPriority="high" decoding="async" className="absolute inset-0 -z-20 h-full w-full object-cover" style={{ objectPosition: "center 62%" }} />
          </picture>
          <div aria-hidden className="page-banner-wash absolute inset-0 -z-10" />
        </>
      )}
      <div className="w-full max-w-[1200px] mx-auto px-5 sm:px-8 py-5 md:py-8">
        <div className="max-w-[640px]">
          <nav aria-label="Breadcrumb" className="font-body font-semibold uppercase" style={{ fontSize: 10.5, letterSpacing: "0.22em", color: soft }}>
            <Link href="/" className="hover:underline">Home</Link>
            <span aria-hidden className="mx-2.5" style={{ color: accent }}>/</span>
            <span style={{ color: accent }}>{crumb}</span>
          </nav>
          <h1 id={headingId} className="mt-2.5 md:mt-3.5" style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: "clamp(2rem, 4.2vw, 3.4rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: ink }}>
            {title}
          </h1>
          {description && (
            <p className="font-body mt-2.5 md:mt-3.5 line-clamp-3 md:line-clamp-2" style={{ fontSize: "clamp(0.85rem, 1.12vw, 1rem)", lineHeight: 1.55, color: soft, maxWidth: 540 }}>
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
