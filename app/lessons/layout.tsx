import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { excludeInternal } from "@/lib/curriculum/internal";

// Prototype-v4 sidebar: topic rows with status dots, lesson code minis, legend.
export default async function LessonsLayout({ children }: { children: React.ReactNode }) {
  const me = await currentUser();
  if (!me) redirect("/join");
  // Internal chapters (demo seeds, import tests) must never reach a student.
  // Filtered in JS — see lib/curriculum/internal.ts for why not in the query.
  const chapters = excludeInternal(
    await prisma.chapter.findMany({
      orderBy: { order: "asc" },
      include: { lessons: { orderBy: { order: "asc" } } },
    })
  );
  const progress = await prisma.progress.findMany({ where: { userId: me.id } });
  const statusByLesson = new Map(progress.map((p) => [p.lessonId, p.status]));
  const dot = (s?: string) => (s === "MASTERED" ? "m" : s === "IN_PROGRESS" ? "p" : "n");
  const isInteractive = (l: { flow: unknown }) => (((l.flow as any)?.steps as unknown[]) || []).length > 0;

  const lessonLink = (l: { id: string; code: string; title: string; flow: unknown }) => (
    <Link key={l.id} href={`/lessons/${l.code}`} className="topic">
      <span className={`dot ${dot(statusByLesson.get(l.id))}`} />
      {l.title}
      {/* Only some lessons are the do-first interactive experience yet; the
          rest are still reading. Say which is which up front rather than
          letting a student find out by landing in a wall of text. */}
      {isInteractive(l) && <span className="playmark" title="Interactive — do it, don't read it">▶</span>}
      <span className="mini">{l.code}</span>
    </Link>
  );

  return (
    <div className="shell">
      {/* On phones the sidebar is hidden, which used to leave a student stuck
          on whichever lesson they landed on with no way to browse. This picker
          appears only there. */}
      <details className="lessonpicker">
        <summary>☰ All lessons</summary>
        <div className="pickerbody">{chapters.map((c) => <div key={c.id}>{c.lessons.map(lessonLink)}</div>)}</div>
      </details>
      <aside className="side">
        {chapters.map((c) => (
          <div key={c.id}>
            <h3>{c.title}</h3>
            {c.lessons.map(lessonLink)}
          </div>
        ))}
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
