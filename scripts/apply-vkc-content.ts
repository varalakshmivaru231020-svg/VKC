/**
 * Load VKC Cane Gold's real business details into site_settings.
 *
 * The Contact page and the store/brand strings are database-driven — the code
 * defaults only apply where no row exists, and the Contact page deliberately has
 * no fallbacks at all (it shows nothing rather than a wrong number). So the
 * front-end rebrand is not visible until these rows are set.
 *
 * Values below are taken from https://vkccanegold.com (about / contact pages).
 *
 * Dry run (prints what would change, touches nothing):
 *   npx tsx scripts/apply-vkc-content.ts
 * Apply:
 *   npx tsx scripts/apply-vkc-content.ts --apply
 */
import { db } from "../lib/db";

type Meta = { label: string; group: string; type: string };

const SETTINGS: Array<{ key: string; value: string; meta: Meta }> = [
  // ── Brand ──
  { key: "site.name",         value: "VKC Gold",
    meta: { label: "Store Name", group: "general", type: "text" } },
  { key: "site.tagline",      value: "Sweetness of Nature, Strength of Tradition.",
    meta: { label: "Store Tagline", group: "general", type: "text" } },
  { key: "site.announcement", value: "Free shipping all over India · 100% natural, chemical-free jaggery",
    meta: { label: "Announcement Text", group: "general", type: "text" } },
  { key: "store_name",        value: "VKC Gold",
    meta: { label: "Store Name", group: "general", type: "text" } },

  // ── Contact (drives /contact, the footer and the invoice) ──
  { key: "store_phone",   value: "+91 95916 08382",
    meta: { label: "Store Phone", group: "general", type: "text" } },
  { key: "store_email",   value: "info@vkccanegold.co.in",
    meta: { label: "Store Email", group: "general", type: "text" } },
  { key: "store_address", value: "Ballenahalli Village, Srirangapatna Taluk",
    meta: { label: "Store Address", group: "general", type: "text" } },
  { key: "store_city",    value: "Mandya District, Karnataka – 571807",
    meta: { label: "Store City", group: "general", type: "text" } },
  { key: "whatsapp_number", value: "919591608382",
    meta: { label: "WhatsApp Number", group: "general", type: "text" } },

  // ── SEO ──
  { key: "meta_title",       value: "VKC Gold — 100% Natural Jaggery & Cane Products",
    meta: { label: "Meta Title", group: "general", type: "text" } },
  { key: "meta_description", value:
      "Pure, chemical-free jaggery, syrups, bars and gift boxes made in Mandya, Karnataka. Farmer-focused and 100% natural since 1988.",
    meta: { label: "Meta Description", group: "general", type: "text" } },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const existing = await db.siteSetting.findMany({
    where: { key: { in: SETTINGS.map((s) => s.key) } },
  });
  const current = new Map(existing.map((r) => [r.key, r.value]));

  const changes = SETTINGS.filter((s) => current.get(s.key) !== s.value);

  if (changes.length === 0) {
    console.log("All settings already match — nothing to do.");
    return;
  }

  console.log(`${changes.length} setting(s) ${apply ? "written" : "would change"}:\n`);
  for (const c of changes) {
    console.log(`  ${c.key}`);
    console.log(`    - ${current.get(c.key) ?? "(not set)"}`);
    console.log(`    + ${c.value}\n`);
    if (apply) {
      await db.siteSetting.upsert({
        where:  { key: c.key },
        update: { value: c.value },
        create: { key: c.key, value: c.value, ...c.meta },
      });
    }
  }

  if (!apply) console.log("Dry run — re-run with --apply to write these.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
