import "server-only";
import { runJava } from "@/lib/java/piston";
import type { Flow, FlowStep } from "./flow";

// Split out of flow.ts so that flow.ts stays PURE. The lesson-authoring CLI
// (scripts/lesson.mjs) needs the types and validateFlow, and a `server-only`
// import made the whole module unusable outside Next — which meant teammates
// could not check a lesson without deploying it.

// ─── Compiler verification (the anti-hallucination gate) ─────────────────────
//
// Runs every verifiable snippet through the REAL Java runner and checks the
// authored claims hold. An AI-authored lesson that lies about output teaches
// the exact misconception it exists to fix — so imports must pass this.

const norm = (x: string) => (x || "").replace(/\r\n/g, "\n").trimEnd();
const looksLikeError = (o: string) => /\berror\b/i.test(o);

// How many snippets to compile at once during verification.
//
// This used to fire EVERY step simultaneously, which stampeded the runner: a
// 12-step lesson meant 12 concurrent JVMs. On a small self-hosted box that
// queued past the request timeout, and on the public fallback it tripped
// throttling — either way steps came back with empty output and the lesson was
// rejected for "failures" that were really just load. Verification is an
// authoring-time action, so being a few seconds slower is free; being flaky is
// not.
const VERIFY_BATCH = 3;

