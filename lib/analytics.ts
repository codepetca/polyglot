import "server-only";
import { prisma } from "./db";
import { EVENT } from "./events";
import { isInternalChapter } from "./curriculum/internal";

// Product analytics over the existing Event log. Nothing new is collected —
// this is purely a read.
//
// It exists to answer the one question that decides whether this project is
// worth continuing, without having to ask a single person: DID ANYONE ACTUALLY
// USE IT, AND DID THEY COME BACK? Shipping without this is how a project gets
// "ignored" and the owner can't tell the difference between "nobody came" and
// "they came and it was bad" — two problems with completely different fixes.

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export type Funnel = {
  code: string;
  title: string;
  interactive: boolean;
  steps: number;
  viewers: number; // distinct learners who opened it
  starters: number; // distinct learners who completed >= 1 step
  finishers: number; // distinct learners who completed the LAST step
  dropoff: { stepId: string; kind: string; reached: number }[]; // per-step reach, in order
};

export type Analytics = {
  windowDays: number;
  totals: { learners: number; sessionsStarted: number; activated: number; returned: number; stepsDone: number; runs: number; tutorAsks: number };
  daily: { day: string; learners: number; newLearners: number; steps: number }[];
  funnels: Funnel[];
  hardestSteps: { lesson: string; stepId: string; kind: string; attempts: number; firstTryRate: number | null }[];
  quietSince: number | null; // days since the last learner activity, null = never any
};

