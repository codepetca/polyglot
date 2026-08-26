import { NextResponse } from "next/server";
import { requireRoleApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LANGUAGES, translateLesson, DEFAULT_TRANSLATE_MODEL } from "@/lib/curriculum/translate";
import { studentCode } from "@/lib/curriculum/codehs";
import { getBudgetConfig } from "@/lib/settings";

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
  // Today's spend, so a batch run is not started into an exhausted budget.
  const day = new Date().toISOString().slice(0, 10);
  const [cfg, sum] = await Promise.all([
    getBudgetConfig(),
    prisma.aiCall.aggregate({ _sum: { cost: true }, where: { createdAt: { gte: new Date(day + "T00:00:00.000Z") } } }),
  ]);
  const spent = sum._sum.cost || 0;

  return NextResponse.json({
    budget: { spent, cap: cfg.dailyCapUsd, over: spent >= cfg.dailyCapUsd },
    defaultModel: DEFAULT_TRANSLATE_MODEL,
    languages: Object.entries(LANGUAGES).map(([code, v]) => ({ code, ...v })),
    lessons: lessons
      .filter((l) => !l.chapter.title.startsWith("__") && (((l.flow as any)?.steps || []).length > 0))
      // `shown` is the number the student sees. The internal code is one unit
      // behind, so a page listing 2.1 looks like a unit that does not exist.
      .map((l) => {
        // COUNT WHAT MATCHES, NOT WHAT IS STORED.
        //
        // This used to return Object.keys(flowI18n) — merely which locales had
        // ever been written. Translations are keyed by STEP ID, so rewriting a
        // lesson orphans every entry for it: the locale is still "there", the
        // console said 57 of 57 lessons have Simplified Chinese, "Translate 0
        // missing" was the only option offered, and a fifth of the course
        // quietly served English. There was no way to notice or to fix it from
        // this screen.
        const ids: string[] = (((l.flow as any)?.steps || []) as { id: string }[]).map((x) => x.id);
        const i18n = ((l.flowI18n as any) || {}) as Record<string, Record<string, unknown>>;
        const have: Record<string, number> = {};
        for (const [loc, map] of Object.entries(i18n)) {
          const keys = Object.keys(map || {});
          have[loc] = ids.filter((id) => keys.includes(id)).length;
        }
        return { code: l.code, shown: studentCode(l.code), title: l.title, steps: ids.length, have };
      }),
  });
}

export async function POST(req: Request) {
  const me = await requireRoleApi("ADMIN");
  if (me instanceof NextResponse) return me;
  const { lessonCode, locale, model } = await req.json();
  try {
    const r = await translateLesson(String(lessonCode || ""), String(locale || ""), me.id, model ? String(model) : undefined);
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
