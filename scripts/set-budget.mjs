// Raise or lower the daily AI spend cap.
//
// The cap lives in the Setting table and is read by lib/llm/index.ts. When
// today's spend crosses it, every paid lane is dropped and the offline stub
// answers instead — which is what silently killed a translation run.
//
//   node --env-file=.env scripts/set-budget.mjs 25
//
// Run with no argument to just report the current cap and today's spend.
import { PrismaClient } from "@prisma/client";

async function connect() {
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRawUnsafe("select 1");
    return { via: "postgres on 5432", q: (t, p = []) => prisma.$queryRawUnsafe(t, ...p), close: () => prisma.$disconnect() };
  } catch { await prisma.$disconnect().catch(() => {}); }
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  await sql.query("select 1");
  return { via: "neon over https", q: (t, p = []) => sql.query(t, p), close: async () => {} };
}
const rows = (r) => (Array.isArray(r) ? r : r?.rows || []);

const arg = process.argv[2];
const db = await connect();
try {
  const day = new Date().toISOString().slice(0, 10);
  const spent = rows(await db.q(`select coalesce(sum(cost),0)::float s from "AiCall" where "createdAt" >= $1`, [day + "T00:00:00.000Z"]))[0].s;
  const cur = rows(await db.q(`select value from "Setting" where key = 'budget'`))[0]?.value;
  const cap = cur?.dailyCapUsd ?? 5;
  console.log(`today: $${spent.toFixed(4)} spent · cap $${cap}${spent >= cap ? "  ← OVER, every call is being stubbed" : ""}`);

  if (arg === undefined) { console.log("\npass a number to change it, e.g. scripts/set-budget.mjs 25"); }
  else {
    const next = Number(arg);
    if (!Number.isFinite(next) || next < 0 || next > 500) { console.error("✗ give a number between 0 and 500"); process.exitCode = 2; }
    else {
      const merged = JSON.stringify({ ...(cur || {}), dailyCapUsd: next });
      await db.q(
        `insert into "Setting" (key, value) values ('budget', $1::jsonb)
         on conflict (key) do update set value = $1::jsonb`, [merged]);
      console.log(`✓ cap is now $${next} — ${spent >= next ? "STILL over" : "under, calls will go through"}`);
    }
  }
} catch (e) { console.error(e); process.exitCode = 1; }
await db.close();
