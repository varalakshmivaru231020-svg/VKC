export const BANNER_POSITIONS: Record<string, string> = {
  home_hero: "Home — Hero",
  home_mid: "Home — Mid Section",
  home_bottom: "Home — Bottom",
  category_top: "Category — Top",
  category_banner: "Category — Banner",
  shop_top: "Shop — Top",
  shop_banner: "Shop — Banner",
  about_banner: "About Us — Hero Banner",
  leadership_banner: "Leadership — Header Banner",
  credentials_banner: "Credentials — Header Banner",
};

export const BANNER_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  PROMOTIONAL: { label: "Promotional", color: "#7C3AED", bg: "#EDE9FE" },
  SEASONAL: { label: "Seasonal", color: "#0369A1", bg: "#E0F2FE" },
  SALE: { label: "Sale / Offer", color: "#DC2626", bg: "#FEE2E2" },
  CATEGORY: { label: "Category", color: "#059669", bg: "#D1FAE5" },
  BRAND: { label: "Brand", color: "#D97706", bg: "#FEF3C7" },
  ANNOUNCEMENT: { label: "Announcement", color: "#374151", bg: "#F3F4F6" },
  CUSTOM: { label: "Custom", color: "#6B7280", bg: "#F9FAFB" },
};

const POSITION_SET = new Set(Object.keys(BANNER_POSITIONS));
const TYPE_SET = new Set(Object.keys(BANNER_TYPES));
const SAFE_IMAGE_HOSTS = new Set([
  "res.cloudinary.com",
  "images.unsplash.com",
  "lh3.googleusercontent.com",
]);
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function normalizeBannerPosition(value: unknown) {
  const position = cleanString(value);
  return POSITION_SET.has(position) ? position : null;
}

export function normalizeBannerType(value: unknown) {
  const type = cleanString(value);
  return TYPE_SET.has(type) ? type : "PROMOTIONAL";
}

export function normalizeBannerImageUrl(value: unknown) {
  const url = cleanString(value);
  if (!url || CONTROL_CHARS.test(url) || url.startsWith("//") || url.includes("\\")) {
    return null;
  }

  if (url.startsWith("/")) {
    return url.startsWith("/uploads/") || url.startsWith("/images/") ? url : null;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (parsed.protocol === "https:" && SAFE_IMAGE_HOSTS.has(hostname)) {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeBannerLinkUrl(value: unknown) {
  const url = cleanString(value);
  if (!url || CONTROL_CHARS.test(url) || url.startsWith("//") || url.includes("\\")) {
    return null;
  }

  if (url.startsWith("/")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}
