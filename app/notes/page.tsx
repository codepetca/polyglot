import Link from "next/link";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { studentCode } from "@/lib/curriculum/codehs";
import { EVENT } from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * The unit scroll. Every key point a student has met, in order, on one page.
 *
 * WHY IT EXISTS: a lesson is a performance — fifteen steps, a runner, a
 * walkthrough. None of that is re-readable. Revising by replaying a lesson is
 * so slow that nobody does it, so what a student actually keeps is whatever
 * they wrote down themselves, which for most of them is nothing. This is the
 * same material as the lessons, laid out to be read in a couple of minutes.
 */
export default async function NotesPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const me = await currentUser();
  if (!me) redirect("/login");
  const { all } = await searchParams;
  // Reading ahead is allowed. The default is earned-only so the page fills up
  // as they work, but nobody is ever locked out of the material itself — and
  // anyone reviewing the course needs to see all of it in one go.
  const showAll = all === "1";

  // EARNED ONLY, for students. A note appears once the step that taught it has
  // been cleared, so the page fills up as they work — same rule the tome uses.
  // Staff see everything: reviewing the course means reading all of it.
  const isStaff = me.role !== "STUDENT" || showAll;
  const cleared = isStaff
    ? null
    : new Set(
        (
          await prisma.event.findMany({
            where: { userId: me.id, type: EVENT.FLOW_STEP },
            select: { payload: true },
            take: 5000,
          })
        )
          .map((e) => (e.payload as any)?.stepId)
          .filter(Boolean)
      );

  const chapters = await prisma.chapter.findMany({
    where: { title: { not: { startsWith: "__" } } },
    orderBy: { order: "asc" },
    select: {
      title: true,
      order: true,
      lessons: {
        orderBy: { order: "asc" },
        select: { code: true, title: true, flow: true },
      },
    },
  });

  const units = chapters
    .map((c) => ({
      unit: c.order + 1,
      title: c.title,
      lessons: c.lessons
        .map((l) => ({
          code: l.code,
          shown: studentCode(l.code),
          title: l.title,
          points: (((l.flow as any)?.steps as any[]) || [])
            .filter((s) => !cleared || cleared.has(s.id))
            .map((s) => s.keypoint)
            .filter((k): k is string => typeof k === "string" && k.length > 0),
          locked: (((l.flow as any)?.steps as any[]) || []).filter(
            (s) => s.keypoint && cleared && !cleared.has(s.id)
          ).length,
        }))
        .filter((l) => l.points.length > 0),
    }))
    .filter((u) => u.lessons.length > 0);

  const total = units.reduce((n, u) => n + u.lessons.reduce((m, l) => m + l.points.length, 0), 0);

  return (
    <main className="wrap notes">
      <header className="noteshead">
        <h1>Your notes</h1>
        <p className="meta">
          {total} note{total === 1 ? "" : "s"} {showAll || me.role !== "STUDENT" ? "in the course" : "unlocked"}.{" "}
          {me.role === "STUDENT" && (
            showAll
              ? <Link href="/notes">Show only what I have unlocked</Link>
              : <Link href="/notes?all=1">Show every note in the course</Link>
          )}
        </p>
      </header>

      {units.length === 0 ? (
        <p className="meta">Nothing yet. A note appears here each time you finish a step that teaches one.</p>
      ) : (
        units.map((u) => (
          <section className="noteunit" key={u.title}>
            <h2>{u.title}</h2>
            <Link className="guidelink" href={`/notes/${u.unit}`}>Read the whole unit written out →</Link>
            {u.lessons.map((l) => (
              <div className="notelesson" key={l.code}>
                <h3>
                  <span className="notecode">{l.shown}</span>
                  <Link href={`/lessons/${l.code}`}>{l.title}</Link>
                </h3>
                <ul>
                  {l.points.map((p, j) => (
                    <li key={j}>{p}</li>
                  ))}
                </ul>
                {l.locked > 0 && (
                  <p className="notelocked">{l.locked} more to unlock in this lesson</p>
                )}
              </div>
            ))}
          </section>
        ))
      )}
    </main>
  );
}
