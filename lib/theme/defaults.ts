import type { ThemeSettings, SettingMeta } from "./types";

export const DEFAULT_THEME: ThemeSettings = {
  // ── Colors ────────────────────────────────────────────
  "color.primary":        "#8B1A2E",
  "color.primary.dark":   "#5E1020",
  "color.primary.light":  "#B5293F",
  "color.primary.50":     "#FDF0F2",
  "color.gold":           "#C4922A",
  "color.gold.light":     "#E8C97A",
  "color.gold.dark":      "#8B6318",
  "color.ivory":          "#FBF8F3",
  "color.cream":          "#F2EBE0",
  "color.parchment":      "#E8DDD0",
  "color.sand":           "#C9BAA8",
  "color.text.primary":   "#1C1410",
  "color.text.secondary": "#4A3F38",
  "color.text.muted":     "#8A7B72",
  "color.text.disabled":  "#BEB3AC",
  "color.text.inverse":   "#FBF8F3",
  "color.success":        "#2E6B47",
  "color.success.bg":     "#EDF7F2",
  "color.error":          "#C42B2B",
  "color.error.bg":       "#FEF0F0",
  "color.warning":        "#C47A2B",
  "color.warning.bg":     "#FEF5E7",
  "color.border":         "#E8DDD0",

  // ── Font Families ─────────────────────────────────────
  "font.heading": "'Cormorant Garamond', Georgia, serif",
  "font.body":    "'Inter', system-ui, sans-serif",
  "font.accent":  "'Cormorant Garamond', Georgia, serif",

  // ── Font Sizes ────────────────────────────────────────
  "text.display":  "clamp(4rem, 8vw, 7rem)",
  "text.h1":       "clamp(2.25rem, 4.5vw, 3.75rem)",
  "text.h2":       "clamp(1.875rem, 3.5vw, 2.875rem)",
  "text.h3":       "2rem",
  "text.h4":       "1.5rem",
  "text.h5":       "1.25rem",
  "text.body.xl":  "1.25rem",
  "text.body":     "1.0625rem",
  "text.sm":       "0.9375rem",
  "text.xs":       "0.8125rem",
  "text.price":    "1.75rem",
  "text.price.sm": "1.3125rem",

  // ── Font Weights ──────────────────────────────────────
  "weight.heading":    "500",
  "weight.subheading": "600",
  "weight.body":       "400",
  "weight.label":      "600",

  // ── Line Heights ──────────────────────────────────────
  "leading.display": "1.1",
  "leading.heading": "1.2",
  "leading.body":    "1.65",

  // ── Letter Spacing ────────────────────────────────────
  "tracking.display": "-0.02em",
  "tracking.heading": "-0.01em",
  "tracking.label":   "0.08em",

  // ── General ───────────────────────────────────────────
  "site.name":                "Vijaylakshmi Sarees",
  "site.tagline":             "Timeless Weaves. Modern Souls.",
  "site.announcement":        "Free shipping on orders above ₹2,999 · New Arrivals: Kanjivaram Collection",
  "site.announcement.active": "true",
  "site.currency.symbol":     "₹",
  "site.currency.code":       "INR",
};

/** CSS custom property name for a theme key */
export function toCssVar(key: string): string {
  return "--" + key.replace(/\./g, "-");
}

/** Build the inline <style> block from theme settings */
export function buildThemeStyle(settings: Partial<ThemeSettings>): string {
  const merged = { ...DEFAULT_THEME, ...settings };
  const lines = Object.entries(merged)
    .filter(([k]) => !k.startsWith("site."))
    .map(([k, v]) => `  ${toCssVar(k)}: ${v};`);
  return `:root {\n${lines.join("\n")}\n}`;
}

