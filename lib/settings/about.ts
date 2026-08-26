import { db } from "@/lib/db";

/**
 * Content for the About Us page.
 *
 * Every string below was previously hardcoded in app/(marketing)/about/page.tsx,
 * which meant a developer had to change an office address. They are now site
 * settings, with the original copy kept here as the default — so the page looks
 * identical until someone edits it in Admin → Settings → About Page.
 *
 * The repeating blocks (values cards, offices) are stored as JSON strings
 * because SiteSetting.value is a plain text column. Both parse defensively:
 * malformed JSON falls back to the default rather than breaking the page.
 */

export interface AboutValue {
  icon: string;   // key into ABOUT_VALUE_ICONS
  title: string;
  desc: string;
}

export interface AboutOffice {
  label: string;
  name: string | null;
  lines: string[];
}

export interface AboutContent {
  heroEyebrow: string;
  heroTitle: string;      // newlines render as line breaks
  heroSubtitle: string;
  storyHeading: string;
  storyBody: string;      // blank line between paragraphs
  valuesEyebrow: string;
  valuesHeading: string;
  values: AboutValue[];
  officesEyebrow: string;
  officesHeading: string;
  offices: AboutOffice[];
  ctaHeading: string;
  ctaText: string;
  // The "Our Heritage" block on the home page — same brand story, so it is
  // managed alongside the About page rather than in a separate tab.
  homeEyebrow: string;
  homeHeading: string;   // newlines render as line breaks
  homeBody: string;
  homeQuote: string;
  homeCtaLabel: string;
}

/** Icon names the values cards may use. Anything else falls back to Heart. */
export const ABOUT_VALUE_ICONS = ["Heart", "ShieldCheck", "Sparkles", "Globe2"] as const;

export const ABOUT_DEFAULTS: AboutContent = {
  heroEyebrow: "Over a Decade of Trust",
  heroTitle: "Where Tradition\nMeets Luxury.",
  heroSubtitle:
    "At Anjali's Vijaylakshmi Sarees, every saree is a celebration of heritage, elegance, and timeless craftsmanship.",
  storyHeading: "About Us",
  storyBody: [
    "At Anjali's Vijaylakshmi Sarees, every saree is a celebration of heritage, elegance, and timeless craftsmanship. For over a decade, we have been curating exquisite collections that beautifully blend India's rich textile traditions with contemporary sophistication.",
    "From intricate Aari work and exclusive handcrafted designs to premium fabrics and refined finishes, each creation reflects our passion for perfection. Our journey has been built on trust, authenticity, and an unwavering commitment to quality, earning the love of customers across India and around the world.",
    "Through exhibitions, online live sales, and our digital presence, we continue to make exceptional sarees accessible to every woman. More than a brand, Anjali's Vijaylakshmi Sarees is a destination where tradition meets luxury, and every drape tells a story of grace, confidence and enduring beauty.",
  ].join("\n\n"),
  valuesEyebrow: "What We Stand For",
  valuesHeading: "Our Values",
  values: [
    {
      icon: "Heart",
      title: "Heritage & Craftsmanship",
      desc: "From intricate Aari work to exclusive handcrafted designs, every saree reflects our passion for perfection and India's rich textile traditions.",
    },
    {
      icon: "ShieldCheck",
      title: "Trust & Authenticity",
      desc: "Our journey has been built on trust, authenticity, and an unwavering commitment to quality — earning the love of customers across India and around the world.",
    },
    {
      icon: "Sparkles",
      title: "Premium Quality",
      desc: "Premium fabrics, refined finishes, and meticulous attention to detail — because every drape should tell a story of grace and enduring beauty.",
    },
    {
      icon: "Globe2",
      title: "Accessible to Every Woman",
      desc: "Through exhibitions, online live sales, and our digital presence, we continue to make exceptional sarees accessible to every woman, everywhere.",
    },
  ],
  officesEyebrow: "Reach Us",
  officesHeading: "Contact & Registered Offices",
  offices: [
    {
      label: "Registered Office",
      name: null,
      lines: [
        "VL Group",
        "36/11, CHB Colony, Street No. 04",
        "Vellur Road",
        "Tiruchengode – 637211",
        "Namakkal Dt., Tamil Nadu",
      ],
    },
    {
      label: "Karnataka Office",
      name: "Anjali's Vijaylakshmi Sarees — VL Group",
      lines: [
        "D. No. 4/397/A1 to 4/397/A8",
        "Chantar Gram Panchayat, Brahmavar Hebri Road",
        "Chantar, Udupi",
        "Brahmavar – 576213, Karnataka",
      ],
    },
  ],
  ctaHeading: "Wear a Story",
  ctaText:
    "Browse our collection and find the saree that speaks to you — woven with skill, intention, and a decade of passion.",
  homeEyebrow: "Our Heritage",
  homeHeading: "Woven With\nGenerations of Love",
  homeBody:
    "Every Vijaylakshmi saree carries the artistry of master weavers whose skills have been passed down through generations. We work closely with skilled artisans, helping preserve India's rich and time-honoured weaving traditions. Each saree is more than a piece of fabric — it is a celebration of craftsmanship, heritage, and the hands that bring it to life.",
  homeQuote:
    "When you buy a Vijaylakshmi saree, you are not just wearing fabric — you are wearing someone's story.",
  homeCtaLabel: "Read Our Story",
};

