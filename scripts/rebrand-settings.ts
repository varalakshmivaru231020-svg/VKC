/**
 * Rebrand the admin-editable settings held in the database.
 *
 * The code defaults in lib/theme/defaults.ts only apply to keys that have no
 * row in site_settings — getThemeSettings() does `{ ...DEFAULT_THEME, ...fromDb }`,
 * so any row present WINS over the default. A saved "Store Name" therefore keeps
 * showing the old brand on the live site no matter what the code says.
 *
 * Dry run (prints what would change, touches nothing):
 *   npx tsx scripts/rebrand-settings.ts
 * Apply:
 *   npx tsx scripts/rebrand-settings.ts --apply
 */
import { db } from "../lib/db";

/** Longest-first, so "Vijaylakshmi Sarees" is never eaten by "Vijaylakshmi". */
const RULES: Array<[RegExp, string]> = [
  // Upload paths first: the plain-text rules below would turn a stored
  // "/uploads/Vijaylakshmi.png" into "/uploads/VKC Gold.png", a file that does
  // not exist. Clear it instead and let the admin upload the new brand's image.
  [/^\/uploads\/Vijaylakshmi\.png$/g, ""],
  [/Anjali['\u2019]s Vijaylakshmi Sarees/g, "VKC Gold"],
  [/Vijaylakshmi Sarees/g,                  "VKC Gold"],
  [/VIJAYLAKSHMI SAREES/g,                  "VKC GOLD"],
  [/VIJAYLAKSHMI/g,                         "VKC GOLD"],
  [/Vijaylakshmi/g,                         "VKC Gold"],
  [/vijaylakshmisarees\.com/g,              "vkcgoldikshu.com"],
  [/@vijaylakshmi\.in/g,                    "@vkcgoldikshu.com"],
];

function rebrand(value: string): string {
  return RULES.reduce((acc, [re, to]) => acc.replace(re, to), value);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const rows = await db.siteSetting.findMany();

  const changes = rows
    .map((r) => ({ key: r.key, from: r.value, to: rebrand(r.value) }))
    .filter((c) => c.from !== c.to);

  if (changes.length === 0) {
    console.log("Nothing to rebrand — no setting contains the old brand or domain.");
    return;
  }

  console.log(`${changes.length} setting(s) ${apply ? "updated" : "would change"}:\n`);
  for (const c of changes) {
    console.log(`  ${c.key}`);
    console.log(`    - ${c.from}`);
    console.log(`    + ${c.to}\n`);
    if (apply) {
      await db.siteSetting.update({ where: { key: c.key }, data: { value: c.to } });
    }
  }

  if (!apply) console.log("Dry run — re-run with --apply to write these.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
