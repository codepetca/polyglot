import { NextResponse } from "next/server";
import { resolveActor } from "@/lib/actor";
import { rateLimit } from "@/lib/ratelimit";
import { getQuestionnaire, hasAnswered, submit } from "@/lib/questionnaire";

// GET: the questionnaire, and whether this person already did it.
// POST: their answers, once.
//
// resolveActor rather than currentUser, matching the report route it replaces:
// the same person must be able to answer whether they arrived by cookie or by
// token. There is no GET of anyone else's answers here — that is admin-only and
// lives on the admin page, because a student being able to read the class's
// responses is exactly the thing a one-way form is supposed to prevent.

export async function GET(req: Request) {
  const me = await resolveActor(req);
  if (!me) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const cfg = await getQuestionnaire();
  if (!cfg.active || !cfg.questions.length) return NextResponse.json({ active: false });
  return NextResponse.json({
    active: true,
    title: cfg.title,
    intro: cfg.intro,
    questions: cfg.questions,
    askNote: cfg.askNote,
    noteLabel: cfg.noteLabel,
    round: cfg.round,
    answered: await hasAnswered(me.id, cfg.round),
  });
}

export async function POST(req: Request) {
  const me = await resolveActor(req);
  if (!me) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  if (!rateLimit(`survey:${me.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "You have already sent this." }, { status: 429 });
  }
  const cfg = await getQuestionnaire();
  if (!cfg.active || !cfg.questions.length) return NextResponse.json({ error: "nothing to answer" }, { status: 400 });
  if (await hasAnswered(me.id, cfg.round)) return NextResponse.json({ error: "already answered" }, { status: 409 });

  const body = await req.json().catch(() => null);
  const raw = body?.answers && typeof body.answers === "object" ? body.answers : {};
  // Only ids that exist, only indexes that exist. A client is free to send
  // anything; the tally must never be able to grow a column nobody wrote.
  const answers: Record<string, number> = {};
  for (const q of cfg.questions) {
    const v = Number(raw[q.id]);
    if (Number.isInteger(v) && v >= 0 && v < q.opts.length) answers[q.id] = v;
  }
  if (!Object.keys(answers).length) return NextResponse.json({ error: "answer at least one" }, { status: 400 });

  const note = cfg.askNote ? String(body?.note || "").slice(0, 600) : "";
  const ok = await submit(me.id, { round: cfg.round, answers, note }, String(body?.lessonCode || "") || undefined);
  if (!ok) return NextResponse.json({ error: "no admin to send to" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
