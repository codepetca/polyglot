import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { complete } from "@/lib/llm";
import { DEFAULT_PROMPTS, renderPrompt } from "@/lib/llm/prompts";
import { getProviderConfig } from "@/lib/settings";
import { performanceSummary } from "@/lib/progress";
import { logEvent, EVENT } from "@/lib/events";
import { normalize } from "@/lib/text";
import { sanitizeInline } from "@/lib/sanitize";
import { rateLimit } from "@/lib/ratelimit";
import type { Exercise, QuizQuestion } from "@/lib/curriculum/blocks";

// Flash for the interactive features. Cheap, fast, and plenty for a hint.
const TUTOR_MODEL = "gemini-flash-latest";

const STUDENT_DAILY_AI_CAP = 150;

export async function POST(req: Request) {
  const body = await req.json();
  const { feature, lessonCode } = body;
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  // One student can't burn the whole class's free-tier quota.
  if (me.role === "STUDENT") {
    if (!rateLimit(`ai:${me.id}`, 15, 60 * 1000)) {
      return NextResponse.json({ error: "Slow down a little — try again in a minute." }, { status: 429 });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const used = await prisma.aiCall.count({ where: { userId: me.id, createdAt: { gte: today } } });
    if (used >= STUDENT_DAILY_AI_CAP) {
      return NextResponse.json({ error: "You've hit today's AI limit — back tomorrow. The lessons and code runner still work!" }, { status: 429 });
    }
  }

  const lesson = await prisma.lesson.findUnique({ where: { code: lessonCode } });
  if (!lesson) return NextResponse.json({ error: "lesson not found" }, { status: 404 });
  const exercise = lesson.exercise as unknown as Exercise;
  const objectives = ((lesson.objectives as unknown as string[]) || []).join("; ") || "";
  const prompts = (await getProviderConfig()).prompts; // admin overrides (or {})

  // ─── Tutor ─────────────────────────────────────────────────────────────────
  if (feature === "tutor") {
    const record = await performanceSummary(me.id, lesson.id);
    const keypoints = ((((lesson.flow as any)?.steps as any[]) || [])
      .map((st) => st.keypoint)
      .filter((k: unknown): k is string => typeof k === "string" && k.trim().length > 0));
    const r = await complete<never>(
      {
        feature: "tutor",
        system: renderPrompt(prompts.tutor || DEFAULT_PROMPTS.tutor, {
          lessonTitle: lesson.title,
          goal: lesson.goal,
          objectives: objectives ? `Learning objectives (stay within these): ${objectives}` : "",
          // The lesson's own key points — the sentences it decided were worth
          // remembering. Objectives say what the lesson is FOR; these say what
          // it actually claims, in the words it uses, so the tutor stops
          // paraphrasing the topic from general Java knowledge and starts
          // answering from this lesson.
          keypoints: keypoints.length
            ? `What this lesson teaches, in its own words:\n${keypoints.map((k) => `- ${k}`).join("\n")}`
            : "",
          record: record ? `Student record: ${record}` : "",
          exercise: exercise?.prompt ? `Current exercise: ${exercise.prompt}` : "",
        }),
        // The conversation so far, then the new question. Without this the
        // tutor answered every message cold, so a follow-up of "why?" had
        // nothing to refer to.
        messages: [
          ...(Array.isArray(body.history) ? body.history : [])
            .filter((h: any) => h && (h.role === "user" || h.role === "assistant") && typeof h.text === "string")
            .slice(-8)
            .map((h: any) => ({ role: h.role as "user" | "assistant", content: String(h.text).slice(0, 4000) })),
          { role: "user" as const, content: `Student question: ${body.message}\n\nTheir current code:\n${body.code || "(none)"}` },
        ],
        // Generous: thinking models (e.g. Gemini flash) spend hidden reasoning
        // tokens inside this budget — a tight cap strangles the visible reply.
        maxTokens: 3000,
        // Flash: a tutor reply is short, and this is the highest-volume AI
        // call in the platform. The reasoning model costs many times more for
        // no gain on "why does 7 / 2 give 3".
        model: TUTOR_MODEL,
        // A one-hint tutor reply doesn't need deep reasoning — cap hidden
        // "thinking" tokens (they're billed as output but invisible in the
        // reply; uncapped they can be most of the real per-call cost).
        reasoningEffort: "low",
      },
      { userId: me.id }
    );
    // Analytics substrate: keep the actual exchange, not just the token bill.
    // Learners only — staff (you) never pollute the data.
    if (me.role === "STUDENT") logEvent({ type: EVENT.TUTOR_MESSAGE, userId: me.id, classId: me.classId, lessonId: lesson.id, lessonCode, question: body.message, reply: r.text });
    return NextResponse.json({ text: r.text, meta: metaLine(r) });
  }

  // ─── Explain: "what does this error mean" and "annotate my code" ───────────
  //
  // ONE ENDPOINT, because they are the same question asked at two moments —
  // what is going on in MY code — and both want the answer pinned to lines
  // rather than delivered as a paragraph to map back by hand.
  if (feature === "explain") {
    const keypoints = ((((lesson.flow as any)?.steps as any[]) || [])
      .map((st) => st.keypoint)
      .filter((k: unknown): k is string => typeof k === "string" && k.trim().length > 0));
    const code = String(body.code || "");
    if (!code.trim()) return NextResponse.json({ error: "no code" }, { status: 400 });

    const errorMode = body.mode === "error";
    const numbered = code.split("\n").map((l: string, i: number) => `${i + 1}| ${l}`).join("\n");

    const r = await complete<{ summary?: string; notes?: { line: number; note: string }[]; fix?: string }>(
      {
        feature: "explain",
        system: renderPrompt(prompts.explain || DEFAULT_PROMPTS.explain, {
          lessonTitle: lesson.title,
          keypoints: keypoints.length ? `This lesson teaches:\n${keypoints.map((k) => `- ${k}`).join("\n")}` : "",
          mode: errorMode
            ? "The student's program did not run. Explain the error in plain words, say which line is at fault, and give the corrected program."
            : "The student's program runs. Walk through what it does, line by line, on the lines that matter. Only set \"fix\" if something is genuinely wrong.",
          payload: errorMode
            ? `Their code (line-numbered):\n${numbered}\n\nThe compiler said:\n${String(body.error || "").slice(0, 2000)}`
            : `Their code (line-numbered):\n${numbered}${body.stdout ? `\n\nIt printed:\n${String(body.stdout).slice(0, 800)}` : ""}`,
        }),
        messages: [{ role: "user", content: errorMode ? "Explain the error." : "Explain my code." }],
        json: true,
        maxTokens: 2000,
        reasoningEffort: "low",
        model: TUTOR_MODEL,
      },
      { userId: me.id }
    );

    const lineCount = code.split("\n").length;
    const notes = (Array.isArray(r.data?.notes) ? r.data!.notes : [])
      // A note against a line that does not exist would render nowhere, or
      // worse, against the wrong line. Drop it.
      .filter((n) => n && Number.isFinite(n.line) && n.line >= 1 && n.line <= lineCount && typeof n.note === "string" && n.note.trim())
      .slice(0, 5)
      .map((n) => ({ line: Math.round(n.line), note: n.note.trim() }));

    if (me.role === "STUDENT") {
      logEvent({ type: EVENT.TUTOR_MESSAGE, userId: me.id, classId: me.classId, lessonId: lesson.id, lessonCode, question: errorMode ? "(explain error)" : "(explain code)", reply: r.text });
    }
    return NextResponse.json({
      summary: (r.data?.summary || "").trim(),
      notes,
      fix: typeof r.data?.fix === "string" ? r.data.fix.trim() : "",
      meta: metaLine(r),
    });
  }

  // ─── Grade (output verdict is authoritative; AI writes the coaching) ─────────
  if (feature === "grade") {
    const passed = body.compiled !== false && normalize(body.stdout || "") === normalize(exercise?.expected || "");

    // Rule-based mode: same verdict, zero AI calls, deterministic feedback.
    if (body.mode !== "ai") {
      const feedback =
        body.compiled === false
          ? "The program didn't compile — read the error above, fix that line, and run again."
          : passed
            ? "Output matches the expected result exactly."
            : "Output doesn't match — compare the two boxes above, character by character (spaces and line breaks count).";
      return NextResponse.json({ passed, feedback, meta: "rule-based · output comparison · no AI call" });
    }

    const r = await complete<{ feedback: string }>(
      {
        feature: "grade",
        system: renderPrompt(prompts.grade || DEFAULT_PROMPTS.grade, {
          prompt: exercise?.prompt || "",
          behaviour: exercise?.behaviour || "",
          compileNote:
            body.compiled === false
              ? `The program did NOT compile. Error: ${body.error}\nName the compile fix in plain beginner words, and say one encouraging thing. Never write a full corrected solution.`
              : `The pass/fail verdict is decided by comparing output - you only write the coaching. If wrong, name the key issue and give ONE nudge. Never write a full corrected solution.`,
        }),
        messages: [{ role: "user", content: `Student code:\n${body.code}\n\n${body.compiled === false ? `Compiler error:\n${body.error}` : `Program output:\n${body.stdout}`}` }],
        json: true,
        maxTokens: 3000,
        // Flash: a tutor reply is short, and this is the highest-volume AI
        // call in the platform. The reasoning model costs many times more for
        // no gain on "why does 7 / 2 give 3".
        model: TUTOR_MODEL,
      },
      { userId: me.id }
    );
    return NextResponse.json({ passed, feedback: r.data?.feedback || r.text, meta: metaLine(r) });
  }

  // ─── Generate practice (fall back to the lesson's own quizBank) ──────────────
  if (feature === "generate") {
    const record = await performanceSummary(me.id, lesson.id);
    const r = await complete<{ questions: QuizQuestion[] }>(
      {
        feature: "generate",
        system: renderPrompt(prompts.generate || DEFAULT_PROMPTS.generate, {
          lessonTitle: lesson.title,
          goal: lesson.goal,
          objectives: objectives ? `Target these objectives: ${objectives}` : "",
          record: record ? `Student record: ${record}` : "",
        }),
        messages: [{ role: "user", content: body.request ? `Student request: ${body.request}` : "Auto-target the student's weak spots." }],
        json: true,
        maxTokens: 8000,
      },
      { userId: me.id }
    );
    // Coerce `correct` (models often return it as a string) then keep any
    // well-formed MCQ (2–6 options, valid answer index).
    let questions: QuizQuestion[] = (r.data?.questions || [])
      .map((q) => ({ ...q, correct: Number(q.correct) }))
      .filter(
        (q) =>
          q && q.q && Array.isArray(q.opts) && q.opts.length >= 2 && q.opts.length <= 6 && Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.opts.length
      )
      // AI output is semi-trusted: allow only simple formatting tags, nothing executable.
      .map((q) => ({ ...q, q: sanitizeInline(q.q), opts: q.opts.map(sanitizeInline), why: q.why ? sanitizeInline(q.why) : q.why }));
    let note = `AI-generated live (${metaLine(r)})`;
    if (!questions.length) {
      // Never fail silently: fall back to the lesson bank if it has one, and
      // say exactly what the model returned so failures are debuggable.
      questions = (lesson.quizBank as unknown as QuizQuestion[]).slice(0, 4);
      note =
        r.provider === "stub"
          ? "no AI key configured"
          : `model reply wasn't a valid question set — raw start: "${(r.text || "(empty)").slice(0, 140)}"`;
    }
    return NextResponse.json({ questions, note, provider: r.provider });
  }

  return NextResponse.json({ error: "unknown feature" }, { status: 400 });
}

function metaLine(r: { provider: string; model: string; usage: { input: number; output: number }; cost: number }) {
  return `${r.provider}/${r.model} · ${r.usage.input}in/${r.usage.output}out · $${r.cost.toFixed(5)}`;
}
