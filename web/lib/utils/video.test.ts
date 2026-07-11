import { describe, it, expect } from "vitest";
import { parseVideoUrl, isDirectVideoFile } from "./video";

describe("parseVideoUrl", () => {
  it("parses a YouTube watch URL", () => {
    const result = parseVideoUrl("https://www.youtube.com/watch?v=AzRRFBsb-XI");
    expect(result).toEqual({
      platform: "youtube",
      embedUrl: "https://www.youtube.com/embed/AzRRFBsb-XI",
      thumbnailUrl: "https://img.youtube.com/vi/AzRRFBsb-XI/hqdefault.jpg",
    });
  });

  it("parses a youtu.be short URL", () => {
    const result = parseVideoUrl("https://youtu.be/AzRRFBsb-XI");
    expect(result?.embedUrl).toBe("https://www.youtube.com/embed/AzRRFBsb-XI");
  });

  it("parses a YouTube Shorts URL", () => {
    const result = parseVideoUrl("https://www.youtube.com/shorts/AzRRFBsb-XI");
    expect(result?.platform).toBe("youtube");
  });

  it("parses a Vimeo URL", () => {
    const result = parseVideoUrl("https://vimeo.com/76979871");
    expect(result).toEqual({
      platform: "vimeo",
      embedUrl: "https://player.vimeo.com/video/76979871",
      thumbnailUrl: null,
    });
  });

  it("parses a Facebook video URL", () => {
    const url = "https://www.facebook.com/VijaylakshmiSarees/videos/1234567890/";
    const result = parseVideoUrl(url);
    expect(result?.platform).toBe("facebook");
    expect(result?.embedUrl).toContain(encodeURIComponent(url));
  });

  it("parses an fb.watch short link", () => {
    const result = parseVideoUrl("https://fb.watch/abc123/");
    expect(result?.platform).toBe("facebook");
  });

  it("returns null for a direct video file URL", () => {
    expect(parseVideoUrl("https://cdn.example.com/uploads/saree-demo.mp4")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseVideoUrl("")).toBeNull();
  });
});

describe("isDirectVideoFile", () => {
  it("recognizes common video file extensions", () => {
    expect(isDirectVideoFile("https://cdn.example.com/video.mp4")).toBe(true);
    expect(isDirectVideoFile("https://cdn.example.com/video.webm?v=2")).toBe(true);
    expect(isDirectVideoFile("https://cdn.example.com/video.mov")).toBe(true);
  });

  it("rejects non-video URLs", () => {
    expect(isDirectVideoFile("https://www.youtube.com/watch?v=abc")).toBe(false);
    expect(isDirectVideoFile("https://cdn.example.com/photo.jpg")).toBe(false);
  });
});
