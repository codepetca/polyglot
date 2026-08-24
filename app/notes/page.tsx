import Link from "next/link";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { studentCode } from "@/lib/curriculum/codehs";
import { excludeInternal } from "@/lib/curriculum/internal";
import NoteList from "@/components/NoteList";

export const dynamic = "force-dynamic";

/**
 * The unit scroll. Every key point a student has met, in order, on one page.
 *
 * WHY IT EXISTS: a lesson is a performance — fifteen steps, a runner, a
 * walkthrough. None of that is re-readable. Revising by replaying a lesson is
 * so slow that nobody does it, so what a student actually keeps is whatever
 * they wrote down themselves, which for most of them is nothing. This is the
 * same material as the lessons, laid out to be read in a couple of minutes.
 *
 * FOLDED, both levels. Written out flat this page is several hundred key
 * points and minutes of scrolling to reach the unit you actually wanted. A
 * student revising one topic should see a six-row index, open the unit, open
 * the lesson, and read ten lines. Native <details>, so it costs no JavaScript
 * and the browser's own find-in-page still reaches closed sections.
 */
export default async function NotesPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const me = await currentUser();
  if (!me) redirect("/login");
  // NO GATE. Earned-only was my idea and it cost three rounds of "I still
  // cannot see the notes" — on a fresh account the page was simply empty, and
  // an empty page is indistinguishable from a broken one. Accounts get sorted
  // when Pika lands; until then every note is visible to everyone.
  void searchParams;

  // Internal chapters are filtered in JS, never with a Prisma startsWith —
  // see lib/curriculum/internal.ts for why that silently matches nothing.
  const chapters = excludeInternal(await prisma.chapter.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      order: true,
      lessons: {
        orderBy: { order: "asc" },
        // flowI18n carries the translated keypoints, so the notes can be read
        // in a second language without a second store — see
        // lib/curriculum/i18n-extract.ts.
        select: { code: true, title: true, flow: true, flowI18n: true },
      },
    },
  }));

  const units = chapters
    .map((c) => ({
      id: c.id,
      unit: c.order + 1,
      title: c.title,
      lessons: c.lessons
        .map((l) => ({
          code: l.code,
          shown: studentCode(l.code),
          title: l.title,
          points: (((l.flow as any)?.steps as any[]) || [])
            .filter((s) => typeof s.keypoint === "string" && s.keypoint.length > 0)
            .map((s) => ({
              en: s.keypoint as string,
              // stepId -> locale -> keypoint. Sent whole; the client picks the
              // language, because the preference lives in the browser.
              alt: Object.fromEntries(
                Object.entries(((l.flowI18n as any) || {}) as Record<string, any>)
                  .map(([loc, t]) => [loc, t?.[s.id]?.keypoint])
                  .filter(([, v]) => typeof v === "string" && v),
              ) as Record<string, string>,
            })),
        }))
        .filter((l) => l.points.length > 0),
    }))
    .filter((u) => u.lessons.length > 0);

  const total = units.reduce((n, u) => n + u.lessons.reduce((m, l) => m + l.points.length, 0), 0);

  return (
    <main className="wrap notes">
      <header className="noteshead">
        <h1>Your notes</h1>
        <p className="meta">{total} key point{total === 1 ? "" : "s"} from across the course. Open a unit to read it.</p>
      </header>

      {units.length === 0 ? (
        <p className="meta">Nothing yet. A note appears here each time you finish a step that teaches one.</p>
      ) : (
        units.map((u) => {
          const notes = u.lessons.reduce((m, l) => m + l.points.length, 0);
          return (
            <details className="notefold unit" key={u.id}>
              <summary>
                <span className="foldtitle">{u.title}</span>
                <span className="foldcount">
                  {u.lessons.length} lesson{u.lessons.length === 1 ? "" : "s"} · {notes} note{notes === 1 ? "" : "s"}
                </span>
              </summary>
              <div className="foldbody">
                <Link className="guidelink" href={`/notes/${u.unit}`}>Read the whole unit written out →</Link>
                {u.lessons.map((l) => (
                  <details className="notefold lesson" key={l.code}>
                    <summary>
                      <span className="notecode">{l.shown}</span>
                      <span className="foldtitle">{l.title}</span>
                      <span className="foldcount">{l.points.length}</span>
                    </summary>
                    <div className="foldbody">
                      <NoteList points={l.points} />
                      <Link className="guidelink" href={`/lessons/${l.code}`}>Open the lesson →</Link>
                    </div>
                  </details>
                ))}
              </div>
            </details>
          );
        })
      )}
    </main>
  );
}
