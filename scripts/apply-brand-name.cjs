/**
 * Set the brand name shown by the storefront to "vkcgoldikshu".
 *
 * The header wordmark, footer, page titles and app config all read the site
 * name from the SiteSetting table (Admin → Design → General), which still held
 * the previous brand. Idempotent; run on the server after deploying:
 *
 *   node scripts/apply-brand-name.cjs
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

const SETTINGS = [
  ["site.name",    "vkcgoldikshu",                                  "Site Name",    "general", "text"],
  ["site.tagline", "Rooted in Legacy. Led with Purpose.",            "Tagline",      "general", "text"],
  ["store_name",   "vkcgoldikshu",                                  "Store Name",   "general", "text"],
];

(async () => {
  for (const [key, value, label, group, type] of SETTINGS) {
    await db.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value, label, group, type } });
    console.log(`${key.padEnd(14)} ${value}`);
  }
  await db.$disconnect();
})().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
