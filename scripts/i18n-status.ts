// What is ACTUALLY translated, measured against the lessons as they stand today.
//
// WHY THIS EXISTS. scripts/i18n-coverage.ts answers "how much is there to
// translate" by walking the flow. It cannot answer "how much of it is done",
// because that lives in the database — and the gap between those two questions
// hid a real bug for months.
//
// Translations are stored keyed by STEP ID. Rewrite a lesson and its steps get
// new ids, so every translation for it silently stops matching: the rows are
// still there, a naive count still reports them, and the student sees English.
// Lesson 2.1 had four Simplified Chinese entries and zero of them matched.
//
// So this counts OVERLAP, not presence, and names the orphans.
//
//   npx tsx scripts/i18n-status.ts            # per-locale summary
//   npx tsx scripts/i18n-status.ts --lessons  # also list incomplete lessons
import { PrismaClient } from "@prisma/client";

type Step = { id: string };
const detail = process.argv.includes("--lessons");

async function rows() {
  const prisma = new PrismaClient();
  try {
    return await prisma.$queryRawUnsafe<any[]>(
      `select l.code, l.flow, l."flowI18n" from "Lesson" l
         join "Chapter" c on c.id = l."chapterId"
        where c.title not like '\\_\\_%' order by c."order", l."order"`
    );
  } catch {
    // Same fallback as flows.mjs: 5432 is blocked on some networks, 443 is not.
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);
    return (await sql.query(
      `select l.code, l.flow, l."flowI18n" from "Lesson" l
         join "Chapter" c on c.id = l."chapterId"
        where c.title not like '\\_\\_%' order by c."order", l."order"`
    )) as any[];
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

async function main() {
  const all = await rows();
  const per: Record<string, { matched: number; orphaned: number; full: number; partial: string[] }> = {};
  let lessons = 0;
  let steps = 0;

  for (const r of all) {
    const ids: string[] = ((r.flow?.steps as Step[]) || []).map((s) => s.id);
    if (!ids.length) continue;
    lessons++;
    steps += ids.length;
    for (const [loc, map] of Object.entries((r.flowI18n as Record<string, any>) || {})) {
      const keys = Object.keys(map || {});
      const hit = ids.filter((id) => keys.includes(id)).length;
      per[loc] ||= { matched: 0, orphaned: 0, full: 0, partial: [] };
      per[loc].matched += hit;
      per[loc].orphaned += keys.filter((k) => !ids.includes(k)).length;
      if (hit === ids.length) per[loc].full++;
      else per[loc].partial.push(`${r.code}(${hit}/${ids.length})`);
    }
  }

  console.log(`${lessons} lessons, ${steps} steps\n`);
  console.log("locale     translated      complete   orphaned");
  const sorted = Object.entries(per).sort((a, b) => b[1].matched - a[1].matched);
  for (const [loc, v] of sorted) {
    const pct = Math.round((v.matched / steps) * 100);
    const warn = v.orphaned ? `  ← ${v.orphaned} keys match no step` : "";
    console.log(
      `${loc.padEnd(10)} ${String(v.matched).padStart(4)}/${steps} ${String(pct).padStart(4)}%   ${String(v.full).padStart(2)}/${lessons}${warn}`
    );
  }
  if (detail) {
    for (const [loc, v] of sorted) {
      if (v.partial.length) console.log(`\n${loc} incomplete:\n  ${v.partial.join(" ")}`);
    }
  }
  console.log(
    "\nOrphaned keys mean a lesson was rewritten after being translated. Re-run that\n" +
      "locale at /admin/translate; the new pass overwrites them."
  );
}
main();
