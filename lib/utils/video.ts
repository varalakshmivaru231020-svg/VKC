/** Detects YouTube / Vimeo / Facebook video page URLs and turns them into an
 *  embeddable iframe URL + thumbnail. Falls back to null (treat as a direct
 *  video file, e.g. .mp4) when nothing matches. */

export interface ParsedVideo {
  platform: "youtube" | "vimeo" | "facebook";
  embedUrl: string;
  thumbnailUrl: string | null;
}

export function parseVideoUrl(url: string): ParsedVideo | null {
  if (!url) return null;

  // YouTube — watch?v=, youtu.be/, shorts/, embed/ already
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/
  );
  if (yt) {
    const id = yt[1];
    return {
      platform: "youtube",
      embedUrl: `https://www.youtube.com/embed/${id}`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return {
      platform: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeo[1]}`,
      thumbnailUrl: null,
    };
  }

  // Facebook — video page or fb.watch short link, or reel
  if (/facebook\.com\/.*\/videos\/|fb\.watch\/|facebook\.com\/reel\//.test(url)) {
    return {
      platform: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`,
      thumbnailUrl: null,
    };
  }

  return null;
}

/** True if the URL is a direct playable file (mp4/webm/ogg/mov) rather than a page link. */
export function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}
