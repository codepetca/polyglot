// Lesson content backup — export every interactive flow to a versioned file,
// and restore it.
//
// WHY THIS EXISTS: lessons authored through the admin pipeline (/admin/authoring)
// live ONLY in the database. The early lessons have author-*.mjs scripts in the
// repo, but everything created the intended way from now on would have no copy
// anywhere — one bad `db push`, one wrong delete, and weeks of authored content
// is gone with no way to rebuild it. This keeps content in git, where it can be
// diffed and restored.
//
//   node --env-file=.env scripts/flows.mjs export    # DB → prisma/flows.json
//   node --env-file=.env scripts/flows.mjs seed      # create rows for new lessons
//   node --env-file=.env scripts/flows.mjs restore   # prisma/flows.json → DB
//   node --env-file=.env scripts/flows.mjs diff      # what would change
//
// Restore does NOT re-run compiler verification: everything in the file already
// passed it on the way in, and re-checking ~100 snippets over the network would
// be slow and flaky. Verification belongs at authoring time, which is where it is.
//
// TWO TRANSPORTS, ONE SET OF QUERIES. Postgres speaks on port 5432, and plenty
// of school and office networks silently swallow it — they accept the TCP
// connection so it *looks* open, then drop the traffic, so Prisma reports the
// database as unreachable when the database is perfectly fine. Neon also serves
// SQL over HTTPS on 443, which those networks do let through. So every query
// below is plain SQL with $1 placeholders, and connect() picks whichever pipe
// actually works. Anyone authoring a lesson from a locked-down network gets the
// HTTPS path automatically instead of a wall.

import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILE = "prisma/flows.json";

// Internal unit prefix -> the chapter it belongs to. Internal codes run one
// behind the student-facing ones (internal 5.x is the student's Unit 6), which
// is why this map is spelled out rather than computed.
const CHAPTERS = {
  "2": { id: "cmrsefkef0000u223d5bzl5xe", title: "Unit 3 — Basic Java", order: 2 },
  "3": { id: "unit-methods", title: "Unit 4 - Methods", order: 3 },
  "4": { id: "unit-classes", title: "Unit 5 - Classes and OOP", order: 4 },
  "5": { id: "unit-data", title: "Unit 6 - Data Structures", order: 5 },
};

// Prisma generates ids in the client, so raw inserts have to supply their own.
const newId = () =>
  "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 6);

async function connect() {
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRawUnsafe("select 1");
    return {
      via: "postgres on 5432",
      q: (text, params = []) => prisma.$queryRawUnsafe(text, ...params),
      close: () => prisma.$disconnect(),
    };
  } catch {
    await prisma.$disconnect().catch(() => {});
  }
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  await sql.query("select 1"); // let a genuine auth/DB error surface as itself
  return { via: "neon over https (5432 is blocked on this network)", q: (t, p = []) => sql.query(t, p), close: async () => {} };
}

async function load(db) {
  const rows = await db.q(`
    select l.code, l.title, l.objectives, l.flow
      from "Lesson" l join "Chapter" c on c.id = l."chapterId"
     where c.title not like '\\_\\_%'
     order by c."order" asc, l."order" asc`);
  return rows.filter((l) => ((l.flow?.steps) || []).length > 0);
}

async function doExport(db) {
  const lessons = await load(db);
  writeFileSync(
    FILE,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        note: "Interactive lesson flows. Restore with: node --env-file=.env scripts/flows.mjs restore",
        lessons: lessons.map((l) => ({ code: l.code, title: l.title, objectives: l.objectives ?? null, flow: l.flow })),
      },
      null,
      2,
    ) + "\n",
  );
  const steps = lessons.reduce((n, l) => n + l.flow.steps.length, 0);
  console.log(`✓ exported ${lessons.length} lessons / ${steps} steps → ${FILE}`);
  for (const l of lessons) console.log(`   ${l.code} ${l.title} (${l.flow.steps.length} steps)`);
}

