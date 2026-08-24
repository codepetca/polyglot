// What a translator would actually see, per lesson — and proof that no code
// or answer key is in it.
//
// WHY THIS EXISTS. The extractor used to walk five fields plus the deprecated
// points[]. When the Unit 3-6 rework moved every explanation into body[],
// keypoint, facts and rules, translation quietly became one line per lesson and
// nobody noticed, because nothing measured it. This measures it.
//
//   npx tsx scripts/i18n-coverage.ts
//
// Fails if any lesson has no translatable prose, or if anything that is code
// or an answer key reaches the list.
import { readFileSync } from "node:fs";
import { extractTranslatable } from "../lib/curriculum/i18n-extract";
import type { FlowStep } from "../lib/curriculum/flow";

const lessons = JSON.parse(readFileSync("prisma/flows.json", "utf8")).lessons as {
  code: string; title: string; flow: { steps: FlowStep[] };
}[];

// Nothing here may ever be handed to a translator.
const FORBIDDEN: (keyof FlowStep)[] = ["code", "target", "output", "solution", "stdin", "harness", "library"];

let total = 0;
const empty: string[] = [];
const leaks: string[] = [];

for (const l of lessons) {
  const steps = l.flow?.steps || [];
  const items = extractTranslatable(steps);
  total += items.length;
  if (!items.length && steps.length) empty.push(l.code);

  const banned = new Set<string>();
  for (const s of steps) {
    for (const f of FORBIDDEN) {
      const v = (s as any)[f];
      if (typeof v === "string" && v.trim()) banned.add(v.trim());
    }
    for (const sd of s.sides || []) { if (sd.code) banned.add(sd.code.trim()); if (sd.output) banned.add(sd.output.trim()); }
    for (const a of s.annotate || []) if (a.token) banned.add(a.token.trim());
    for (const r of s.rules || []) if (r.example) banned.add(r.example.trim());
  }
  for (const it of items) if (banned.has(it.text.trim())) leaks.push(`${l.code} ${it.path.join(".")} = ${JSON.stringify(it.text.slice(0, 50))}`);

  const perStep = steps.length ? (items.length / steps.length).toFixed(1) : "0";
  console.log(`  ${l.code.padEnd(5)} ${String(items.length).padStart(4)} strings  (${perStep}/step)  ${l.title}`);
}

console.log(`\n${total} translatable strings across ${lessons.length} lessons`);
if (empty.length) console.error(`\n✗ no prose found in: ${empty.join(" ")}`);
if (leaks.length) {
  console.error(`\n✗ ${leaks.length} code/answer string(s) reached the translator:`);
  for (const x of leaks.slice(0, 12)) console.error("   " + x);
}
if (empty.length || leaks.length) process.exit(1);
console.log("✓ every lesson has prose, and no code or answer key is in the list");
