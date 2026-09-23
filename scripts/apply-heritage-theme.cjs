/**
 * Apply the "premium heritage" brand palette + fonts to the live theme settings.
 *
 * Replaces the orange/brown "jaggery amber" look with an ivory canvas, deep
 * brown typography, restrained metallic-gold accents, and a new restrained
 * royal-blue secondary accent (badges, footer, one heritage moment) —
 * matching the VKC Gold Ikshu logo's actual two-tone gold/blue identity
 * instead of only the gold half of it.
 *
 * The storefront reads colours/fonts from the SiteSetting table (Admin →
 * Design) and falls back to lib/theme/defaults.ts only for keys that are
 * missing. Any value previously saved in admin would therefore keep
 * overriding the new defaults, so this script upserts every key.
 *
 *   node scripts/apply-heritage-theme.cjs
 *
 * Idempotent — safe to re-run. Reads DATABASE_URL from the environment or .env.
 */
const fs = require("fs");
const path = require("path");

if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const PALETTE = {
  "color.primary":        ["#C99118", "Primary Brand Color",    "Main brand color — buttons, links, accents"],
  "color.primary.dark":   ["#9C700F", "Primary Dark",           "Hover/pressed state of primary"],
  "color.primary.light":  ["#DDA83B", "Primary Light",          "Active/highlight variant of primary"],
  "color.primary.50":     ["#FBF1DC", "Primary Tint (bg)",      "Very light tint for hover backgrounds"],
  "color.gold":           ["#C99118", "Gold / Accent",          "Accent color — borders, icons, highlights"],
  "color.gold.light":     ["#E4B958", "Gold Light",             "Lighter gold — shimmer, selected swatches"],
  "color.gold.dark":      ["#8F6A10", "Gold Dark",              "Darker gold for text on light gold bg"],
  "color.royal":          ["#063B70", "Royal Blue Accent",      "Restrained secondary accent — badges, footer, one heritage section"],
  "color.royal.dark":     ["#042A50", "Royal Blue Dark",        "Hover/pressed state of the royal blue accent"],
  "color.royal.light":    ["#E8EFF6", "Royal Blue Tint (bg)",   "Very light blue tint for badge backgrounds"],
  "color.ivory":          ["#FCFAF5", "Page Background",        "Main page background"],
  "color.cream":          ["#F7F0E3", "Section Background",     "Alternate section background"],
  "color.parchment":      ["#E9DCC3", "Card Border / Divider",  "Card borders and horizontal dividers"],
  "color.sand":           ["#D3BD98", "Sand",                   "Muted warm neutral"],
  "color.text.primary":   ["#241A12", "Text Primary",           "Main body text"],
  "color.text.secondary": ["#6F6255", "Text Secondary",         "Supporting text"],
  "color.text.muted":     ["#8F8171", "Text Muted",             "Captions, labels, placeholders"],
  "color.text.disabled":  ["#C7BBAA", "Text Disabled",          "Disabled text"],
  "color.text.inverse":   ["#FCFAF5", "Text Inverse",           "Text on dark backgrounds"],
  "color.border":         ["#E9DCC3", "Border",                 "Default border colour"],
};

const FONTS = {
  "font.heading": ["'DM Serif Display', Georgia, serif", "Heading Font"],
  "font.body":    ["'DM Sans', system-ui, sans-serif",   "Body / UI Font"],
  "font.accent":  ["'DM Serif Display', Georgia, serif", "Accent Font"],
};

(async () => {
  let n = 0;
  for (const [key, [value, label, description]] of Object.entries(PALETTE)) {
    await db.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, label, group: "colors", type: "color", sortOrder: n },
    });
    n++;
    console.log(`${key.padEnd(24)} ${value}  ${description || ""}`);
  }
  for (const [key, [value, label]] of Object.entries(FONTS)) {
    await db.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, label, group: "typography", type: "font-family", sortOrder: n },
    });
    n++;
    console.log(`${key.padEnd(24)} ${value}`);
  }
  console.log(`\n${n} theme settings applied.`);
  await db.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
