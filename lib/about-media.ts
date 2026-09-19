/**
 * Media slots for the About film (/about).
 *
 * Every photograph on the page is a named slot. A slot is filled, in order, by:
 *   1. An active banner in Admin → Banners at the slot's position — upload the
 *      real VKC photograph (or an .mp4/.webm for the hero) and it replaces the
 *      placeholder with no code change. "Mobile image" is used under 768px.
 *   2. The default below.
 *
 * Defaults marked `placeholder: true` are NOT VKC photographs. They are
 * documentary frames from Wikimedia Commons, chosen because most were taken
 * in Mandya district itself, and none shows an identifiable person. They must
 * be credited while in use (the page prints the credit line automatically)
 * and are meant to be replaced — see public/images/about/README.md.
 */

export interface AboutMediaSlot {
  /** Banner position in Admin → Banners. */
  position: string;
  /** Label shown in the admin position picker. */
  adminLabel: string;
  src: string;
  alt: string;
  /** Documentary caption printed beside the frame; dropped once replaced. */
  caption?: string;
  placeholder: boolean;
  credit?: { author: string; licence: string; source: string };
  /** What the real VKC photograph should show. */
  brief: string;
}

const COMMONS = "https://commons.wikimedia.org/wiki/File:";

export const ABOUT_MEDIA = {
  hero: {
    position: "about_hero",
    adminLabel: "About film — 00 Hero (image, or .mp4/.webm video)",
    src: "/images/about/cane-field-srirangapatna.webp",
    alt: "A standing sugarcane field in Srirangapatna, Mandya district",
    caption: "Sugarcane, Srirangapatna — Mandya district",
    placeholder: true,
    credit: { author: "Timothy A. Gonsalves", licence: "CC BY-SA 4.0", source: `${COMMONS}Sugarcane_Field_Srirangapatna_Karnataka_Jul22_R16_06192.jpg` },
    brief: "VKC's own cane fields at golden hour, wide. A 10–20s silent loop (.mp4) is ideal; keep it under 6 MB.",
  },
  story: {
    position: "about_story",
    adminLabel: "About film — 01 The Story (tall inset)",
    src: "/images/about/cane-stalks.webp",
    alt: "Ripe sugarcane stalks, close",
    placeholder: true,
    credit: { author: "Captain Raju", licence: "CC0", source: `${COMMONS}Sugarcane_in_2021.01.jpg` },
    brief: "A tall, close frame of cane — stalks, leaves or cut ends. Portrait orientation.",
  },
  year1988: {
    position: "about_1988",
    adminLabel: "About film — 02 1988 (full screen)",
    src: "/images/about/ikshu-cane-sky.webp",
    alt: "Sugarcane against an evening sky",
    placeholder: true,
    credit: { author: "Dinesh Valke", licence: "CC BY-SA 2.0", source: `${COMMONS}Ikshu_(Sanskrit-_%E0%A4%87%E0%A4%95%E0%A5%8D%E0%A4%B7%E0%A5%81)_(4396779315).jpg` },
    brief: "An archive photograph of the original Vairamudi Krupa Crusher or the family in the early years, if one exists. The number 1988 sits over it.",
  },
  mandya: {
    position: "about_mandya",
    adminLabel: "About film — 05 Mandya (full width)",
    src: "/images/about/fields-dusk-srirangapatna.webp",
    alt: "Irrigated fields at dusk near Srirangapatna, Mandya district",
    caption: "Fields at dusk near Srirangapatna",
    placeholder: true,
    credit: { author: "Deepak TL", licence: "CC BY-SA 4.0", source: `${COMMONS}Paddy_fields_near_Srirangapattana.jpg` },
    brief: "The landscape around the unit at Ballenahalli — wide, with sky. Cane fields preferred.",
  },
  farmer: {
    position: "about_farmer",
    adminLabel: "About film — 06 The Farmer",
    src: "/images/about/harvest-doddagowdana-koppalu.webp",
    alt: "A sugarcane harvest in Doddagowdana Koppalu, Mandya district",
    caption: "Harvest, Doddagowdana Koppalu — Mandya district",
    placeholder: true,
    credit: { author: "Timothy A. Gonsalves", licence: "CC BY-SA 4.0", source: `${COMMONS}Harvesting_Sugarcane_Doddagowdana_Koppalu_Aug24_A7CR_02231.jpg` },
    brief: "A farmer VKC actually buys from, photographed with their consent — hands, cane, soil, face. This is the most important photograph to replace.",
  },
  field: {
    position: "about_field",
    adminLabel: "About film — 09 Chapter 01 The Field",
    src: "/images/about/kaveri-mandya.webp",
    alt: "The Kaveri running past fields in Mandya",
    caption: "The Kaveri, Mandya",
    placeholder: true,
    credit: { author: "Timothy A. Gonsalves", licence: "CC BY-SA 4.0", source: `${COMMONS}Kaveri_Spate_Mandya_Karnataka_Jul24_A7CR_01964.jpg` },
    brief: "Growing cane in the field, landscape orientation.",
  },
  harvest: {
    position: "about_harvest",
    adminLabel: "About film — 09 Chapter 02 The Harvest",
    src: "/images/about/cane-stalks.webp",
    alt: "Ripe sugarcane stalks ready for cutting",
    placeholder: true,
    credit: { author: "Captain Raju", licence: "CC0", source: `${COMMONS}Sugarcane_in_2021.01.jpg` },
    brief: "Cane being cut, bundled or carted to the crusher. Portrait orientation.",
  },
  craft: {
    position: "about_craft",
    adminLabel: "About film — 09 Chapter 03 The Craft",
    src: "/images/about/jaggery-pan.webp",
    alt: "Cane juice boiling down to jaggery in an open pan",
    placeholder: true,
    credit: { author: "Accesscrawl", licence: "CC BY-SA 4.0", source: `${COMMONS}Traditional_Jaggery_making_in_India.jpg` },
    brief: "VKC's own pan, crusher or moulds at work — steam and colour. Landscape orientation.",
  },
  sweetness: {
    position: "about_sweetness",
    adminLabel: "About film — 09 Chapter 04 The Sweetness",
    // Filled at request time with the store's own hero product photograph.
    src: "",
    alt: "VKC Gold Ikshu jaggery products",
    placeholder: false,
    brief: "Finished VKC products, styled. Falls back to the home hero slide.",
  },
  future: {
    position: "about_future",
    adminLabel: "About film — 12 The Future (faint backdrop)",
    src: "/images/about/cane-field-srirangapatna.webp",
    alt: "",
    placeholder: true,
    credit: { author: "Timothy A. Gonsalves", licence: "CC BY-SA 4.0", source: `${COMMONS}Sugarcane_Field_Srirangapatna_Karnataka_Jul22_R16_06192.jpg` },
    brief: "Anything forward-looking: young cane, the site of the proposed unit, new machinery once it exists. It is shown very dark, behind type.",
  },
} as const satisfies Record<string, AboutMediaSlot>;

