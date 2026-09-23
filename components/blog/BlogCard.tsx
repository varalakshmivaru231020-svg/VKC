import Link from "next/link";
import { Calendar, User, ArrowRight, BookOpen } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

export interface BlogCardProps {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
  author?: string | null;
  tags?: string[];
  aspectRatio?: string;
}

const formatDate = (dateInput?: Date | string | null) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

export function BlogCard({
  title,
  slug,
  excerpt,
  imageUrl,
  publishedAt,
  createdAt,
  author,
  aspectRatio = "16 / 10",
}: BlogCardProps) {
  const formattedDate = formatDate(publishedAt ?? createdAt);
  const authorName = author || "VKC Team";

  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col rounded-2xl border bg-white overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={{ borderColor: "var(--color-parchment, #E0D0B8)" }}
    >
      {/* Full width image banner */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio, background: "var(--color-cream, #FBF1DE)" }}
      >
        {imageUrl ? (
          <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
            <SmartImage
              src={imageUrl}
              alt={title}
              fill
              objectFit="cover"
              objectPosition="center"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-10 w-10 opacity-30" style={{ color: "#487A38" }} />
          </div>
        )}
      </div>

      {/* Card details body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Metadata bar */}
        <div className="flex items-center flex-wrap gap-4 text-xs mb-3 font-body">
          {formattedDate && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5" style={{ color: "#487A38" }} />
              <span style={{ color: "#888888" }}>{formattedDate}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 font-medium">
            <User className="h-3.5 w-3.5" style={{ color: "#487A38" }} />
            <span style={{ color: "#888888" }}>{authorName}</span>
          </span>
        </div>

        {/* Title */}
        <h3
          className="font-body font-bold text-base sm:text-lg leading-snug line-clamp-2 mb-2.5 transition-colors"
          style={{ color: "#487A38" }}
        >
          {title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p
            className="font-body text-xs sm:text-sm line-clamp-3 mb-4 leading-relaxed"
            style={{ color: "#555555", textAlign: "left", hyphens: "none" }}
          >
            {excerpt}
          </p>
        )}

        {/* Read More */}
        <div className="mt-auto pt-2">
          <span
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold font-body group-hover:gap-2.5 transition-all"
            style={{ color: "#487A38" }}
          >
            Read More <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
