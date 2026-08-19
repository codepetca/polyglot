// Harvest the CodeHS course syllabus (unit -> lesson -> objectives).
//
// The lesson-plan page is PUBLIC, so this needs no login and can be re-run
// whenever CodeHS updates the course. Item-level content (exercise specs, quiz
// questions) is NOT here — that is login-gated and lives in codehs.ts for the
// units we have actually opened.
//
//   node scripts/syllabus.mjs      # refresh lib/curriculum/syllabus.json
//
// NUMBERING: this page uses the PUBLIC catalogue, which has no Java Pretest.
// The owner's course inserts one as Unit 1, so every unit here is one lower
// than the student sees. `courseCode` records what they actually see.
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const URL = "https://codehs.com/course/apcsamocha/lessons";
const OUT = "lib/curriculum/syllabus.json";

// Fetch, but keep a cached copy: codehs.com is occasionally slow from here and
// a network blip should not stop you regenerating the file. `--cached` forces
// the local copy.
const CACHE = "/tmp/codehs-lessons.html";
let html;
if (!process.argv.includes("--cached")) {
  try {
    html = await fetch(URL, { signal: AbortSignal.timeout(30_000) }).then((r) => r.text());
    writeFileSync(CACHE, html);
  } catch (e) {
    console.warn(`! fetch failed (${String(e.message).slice(0, 50)}) - falling back to cache`);
  }
}
if (!html) {
  if (!existsSync(CACHE)) { console.error(`no cache at ${CACHE}; re-run with a working connection`); process.exit(1); }
  html = readFileSync(CACHE, "utf8");
}


const entities = (t) =>
  t.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
   .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
   .replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'")
   .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const decodeAttr = (s) =>
  entities(s).replace(/\\n/g, "\n");

const decode = (s) =>
  entities(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

// Walk the document in order, so each lesson is attributed to the unit heading
// that most recently preceded it.
const token = /<h2[^>]*class="[^"]*module-title[^"]*"[^>]*>([\s\S]*?)<\/h2>|<h3[^>]*class="[^"]*course-marketing-header[^"]*"[^>]*>([\s\S]*?)<\/h3>|<ul[^>]*class="[^"]*(?:objective|lesson-plan)[^"]*"[^>]*>([\s\S]*?)<\/ul>/g;

const lessons = [];
let unit = null, cur = null, m;
while ((m = token.exec(html))) {
  if (m[1]) { unit = decode(m[1]); cur = null; continue; }
  if (m[2]) {
    const h = decode(m[2]);
    const lm = h.match(/^(\d+\.\d+)\s+(.+)$/);
    if (lm && unit) { cur = { unit, code: lm[1], title: lm[2], objectives: [] }; lessons.push(cur); }
    continue;
  }
}

// Description and Objective are stored in `data-markdown` attributes, one <li>
// each, following the lesson-item. Objectives are the "* " bullets under
// "Students will be able to". Walk them in document order and attach to the
// lesson that most recently opened.
const MD = /<span class="lesson-number">(\d+\.\d+)<\/span>|data-markdown="([\s\S]*?)"(?:\s*>|>)/g;
const byCode = new Map(lessons.map((l) => [l.code, l]));
let at = null, mm;
while ((mm = MD.exec(html))) {
  if (mm[1]) { at = byCode.get(mm[1]) || null; continue; }
  if (!at || !mm[2]) continue;
  const md = decodeAttr(mm[2]);
  if (!/Students will be able to/i.test(md)) continue;
  at.objectives = md
    .split(/\r?\n/)
    .filter((l) => /^\s*[-*]\s+/.test(l))   // CodeHS mixes * and - bullets
    .map((l) => l.replace(/^\s*[-*]\s+/, "").replace(/`/g, "").trim())
    .filter(Boolean);
}

const unitOrder = [...new Set(lessons.map((l) => l.unit))];
const out = {
  source: URL,
  harvestedAt: new Date().toISOString().slice(0, 10),
  note: "Objectives only. Exercise specs and quiz questions are login-gated - see lib/curriculum/codehs.ts.",
  units: unitOrder.map((name, i) => ({
    name,
    publicUnit: i + 1,
    courseUnit: i + 2, // Java Pretest occupies Unit 1 in the owner's course
    lessons: lessons.filter((l) => l.unit === name).map(({ code, title, objectives }) => {
      const [u, n] = code.split(".");
      return { publicCode: code, courseCode: `${Number(u) + 1}.${n}`, title, objectives };
    }),
  })),
};
writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
for (const u of out.units) {
  const withObj = u.lessons.filter((l) => l.objectives.length).length;
  console.log(`unit ${u.publicUnit} -> course ${u.courseUnit}: ${u.name.padEnd(52)} ${String(u.lessons.length).padStart(2)} lessons, ${withObj} with objectives`);
}
console.log(`\n-> ${OUT}`);
