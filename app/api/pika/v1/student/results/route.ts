import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePikaStudent, pikaPreflight } from "@/lib/pika/guard";
import { excludeInternal } from "@/lib/curriculum/internal";
import { studentCode } from "@/lib/curriculum/codehs";

export const dynamic = "force-dynamic";

// The gradebook feed. Pika PULLS this and writes its own grades.
//
// polyglot never pushes into Pika and never holds a Supabase credential. That
// keeps the port one-directional for writes, which is the smallest version of
// this that still delivers gradable assignments. See PIKA-INTEGRATION.md.

export async function OPTIONS(req: Request) {
  return pikaPreflight(req);
}

export async function GET(req: Request) {
  const ctx = await requirePikaStudent(req);
  if (ctx instanceof NextResponse) return ctx;

  const lessons = excludeInternal(
    await prisma.chapter.findMany({
      orderBy: { order: "asc" },
      select: { title: true, lessons: { orderBy: { order: "asc" }, select: { id: true, code: true, title: true } } },
    }),
  ).flatMap((c) => c.lessons);

  const byId = new Map(lessons.map((l) => [l.id, l]));
  const progress = await prisma.progress.findMany({
    where: { userId: ctx.userId, lessonId: { in: lessons.map((l) => l.id) } },
    select: { lessonId: true, status: true, readiness: true, updatedAt: true },
  });

  const results = progress
    .filter((p) => byId.has(p.lessonId))
    .map((p) => {
      const l = byId.get(p.lessonId)!;
      return {
        lesson: studentCode(l.code),
        title: l.title,
        status: p.status,
        // readiness is polyglot's own 0..1 evidence toward mastery, so it is the
        // honest score to hand a gradebook. Reported only once a student has
        // actually started: a lesson nobody reached is not a lesson failed, and
        // sending 0 for it would quietly tank a real grade.
        score: p.status === "NOT_STARTED" ? null : Number(p.readiness.toFixed(3)),
        completedAt: p.status === "MASTERED" ? p.updatedAt.toISOString() : null,
      };
    });

  return NextResponse.json({ results }, { headers: ctx.headers });
}
