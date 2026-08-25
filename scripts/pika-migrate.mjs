// Add the Pika identity column, over whichever transport works.
//
// `prisma migrate` needs port 5432, which is blocked on the owner's network, so
// this mirrors scripts/flows.mjs and falls back to Neon over HTTPS. Idempotent:
// safe to re-run, and safe to run before the matching deploy.
import { PrismaClient } from "@prisma/client";

async function connect() {
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRawUnsafe("select 1");
    return { via: "postgres on 5432", q: (t, p = []) => prisma.$queryRawUnsafe(t, ...p), close: () => prisma.$disconnect() };
  } catch {
    await prisma.$disconnect().catch(() => {});
  }
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  await sql.query("select 1");
  return { via: "neon over https (5432 is blocked on this network)", q: (t, p = []) => sql.query(t, p), close: async () => {} };
}

const db = await connect();
console.log(`· connected via ${db.via}\n`);
try {
  await db.q(`alter table "User" add column if not exists "pikaSubject" text`);
  // Badges: the admin's own rewards. Same shape as Pal's collection items so
  // they can be mirrored there later rather than becoming a rival system.
  await db.q(`create table if not exists "Badge" (
    "id" text primary key,
    "name" text not null,
    "image" text not null,
    "description" text not null default '',
    "createdAt" timestamp(3) not null default current_timestamp
  )`);
  await db.q(`create table if not exists "BadgeAward" (
    "id" text primary key,
    "badgeId" text not null references "Badge"("id") on delete cascade,
    "userId" text not null references "User"("id") on delete cascade,
    "note" text not null default '',
    "createdAt" timestamp(3) not null default current_timestamp
  )`);
  await db.q(`create unique index if not exists "BadgeAward_badgeId_userId_key" on "BadgeAward" ("badgeId", "userId")`);
  await db.q(`create index if not exists "BadgeAward_userId_createdAt_idx" on "BadgeAward" ("userId", "createdAt")`);
  await db.q(`create unique index if not exists "User_pikaSubject_key" on "User" ("pikaSubject")`);
  const rows = await db.q(
    `select column_name from information_schema.columns where table_name = 'User' and column_name = 'pikaSubject'`,
  );
  const found = Array.isArray(rows) ? rows.length : (rows?.rows?.length ?? 0);
  const tRes = await db.q(
    `select table_name from information_schema.tables where table_name in ('Badge','BadgeAward')`);
  const tables = Array.isArray(tRes) ? tRes : tRes?.rows || [];
  console.log(found ? "✓ User.pikaSubject present, unique index in place" : "✗ column still missing");
  console.log(`${tables.length === 2 ? "✓" : "✗"} badge tables: ${tables.map((t) => t.table_name).join(", ") || "none"}`);
  process.exitCode = found ? 0 : 1;
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
await db.close();
