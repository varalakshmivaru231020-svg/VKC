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
  storyImage: string;
  storyCaptionTop: string;
  storyCaptionBottom: string;
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
  heroEyebrow: "Mandya's Pride Since 1988",
  heroTitle: "Sweetness of Nature,\nStrength of Tradition.",
  heroSubtitle:
    "Pure, chemical-free jaggery and cane products from the sugarcane fields of Mandya, Karnataka.",
  storyHeading: "About Us",
  storyBody: [
    "VKC Gold delivers the purest form of natural sweetness, straight from the sugarcane fields of Mandya, Karnataka. Established in 1988, we are a natural food processing enterprise dedicated to chemical-free, healthy jaggery products.",
    "We work directly with local farmers on fair pricing, then combine traditional know-how with modern, eco-friendly machinery — sugarcane crushing, juice extraction, filtration, boiling and packaging — so that nothing is lost between the field and the finished product.",
    "Every product carries the same promise: no artificial colours, no artificial flavours, and no chemicals added. From pure jaggery cubes and natural powder to syrups, bars and festive gift hampers, we make natural sweetness part of everyday life.",
  ].join("\n\n"),
  // No default image: the only one we had was the previous brand's. SmartImage
  // shows a neutral placeholder for an empty src, which is better than a photo
  // that belongs to another business. Admin → Settings uploads the real one.
  storyImage: "",
  storyCaptionTop: "100% Natural",
  storyCaptionBottom: "No chemicals, ever",
  valuesEyebrow: "What We Stand For",
  valuesHeading: "Our Values",
  values: [
    {
      icon: "Heart",
      title: "Support to Local Farmers",
      desc: "We empower rural communities around Mandya with fair pricing, buying cane directly from the farmers who grow it.",
    },
    {
      icon: "ShieldCheck",
      title: "Purity and Quality First",
      desc: "100% natural production with no preservatives, no artificial colours or flavours, and no chemicals added at any stage.",
    },
    {
      icon: "Sparkles",
      title: "Innovation with Tradition",
      desc: "Time-honoured jaggery-making combined with modern machinery and hygienic processing, for consistent quality in every batch.",
    },
    {
      icon: "Globe2",
      title: "Sustainable Growth",
      desc: "Eco-friendly manufacturing that reduces waste, as we grow towards becoming a trusted global brand for Mandya's sweetness.",
    },
  ],
  officesEyebrow: "Reach Us",
  officesHeading: "Contact & Registered Offices",
  offices: [
    {
      label: "Registered Office",
      name: "VKC Cane Gold Foods Pvt. Ltd.",
      lines: [
        "Ballenahalli Village",
        "Srirangapatna Taluk",
        "Mandya District",
        "Karnataka – 571807",
      ],
    },
  ],
  ctaHeading: "Taste the Difference",
  ctaText:
    "Browse our range of chemical-free jaggery products — made with care, from cane grown by farmers we know by name.",
  homeEyebrow: "Our Heritage",
  homeHeading: "Rooted in\nMandya Since 1988",
  homeBody:
    "Every VKC Gold product begins in the sugarcane fields of Mandya, with farmers we have worked alongside for decades. We pay fairly, process without chemicals, and let the cane speak for itself. Each batch is more than a sweetener — it is the taste of a district that has grown cane for generations.",
  homeQuote:
    "When you choose VKC Gold, you are not just choosing sweetness — you are supporting the farmer who grew it.",
  homeCtaLabel: "Read Our Story",
};

/** Setting key for each simple text field. */
export const ABOUT_TEXT_KEYS = {
  heroEyebrow:    "about_hero_eyebrow",
  heroTitle:      "about_hero_title",
  heroSubtitle:   "about_hero_subtitle",
  storyHeading:   "about_story_heading",
  storyBody:      "about_story_body",
  storyImage:     "about_story_image",
  storyCaptionTop:    "about_story_caption_top",
  storyCaptionBottom: "about_story_caption_bottom",
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
    storyImage:     text("storyImage"),
    storyCaptionTop:    text("storyCaptionTop"),
    storyCaptionBottom: text("storyCaptionBottom"),
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
