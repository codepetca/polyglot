import "server-only";
import { wrapAs, type WrapMode } from "./wrapper";

// Java execution, with failover.
//
// WHY THIS IS A LIST AND NOT ONE URL: this project already lost its runner once
// — the public Piston API went whitelist-only on 2026-02-15 (still returns 401,
// re-verified) and every lesson broke. Compiler Explorer is the same class of
// dependency: free, keyless, no SLA. Since every interactive lesson step calls
// this, a single backend means one third party can take the whole product down.
//
// So: an ordered list of lanes, tried in sequence, with short-lived health
// memory so a dead lane isn't re-dialed on every request.
//
// Lane inventory (probed live, not assumed):
//   godbolt java2102   → works (JDK 21.0.2) — primary
//   godbolt java2100   → works (JDK 21.0.0) — covers one compiler breaking
//   public Piston      → 401 whitelist-only, deliberately NOT included
//   self-hosted Piston → set PISTON_URL; the ONLY way to get true
//                        different-host redundancy today. Recommended before
//                        any real traffic.
//
// Honest limitation: without PISTON_URL both default lanes share one host, so
// this survives compiler-level breakage but not godbolt itself going down.

const GODBOLT_URL = process.env.GODBOLT_URL || "https://godbolt.org";
const PISTON_URL = process.env.PISTON_URL || ""; // self-hosted only
const PISTON_JAVA = process.env.PISTON_JAVA_VERSION || "15.0.2";
// Shared secret for the self-hosted runner. Piston itself is bound to localhost
// on that box; a TLS reverse proxy in front rejects anything without this
// header, so the endpoint can't be used as free public compute if it's found.
const PISTON_TOKEN = process.env.PISTON_TOKEN || "";
// Comma-separated, tried in order.
const GODBOLT_COMPILERS = (process.env.GODBOLT_JAVA || "java2102,java2100")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export interface RunResult {
  compiled: boolean;
  stdout: string;
  error: string; // compile or runtime error, remapped to the student's line numbers
  runner?: string; // which lane served it (diagnostics; never shown to students)
}

// Remap compiler/stack-trace line numbers back to the student's editor lines.
// Godbolt reports "<source>:N" and "example.java:N". Piston reports
// "Main.java.java:N" — note the DOUBLED extension, which the old
// exact-match pattern missed, leaving students with line numbers offset by the
// hidden wrapper. Match any .java-ish filename, however many extensions.
function remapErrors(text: string, offset: number): string {
  return text.replace(/(?:<source>|[A-Za-z0-9_$]+(?:\.java)+):(\d+)/g, (_m, n) => {
    return `line ${Math.max(1, parseInt(n, 10) - offset)}`;
  });
}

// ─── Lanes ───────────────────────────────────────────────────────────────────

type Lane = { name: string; run: (source: string, stdin: string, offset: number) => Promise<RunResult> };

function lanes(): Lane[] {
  const out: Lane[] = [];
  // Self-hosted Piston first when configured: it's the only lane on a host the
  // owner controls, so it should absorb traffic rather than a free service.
  if (PISTON_URL) out.push({ name: "piston(self-hosted)", run: runViaPiston });
  for (const c of GODBOLT_COMPILERS) {
    out.push({ name: `godbolt/${c}`, run: (s, i, o) => runViaGodbolt(s, i, o, c) });
  }
  return out;
}

// HOW LONG A DEAD LANE MAY COST US. The self-hosted box is tried first, and
// when it is down it does not refuse the connection — it accepts and then never
// answers, so the request sits there until it is aborted. At 20s that alone
// outlived the serverless function, which meant the godbolt fallback below was
// never reached and a healthy runner looked broken to the student. The first
// lane now gets a few seconds to prove it is alive; whichever lane actually
// answers gets the long timeout, because compiling really can take a while.
const PROBE_MS = Number(process.env.RUNNER_PROBE_MS || 4000);
const WORK_MS = 20_000;

// Short-lived health memory: a lane that just failed hard is skipped for a
// while so students don't eat its timeout on every single step.
const COOLDOWN_MS = 60_000;
const sick = new Map<string, number>();
const isSick = (name: string) => (sick.get(name) ?? 0) > Date.now();

/** Diagnostics for the admin runner panel. */
export function runnerHealth(): { name: string; healthy: boolean; cooldownEndsInMs: number }[] {
  return lanes().map((l) => ({
    name: l.name,
    healthy: !isSick(l.name),
    cooldownEndsInMs: Math.max(0, (sick.get(l.name) ?? 0) - Date.now()),
  }));
}

// A lane "failed" only if the SERVICE failed. A student's code failing to
// compile is a SUCCESSFUL run — never fail over on that, it would burn every
// lane on a typo.
class LaneDown extends Error {}