function readFile() {
  if (!existsSync(FILE)) {
    console.error(`✗ ${FILE} not found — run "export" first.`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(FILE, "utf8"));
}

async function doDiff(db) {
  const file = readFile();
  const live = new Map((await load(db)).map((l) => [l.code, l]));
  let differences = 0;
  for (const saved of file.lessons) {
    const cur = live.get(saved.code);
    if (!cur) {
      console.log(`+ ${saved.code}: missing from DB, "seed" would create it (${saved.flow.steps.length} steps)`);
      differences++;
      continue;
    }
    if (stable(cur.flow) !== stable(saved.flow)) {
      console.log(`~ ${saved.code}: differs (DB ${cur.flow.steps.length} steps vs file ${saved.flow.steps.length})`);
      differences++;
    }
  }
  for (const [code] of live) {
    if (!file.lessons.some((l) => l.code === code)) {
      console.log(`! ${code}: in DB but NOT in the file — export to save it`);
      differences++;
    }
  }
  console.log(differences ? `\n${differences} difference(s)` : "\nDB and file match");
}

/**
 * Key-order-insensitive JSON. A Postgres jsonb round trip reorders object keys,
 * so a plain JSON.stringify comparison reports every lesson as changed and the
 * skip never fires — which is what made the batched restore still rewrite all
 * 36 lessons on a no-op run.
 */
function stable(v) {
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  if (v && typeof v === "object") {
    return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + stable(v[k])).join(",") + "}";
  }
  return JSON.stringify(v);
}

/**
 * Create rows for lessons that exist in the file but not in the DB — a new unit
 * authored offline has no row to restore *into*. Content is left empty here;
 * `restore` fills the flow. Split from restore on purpose: restore only ever
 * moves content, so it can be re-run without wondering what else it might make.
 */
async function doSeed(db) {
  const file = readFile();
  const have = new Set((await db.q(`select code from "Lesson"`)).map((r) => r.code));
  const missing = file.lessons.filter((l) => !have.has(l.code));
  if (!missing.length) return console.log("✓ every lesson in the file already has a row");

  const needChapters = [...new Set(missing.map((l) => l.code.split(".")[0]))];
  for (const prefix of needChapters) {
    const ch = CHAPTERS[prefix];
    if (!ch) throw new Error(`no chapter mapped for lesson code prefix "${prefix}." — add it to CHAPTERS`);
    const [exists] = await db.q(`select id from "Chapter" where id = $1`, [ch.id]);
    if (!exists) {
      await db.q(
        `insert into "Chapter" (id, "order", title, "updatedAt") values ($1, $2, $3, now()) returning id`,
        [ch.id, ch.order, ch.title],
      );
      console.log(`✓ created chapter ${ch.title}`);
    }
  }

  for (const l of missing) {
    const ch = CHAPTERS[l.code.split(".")[0]];
    const order = Number(l.code.split(".")[1]);
    const goal = (l.objectives && l.objectives[0]) || l.title;
    await db.q(
      `insert into "Lesson" (id, "chapterId", code, "order", title, goal, blocks, exercise, "quizBank", objectives, "updatedAt")
       values ($1, $2, $3, $4, $5, $6, '[]'::jsonb, '{}'::jsonb, '[]'::jsonb, $7::jsonb, now()) returning id`,
      [newId(), ch.id, l.code, order, l.title, goal, JSON.stringify(l.objectives ?? [])],
    );
    console.log(`✓ ${l.code} ${l.title} — row created in ${ch.title}`);
  }
  console.log(`\n✓ ${missing.length} lesson row(s) created. Run "restore" to fill in the flows.`);
}

