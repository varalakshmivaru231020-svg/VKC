/**
 * Create the `testimonials` table (additive, idempotent). Run on the server
 * after deploying the Testimonial model:
 *
 *   node scripts/create-testimonials-table.cjs
 *
 * Mirrors prisma/schema.prisma `model Testimonial`. Kept as raw SQL because
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
  `CREATE TABLE IF NOT EXISTS "testimonials" (
     "id"        TEXT PRIMARY KEY,
     "name"      VARCHAR(120) NOT NULL,
     "location"  VARCHAR(120),
     "tag"       VARCHAR(80),
     "rating"    INTEGER NOT NULL DEFAULT 5,
     "quote"     TEXT NOT NULL,
     "avatarUrl" VARCHAR(500),
     "sortOrder" INTEGER NOT NULL DEFAULT 0,
     "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS "testimonials_isActive_sortOrder_idx" ON "testimonials" ("isActive", "sortOrder")`,
];

(async () => {
  for (const stmt of SQL) await db.$executeRawUnsafe(stmt);
  const n = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "testimonials"`);
  console.log(`testimonials table ready (${n[0].n} rows)`);
  await db.$disconnect();
})().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
