import { NextResponse } from "next/server";
import { requireRoleApi } from "@/lib/auth";
import { runJava, runnerHealth } from "@/lib/java/piston";
import { LANGS } from "@/lib/run/languages";

// Runner diagnostics (admin). GET = configured lanes + which are cooling down.
// POST = actually execute a trivial program and report which lane served it,
// so an outage is provable in one click instead of guessed at.
export async function GET() {
  const gate = await requireRoleApi("ADMIN");
  if (gate instanceof NextResponse) return gate;
  return NextResponse.json({ lanes: runnerHealth() });
}

export async function POST() {
  const gate = await requireRoleApi("ADMIN");
  if (gate instanceof NextResponse) return gate;
  const started = Date.now();
  // Ping EVERY language, not just Java. A language the scratchpad offers but
  // the runner cannot serve is worse than one it never offered — the student
  // finds out, not the admin. This makes it the admin who finds out.
  const probes: Record<string, { ok: boolean; ms: number; servedBy?: string; error?: string }> = {};
  for (const spec of Object.values(LANGS)) {
    const t = Date.now();
    const src = spec.id === "java" ? 'System.out.print("PING-OK");' : 'console.log("PING-OK");';
    const p = await runJava(src, "", { wrapBeginner: spec.wraps, lang: spec.id });
    probes[spec.id] = {
      ok: p.compiled && p.stdout.includes("PING-OK"),
      ms: Date.now() - t,
      servedBy: p.runner,
      error: p.error || undefined,
    };
  }
  const r = probes.java;
  return NextResponse.json({
    ok: r.ok,
    servedBy: r.servedBy,
    ms: Date.now() - started,
    languages: probes,
    lanes: runnerHealth(),
  });
}
