export interface ThemeSettings {
  // ── Colors ────────────────────────────────────────────
  "color.primary": string;
  "color.primary.dark": string;
  "color.primary.light": string;
  "color.primary.50": string;
  "color.gold": string;
  "color.gold.light": string;
  "color.gold.dark": string;
  "color.ivory": string;
  "color.cream": string;
  "color.parchment": string;
  "color.sand": string;
  "color.text.primary": string;
  "color.text.secondary": string;
  "color.text.muted": string;
  "color.text.disabled": string;
  "color.text.inverse": string;
  "color.success": string;
  "color.success.bg": string;
  "color.error": string;
  "color.error.bg": string;
  "color.warning": string;
  "color.warning.bg": string;
  "color.border": string;

  // ── Typography: Font Families ──────────────────────────
  "font.heading": string;
  "font.body": string;
  "font.accent": string;

  // ── Typography: Font Sizes (px values stored as strings) ─
  "text.display": string;
  "text.h1": string;
  "text.h2": string;
  "text.h3": string;
  "text.h4": string;
  "text.h5": string;
  "text.body.xl": string;
  "text.body": string;
  "text.sm": string;
  "text.xs": string;
  "text.price": string;
  "text.price.sm": string;

  // ── Typography: Font Weights ───────────────────────────
  "weight.heading": string;
  "weight.subheading": string;
  "weight.body": string;
  "weight.label": string;

  // ── Line Heights ──────────────────────────────────────
  "leading.display": string;
  "leading.heading": string;
  "leading.body": string;

  // ── Letter Spacing ────────────────────────────────────
  "tracking.display": string;
  "tracking.heading": string;
  "tracking.label": string;

  // ── General ───────────────────────────────────────────
  "site.name": string;
  "site.tagline": string;
  "site.announcement": string;
  "site.announcement.active": string;
  "site.currency.symbol": string;
  "site.currency.code": string;
}

export type ThemeKey = keyof ThemeSettings;

export interface SettingMeta {
  key: ThemeKey;
  label: string;
  group: "colors" | "typography" | "sizing" | "general";
  type: "color" | "font-family" | "font-size" | "font-weight" | "line-height" | "letter-spacing" | "text" | "boolean" | "select";
  options?: { label: string; value: string }[];
  description?: string;
}
