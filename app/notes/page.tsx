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
export default async function NotesPage() {
  const me = await currentUser();
  if (!me) redirect("/login");

  const chapters = await prisma.chapter.findMany({
    where: { title: { not: { startsWith: "__" } } },
    orderBy: { order: "asc" },
    select: {
      title: true,
      lessons: {
        orderBy: { order: "asc" },
        select: { code: true, title: true, flow: true },
      },
    },
  });

  const units = chapters
    .map((c) => ({
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
        <p className="meta">
          {total} key point{total === 1 ? "" : "s"} from the lessons you have worked through.
        </p>
      </header>

      {units.length === 0 ? (
        <p className="meta">Nothing yet. Key points appear here as you finish lessons.</p>
      ) : (
        units.map((u) => (
          <section className="noteunit" key={u.title}>
            <h2>{u.title}</h2>
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
