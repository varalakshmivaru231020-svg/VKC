/**
 * Create the push-notification tables (additive, idempotent). Run on the
 * server after deploying the DeviceToken and PushCampaign models:
 *
 *   node scripts/create-push-tables.cjs
 *
 * Mirrors prisma/schema.prisma. Raw SQL because this project reconciles the
 * production DB with additive scripts rather than `prisma migrate deploy`.
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
  `CREATE TABLE IF NOT EXISTS "device_tokens" (
     "id"         TEXT PRIMARY KEY,
     "token"      VARCHAR(512) NOT NULL,
     "platform"   VARCHAR(20) NOT NULL DEFAULT 'android',
     "userId"     TEXT,
     "appVersion" VARCHAR(40),
     "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "device_tokens_token_key" ON "device_tokens" ("token")`,
  `CREATE INDEX IF NOT EXISTS "device_tokens_userId_idx" ON "device_tokens" ("userId")`,
  `CREATE TABLE IF NOT EXISTS "push_campaigns" (
     "id"          TEXT PRIMARY KEY,
     "title"       VARCHAR(80) NOT NULL,
     "body"        VARCHAR(240) NOT NULL,
     "link"        VARCHAR(500),
     "sentCount"   INTEGER NOT NULL DEFAULT 0,
     "failedCount" INTEGER NOT NULL DEFAULT 0,
     "createdById" TEXT,
     "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
];

(async () => {
  for (const stmt of SQL) await db.$executeRawUnsafe(stmt);
  const n = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "device_tokens"`);
  console.log(`push tables ready (${n[0].n} devices)`);
  await db.$disconnect();
})().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
