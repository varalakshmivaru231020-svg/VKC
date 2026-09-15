/**
 * Create the `newsletter_subscribers` table (additive, idempotent). Run on
 * the server after deploying the NewsletterSubscriber model:
 *
 *   node scripts/create-newsletter-table.cjs
 *
 * Mirrors prisma/schema.prisma `model NewsletterSubscriber`. Raw SQL because
 * this project reconciles the production DB with additive scripts rather
 * than `prisma migrate deploy` (see scripts/sync-schema.sql).
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

const SQL = [
  `CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
     "id"        TEXT PRIMARY KEY,
     "email"     VARCHAR(200) NOT NULL,
     "source"    VARCHAR(40) NOT NULL DEFAULT 'website',
     "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_email_key" ON "newsletter_subscribers" ("email")`,
];

(async () => {
  for (const stmt of SQL) await db.$executeRawUnsafe(stmt);
  const n = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "newsletter_subscribers"`);
  console.log(`newsletter_subscribers table ready (${n[0].n} rows)`);
  await db.$disconnect();
})().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
