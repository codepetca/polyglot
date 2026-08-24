// Compile every code sample in the documentation.
//
// WHY: this repo's founding rule is that nothing claims something Java does not
// do. Lessons have had that gate since day one (scripts/lesson.ts); the
// reference panel never did, and it is the surface a stuck student copies from
// most. A snippet here that does not compile costs a beginner an hour and
// teaches them to distrust the one thing that was meant to be reliable.
//
//   PISTON_URL= npx tsx scripts/reference-check.ts
//
// Entries marked `wrap: "none"` are fragments — operator lists, signatures,
// commented illustrations — and are skipped by design.
import { REFERENCE, type Entry } from "../lib/curriculum/reference";
import { wrapAs, type WrapMode } from "../lib/java/wrapper";

const norm = (s: string) => (s || "").replace(/\r\n/g, "\n").trimEnd();

async function runJava(code: string, mode: WrapMode, stdin = ""): Promise<{ ok: boolean; err: string }> {
  const source = wrapAs(code, mode).source;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch("https://godbolt.org/api/compiler/java2102/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "classOS-edu/1.0" },
        body: JSON.stringify({
          source, lang: "java", allowStoreCodeDebug: false,
          options: { userArguments: "", executeParameters: { args: [], stdin }, compilerOptions: { executorRequest: true }, filters: { execute: true } },
        }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!r.ok) continue;
      const d: any = await r.json();
      const lines = (a: any[]) => (a || []).map((x: any) => x.text).join("\n");
      if (d.buildResult && d.buildResult.code !== 0) return { ok: false, err: norm(lines(d.buildResult.stderr)).split("\n")[0] };
      if (d.code !== 0) return { ok: false, err: norm(lines(d.stderr)).split("\n")[0] };
      return { ok: true, err: "" };
    } catch {
      await new Promise((res) => setTimeout(res, attempt * 1500));
    }
  }
  return { ok: false, err: "could not reach a Java runner" };
}

/** methods mode calls run(); an entry that only declares a class needs one. */
function methodsSource(code: string): string {
  return /\brun\s*\(\s*\)/.test(code) ? code : `${code}\n\npublic void run() {\n}`;
}

async function main() {
  let checked = 0, skipped = 0;
  const failures: string[] = [];

  for (const section of REFERENCE) {
    const beginner: Entry[] = [];
    for (const e of section.entries) {
      if (e.wrap === "none") { skipped++; continue; }
      if (e.stdin) {
      const r = await runJava(e.code, e.wrap === "methods" ? "methods" : "beginner", e.stdin);
      checked++;
      if (!r.ok) failures.push(`${section.id} / ${e.name}: ${r.err}`);
      continue;
    }
    if (e.wrap === "methods") {
        const r = await runJava(methodsSource(e.code), "methods");
        checked++;
        if (!r.ok) failures.push(`${section.id} / ${e.name}: ${r.err}`);
        continue;
      }
      beginner.push(e);
    }
    if (!beginner.length) { console.log(`  ·  ${section.id} (${section.entries.length} entries, none runnable alone)`); continue; }

    // Batched into ONE compile, each entry inside its own block so two entries
    // declaring the same variable do not collide. Keeps this to ~30 network
    // round-trips instead of ~90.
    const batch = beginner.map((e) => `{\n${e.code}\n}`).join("\n");
    const r = await runJava(batch, "beginner");
    checked += beginner.length;
    if (r.ok) {
      console.log(`  ok  ${section.id} (${beginner.length} runnable)`);
    } else {
      // Re-run one at a time so the report names the actual culprit.
      console.log(`  ??  ${section.id} — batch failed, isolating…`);
      for (const e of beginner) {
        const one = await runJava(e.code, "beginner");
        if (!one.ok) failures.push(`${section.id} / ${e.name}: ${one.err}`);
      }
    }
  }

  console.log(`\n${checked} snippets compiled, ${skipped} fragments skipped`);
  if (failures.length) {
    console.error(`\n✗ ${failures.length} do not compile:`);
    for (const f of failures) console.error("   " + f);
    process.exit(1);
  }
  console.log("✓ every runnable documentation snippet compiles");

}

main();