export async function runJava(
  code: string,
  stdin = "",
  opts: { wrapBeginner?: boolean; mode?: WrapMode } = {}
): Promise<RunResult> {
  const { source, offset } = opts.wrapBeginner ? wrapAs(code, opts.mode || "beginner") : { source: code, offset: 0 };
  const all = lanes();
  // Healthy lanes first, but still fall back to cooling-down ones rather than
  // give up — a 60s cooldown shouldn't hard-fail a student if it's recovered.
  const order = [...all.filter((l) => !isSick(l.name)), ...all.filter((l) => isSick(l.name))];

  let lastDown = "";
  for (const lane of order) {
    try {
      const r = await lane.run(source, stdin, offset);
      sick.delete(lane.name);
      return { ...r, runner: lane.name };
    } catch (e) {
      if (e instanceof LaneDown) {
        sick.set(lane.name, Date.now() + COOLDOWN_MS);
        lastDown = e.message;
        continue; // try the next lane
      }
      throw e;
    }
  }
  return {
    compiled: false,
    stdout: "",
    error: `The code runner is unavailable right now — this is on our side, not your code. Try again in a minute.${lastDown ? `\n(technical: ${lastDown})` : ""}`,
    runner: "none",
  };
}

// ─── Compiler Explorer ───────────────────────────────────────────────────────

async function runViaGodbolt(source: string, stdin: string, offset: number, compilerId: string): Promise<RunResult> {
  let res: Response;
  try {
    res = await fetch(`${GODBOLT_URL}/api/compiler/${compilerId}/compile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "classOS-edu/1.0" },
      body: JSON.stringify({
        source,
        lang: "java",
        allowStoreCodeDebug: false,
        options: {
          userArguments: "",
          executeParameters: { args: [], stdin },
          compilerOptions: { executorRequest: true },
          filters: { execute: true },
        },
      }),
      signal: AbortSignal.timeout(WORK_MS),
    });
  } catch (e) {
    throw new LaneDown(`${compilerId} unreachable: ${(e as Error).message.slice(0, 80)}`);
  }
  if (!res.ok) throw new LaneDown(`${compilerId} HTTP ${res.status}`);

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new LaneDown(`${compilerId} returned non-JSON`);
  }
  const lines = (arr: { text: string }[] | undefined) => (arr || []).map((l) => l.text).join("\n");

  const build = data.buildResult;
  if (build && build.code !== 0) {
    // Student's code didn't compile — a real answer, not a lane failure.
    return { compiled: false, stdout: "", error: remapErrors(lines(build.stderr) || "Compilation failed.", offset) };
  }
  const stdout = lines(data.stdout);
  const stderr = lines(data.stderr);
  if (data.code !== 0 && stderr) {
    return { compiled: true, stdout, error: remapErrors(stderr, offset) };
  }
  return { compiled: true, stdout, error: "" };
}

// ─── Self-hosted Piston (set PISTON_URL) ─────────────────────────────────────

async function runViaPiston(source: string, stdin: string, offset: number): Promise<RunResult> {
  let res: Response;
  try {
    res = await fetch(`${PISTON_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(PISTON_TOKEN ? { "X-Runner-Token": PISTON_TOKEN } : {}),
      },
      body: JSON.stringify({
        language: "java",
        version: PISTON_JAVA,
        files: [{ name: "Main.java", content: source }],
        stdin,
        compile_timeout: 10000,
        run_timeout: 5000,
      }),
      signal: AbortSignal.timeout(PROBE_MS),
    });
  } catch (e) {
    throw new LaneDown(`piston unreachable: ${(e as Error).message.slice(0, 80)}`);
  }
  if (!res.ok) throw new LaneDown(`piston HTTP ${res.status}`);

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new LaneDown("piston returned non-JSON");
  }
  if (data.compile && data.compile.code !== 0) {
    return { compiled: false, stdout: "", error: remapErrors(data.compile.stderr || "Compilation failed.", offset) };
  }
  const run = data.run || {};
  const stderr = run.stderr || "";
  // Piston's Java runtime compiles AND runs in one step, so javac errors arrive
  // in run.stderr with NO `compile` object at all. Without this check a syntax
  // error was reported to the student as "compiled fine, printed nothing" —
  // the single most misleading thing this could tell a beginner.
  if (run.code !== 0 && isJavaCompileError(stderr)) {
    return { compiled: false, stdout: "", error: remapErrors(stderr, offset) };
  }
  if (run.code !== 0 && stderr) {
    return { compiled: true, stdout: run.stdout ?? "", error: remapErrors(stderr, offset) };
  }
  return { compiled: true, stdout: run.stdout ?? "", error: "" };
}

// javac failure vs a runtime exception. A runtime crash means the code DID
// compile, so the two must not be conflated.
function isJavaCompileError(stderr: string): boolean {
  if (/Exception in thread|\bat [\w.$]+\(/.test(stderr)) return false; // stack trace → it ran
  return /error: compilation failed/i.test(stderr) || /^\s*\S+\.java\S*:\d+: error:/m.test(stderr);
}
