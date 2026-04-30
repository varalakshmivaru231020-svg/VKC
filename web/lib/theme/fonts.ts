export interface FontOption {
  name: string;
  value: string;
  category: "serif" | "sans-serif" | "display";
  googleFamily: string; // URL-safe family name for Google Fonts
  weights: string;      // weights param e.g. "300;400;500;600;700"
  italic?: boolean;
  preview: string;      // preview sentence
}

export const HEADING_FONTS: FontOption[] = [
  {
    name: "Cormorant Garamond",
    value: "'Cormorant Garamond', Georgia, serif",
    category: "serif",
    googleFamily: "Cormorant+Garamond",
    weights: "ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500",
    italic: true,
    preview: "The Art of Silk Weaving",
  },
  {
    name: "Playfair Display",
    value: "'Playfair Display', Georgia, serif",
    category: "serif",
    googleFamily: "Playfair+Display",
    weights: "ital,wght@0,400;0,500;0,600;0,700;1,400",
    italic: true,
    preview: "The Art of Silk Weaving",
  },
  {
    name: "DM Serif Display",
    value: "'DM Serif Display', Georgia, serif",
    category: "serif",
    googleFamily: "DM+Serif+Display",
    weights: "ital,wght@0,400;1,400",
    italic: true,
    preview: "The Art of Silk Weaving",
  },
  {
    name: "Libre Baskerville",
    value: "'Libre Baskerville', Georgia, serif",
    category: "serif",
    googleFamily: "Libre+Baskerville",
    weights: "ital,wght@0,400;0,700;1,400",
    italic: true,
    preview: "The Art of Silk Weaving",
  },
  {
    name: "EB Garamond",
    value: "'EB Garamond', Georgia, serif",
    category: "serif",
    googleFamily: "EB+Garamond",
    weights: "ital,wght@0,400;0,500;0,600;0,700;1,400",
    italic: true,
    preview: "The Art of Silk Weaving",
  },
  {
    name: "Bodoni Moda",
    value: "'Bodoni Moda', Georgia, serif",
    category: "serif",
    googleFamily: "Bodoni+Moda",
    weights: "ital,wght@0,400;0,500;0,700;1,400",
    italic: true,
    preview: "The Art of Silk Weaving",
  },
  {
    name: "Crimson Text",
    value: "'Crimson Text', Georgia, serif",
    category: "serif",
    googleFamily: "Crimson+Text",
    weights: "ital,wght@0,400;0,600;1,400",
    italic: true,
    preview: "The Art of Silk Weaving",
  },
  {
    name: "Josefin Sans",
    value: "'Josefin Sans', system-ui, sans-serif",
    category: "sans-serif",
    googleFamily: "Josefin+Sans",
    weights: "wght@300;400;600;700",
    preview: "The Art of Silk Weaving",
  },
  {
    name: "Raleway",
    value: "'Raleway', system-ui, sans-serif",
    category: "sans-serif",
    googleFamily: "Raleway",
    weights: "wght@300;400;500;600;700",
    preview: "The Art of Silk Weaving",
  },
];

export const BODY_FONTS: FontOption[] = [
  {
    name: "Inter",
    value: "'Inter', system-ui, sans-serif",
    category: "sans-serif",
    googleFamily: "Inter",
    weights: "wght@300;400;500;600;700",
    preview: "Discover our curated collection of handwoven sarees from across India.",
  },
  {
    name: "DM Sans",
    value: "'DM Sans', system-ui, sans-serif",
    category: "sans-serif",
    googleFamily: "DM+Sans",
    weights: "wght@300;400;500;600;700",
    preview: "Discover our curated collection of handwoven sarees from across India.",
  },
  {
    name: "Nunito",
    value: "'Nunito', system-ui, sans-serif",
    category: "sans-serif",
    googleFamily: "Nunito",
    weights: "wght@300;400;500;600;700",
    preview: "Discover our curated collection of handwoven sarees from across India.",
  },
  {
    name: "Lato",
    value: "'Lato', system-ui, sans-serif",
    category: "sans-serif",
    googleFamily: "Lato",
    weights: "wght@300;400;700",
    preview: "Discover our curated collection of handwoven sarees from across India.",
  },
  {
    name: "Poppins",
    value: "'Poppins', system-ui, sans-serif",
    category: "sans-serif",
    googleFamily: "Poppins",
    weights: "wght@300;400;500;600;700",
    preview: "Discover our curated collection of handwoven sarees from across India.",
  },
  {
    name: "Source Sans 3",
    value: "'Source Sans 3', system-ui, sans-serif",
    category: "sans-serif",
    googleFamily: "Source+Sans+3",
    weights: "wght@300;400;500;600;700",
    preview: "Discover our curated collection of handwoven sarees from across India.",
  },
];

/** Build a single Google Fonts URL that loads all selected fonts */
export function buildGoogleFontsUrl(headingFont: string, bodyFont: string): string {
  const findHeading = HEADING_FONTS.find((f) => f.value === headingFont);
  const findBody = BODY_FONTS.find((f) => f.value === bodyFont);

  const families: string[] = [];
  if (findHeading) families.push(`family=${findHeading.googleFamily}:${findHeading.weights}`);
  if (findBody && findBody.googleFamily !== findHeading?.googleFamily) {
    families.push(`family=${findBody.googleFamily}:${findBody.weights}`);
  }
  if (families.length === 0) return "";
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

/** Build a URL that loads ALL available fonts for the admin preview */
export function buildAllFontsUrl(): string {
  const all = [...HEADING_FONTS, ...BODY_FONTS];
  const seen = new Set<string>();
  const families: string[] = [];
  for (const f of all) {
    if (!seen.has(f.googleFamily)) {
      seen.add(f.googleFamily);
      families.push(`family=${f.googleFamily}:${f.weights}`);
    }
  }
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
