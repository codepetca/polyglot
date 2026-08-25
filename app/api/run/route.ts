import { NextResponse } from "next/server";
import { resolveActor } from "@/lib/actor";
import { runJava } from "@/lib/java/piston";
import { rateLimit } from "@/lib/ratelimit";
import { logEvent, EVENT } from "@/lib/events";
import { prisma } from "@/lib/db";
import { resolveLessonCode } from "@/lib/curriculum/codehs";

// Runs Java (Compiler Explorer, or self-hosted Piston via PISTON_URL).
// Auth required — this must not be a public compute
// endpoint once the app is hosted. `wrap` splices the student's code into the
// beginner input() template (see lib/java/piston.ts).
// Room for a dead lane to time out AND the fallback to still run. Without this
// the platform default cut the request off mid-failover, so a working runner
// reported as unavailable.
export const maxDuration = 60;

export async function POST(req: Request) {
  const me = await resolveActor(req);
  if (!me) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  // Interactive flow lessons are run-heavy by design (every step is a ▶ press).
  if (!rateLimit(`run:${me.id}`, 20, 60 * 1000)) {
    return NextResponse.json({ compiled: false, stdout: "", error: "Slow down — max 20 runs per minute." });
  }

  const { code, stdin, wrap, wrapMode, lessonCode, stepId } = await req.json();
  if (typeof code !== "string") return NextResponse.json({ error: "code required" }, { status: 400 });

  // Hidden library classes. A step can hand the student classes to USE without
  // showing the source — the whole point of 5.3, where being a client means
  // working from documentation. The code never reaches the browser, so it is
  // fetched here and compiled in behind whatever they wrote.
  let library = "";
  if (typeof lessonCode === "string" && typeof stepId === "string") {
    const lesson = await prisma.lesson.findUnique({ where: { code: resolveLessonCode(lessonCode) }, select: { flow: true } });
    const step = (((lesson?.flow as any)?.steps as any[]) || []).find((s) => s.id === stepId);
    if (typeof step?.library === "string") library = step.library;
  }

  const result = await runJava(code, stdin || "", {
    append: library || undefined,
    wrapBeginner: wrap !== false,
    // "methods" puts the snippet at class level so a student can define methods.
    mode: wrapMode === "methods" ? "methods" : "beginner",
  });
  // Analytics substrate (best-effort): did their code compile/run? Learners only.
  if (me.role === "STUDENT") logEvent({ type: EVENT.CODE_RUN, userId: me.id, classId: me.classId, lessonCode: lessonCode ?? null, compiled: (result as any)?.compiled ?? null });
  return NextResponse.json(result);
}
