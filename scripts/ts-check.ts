// The compiler gate for TypeScript lessons, matching scripts/lesson.ts for Java.
//
// A lesson snippet that does not do what the lesson says is worse than no
// lesson: the student assumes they are the problem. So every snippet a
// TypeScript lesson ships is checked here — the clean ones must produce no
// diagnostics, and the ones that are MEANT to fail must fail with the exact
// error code the lesson claims.
//
//   npx tsx scripts/ts-check.ts
import { check } from "../lib/ts/check";

type Case = { name: string; code: string; expect: "clean" | number };

const CASES: Case[] = [
  { name: "hello", code: 'console.log("Hello");', expect: "clean" },
  { name: "inferred string", code: 'let name = "Ada";\nname = "Ben";\nconsole.log(name);', expect: "clean" },
  { name: "wrong type after inference", code: 'let score = 0;\nscore = "ten";', expect: 2322 },
  { name: "annotated", code: "let age: number = 15;\nconsole.log(age);", expect: "clean" },
  { name: "const reassigned", code: "const city = \"Markham\";\ncity = \"Toronto\";", expect: 2588 },
  { name: "implicit any", code: "function f(x) { return x; }", expect: 7006 },
  { name: "template literal", code: 'const n = "Ada";\nconsole.log(`Hi, ${n}!`);', expect: "clean" },
  { name: "array push wrong type", code: "const xs: number[] = [1, 2];\nxs.push(\"three\");", expect: 2345 },
  { name: "possibly null", code: "let s: string | null = null;\nconsole.log(s.length);", expect: 18047 },
  { name: "no DOM", code: 'document.title = "x";', expect: 2584 },
];

let bad = 0;
for (const c of CASES) {
  const r = check(c.code);
  const codes = r.diagnostics.map((d) => d.code);
  const ok = c.expect === "clean" ? r.ok : codes.includes(c.expect);
  if (!ok) {
    bad++;
    console.log(`FAIL ${c.name}: expected ${c.expect}, got ${codes.length ? codes.join(",") : "no errors"}`);
    for (const d of r.diagnostics) console.log(`        L${d.line} TS${d.code} ${d.message}`);
  }
}

// Clean code must also emit runnable JavaScript, not just type-check.
const emitted = check('const n: number = 21;\nconsole.log(n * 2);');
if (!emitted.js.includes("console.log(n * 2)")) {
  bad++;
  console.log("FAIL emit: clean code produced no usable JavaScript");
}

console.log(bad ? `\n${bad} failed of ${CASES.length + 1}` : `\nall ${CASES.length + 1} checks passed`);
process.exit(bad ? 1 : 0);
