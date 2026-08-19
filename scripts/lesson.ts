// Lesson authoring CLI — verify a lesson without deploying anything.
//
// WHY: lessons used to be authorable only through the admin page on a running
// deployment, which meant anyone helping had to be handed production access.
// This runs on a laptop: write a flow JSON, check it against the real Java
// runner, and if it passes, drop it into prisma/flows.json as a normal file
// change you can open a PR with. No database, no admin login, no deploy.
//
//   npx tsx scripts/lesson.ts verify my-lesson.json
//   npx tsx scripts/lesson.ts add    my-lesson.json      # verify, then merge
//
// Run with `node --env-file=.env` semantics via tsx if you have PISTON_URL set;
// otherwise it falls back to the public Compiler Explorer lanes.
import { readFileSync, writeFileSync } from "node:fs";
import { validateFlow, type Flow, type FlowStep } from "../lib/curriculum/flow";
import { wrapAs, type WrapMode } from "../lib/java/wrapper";

const PISTON_URL = process.env.PISTON_URL || "";
const PISTON_TOKEN = process.env.PISTON_TOKEN || "";
const PISTON_JAVA = process.env.PISTON_JAVA_VERSION || "15.0.2";
const norm = (s: string) => (s || "").replace(/\r\n/g, "\n").trimEnd();

type Run = { compiled: boolean; stdout: string; error: string };

