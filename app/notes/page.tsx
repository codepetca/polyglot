import Link from "next/link";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { studentCode } from "@/lib/curriculum/codehs";

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
  // NO GATE. Earned-only was my idea and it cost three rounds of "I still
  // cannot see the notes" — on a fresh account the page was simply empty, and
  // an empty page is indistinguishable from a broken one. Accounts get sorted
  // when Pika lands; until then every note is visible to everyone.
  void searchParams;

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
            .map((s) => s.keypoint)
            .filter((k): k is string => typeof k === "string" && k.length > 0),
        }))
        .filter((l) => l.points.length > 0),
    }))
    .filter((u) => u.lessons.length > 0);

  const total = units.reduce((n, u) => n + u.lessons.reduce((m, l) => m + l.points.length, 0), 0);

  return (
    <main className="wrap notes">
      <header className="noteshead">
        <h1>Your notes</h1>
        <p className="meta">{total} key point{total === 1 ? "" : "s"} from across the course.</p>
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
              </div>
            ))}
          </section>
        ))
      )}
    </main>
  );
}