export async function getAnalytics(windowDays = 30): Promise<Analytics> {
  const since = new Date(Date.now() - windowDays * DAY);

  // Real anonymous practice learners only. /api/auth/practice creates them with
  // NO email and NO class; demo-seeded students (scripts/seed-mastery) also have
  // no email but DO belong to a class — without the classId filter they inflate
  // every number here with fake people. Events are then scoped to this set for
  // the same reason.
  const [learners, lessons] = await Promise.all([
    prisma.user.findMany({ where: { role: "STUDENT", email: null, classId: null }, select: { id: true, createdAt: true } }),
    prisma.lesson.findMany({
      orderBy: [{ chapter: { order: "asc" } }, { order: "asc" }],
      select: { id: true, code: true, title: true, flow: true, chapter: { select: { title: true } } },
    }),
  ]);
  const learnerIds = learners.map((l) => l.id);
  const events = learnerIds.length
    ? await prisma.event.findMany({
        where: { at: { gte: since }, userId: { in: learnerIds } },
        orderBy: { at: "asc" },
        select: { userId: true, type: true, at: true, payload: true },
      })
    : [];

  // Internal chapters (demo seeds, import tests) must not pollute the numbers.
  const visible = lessons.filter((l) => !isInternalChapter(l.chapter.title));

  // ── daily + totals ──
  const byDay = new Map<string, Set<string>>();
  const stepsByDay = new Map<string, number>();
  const activeDays = new Map<string, Set<string>>(); // userId → set of day keys
  let stepsDone = 0;
  let runs = 0;
  let tutorAsks = 0;
  let lastActivity: Date | null = null;

  // per-user per-lesson step completion, and per-step reach
  const stepReach = new Map<string, Set<string>>(); // `${lessonId}|${stepId}` → users
  const lessonViewers = new Map<string, Set<string>>(); // lessonId → users
  const lessonStarters = new Map<string, Set<string>>();
  const attemptTotals = new Map<string, { attempts: number; firstTry: number; n: number; kind: string; lessonId: string }>();

  for (const e of events) {
    const uid = e.userId!;
    const k = dayKey(e.at);
    if (!byDay.has(k)) byDay.set(k, new Set());
    byDay.get(k)!.add(uid);
    if (!activeDays.has(uid)) activeDays.set(uid, new Set());
    activeDays.get(uid)!.add(k);
    if (!lastActivity || e.at > lastActivity) lastActivity = e.at;

    const p = (e.payload || {}) as any;
    if (e.type === EVENT.LESSON_VIEW && p.lessonId) {
      if (!lessonViewers.has(p.lessonId)) lessonViewers.set(p.lessonId, new Set());
      lessonViewers.get(p.lessonId)!.add(uid);
    }
    if (e.type === EVENT.CODE_RUN) runs++;
    if (e.type === EVENT.TUTOR_MESSAGE) tutorAsks++;
    if (e.type === EVENT.FLOW_STEP) {
      stepsDone++;
      stepsByDay.set(k, (stepsByDay.get(k) || 0) + 1);
      if (p.lessonId && p.stepId) {
        const key = `${p.lessonId}|${p.stepId}`;
        if (!stepReach.has(key)) stepReach.set(key, new Set());
        stepReach.get(key)!.add(uid);
        if (!lessonStarters.has(p.lessonId)) lessonStarters.set(p.lessonId, new Set());
        lessonStarters.get(p.lessonId)!.add(uid);

        const a = attemptTotals.get(key) || { attempts: 0, firstTry: 0, n: 0, kind: p.kind || "?", lessonId: p.lessonId };
        a.attempts += Number(p.attempts) || 1;
        if (p.correct === true || Number(p.attempts) === 1) a.firstTry++;
        a.n++;
        a.kind = p.kind || a.kind;
        attemptTotals.set(key, a);
      }
    }
  }

  const days: Analytics["daily"] = [];
  const newByDay = new Map<string, number>();
  for (const l of learners) {
    const k = dayKey(l.createdAt);
    newByDay.set(k, (newByDay.get(k) || 0) + 1);
  }
  for (let i = windowDays - 1; i >= 0; i--) {
    const k = dayKey(new Date(Date.now() - i * DAY));
    days.push({ day: k, learners: byDay.get(k)?.size || 0, newLearners: newByDay.get(k) || 0, steps: stepsByDay.get(k) || 0 });
  }

  const activated = [...activeDays.keys()].filter((u) => {
    // did they complete at least one step (not just open a page)?
    return events.some((e) => e.userId === u && e.type === EVENT.FLOW_STEP);
  }).length;
  const returned = [...activeDays.values()].filter((s) => s.size >= 2).length;

  // ── per-lesson funnels ──
  const funnels: Funnel[] = visible.map((l) => {
    const steps = (((l.flow as any)?.steps as any[]) || []);
    const lastId = steps.length ? steps[steps.length - 1].id : null;
    return {
      code: l.code,
      title: l.title,
      interactive: steps.length > 0,
      steps: steps.length,
      viewers: lessonViewers.get(l.id)?.size || 0,
      starters: lessonStarters.get(l.id)?.size || 0,
      finishers: lastId ? stepReach.get(`${l.id}|${lastId}`)?.size || 0 : 0,
      dropoff: steps.map((s: any) => ({
        stepId: s.id,
        kind: s.kind,
        reached: stepReach.get(`${l.id}|${s.id}`)?.size || 0,
      })),
    };
  });

  // ── hardest steps: most attempts per completion ──
  const codeOf = new Map(visible.map((l) => [l.id, l.code]));
  const hardestSteps = [...attemptTotals.entries()]
    .filter(([, a]) => a.n >= 2) // need a little signal before calling something hard
    .map(([key, a]) => ({
      lesson: codeOf.get(a.lessonId) || "?",
      stepId: key.split("|")[1],
      kind: a.kind,
      attempts: Number((a.attempts / a.n).toFixed(2)),
      firstTryRate: a.n ? Number((a.firstTry / a.n).toFixed(2)) : null,
    }))
    .sort((x, y) => y.attempts - x.attempts)
    .slice(0, 10);

  return {
    windowDays,
    totals: {
      learners: learners.length,
      sessionsStarted: learners.filter((l) => l.createdAt >= since).length,
      activated,
      returned,
      stepsDone,
      runs,
      tutorAsks,
    },
    daily: days,
    funnels,
    hardestSteps,
    quietSince: lastActivity ? Math.floor((Date.now() - (lastActivity as Date).getTime()) / DAY) : null,
  };
}