async function runJava(code: string, stdin = "", mode: WrapMode = "beginner"): Promise<Run> {
  const { source } = wrapAs(code, mode);
  let lastErr = "";

  // Self-hosted runner first when configured. It can be down — it was, the day
  // this was written — so a failure here must fall through, not crash.
  if (PISTON_URL) {
    try {
      const r = await fetch(`${PISTON_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(PISTON_TOKEN ? { "X-Runner-Token": PISTON_TOKEN } : {}) },
        body: JSON.stringify({ language: "java", version: PISTON_JAVA, files: [{ name: "Main.java", content: source }], stdin, compile_timeout: 10000, run_timeout: 5000 }),
        signal: AbortSignal.timeout(20_000),
      });
      if (r.ok) {
        const d: any = await r.json();
        if (d.compile?.code) return { compiled: false, stdout: "", error: d.compile.stderr || "compile failed" };
        const run = d.run || {};
        if (run.code !== 0 && run.stderr) return { compiled: !/error:/i.test(run.stderr), stdout: run.stdout || "", error: run.stderr };
        return { compiled: true, stdout: run.stdout || "", error: "" };
      }
      lastErr = `piston HTTP ${r.status}`;
    } catch (e) {
      lastErr = `piston unreachable (${String((e as Error).message).slice(0, 40)})`;
    }
  }

  // Compiler Explorer, with a couple of retries — it is free and occasionally
  // refuses a connection, and a blip must not be reported as a broken lesson.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch("https://godbolt.org/api/compiler/java2102/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "classOS-edu/1.0" },
        body: JSON.stringify({ source, lang: "java", allowStoreCodeDebug: false, options: { userArguments: "", executeParameters: { args: [], stdin }, compilerOptions: { executorRequest: true }, filters: { execute: true } } }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!r.ok) { lastErr = `godbolt HTTP ${r.status}`; continue; }
      const d: any = await r.json();
      const lines = (a: any[]) => (a || []).map((x: any) => x.text).join("\n");
      if (d.buildResult && d.buildResult.code !== 0) return { compiled: false, stdout: "", error: lines(d.buildResult.stderr) };
      return { compiled: true, stdout: lines(d.stdout), error: d.code !== 0 ? lines(d.stderr) : "" };
    } catch (e) {
      lastErr = `godbolt attempt ${attempt}: ${String((e as Error).message).slice(0, 40)}`;
      await new Promise((res) => setTimeout(res, attempt * 1500));
    }
  }
  throw new RunnerDown(lastErr);
}

/** No runner could be reached. NOT a lesson problem — say so and stop. */
class RunnerDown extends Error {}

const javaType = (v: string) =>
  /^(true|false)$/.test(v) ? "boolean" : /^-?\d+$/.test(v) ? "int" : /^-?\d*\.\d+$/.test(v) ? "double" : "String";

/** Every claim a step makes about Java, checked against Java. */
async function checkStep(s: FlowStep): Promise<string[]> {
  const fails: string[] = [];
  const at = `${s.id} (${s.kind})`;
  const expect = async (code: string, stdin: string, want: string, what: string) => {
    const r = await runJava(code, stdin, s.wrap || "beginner");
    if (!r.compiled || r.error) fails.push(`${at}: ${what} does not run clean — ${(r.error || "").split("\n")[0].slice(0, 110)}`);
    else if (norm(r.stdout) !== norm(want)) fails.push(`${at}: ${what} prints ${JSON.stringify(norm(r.stdout))}, step claims ${JSON.stringify(norm(want))}`);
  };
  switch (s.kind) {
    case "teach": if (s.code && s.output !== undefined) await expect(s.code, s.stdin || "", s.output, "shown output"); break;
    case "run": { const r = await runJava(s.code!, s.stdin || "", s.wrap || "beginner"); if (!r.compiled || r.error) fails.push(`${at}: does not run clean — ${(r.error || "").split("\n")[0].slice(0, 110)}`); break; }
    case "tweak": await expect(s.code!, s.stdin || "", s.target!, "starting output"); break;
    case "ask": { const stdin = (s.fields || []).map((f) => f.sample).join("\n");
      const r = await runJava(s.code!, stdin, s.wrap || "beginner"); if (!r.compiled || r.error) fails.push(`${at}: does not run with the sample answers — ${(r.error || "").split("\n")[0].slice(0, 110)}`); break; }
    case "predict": { const want = s.opts![s.correct!];
      if (/error|crash/i.test(want)) { const r = await runJava(s.code!, s.stdin || "", s.wrap || "beginner"); if (r.compiled && !r.error) fails.push(`${at}: claims an error but it runs fine`); }
      else await expect(s.code!, s.stdin || "", want, "the correct option"); break; }
    case "fix": case "write": await expect(s.solution!, s.stdin || "", s.target!, "solution"); break;
    case "arrange": await expect((s.lines || []).join("\n"), s.stdin || "", s.target!, "ordered lines"); break;
    case "table": {
      if (!s.exprs?.length) break;
      const from = s.fillFrom ?? 1;
      const names = (s.columns || []).slice(0, from);
      for (const [ri, row] of (s.rows || []).entries()) {
        const decls = names.map((n, i) => { const t = javaType(row[i]); return `${t} ${n} = ${t === "String" ? JSON.stringify(row[i]) : row[i]};`; }).join("\n");
        await expect(`${decls}\n${s.exprs.map((e) => `System.out.println(${e});`).join("\n")}`, "", row.slice(from).join("\n"), `row ${ri + 1}`);
      }
      break;
    }
  }
  return fails;
}

async function main() {
  const [cmd, file] = process.argv.slice(2);
  if (!cmd || !file) { console.error("usage: npx tsx scripts/lesson.ts verify|add <lesson.json>"); process.exit(2); }
  const doc = JSON.parse(readFileSync(file, "utf8"));
  const { code, title, objectives, flow } = doc as { code: string; title?: string; objectives?: string[]; flow: Flow };
  if (!code || !flow) { console.error("lesson JSON needs { code, flow } (title and objectives optional)"); process.exit(2); }

  const v = validateFlow(flow);
  if (!v.ok) { console.error("✗ structure:\n  " + v.errors.join("\n  ")); process.exit(1); }
  console.log(`✓ structure ok — ${flow.steps.length} steps`);

  let failed = 0;
  for (const s of flow.steps) {
    const fails = await checkStep(s);
    if (fails.length) { failed++; fails.forEach((f) => console.error("  ✗ " + f)); }
    else console.log(`  ✓ ${s.id} (${s.kind})`);
  }
  if (failed) { console.error(`\n✗ ${failed} step(s) do not match real Java. Nothing was written.`); process.exit(1); }
  console.log("\n✓ every snippet verified against the real Java runner");

  if (cmd !== "add") return;
  const P = "prisma/flows.json";
  const f = JSON.parse(readFileSync(P, "utf8"));
  const i = f.lessons.findIndex((l: any) => l.code === code);
  const entry = { code, title: title ?? f.lessons[i]?.title ?? code, objectives: objectives ?? f.lessons[i]?.objectives ?? [], flow };
  if (i >= 0) f.lessons[i] = entry; else f.lessons.push(entry);
  f.lessons.sort((a: any, b: any) => { const p = (s: string) => s.split(".").map(Number); const A = p(a.code), B = p(b.code); return A[0] - B[0] || A[1] - B[1]; });
  writeFileSync(P, JSON.stringify(f, null, 2) + "\n");
  console.log(`✓ ${i >= 0 ? "replaced" : "added"} ${code} in ${P} — commit it and open a PR`);
}
main().catch((e) => {
  if (e instanceof RunnerDown) {
    console.error(`\n✗ Could not reach any Java runner (${e.message}).`);
    console.error("  This is not a problem with your lesson. Check PISTON_URL, or your connection, and try again.");
    process.exit(3);
  }
  console.error(e);
  process.exit(1);
});
