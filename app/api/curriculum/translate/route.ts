import { NextResponse } from "next/server";
import { requireRoleApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LANGUAGES, translateLesson } from "@/lib/curriculum/translate";
import { studentCode } from "@/lib/curriculum/codehs";

// Generate the ESL language assist for a lesson (admin).
// This does NOT translate the course — the English stays primary and these
// notes render underneath it on demand. See lib/curriculum/translate.ts.

export async function GET() {
  const gate = await requireRoleApi("ADMIN");
  if (gate instanceof NextResponse) return gate;
  const lessons = await prisma.lesson.findMany({
    orderBy: [{ chapter: { order: "asc" } }, { order: "asc" }],
    select: { code: true, title: true, flow: true, flowI18n: true, chapter: { select: { title: true } } },
  });
  return NextResponse.json({
    languages: Object.entries(LANGUAGES).map(([code, v]) => ({ code, ...v })),
    lessons: lessons
      .filter((l) => !l.chapter.title.startsWith("__") && (((l.flow as any)?.steps || []).length > 0))
      // `shown` is the number the student sees. The internal code is one unit
      // behind, so a page listing 2.1 looks like a unit that does not exist.
      .map((l) => ({ code: l.code, shown: studentCode(l.code), title: l.title, have: Object.keys((l.flowI18n as any) || {}) })),
  });
}

export async function POST(req: Request) {
  const me = await requireRoleApi("ADMIN");
  if (me instanceof NextResponse) return me;
  const { lessonCode, locale } = await req.json();
  try {
    const r = await translateLesson(String(lessonCode || ""), String(locale || ""), me.id);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    // Prisma puts the actual reason at the END of a very long message, so
    // slicing the first 200 characters showed only the payload dump — which is
    // how a sparse-array bug read as a Chinese encoding problem for an hour.
    const msg = (e as Error).message.replace(/\s+/g, " ").trim();
    const reason = msg.length > 240 ? `${msg.slice(0, 120)} … ${msg.slice(-160)}` : msg;
    return NextResponse.json({ ok: false, error: reason });
  }
}
