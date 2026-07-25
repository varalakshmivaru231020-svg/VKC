import Link from "next/link";
import { SmartImage } from "@/components/ui/SmartImage";

interface PromoBannerProps {
  banner: {
    title: string;
    subtitle?: string | null;
    imageUrl: string;
    mobileImageUrl?: string | null;
    linkUrl?: string | null;
  };
}

export function PromoBanner({ banner }: PromoBannerProps) {
  const content = (
    <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100">
      {/* Desktop Image */}
      <img
        src={banner.imageUrl}
        alt={banner.title}
        className={`w-full h-auto object-cover ${banner.mobileImageUrl ? "hidden md:block" : "block"}`}
      />
      
      {/* Mobile Image */}
      {banner.mobileImageUrl && (
        <img
          src={banner.mobileImageUrl}
          alt={banner.title}
          className="w-full h-auto object-cover md:hidden"
        />
      )}

      {/* Screen reader text only, images contain the text usually for promotional banners */}
      <span className="sr-only">
        {banner.title} {banner.subtitle}
      </span>
    </div>
  );

  if (banner.linkUrl) {
    return (
      <Link href={banner.linkUrl} className="block w-full hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return <div className="w-full">{content}</div>;
}
