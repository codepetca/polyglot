import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { excludeInternal } from "@/lib/curriculum/internal";
import { studentCode } from "@/lib/curriculum/codehs";
import LessonNav, { type NavUnit } from "@/components/lesson/LessonNav";

// Prototype-v4 sidebar: units that fold, topic rows with status dots, lesson
// code minis. The folding lives in LessonNav because it needs the current
// pathname to know which unit to open.
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
  const dot = (s?: string): "m" | "p" | "n" => (s === "MASTERED" ? "m" : s === "IN_PROGRESS" ? "p" : "n");
  const isInteractive = (l: { flow: unknown }) => (((l.flow as any)?.steps as unknown[]) || []).length > 0;

  const units: NavUnit[] = chapters.map((c) => ({
    id: c.id,
    title: c.title,
    lessons: c.lessons.map((l) => ({
      code: l.code,
      shown: studentCode(l.code),
      title: l.title,
      dot: dot(statusByLesson.get(l.id)),
      interactive: isInteractive(l),
    })),
  }));

  return (
    <div className="shell">
      {/* On phones the sidebar is hidden, which used to leave a student stuck
          on whichever lesson they landed on with no way to browse. This picker
          appears only there. */}
      <details className="lessonpicker">
        <summary>☰ All lessons</summary>
        <div className="pickerbody">
          <LessonNav units={units} />
        </div>
      </details>
      <aside className="side">
        <LessonNav units={units} />
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
