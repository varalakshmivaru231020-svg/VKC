import { SmartImage } from "@/components/ui/SmartImage";

/**
 * An image that fills its positioned parent without ever cropping the subject.
 *
 * Uploads arrive in every shape — tall packshots, wide banners — while the
 * frames they land in (a category circle, a 4:3 blog card) are fixed. Cover
 * would crop the edges off, contain would leave flat bars around the picture.
 * This does what photo apps do instead: the same picture, cover-cropped and
 * blurred, fills the frame as a backdrop, and the whole sharp image sits
 * centred on top. The frame reads as one photo edge to edge, and nothing is
 * lost.
 *
 * Place inside an element with `position: relative` (or absolute) and a size.
 *
 * - `inset`: how far the sharp image stays from the frame edge. A circle needs
 *   about 11% so a 3:4 image sits fully inside the disc, corners included; a
 *   rectangular card can use 0.
 * - `feather`: softens the sharp layer's boundary into the backdrop —
 *   "corners" fades only its corners (right for circles), "sides" fades a thin
 *   band at the left and right (right for wide cards holding tall images).
 */
export function FramedImage({
  src,
  alt,
  inset = "0",
  feather = "none",
  blur = 22,
}: {
  src: string;
  alt: string;
  inset?: string;
  feather?: "none" | "corners" | "sides";
  blur?: number;
}) {
  const mask =
    feather === "corners"
      ? "radial-gradient(ellipse 75% 75% at 50% 50%, #000 80%, transparent 100%)"
      : feather === "sides"
        ? "linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)"
        : undefined;

  return (
    <>
      {/* Backdrop: the picture's own colours, blurred, so the frame is full. The
          slight scale hides the transparent fringe a blur leaves at the edges;
          the wash keeps it soft under the sharp layer. */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: `blur(${blur}px) saturate(1.08)`, transform: "scale(1.18)" }}
        />
        <div className="absolute inset-0" style={{ background: "rgba(255, 251, 244, 0.22)" }} />
      </div>

      {/* Subject: the whole image, contained, never cropped. */}
      <div className="absolute" style={{ inset, WebkitMaskImage: mask, maskImage: mask }}>
        <SmartImage src={src} alt={alt} fill objectFit="contain" objectPosition="center" />
      </div>
    </>
  );
}