export type AboutSlotKey = keyof typeof ABOUT_MEDIA;

/** A slot as the page receives it: resolved URLs, and whether it is still a placeholder. */
export interface ResolvedMedia {
  src: string;
  mobileSrc: string | null;
  alt: string;
  caption: string | null;
  isVideo: boolean;
  placeholder: boolean;
  credit: { author: string; licence: string; source: string } | null;
}

export const ABOUT_BANNER_POSITIONS: Record<string, string> = Object.fromEntries(
  Object.values(ABOUT_MEDIA).map((s) => [s.position, s.adminLabel]),
);

const VIDEO = /\.(mp4|webm)(\?.*)?$/i;

export function resolveAboutMedia(
  key: AboutSlotKey,
  banner?: { imageUrl: string | null; mobileImageUrl: string | null; title: string } | null,
  fallbackSrc?: string | null,
): ResolvedMedia {
  const slot: AboutMediaSlot = ABOUT_MEDIA[key];
  if (banner?.imageUrl) {
    return {
      src: banner.imageUrl,
      mobileSrc: banner.mobileImageUrl,
      alt: banner.title || slot.alt,
      caption: null,
      isVideo: VIDEO.test(banner.imageUrl),
      placeholder: false,
      credit: null,
    };
  }
  return {
    src: slot.src || fallbackSrc || "",
    mobileSrc: null,
    alt: slot.alt,
    caption: slot.caption ?? null,
    isVideo: false,
    placeholder: slot.placeholder,
    credit: slot.placeholder ? slot.credit ?? null : null,
  };
}