export async function verifyFlow(flow: Flow): Promise<{ ok: boolean; results: string[]; failures: string[] }> {
  const results: string[] = [];
  const failures: string[] = [];
  const check = async (s: FlowStep) => {
    const name = `${s.id} (${s.kind})`;
    try {
      switch (s.kind) {
        case "compare": {
          // Both halves of a comparison are claims about Java. Check both, or
          // the side-by-side teaches a difference that may not exist.
          let bad = 0;
          for (const [i, sd] of (s.sides || []).entries()) {
            const r = await runJava(sd.code, sd.stdin || "", { wrapBeginner: true, mode: s.wrap || "beginner" });
            if (!r.compiled || r.error) { failures.push(`${name}: side ${i + 1} (${sd.label}) does not run: ${(r.error || "").slice(0, 80)}`); bad++; }
            else if (norm(r.stdout) !== norm(sd.output)) { failures.push(`${name}: side ${i + 1} (${sd.label}) prints ${JSON.stringify(norm(r.stdout))}, step claims ${JSON.stringify(norm(sd.output))}`); bad++; }
          }
          if (!bad) results.push(`${name}: ✓ both sides verified`);
          break;
        }
        case "teach": {
          // A teach step may claim "this is what it prints". That claim must be
          // machine-checked like any other, or the no-lying guarantee has a hole.
          if (!s.code || s.output === undefined) { results.push(`${name}: – no output claimed`); break; }
          const r = await runJava(s.code, s.stdin || "", { wrapBeginner: true, mode: s.wrap || "beginner" });
          if (!r.compiled || r.error) failures.push(`${name}: does not run clean: ${(r.error || "").slice(0, 100)}`);
          else if (norm(r.stdout) !== norm(s.output)) failures.push(`${name}: prints ${JSON.stringify(norm(r.stdout))}, but the step claims ${JSON.stringify(norm(s.output))}`);
          else results.push(`${name}: ✓ shown output verified`);
          break;
        }
        case "run": {
          const r = await runJava(s.code!, s.stdin || "", { wrapBeginner: true, mode: s.wrap || "beginner" });
          if (!r.compiled || r.error) failures.push(`${name}: does not run clean: ${(r.error || "").slice(0, 100)}`);
          else results.push(`${name}: ✓ runs, prints ${JSON.stringify(norm(r.stdout)).slice(0, 60)}`);
          break;
        }
        case "ask": {
          // The student supplies the real input, so there is no fixed output to
          // assert. What must hold is that the snippet compiles and consumes
          // exactly as many lines as there are fields — a mismatch means the
          // student would be asked for a value the program never reads, or the
          // program would block waiting for one they were never asked for.
          const stdin = (s.fields || []).map((fl) => fl.sample).join("\n");
          const r = await runJava(s.code!, stdin, { wrapBeginner: true, mode: s.wrap || "beginner" });
          if (!r.compiled || r.error) failures.push(`${name}: does not run clean with the sample answers: ${(r.error || "").slice(0, 100)}`);
          else results.push(`${name}: ✓ runs with ${(s.fields || []).length} typed value(s)`);
          break;
        }
        case "tweak": {
          const r = await runJava(s.code!, s.stdin || "", { wrapBeginner: true, mode: s.wrap || "beginner" });
          if (!r.compiled || norm(r.stdout) !== norm(s.target!)) failures.push(`${name}: original output ${JSON.stringify(norm(r.stdout))} ≠ target ${JSON.stringify(norm(s.target!))}`);
          else results.push(`${name}: ✓ original verified`);
          break;
        }
        case "predict": {
          const r = await runJava(s.code!, s.stdin || "", { wrapBeginner: true, mode: s.wrap || "beginner" });
          const claimed = s.opts![s.correct!];
          if (looksLikeError(claimed)) {
            if (r.compiled && !r.error) failures.push(`${name}: claims error but it runs fine, prints ${JSON.stringify(norm(r.stdout))}`);
            else results.push(`${name}: ✓ errors as claimed`);
          } else if (!r.compiled || r.error) failures.push(`${name}: doesn't run: ${(r.error || "").slice(0, 100)}`);
          else if (norm(r.stdout) !== norm(claimed)) failures.push(`${name}: prints ${JSON.stringify(norm(r.stdout))}, but correct opt says ${JSON.stringify(norm(claimed))}`);
          else results.push(`${name}: ✓ prints the correct option`);
          break;
        }
        case "table": {
          // A truth table is a claim about what Java does, so it gets checked
          // like any other claim. One program per row: bind the given columns
          // as booleans, print each fillable expression, compare to the cells
          // the step says are correct.
          if (!s.exprs?.length) { results.push(`${name}: – no exprs to verify against`); break; }
          const from = s.fillFrom ?? 1;
          const names = (s.columns || []).slice(0, from);
          // Given columns are not always booleans — 3.8 compares ints, so the
          // declared type is inferred from the literal rather than assumed.
          const javaType = (v: string) =>
            /^(true|false)$/.test(v) ? "boolean"
            : /^-?\d+$/.test(v) ? "int"
            : /^-?\d*\.\d+$/.test(v) ? "double"
            : "String";
          let bad = 0;
          for (const [ri, row] of (s.rows || []).entries()) {
            const decls = names
              .map((n, i) => {
                const t = javaType(row[i]);
                const lit = t === "String" ? JSON.stringify(row[i]) : row[i];
                return `${t} ${n} = ${lit};`;
              })
              .join("\n");
            const prints = s.exprs.map((e) => `System.out.println(${e});`).join("\n");
            const r = await runJava(`${decls}\n${prints}`, "", { wrapBeginner: true, mode: s.wrap || "beginner" });
            const want = row.slice(from).join("\n");
            if (!r.compiled || r.error) { failures.push(`${name}: row ${ri + 1} does not run: ${(r.error || "").slice(0, 90)}`); bad++; }
            else if (norm(r.stdout) !== norm(want)) { failures.push(`${name}: row ${ri + 1} — Java gives ${JSON.stringify(norm(r.stdout))}, table says ${JSON.stringify(want)}`); bad++; }
          }
          if (!bad) results.push(`${name}: ✓ all ${(s.rows || []).length} rows match real Java`);
          break;
        }
        case "fix": case "write": {
          const r = await runJava(s.solution!, s.stdin || "", { wrapBeginner: true, mode: s.wrap || "beginner" });
          if (!r.compiled || norm(r.stdout) !== norm(s.target!)) failures.push(`${name}: solution gives ${JSON.stringify(norm(r.stdout || r.error))} ≠ target ${JSON.stringify(norm(s.target!))}`);
          else results.push(`${name}: ✓ solution reaches target`);
          if (s.kind === "fix" && s.code) {
            const broken = await runJava(s.code, s.stdin || "", { wrapBeginner: true, mode: s.wrap || "beginner" });
            if (broken.compiled && !broken.error && norm(broken.stdout) === norm(s.target!)) failures.push(`${name}: the "broken" code already matches the target`);
          }
          break;
        }
        case "arrange": {
          const r = await runJava(s.lines!.join("\n"), s.stdin || "", { wrapBeginner: true, mode: s.wrap || "beginner" });
          if (!r.compiled || norm(r.stdout) !== norm(s.target!)) failures.push(`${name}: correct order gives ${JSON.stringify(norm(r.stdout || r.error))} ≠ target ${JSON.stringify(norm(s.target!))}`);
          else results.push(`${name}: ✓ correct order reaches target`);
          break;
        }
        case "fill": {
          let assembled = s.code!;
          s.blanks!.forEach((b, i) => { assembled = assembled.split(`⟦${i + 1}⟧`).join(b.chips[b.answer]); });
          const r = await runJava(assembled, s.stdin || "", { wrapBeginner: true, mode: s.wrap || "beginner" });
          if (!r.compiled || r.error) failures.push(`${name}: correct chips don't run: ${(r.error || "").slice(0, 100)}`);
          else if (s.target !== undefined && norm(r.stdout) !== norm(s.target)) failures.push(`${name}: correct chips print ${JSON.stringify(norm(r.stdout))} ≠ target`);
          else results.push(`${name}: ✓ correct chips verified`);
          break;
        }
        default:
          results.push(`${name}: – structural only`);
      }
    } catch (e) {
      failures.push(`${name}: verify crashed: ${(e as Error).message.slice(0, 80)}`);
    }
  };

  for (let i = 0; i < flow.steps.length; i += VERIFY_BATCH) {
    await Promise.all(flow.steps.slice(i, i + VERIFY_BATCH).map(check));
  }
  return { ok: failures.length === 0, results, failures };
}
