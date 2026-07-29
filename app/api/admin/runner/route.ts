import { NextResponse } from "next/server";
import { requireRoleApi } from "@/lib/auth";
import { runJava, runnerHealth } from "@/lib/java/piston";

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
  const r = await runJava('System.out.print("PING-OK");', "", { wrapBeginner: true });
  return NextResponse.json({
    ok: r.compiled && r.stdout.includes("PING-OK"),
    servedBy: r.runner,
    ms: Date.now() - started,
    stdout: r.stdout,
    error: r.error,
    lanes: runnerHealth(),
  });
}
