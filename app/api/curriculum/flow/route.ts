import { NextResponse } from "next/server";
import { requireRoleApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateFlow, verifyFlow, type Flow } from "@/lib/curriculum/flow";

// Flow authoring import (admin). The anti-hallucination gate: a pasted flow is
// (1) structurally validated, then (2) every verifiable snippet is compiled and
// RUN through the real Java runner, checking the authored claims (predict's
// correct option, fix/write solutions, arrange order, fill chips, tweak
// originals). Only a fully-passing flow is written. Steps carrying `skills`
// get tagged so their answers feed mastery + the overseer.
//
// POST { lessonCode, flow, skipVerify? } → { ok, results, failures } (+written)
// GET  ?lessonCode → the current flow (for re-editing)

export async function GET(req: Request) {
  const me = await requireRoleApi("ADMIN");
  if (me instanceof NextResponse) return me;
  const lessonCode = new URL(req.url).searchParams.get("lessonCode") || "";
  const lesson = await prisma.lesson.findUnique({ where: { code: lessonCode }, select: { flow: true } });
  return NextResponse.json({ flow: lesson?.flow ?? null });
}

export async function POST(req: Request) {
  const me = await requireRoleApi("ADMIN");
  if (me instanceof NextResponse) return me;
  const { lessonCode, flow, skipVerify, verifyOnly, objectives } = (await req.json()) as {
    lessonCode: string;
    flow: Flow;
    skipVerify?: boolean;
    verifyOnly?: boolean; // check without writing — safe to run on a live lesson
    // Optional: the lesson's student-facing objectives. Only fills them when
    // empty — a teacher's existing wording is never overwritten by an import.
    objectives?: string[];
  };

  const lesson = await prisma.lesson.findUnique({ where: { code: String(lessonCode || "") } });
  if (!lesson) return NextResponse.json({ ok: false, failures: [`no lesson with code "${lessonCode}"`] });

  const v = validateFlow(flow);
  if (!v.ok) return NextResponse.json({ ok: false, failures: v.errors, fixPrompt: fixPrompt(v.errors) });

  let results: string[] = [];
  if (!skipVerify) {
    const check = await verifyFlow(flow);
    results = check.results;
    if (!check.ok) {
      // Hand back a ready-to-paste correction prompt. The authoring loop is
      // "AI writes → compiler judges → AI fixes", and making the third step a
      // single copy-paste is what makes this usable by a non-programmer.
      return NextResponse.json({ ok: false, results, failures: check.failures, fixPrompt: fixPrompt(check.failures) });
    }
  }

  if (verifyOnly) {
    return NextResponse.json({ ok: true, written: false, verifiedOnly: true, steps: flow.steps.length, results });
  }

  // Store the flow whole (solutions included); the GET/lesson route strips what
  // must not reach a student. Objectives only fill an empty field.
  const cleanObjectives = (objectives || []).map((o) => String(o).trim()).filter(Boolean).slice(0, 12);
  const hasObjectives = (((lesson.objectives as unknown as string[]) ?? []) || []).length > 0;
  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      flow: flow as any,
      ...(cleanObjectives.length && !hasObjectives ? { objectives: cleanObjectives } : {}),
    },
  });

  // Skill tagging: step.skills = ["statement", ...] → find-or-create on this
  // lesson (AI-origin until confirmed in /admin/skills) + tag the step id.
  let tagged = 0;
  const existing = await prisma.skill.findMany({ where: { lessonId: lesson.id } });
  for (const step of flow.steps) {
    for (const stmt of step.skills || []) {
      const clean = String(stmt).trim();
      if (!clean) continue;
      let skill = existing.find((s) => s.statement.toLowerCase() === clean.toLowerCase());
      if (!skill) {
        skill = await prisma.skill.create({ data: { lessonId: lesson.id, statement: clean, origin: "ai", confidence: 0.6 } });
        existing.push(skill);
      }
      await prisma.questionSkill.upsert({
        where: { questionId_skillId: { questionId: step.id, skillId: skill.id } },
        create: { questionId: step.id, skillId: skill.id, origin: "ai" },
        update: {},
      });
      tagged++;
    }
  }

  return NextResponse.json({ ok: true, written: true, steps: flow.steps.length, tagged, results });
}

// Turn machine findings into something the authoring AI can act on directly.
// The whole point: the person running this shouldn't have to translate compiler
// output into instructions — they copy this, paste it back, get corrected JSON.
function fixPrompt(failures: string[]): string {
  return [
    "The lesson JSON you gave me was rejected. Every code snippet was compiled and run against a real Java compiler, and these specific claims did not hold:",
    "",
    ...failures.map((f) => `- ${f}`),
    "",
    "Fix ONLY these problems and return the complete corrected JSON again (same format, all steps included — not just the changed ones).",
    "Reminders that usually explain these failures:",
    '- In JSON, "\\\\n" is a backslash-n inside the Java source; "\\n" is a real newline in a target/option string. Mixing these up is the most common cause.',
    "- A predict step's `correct` option must be EXACTLY what the program prints, character for character (watch trailing spaces and whether print vs println ends the line).",
    "- A fix step's `solution` must actually produce `target`, and its broken `code` must NOT already produce `target`.",
    "- An arrange step's `lines` must be in the CORRECT order and must produce `target` when joined with newlines.",
    "- Integer division truncates (7/2 is 3, not 3.5) and `print` does not end the line.",
  ].join("\n");
}
