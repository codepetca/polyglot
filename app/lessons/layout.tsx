import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { excludeInternal } from "@/lib/curriculum/internal";
import { studentCode } from "@/lib/curriculum/codehs";
import LessonNav, { type NavUnit } from "@/components/lesson/LessonNav";
import SideRail from "@/components/lesson/SideRail";
import Workbench from "@/components/student/Workbench";
import { getSetting } from "@/lib/settings";

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

  // Highlight-to-ask can send a question to the teacher, when they have turned
  // that on. Resolved here rather than in the page so the workbench can live
  // beside the lesson instead of inside it.
  let askTeacher: { id: string; name: string } | null = null;
  if (me.classId) {
    const cls = await prisma.class.findUnique({ where: { id: me.classId }, include: { teacher: true } });
    if (cls?.teacher) {
      const prefs = await getSetting<{ askTeacher?: boolean }>(`prefs:${cls.teacher.id}`, {});
      if (prefs.askTeacher) askTeacher = { id: cls.teacher.id, name: cls.teacher.name };
    }
  }

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
      <SideRail units={units} />
      <main className="main">{children}</main>
      {/* A flex SIBLING of the lesson, not an overlay: opening a tool narrows
          the lesson instead of sitting on top of it. */}
      <Workbench askTeacher={askTeacher} />
    </div>
  );
}
