/**
 * Apply the amber & jaggery-gold brand palette to the live theme settings.
 *
 * The storefront reads colours from the SiteSetting table (Admin → Design) and
 * falls back to lib/theme/defaults.ts only for keys that are missing. Any colour
 * previously saved in admin would therefore keep overriding the new defaults, so
 * this script upserts every colour key with the brand values. Fonts, sizes and
 * general settings are left untouched.
 *
 *   node scripts/apply-amber-theme.cjs
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
  "color.primary":        ["#D9731A", "Primary Brand Color",    "Main brand color — buttons, links, accents"],
  "color.primary.dark":   ["#A8520A", "Primary Dark",           "Hover/pressed state of primary"],
  "color.primary.light":  ["#EE8B2F", "Primary Light",          "Active/highlight variant of primary"],
  "color.primary.50":     ["#FDF1E4", "Primary Tint (bg)",      "Very light tint for hover backgrounds"],
  "color.gold":           ["#F5B301", "Gold / Accent",          "Accent color — borders, icons, highlights"],
  "color.gold.light":     ["#FFD65C", "Gold Light",             "Lighter gold — shimmer, selected swatches"],
  "color.gold.dark":      ["#A66A00", "Gold Dark",              "Darker gold for text on light gold bg"],
  "color.ivory":          ["#FFFBF4", "Page Background",        "Main page background"],
  "color.cream":          ["#FBF1DE", "Section Background",     "Alternate section background"],
  "color.parchment":      ["#F0DCB6", "Card Border / Divider",  "Card borders and horizontal dividers"],
  "color.sand":           ["#D9B27A", "Sand",                   "Muted warm neutral"],
  "color.text.primary":   ["#2B1708", "Text Primary",           "Main body text"],
  "color.text.secondary": ["#5C3A1E", "Text Secondary",         "Supporting text"],
  "color.text.muted":     ["#8A6A4E", "Text Muted",             "Captions, labels, placeholders"],
  "color.text.disabled":  ["#C9B399", "Text Disabled",          "Disabled text"],
  "color.text.inverse":   ["#FFFBF4", "Text Inverse",           "Text on dark backgrounds"],
  "color.border":         ["#F0DCB6", "Border",                 "Default border colour"],
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
    console.log(`${key.padEnd(24)} ${value}  ${description}`);
  }
  console.log(`\n${n} colour settings applied.`);
  await db.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
