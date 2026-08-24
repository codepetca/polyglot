import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePikaStudent, pikaPreflight } from "@/lib/pika/guard";
import { excludeInternal } from "@/lib/curriculum/internal";
import { studentCode } from "@/lib/curriculum/codehs";

export const dynamic = "force-dynamic";

// What the Pika tab renders: this student's units, and where they are in each.
// Read-only, and scoped to the one student the token names.

export async function OPTIONS(req: Request) {
  return pikaPreflight(req);
}

export async function GET(req: Request) {
  const ctx = await requirePikaStudent(req);
  if (ctx instanceof NextResponse) return ctx;

  // Internal chapters are filtered in JS, never with a Prisma startsWith —
  // underscore is a SQL wildcard, so it silently matches nothing.
  const chapters = excludeInternal(
    await prisma.chapter.findMany({
      orderBy: { order: "asc" },
      select: { title: true, order: true, lessons: { orderBy: { order: "asc" }, select: { id: true, code: true, title: true } } },
    }),
  );

  const progress = await prisma.progress.findMany({
    where: { userId: ctx.userId },
    select: { lessonId: true, status: true },
  });
  const status = new Map(progress.map((p) => [p.lessonId, p.status]));

  const units = chapters.map((c) => {
    const lessons = c.lessons.map((l) => ({
      code: studentCode(l.code),
      title: l.title,
      status: status.get(l.id) ?? "NOT_STARTED",
    }));
    return {
      unit: c.order + 1,
      title: c.title,
      lessons,
      mastered: lessons.filter((l) => l.status === "MASTERED").length,
      total: lessons.length,
    };
  });

  return NextResponse.json(
    { student: { name: ctx.claims.name ?? null, classroom: ctx.claims.classroom ?? null }, units },
    { headers: ctx.headers },
  );
}