async function doRestore(db) {
  const file = readFile();

  // WHY THIS IS BATCHED. The first version did one findUnique per lesson, then
  // one findMany + a create + an upsert PER SKILL TAG. At 36 lessons and ~180
  // tags that is several hundred sequential round trips, and over a slow link
  // the whole restore started timing out after minutes. Nothing was wrong with
  // the data — the shape of the queries was the problem.
  const codes = file.lessons.map((l) => l.code);
  const existing = await db.q(
    `select id, code, flow, objectives from "Lesson" where code = any($1::text[])`,
    [codes],
  );
  const byCode = new Map(existing.map((l) => [l.code, l]));

  const changed = [];
  let unchanged = 0;
  let absent = 0;
  for (const saved of file.lessons) {
    const lesson = byCode.get(saved.code);
    if (!lesson) {
      console.warn(`! ${saved.code}: no such lesson in the DB — run "seed" first`);
      absent++;
      continue;
    }
    if (stable(lesson.flow) === stable(saved.flow)) { unchanged++; continue; }
    changed.push({ saved, lesson });
  }

  for (const { saved, lesson } of changed) {
    const hasObj = ((lesson.objectives ?? []) || []).length > 0;
    if (saved.objectives && !hasObj) {
      await db.q(`update "Lesson" set flow = $1::jsonb, objectives = $2::jsonb, "updatedAt" = now() where id = $3 returning id`,
        [JSON.stringify(saved.flow), JSON.stringify(saved.objectives), lesson.id]);
    } else {
      await db.q(`update "Lesson" set flow = $1::jsonb, "updatedAt" = now() where id = $2 returning id`,
        [JSON.stringify(saved.flow), lesson.id]);
    }
    console.log(`✓ ${saved.code} restored (${saved.flow.steps.length} steps)`);
  }

  // Skill tags for the changed lessons only, bulk-inserted.
  let taggedTotal = 0;
  for (const { saved, lesson } of changed) {
    const wanted = new Map(); // lowercase statement -> original
    for (const step of saved.flow.steps) {
      for (const stmt of step.skills || []) {
        const clean = String(stmt).trim();
        if (clean) wanted.set(clean.toLowerCase(), clean);
      }
    }
    if (!wanted.size) continue;

    let have = await db.q(`select id, statement from "Skill" where "lessonId" = $1`, [lesson.id]);
    const lower = new Set(have.map((s) => s.statement.toLowerCase()));
    const missing = [...wanted.entries()].filter(([l]) => !lower.has(l)).map(([, s]) => s);
    if (missing.length) {
      await db.q(
        `insert into "Skill" (id, "lessonId", statement, origin, confidence, "updatedAt")
         select v.id, $1, v.statement, 'ai', 0.6, now()
           from unnest($2::text[], $3::text[]) as v(id, statement)
         returning id`,
        [lesson.id, missing.map(() => newId()), missing],
      );
      have = await db.q(`select id, statement from "Skill" where "lessonId" = $1`, [lesson.id]);
    }
    const byStmt = new Map(have.map((s) => [s.statement.toLowerCase(), s.id]));

    const links = [];
    for (const step of saved.flow.steps) {
      for (const stmt of step.skills || []) {
        const id = byStmt.get(String(stmt).trim().toLowerCase());
        if (id) links.push({ questionId: step.id, skillId: id });
      }
    }
    if (links.length) {
      await db.q(
        `insert into "QuestionSkill" (id, "questionId", "skillId", origin)
         select v.id, v.q, v.s, 'ai' from unnest($1::text[], $2::text[], $3::text[]) as v(id, q, s)
         on conflict do nothing returning id`,
        [links.map(() => newId()), links.map((l) => l.questionId), links.map((l) => l.skillId)],
      );
      taggedTotal += links.length;
    }
  }

  console.log(
    `\n✓ ${changed.length} lessons restored, ${unchanged} already current, ${taggedTotal} skill tags ensured` +
      (absent ? `, ${absent} with no row yet (run "seed")` : ""),
  );
}

const mode = process.argv[2];
const run = mode === "restore" ? doRestore : mode === "diff" ? doDiff : mode === "seed" ? doSeed : doExport;
const db = await connect();
console.log(`· connected via ${db.via}\n`);
try {
  await run(db);
} catch (e) {
  console.error(e);
  await db.close();
  process.exit(1);
}
await db.close();
