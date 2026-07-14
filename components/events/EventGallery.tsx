"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { parseVideoUrl } from "@/lib/utils/video";

interface Media {
  id: string;
  type: string;
  url: string;
  caption: string | null;
}

// Facebook gallery items reuse the video embed/player under their own "FACEBOOK" db type.
const isVideoType = (type: string) => type === "VIDEO" || type === "FACEBOOK";

function VideoThumb({ url }: { url: string }) {
  const parsed = parseVideoUrl(url);
  return (
    <>
      {parsed?.thumbnailUrl ? (
        <img src={parsed.thumbnailUrl} alt="" className="w-full h-full object-cover" />
      ) : parsed ? (
        <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--color-text-primary)" }} />
      ) : (
        <video src={url} className="w-full h-full object-cover" muted />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
          <div style={{ width: 0, height: 0, borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderLeft: "11px solid var(--color-primary)", marginLeft: 3 }} />
        </div>
      </div>
    </>
  );
}

function VideoPlayer({ url }: { url: string }) {
  const parsed = parseVideoUrl(url);
  if (parsed) {
    return (
      <iframe
        src={parsed.embedUrl}
        className="w-full aspect-video max-h-[75vh] rounded-lg"
        style={{ width: "min(90vw, 900px)" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return <video src={url} controls autoPlay className="max-h-[75vh] max-w-full rounded-lg" />;
}

export function EventGallery({ media, layout = "grid" }: { media: Media[]; layout?: "grid" | "slider" }) {
  const [active, setActive] = useState<number | null>(null);

  if (!media.length) {
    return (
      <p className="text-center text-sm font-body py-16" style={{ color: "var(--color-text-muted)" }}>
        No photos or videos added yet.
      </p>
    );
  }

  const openAt = (i: number) => setActive(i);
  const close = () => setActive(null);
  const prev = () => setActive((i) => (i === null ? null : (i - 1 + media.length) % media.length));
  const next = () => setActive((i) => (i === null ? null : (i + 1) % media.length));

  return (
    <>
      <div className={layout === "slider"
        ? "flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x"
        : "grid grid-cols-2 sm:grid-cols-3 gap-3"}
      >
        {media.map((m, i) => (
          <button
            key={m.id}
            onClick={() => openAt(i)}
            className={layout === "slider"
              ? "relative shrink-0 snap-start aspect-square rounded-xl overflow-hidden group"
              : "relative aspect-square rounded-xl overflow-hidden group"}
            style={layout === "slider" ? { background: "var(--color-cream)", width: "min(45vw, 220px)" } : { background: "var(--color-cream)" }}
          >
            {isVideoType(m.type) ? (
              <VideoThumb url={m.url} />
            ) : (
              <SmartImage src={m.url} alt={m.caption ?? "Event photo"} fill objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />
            )}
          </button>
        ))}
      </div>

      {active !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85" onClick={close}>
          <button onClick={close} aria-label="Close" className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          {media.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous" className="absolute left-4 h-11 w-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next" className="absolute right-4 h-11 w-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {isVideoType(media[active].type) ? (
              <VideoPlayer url={media[active].url} />
            ) : (
              <img src={media[active].url} alt={media[active].caption ?? "Event photo"} className="max-h-[75vh] max-w-full rounded-lg object-contain" />
            )}
            {media[active].caption && (
              <p className="text-sm font-body text-white/80">{media[active].caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