/** Setting key for each simple text field. */
export const ABOUT_TEXT_KEYS = {
  heroEyebrow:    "about_hero_eyebrow",
  heroTitle:      "about_hero_title",
  heroSubtitle:   "about_hero_subtitle",
  storyHeading:   "about_story_heading",
  storyBody:      "about_story_body",
  valuesEyebrow:  "about_values_eyebrow",
  valuesHeading:  "about_values_heading",
  officesEyebrow: "about_offices_eyebrow",
  officesHeading: "about_offices_heading",
  ctaHeading:     "about_cta_heading",
  ctaText:        "about_cta_text",
  homeEyebrow:    "about_home_eyebrow",
  homeHeading:    "about_home_heading",
  homeBody:       "about_home_body",
  homeQuote:      "about_home_quote",
  homeCtaLabel:   "about_home_cta_label",
} as const;

export const ABOUT_VALUES_KEY  = "about_values_json";
export const ABOUT_OFFICES_KEY = "about_offices_json";

function parseJson<T>(raw: string | undefined, fallback: T, validate: (v: any) => boolean): T {
  if (!raw?.trim()) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return validate(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function getAboutContent(): Promise<AboutContent> {
  const keys = [
    ...Object.values(ABOUT_TEXT_KEYS),
    ABOUT_VALUES_KEY,
    ABOUT_OFFICES_KEY,
  ];

  const rows = await db.siteSetting
    .findMany({ where: { key: { in: keys } } })
    .catch(() => [] as { key: string; value: string }[]);

  const s: Record<string, string> = {};
  rows.forEach((r) => { s[r.key] = r.value; });

  const text = (field: keyof typeof ABOUT_TEXT_KEYS) =>
    s[ABOUT_TEXT_KEYS[field]]?.trim() || ABOUT_DEFAULTS[field];

  return {
    heroEyebrow:    text("heroEyebrow"),
    heroTitle:      text("heroTitle"),
    heroSubtitle:   text("heroSubtitle"),
    storyHeading:   text("storyHeading"),
    storyBody:      text("storyBody"),
    valuesEyebrow:  text("valuesEyebrow"),
    valuesHeading:  text("valuesHeading"),
    officesEyebrow: text("officesEyebrow"),
    officesHeading: text("officesHeading"),
    ctaHeading:     text("ctaHeading"),
    ctaText:        text("ctaText"),
    homeEyebrow:    text("homeEyebrow"),
    homeHeading:    text("homeHeading"),
    homeBody:       text("homeBody"),
    homeQuote:      text("homeQuote"),
    homeCtaLabel:   text("homeCtaLabel"),
    values: parseJson<AboutValue[]>(
      s[ABOUT_VALUES_KEY], ABOUT_DEFAULTS.values,
      (v) => Array.isArray(v) && v.every((x) => x && typeof x.title === "string"),
    ),
    offices: parseJson<AboutOffice[]>(
      s[ABOUT_OFFICES_KEY], ABOUT_DEFAULTS.offices,
      (v) => Array.isArray(v) && v.every((x) => x && typeof x.label === "string" && Array.isArray(x.lines)),
    ),
  };
}
