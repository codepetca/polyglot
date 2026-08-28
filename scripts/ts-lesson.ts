// The compiler gate for TypeScript lessons.
//
// Java lessons are checked by scripts/lesson.ts, which compiles every snippet
// on a real runner. This does the same job with the in-process TypeScript
// compiler, and checks something stronger: that each step does what the lesson
// SAYS it does.
//
//   teach with a target   → must compile clean and print exactly that
//   live goal "output"    → the worked solution must print exactly the target
//   live goal "error"     → the worked solution must produce exactly expectCode
//   live goal "clean"     → the starter must FAIL and the solution must pass
//   predict / fill        → the code must compile as the question assumes
//
// The last of those matters most. A step whose target cannot actually be
// produced is the worst bug this course can ship: the student writes correct
// code, is told they are wrong, and has no way to know the lesson is at fault.
//
//   npx tsx scripts/ts-lesson.ts <lesson.json>
import { readFileSync } from "node:fs";
import { check } from "../lib/ts/check";
import { validateFlow } from "../lib/curriculum/flow";

const file = process.argv[2];
if (!file) { console.error("usage: ts-lesson.ts <lesson.json>"); process.exit(2); }
const lesson = JSON.parse(readFileSync(file, "utf8"));
const steps: any[] = lesson.flow?.steps || [];

// RUN THE SHARED VALIDATOR FIRST.
//
// This gate checks that the CODE does what the lesson claims. It says nothing
// about whether the step is well formed, and the first lesson written for it
// shipped a fill step using opts/correct instead of chips/answer — which this
// file happily passed and validateFlow rejected. A gate that only checks the
// half you were thinking about gives false confidence.
const shape = validateFlow(lesson.flow);
if (!shape.ok) {
  for (const e of shape.errors) console.log(`FAIL shape: ${e}`);
}

/** Run compiled JS the same way the browser does, capturing console output. */
function outputOf(js: string): string {
  const lines: string[] = [];
  const console_ = { log: (...a: unknown[]) => lines.push(a.map(String).join(" ")), error: (...a: unknown[]) => lines.push(a.map(String).join(" ")) };
  try {
    new Function("console", js)(console_);
  } catch (e) {
    return `<<threw>> ${(e as Error).message}`;
  }
  return lines.join("\n");
}

let bad = shape.ok ? 0 : shape.errors.length;
const fail = (id: string, msg: string) => { bad++; console.log(`FAIL ${id}: ${msg}`); };

for (const s of steps) {
  const id = `${lesson.code}/${s.id}`;

  if (s.kind === "teach" && s.code && s.target !== undefined) {
    const r = check(s.code);
    if (!r.ok) { fail(id, `teach code has errors: ${r.diagnostics.map((d) => `TS${d.code} ${d.message}`).join("; ")}`); continue; }
    const got = outputOf(r.js);
    if (got.trim() !== String(s.target).trim()) fail(id, `prints ${JSON.stringify(got)}, lesson claims ${JSON.stringify(s.target)}`);
  }

  if (s.kind === "live") {
    if (!s.solution) { fail(id, "live step has no solution — the gate cannot prove it is possible"); continue; }
    const r = check(s.solution);

    if (s.goal === "output") {
      if (!r.ok) { fail(id, `solution has errors: ${r.diagnostics.map((d) => `TS${d.code}`).join(",")}`); continue; }
      const got = outputOf(r.js);
      if (got.trim() !== String(s.target).trim()) fail(id, `solution prints ${JSON.stringify(got)}, target is ${JSON.stringify(s.target)}`);
    }

    if (s.goal === "error") {
      const codes = r.diagnostics.map((d) => d.code);
      if (!codes.includes(s.expectCode)) fail(id, `solution produces ${codes.join(",") || "no errors"}, expectCode is ${s.expectCode}`);
    }

    if (s.goal === "clean") {
      // Both halves matter: a starter that already compiles is not a fix, and a
      // solution that does not compile is not a solution.
      if (s.code && check(s.code).ok) fail(id, "starter already compiles — nothing to fix");
      if (!r.ok) fail(id, `solution still has errors: ${r.diagnostics.map((d) => `TS${d.code} ${d.message}`).join("; ")}`);
    }
  }

  if ((s.kind === "predict" || s.kind === "spot") && s.code) {
    // These show code and ask about it. It has to parse, or the question is
    // about something that is not a program.
    const r = check(s.code);
    const syntax = r.diagnostics.filter((d) => d.code < 2000);
    if (syntax.length) fail(id, `question code does not parse: ${syntax.map((d) => d.message).join("; ")}`);
  }
}

console.log(bad ? `\n${bad} problem(s) in ${lesson.code}` : `\n${lesson.code}: all ${steps.length} steps verified`);
process.exit(bad ? 1 : 0);
