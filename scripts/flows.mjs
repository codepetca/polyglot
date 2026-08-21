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
//   node --env-file=.env scripts/flows.mjs restore   # prisma/flows.json → DB
//   node --env-file=.env scripts/flows.mjs diff      # what would change
//
// Restore does NOT re-run compiler verification: everything in the file already
// passed it on the way in, and re-checking ~100 snippets over the network would
// be slow and flaky. Verification belongs at authoring time, which is where it is.

import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const prisma = new PrismaClient();
const FILE = "prisma/flows.json";

async function load() {
  const lessons = await prisma.lesson.findMany({
    orderBy: [{ chapter: { order: "asc" } }, { order: "asc" }],
    select: { code: true, title: true, objectives: true, flow: true, chapter: { select: { title: true } } },
  });
  return lessons.filter(
    (l) => !l.chapter.title.startsWith("__") && (((l.flow?.steps) || []).length > 0)
  );
}

async function doExport() {
  const lessons = await load();
  const payload = {
    exportedAt: new Date().toISOString(),
    note: "Interactive lesson flows. Restore with: node --env-file=.env scripts/flows.mjs restore",
    lessons: lessons.map((l) => ({
      code: l.code,
      title: l.title,
      objectives: l.objectives ?? null,
      flow: l.flow,
    })),
  };
  writeFileSync(FILE, JSON.stringify(payload, null, 2) + "\n");
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

async function doDiff() {
  const file = readFile();
  const live = new Map((await load()).map((l) => [l.code, l]));
  let differences = 0;
  for (const saved of file.lessons) {
    const cur = live.get(saved.code);
    if (!cur) {
      console.log(`+ ${saved.code}: missing from DB, restore would ADD ${saved.flow.steps.length} steps`);
      differences++;
      continue;
    }
    const a = JSON.stringify(cur.flow);
    const b = JSON.stringify(saved.flow);
    if (a !== b) {
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

async function doRestore() {
  const file = readFile();

  // WHY THIS IS BATCHED. The first version did one findUnique per lesson, then
  // one findMany + a create + an upsert PER SKILL TAG. At 36 lessons and ~180
  // tags that is several hundred sequential round trips, and over a slow link
  // the whole restore started timing out after minutes. Nothing was wrong with
  // the data — the shape of the queries was the problem.
  //
  // Now: fetch everything up front, skip lessons whose flow already matches,
  // and insert tags with createMany({ skipDuplicates }) instead of one at a
  // time. An unchanged repo is a handful of queries.
  const codes = file.lessons.map((l) => l.code);
  const existing = await prisma.lesson.findMany({
    where: { code: { in: codes } },
    select: { id: true, code: true, flow: true, objectives: true },
  });
  const byCode = new Map(existing.map((l) => [l.code, l]));

  const changed = [];
  let unchanged = 0;
  for (const saved of file.lessons) {
    const lesson = byCode.get(saved.code);
    if (!lesson) {
      console.warn(`! ${saved.code}: no such lesson in the DB, skipped`);
      continue;
    }
    if (stable(lesson.flow) === stable(saved.flow)) { unchanged++; continue; }
    changed.push({ saved, lesson });
  }

  for (const { saved, lesson } of changed) {
    const hasObj = ((lesson.objectives ?? []) || []).length > 0;
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        flow: saved.flow,
        ...(saved.objectives && !hasObj ? { objectives: saved.objectives } : {}),
      },
    });
    console.log(`\u2713 ${saved.code} restored (${saved.flow.steps.length} steps)`);
  }

  // Skill tags for the changed lessons only, two bulk writes each.
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

    const have = await prisma.skill.findMany({ where: { lessonId: lesson.id } });
    const haveByLower = new Map(have.map((s) => [s.statement.toLowerCase(), s]));
    const missing = [...wanted.entries()].filter(([lower]) => !haveByLower.has(lower));
    if (missing.length) {
      await prisma.skill.createMany({
        data: missing.map(([, statement]) => ({ lessonId: lesson.id, statement, origin: "ai", confidence: 0.6 })),
        skipDuplicates: true,
      });
      for (const s of await prisma.skill.findMany({ where: { lessonId: lesson.id } })) {
        haveByLower.set(s.statement.toLowerCase(), s);
      }
    }

    const links = [];
    for (const step of saved.flow.steps) {
      for (const stmt of step.skills || []) {
        const skill = haveByLower.get(String(stmt).trim().toLowerCase());
        if (skill) links.push({ questionId: step.id, skillId: skill.id, origin: "ai" });
      }
    }
    if (links.length) {
      await prisma.questionSkill.createMany({ data: links, skipDuplicates: true });
      taggedTotal += links.length;
    }
  }

  console.log(`\n\u2713 ${changed.length} lessons restored, ${unchanged} already current, ${taggedTotal} skill tags ensured`);
}


const mode = process.argv[2];
const run = mode === "restore" ? doRestore : mode === "diff" ? doDiff : doExport;
run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
