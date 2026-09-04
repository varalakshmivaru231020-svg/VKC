/** Validation shared by the admin testimonial API routes. */

export interface TestimonialInput {
  name: string;
  location: string | null;
  tag: string | null;
  rating: number;
  quote: string;
  sortOrder: number;
  isActive: boolean;
}

// Strip ASCII control characters only; normal punctuation and spacing stay.
const CONTROL_CHARS = new RegExp("[\\u0000-\\u001F\\u007F]", "g");
const text = (v: unknown) => (typeof v === "string" ? v.replace(CONTROL_CHARS, "").trim() : "");

export function parseTestimonial(body: any): { ok: true; data: TestimonialInput } | { ok: false; error: string } {
  const name = text(body?.name);
  const location = text(body?.location);
  const tag = text(body?.tag);
  const quote = text(body?.quote);
  const rating = Math.round(Number(body?.rating ?? 5));
  const sortOrder = Number.parseInt(String(body?.sortOrder ?? "0"), 10);

  if (!name) return { ok: false, error: "Customer name is required" };
  if (name.length > 120) return { ok: false, error: "Name must be 120 characters or less" };
  if (location.length > 120) return { ok: false, error: "Location must be 120 characters or less" };
  if (tag.length > 80) return { ok: false, error: "Tag must be 80 characters or less" };
  if (!quote) return { ok: false, error: "Testimonial text is required" };
  if (quote.length > 1000) return { ok: false, error: "Testimonial must be 1000 characters or less" };
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return { ok: false, error: "Rating must be between 1 and 5" };

  return {
    ok: true,
    data: {
      name,
      location: location || null,
      tag: tag || null,
      rating,
      quote,
      sortOrder: Number.isFinite(sortOrder) ? Math.max(0, Math.min(sortOrder, 9999)) : 0,
      isActive: typeof body?.isActive === "boolean" ? body.isActive : true,
    },
  };
}