/** Full metadata registry — drives the admin UI */
export const SETTING_METAS: SettingMeta[] = [
  // ── Colors ──────────────────────────────────────────────
  { key: "color.primary",        label: "Primary Brand Color",    group: "colors", type: "color", description: "Main brand color — buttons, links, accents" },
  { key: "color.primary.dark",   label: "Primary Dark",          group: "colors", type: "color", description: "Hover/pressed state of primary" },
  { key: "color.primary.light",  label: "Primary Light",         group: "colors", type: "color", description: "Active/highlight variant of primary" },
  { key: "color.primary.50",     label: "Primary Tint (bg)",     group: "colors", type: "color", description: "Very light tint for hover backgrounds" },
  { key: "color.gold",           label: "Gold / Accent",         group: "colors", type: "color", description: "Accent color — borders, icons, highlights" },
  { key: "color.gold.light",     label: "Gold Light",            group: "colors", type: "color", description: "Lighter gold — shimmer, selected swatches" },
  { key: "color.gold.dark",      label: "Gold Dark",             group: "colors", type: "color", description: "Darker gold for text on light gold bg" },
  { key: "color.ivory",          label: "Page Background",       group: "colors", type: "color", description: "Main page background" },
  { key: "color.cream",          label: "Section Background",    group: "colors", type: "color", description: "Alternate section background" },
  { key: "color.parchment",      label: "Card Border / Divider", group: "colors", type: "color", description: "Card borders and horizontal dividers" },
  { key: "color.text.primary",   label: "Text Primary",          group: "colors", type: "color", description: "Main body text" },
  { key: "color.text.secondary", label: "Text Secondary",        group: "colors", type: "color", description: "Supporting text" },
  { key: "color.text.muted",     label: "Text Muted",            group: "colors", type: "color", description: "Captions, labels, placeholders" },
  { key: "color.success",        label: "Success Green",         group: "colors", type: "color", description: "In-stock, success messages" },
  { key: "color.error",          label: "Error Red",             group: "colors", type: "color", description: "Error states, out of stock" },
  { key: "color.warning",        label: "Warning Amber",         group: "colors", type: "color", description: "Low stock, cautionary states" },
  { key: "color.border",         label: "Default Border",        group: "colors", type: "color" },

  // ── Typography: Fonts ────────────────────────────────────
  {
    key: "font.heading", label: "Heading Font", group: "typography", type: "font-family",
    description: "Used for all headings H1–H5, product names, display text",
    options: [
      { label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif" },
      { label: "Playfair Display",   value: "'Playfair Display', Georgia, serif" },
      { label: "DM Serif Display",   value: "'DM Serif Display', Georgia, serif" },
      { label: "Libre Baskerville",  value: "'Libre Baskerville', Georgia, serif" },
      { label: "EB Garamond",        value: "'EB Garamond', Georgia, serif" },
      { label: "Bodoni Moda",        value: "'Bodoni Moda', Georgia, serif" },
      { label: "Crimson Text",       value: "'Crimson Text', Georgia, serif" },
      { label: "Josefin Sans",       value: "'Josefin Sans', system-ui, sans-serif" },
      { label: "Raleway",            value: "'Raleway', system-ui, sans-serif" },
    ],
  },
  {
    key: "font.body", label: "Body / UI Font", group: "typography", type: "font-family",
    description: "Used for body copy, buttons, inputs, navigation",
    options: [
      { label: "Inter",         value: "'Inter', system-ui, sans-serif" },
      { label: "DM Sans",       value: "'DM Sans', system-ui, sans-serif" },
      { label: "Nunito",        value: "'Nunito', system-ui, sans-serif" },
      { label: "Lato",          value: "'Lato', system-ui, sans-serif" },
      { label: "Poppins",       value: "'Poppins', system-ui, sans-serif" },
      { label: "Source Sans 3", value: "'Source Sans 3', system-ui, sans-serif" },
    ],
  },

  // ── Typography: Sizes ────────────────────────────────────
  { key: "text.display",  label: "Display / Hero Size", group: "typography", type: "font-size", description: "Hero headline size (uses clamp)" },
  { key: "text.h1",       label: "H1 Size",             group: "typography", type: "font-size" },
  { key: "text.h2",       label: "H2 Size",             group: "typography", type: "font-size" },
  { key: "text.h3",       label: "H3 Size",             group: "typography", type: "font-size" },
  { key: "text.h4",       label: "H4 Size",             group: "typography", type: "font-size" },
  { key: "text.h5",       label: "H5 Size",             group: "typography", type: "font-size" },
  { key: "text.body",     label: "Body Text Size",      group: "typography", type: "font-size" },
  { key: "text.sm",       label: "Small Text",          group: "typography", type: "font-size" },
  { key: "text.price",    label: "Price Display Size",  group: "typography", type: "font-size" },

  // ── Font Weights ─────────────────────────────────────────
  {
    key: "weight.heading", label: "Heading Font Weight", group: "typography", type: "select",
    options: [
      { label: "Light (300)",    value: "300" },
      { label: "Regular (400)",  value: "400" },
      { label: "Medium (500)",   value: "500" },
      { label: "SemiBold (600)", value: "600" },
      { label: "Bold (700)",     value: "700" },
    ],
  },
  {
    key: "weight.body", label: "Body Font Weight", group: "typography", type: "select",
    options: [
      { label: "Light (300)",   value: "300" },
      { label: "Regular (400)", value: "400" },
      { label: "Medium (500)",  value: "500" },
    ],
  },

  // ── General ──────────────────────────────────────────────
  { key: "site.name",                label: "Store Name",           group: "general", type: "text" },
  { key: "site.tagline",             label: "Store Tagline",        group: "general", type: "text" },
  { key: "site.announcement",        label: "Announcement Bar Text",group: "general", type: "text" },
  { key: "site.announcement.active", label: "Show Announcement Bar",group: "general", type: "boolean" },
  { key: "site.currency.symbol",     label: "Currency Symbol",      group: "general", type: "text" },
  { key: "site.currency.code",       label: "Currency Code",        group: "general", type: "text" },
];
