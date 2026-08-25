import { prisma } from "@/lib/db";
import { getSetting, setSetting } from "@/lib/settings";
import { reportRecipient } from "@/lib/messaging";

// The questionnaire — what replaced the chat.
//
// WHY THIS SHAPE. The board's objection to the chat was two-way free-text with
// students. The thing actually wanted underneath it was "find out what they
// think", and that does not need a conversation. So: the admin writes a few
// questions with fixed answers, a student answers them once, and nobody
// replies to anybody. One-way and structured, which is what the policy allows.
//
// NO NEW TABLES. The definition lives in Setting, and a response is a Message
// row with kind "survey" whose body is JSON. This is not laziness — Prisma
// migrations need port 5432, which is blocked on the network this is authored
// from, so a schema change could not be applied or tested here. Two existing
// tables do the job, and the shape below is the contract instead.

export interface QQuestion {
  id: string;
  text: string;
  opts: string[];
}
export interface QuestionnaireConfig {
  /** Off means students see no questionnaire button at all. */
  active: boolean;
  title: string;
  intro: string;
  questions: QQuestion[];
  /** One optional comment box. Still one-way: nobody replies to it. */
  askNote: boolean;
  noteLabel: string;
  /** Bumped by the admin to ask everyone again after changing the questions. */
  round: number;
}

export const EMPTY: QuestionnaireConfig = {
  active: false,
  title: "Two quick questions",
  intro: "Nobody is graded on this and nothing is shown to your teacher. It helps me decide what to build next.",
  questions: [],
  askNote: true,
  noteLabel: "Anything else? (optional)",
  round: 1,
};

export async function getQuestionnaire(): Promise<QuestionnaireConfig> {
  return { ...EMPTY, ...(await getSetting<Partial<QuestionnaireConfig>>("questionnaire", {})) };
}

export async function saveQuestionnaire(c: Partial<QuestionnaireConfig>): Promise<void> {
  const merged = { ...(await getQuestionnaire()), ...c };
  // Ids must be stable: a tally is keyed by them, and renumbering on every save
  // would silently re-attribute old answers to new questions.
  merged.questions = merged.questions.map((q, i) => ({
    id: q.id || `q${i + 1}_${Math.random().toString(36).slice(2, 7)}`,
    text: String(q.text || "").slice(0, 200),
    opts: (q.opts || []).map((o) => String(o).slice(0, 80)).filter(Boolean).slice(0, 6),
  }));
  await setSetting("questionnaire", merged);
}

/** JSON stored in Message.body. Round is kept so old answers survive a re-ask. */
export interface QAnswer {
  round: number;
  answers: Record<string, number>;
  note?: string;
}

export async function hasAnswered(userId: string, round: number): Promise<boolean> {
  const rows = await prisma.message.findMany({
    where: { kind: "survey", fromId: userId },
    select: { body: true },
    take: 50,
  });
  return rows.some((r) => {
    try {
      return (JSON.parse(r.body) as QAnswer).round === round;
    } catch {
      return false;
    }
  });
}

export async function submit(userId: string, a: QAnswer, lessonCode?: string): Promise<boolean> {
  const admin = await reportRecipient();
  if (!admin) return false;
  await prisma.message.create({
    data: { kind: "survey", fromId: userId, toId: admin.id, body: JSON.stringify(a), lessonCode: lessonCode || null },
  });
  return true;
}

export interface Tally {
  responses: number;
  perQuestion: { id: string; text: string; opts: { label: string; count: number }[] }[];
  notes: { note: string; at: Date }[];
}

/** What the admin page reads. Counts only the CURRENT round. */
export async function tally(cfg: QuestionnaireConfig): Promise<Tally> {
  const rows = await prisma.message.findMany({
    where: { kind: "survey" },
    select: { body: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  const parsed: QAnswer[] = [];
  const notes: { note: string; at: Date }[] = [];
  for (const r of rows) {
    try {
      const a = JSON.parse(r.body) as QAnswer;
      if (a.round !== cfg.round) continue;
      parsed.push(a);
      if (a.note?.trim()) notes.push({ note: a.note.trim(), at: r.createdAt });
    } catch {
      /* a malformed row must not take the whole page down */
    }
  }
  return {
    responses: parsed.length,
    perQuestion: cfg.questions.map((q) => ({
      id: q.id,
      text: q.text,
      opts: q.opts.map((label, i) => ({ label, count: parsed.filter((p) => p.answers?.[q.id] === i).length })),
    })),
    notes,
  };
}
