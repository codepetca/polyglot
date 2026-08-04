import { NextResponse } from "next/server";
import { requireRoleApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LANGUAGES, translateLesson } from "@/lib/curriculum/translate";

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
      .map((l) => ({ code: l.code, title: l.title, have: Object.keys((l.flowI18n as any) || {}) })),
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
    return NextResponse.json({ ok: false, error: (e as Error).message.slice(0, 200) });
  }
}
