import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { logEvent, EVENT } from "@/lib/events";
import LessonRenderer from "@/components/LessonRenderer";
import LessonWorkspace from "@/components/LessonWorkspace";
import FlowPlayer from "@/components/lesson/FlowPlayer";
import HighlightOnLoad from "@/components/lesson/HighlightOnLoad";
import type { Block, Exercise, QuizQuestion } from "@/lib/curriculum/blocks";
import { stripAnswers } from "@/lib/curriculum/questions";
import { resolveLessonCode, studentCode } from "@/lib/curriculum/codehs";

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ highlight?: string }>;
}) {
  const { code: rawCode } = await params;
  const { highlight } = await searchParams;
  const me = await currentUser();
  if (!me) redirect("/join");
  // Students may arrive with CodeHS's number (3.3) rather than ours (2.3).
  const code = resolveLessonCode(rawCode);
  const lesson = await prisma.lesson.findUnique({ where: { code }, include: { chapter: true } });
  if (!lesson) notFound();

  // Analytics substrate (best-effort): students opening a lesson. Staff previews
  // are excluded so the design data reflects real learners only.
  if (me.role === "STUDENT") logEvent({ type: EVENT.LESSON_VIEW, userId: me.id, classId: me.classId, lessonId: lesson.id, code });

  const progress = await prisma.progress.findUnique({
    where: { userId_lessonId: { userId: me.id, lessonId: lesson.id } },
  });
  const status = progress?.status ?? "NOT_STARTED";
  const readiness = Math.round((progress?.readiness ?? 0) * 100);
  const pill = status === "MASTERED" ? "m" : status === "IN_PROGRESS" ? "p" : "n";
  const pillText = status === "MASTERED" ? "● MASTERED" : status === "IN_PROGRESS" ? "● IN PROGRESS" : "○ NOT STARTED";

  // Strip answer keys out of any inline quiz blocks before they reach the browser.
  const blocks = (lesson.blocks as unknown as Block[]).map((b) =>
    b.type === "quiz" ? { ...b, questions: b.questions.map(stripAnswers) } : b
  ) as Block[];
  const exercise = lesson.exercise as unknown as Exercise;
  const objectives = (lesson.objectives as unknown as string[]) || [];

  // Only the small formative subset (with answers) ships to the browser; the
  // full bank — the clean quiz's answer key — stays server-side (/api/quiz).
  const bank = (lesson.quizBank as unknown as QuizQuestion[]) || [];
  const practiceQuestions = bank.slice(0, 3);
  // The clean quiz exists if there's a typed mastery quiz OR a legacy bank.
  const hasMastery = ((lesson.masteryQuiz as unknown as unknown[]) || []).length > 0 || bank.length > 0;

  // Interactive flow: when authored, it IS the lesson; the classic blocks
  // become the "textbook version" for readers. Find the next lesson for the
  // done-screen link.
  const hasFlow = (((lesson.flow as any)?.steps as unknown[]) || []).length > 0;
  let nextHref: string | null = null;
  if (hasFlow) {
    const next = await prisma.lesson.findFirst({
      where: { chapterId: lesson.chapterId, order: { gt: lesson.order } },
      orderBy: { order: "asc" },
      select: { code: true },
    });
    nextHref = next ? `/lessons/${next.code}` : null;
  }

  const classic = (
    <>
      <div className="panel lesson">
        <h2>
          Lesson <span className="tag k">SET CONTENT — NOT AI</span>
        </h2>
        {lesson.goal && <div className="goalbox" dangerouslySetInnerHTML={{ __html: lesson.goal }} />}
        {objectives.length > 0 && (
          <div className="objectives">
            <div className="ch">🎯 IN THIS LESSON</div>
            <ul>
              {objectives.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}
        <LessonRenderer blocks={blocks} lessonCode={lesson.code} />
      </div>
      {highlight && <HighlightOnLoad text={highlight} />}

      <LessonWorkspace
        lessonCode={lesson.code}
        lessonTitle={lesson.title}
        exercise={exercise}
        practiceQuestions={practiceQuestions}
        hasBank={hasMastery}
        mastered={status === "MASTERED"}
      />
    </>
  );

  return (
    <>
      {/* An interactive lesson shows the student ONE thing: the lesson.
          Everything that used to sit above it — a MASTERED/NOT STARTED badge, a
          "readiness 0%" meter explaining an averaging rule, a shortcut to skip
          to a quiz, a link to a second textbook version — was status and
          navigation aimed at someone confident enough to care. For a student
          who is behind and easily discouraged, a 0% bar before they have done
          anything is a reason to close the tab. So: the title, the step, and
          the documentation. Nothing else. */}
      {/* Titled exactly as CodeHS titles it, number included — a student
          holding both open must never have to work out that "2.3" here and
          "3.3" there are the same lesson. */}
      <h1 className="title" style={{ marginBottom: 4 }}>{studentCode(lesson.code)} {lesson.title}</h1>

      {hasFlow ? (
        <>
          <FlowPlayer lessonCode={lesson.code} lessonTitle={lesson.title} nextHref={nextHref} />
        </>
      ) : (
        <>
          <div className="crumb">{lesson.chapter.title.toUpperCase()} · LESSON {studentCode(lesson.code)}</div>
          {classic}
        </>
      )}

    </>
  );
}
