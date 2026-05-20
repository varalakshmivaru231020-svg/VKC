"use client";

import { useState, useEffect, useRef } from "react";
import { ImageIcon } from "lucide-react";

interface SmartImageProps {
  src: string | null | undefined;
  alt: string;
  /** When true the img and shimmer use absolute inset-0 (for use inside an existing positioned container). */
  fill?: boolean;
  className?: string;
  style?: React.CSSProperties;
  objectFit?: "cover" | "contain";
  objectPosition?: string;
  /** Custom element to render when the image fails to load. */
  fallback?: React.ReactNode;
}

/**
 * Drop-in replacement for <img> that:
 *  - shows a shimmer skeleton while the image is in-flight
 *  - fades the image in once loaded
 *  - shows a subtle placeholder on error
 *
 * fill=false (default): renders its own relative wrapper (good for list items, admin thumbs).
 * fill=true: shimmer + img use absolute inset-0 — place inside your own positioned container.
 */
export function SmartImage({
  src,
  alt,
  fill = false,
  className = "",
  style,
  objectFit = "cover",
  objectPosition = "center",
  fallback,
}: SmartImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    src ? "loading" : "error"
  );
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset status when src changes, and handle cached images that fire onLoad
  // before React can attach the event listener.
  useEffect(() => {
    if (!src) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    // If the browser already has this image cached, onLoad may have fired
    // before React attached the handler — check img.complete to catch this.
    const el = imgRef.current;
    if (el && el.complete) {
      setStatus(el.naturalWidth > 0 ? "loaded" : "error");
    }
  }, [src]);

  const posCls = "absolute inset-0";

  const shimmer = status === "loading" && (
    <div className={`${posCls} shimmer`} aria-hidden />
  );

  const errorEl = status === "error" && (
    <div
      className={`${posCls} flex items-center justify-center`}
      style={{ background: "var(--color-cream)" }}
    >
      {fallback ?? (
        <ImageIcon className="h-5 w-5 opacity-25" style={{ color: "var(--color-sand)" }} />
      )}
    </div>
  );

  const img = src && status !== "error" && (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={`${posCls} w-full h-full transition-opacity duration-300 ${className}`}
      style={{ objectFit, objectPosition, opacity: status === "loaded" ? 1 : 0, ...style }}
      onLoad={() => setStatus("loaded")}
      onError={() => setStatus("error")}
    />
  );

  if (fill) {
    return (
      <>
        {shimmer}
        {errorEl}
        {img}
      </>
    );
  }

  // Standalone: wrap in a relative container
  return (
    <div className="relative w-full h-full overflow-hidden">
      {shimmer}
      {errorEl}
      {img}
    </div>
  );
}
