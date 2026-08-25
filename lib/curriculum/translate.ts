import "server-only";
import { prisma } from "@/lib/db";
import { complete } from "@/lib/llm";
import type { FlowStep } from "@/lib/curriculum/flow";
import {
  TRANSLATABLE_FIELDS, GLOSSARY, extractTranslatable, setAt,
  type TPath, type TItem, type StepTranslation, type FlowTranslation,
} from "@/lib/curriculum/i18n-extract";

export { TRANSLATABLE_FIELDS, GLOSSARY, extractTranslatable };
export type { TPath, TItem, StepTranslation, FlowTranslation };

// LANGUAGE ASSIST for English-as-a-second-language students.
//
// DESIGN GOAL (from the owner, and it matters): the student should learn the
// course IN ENGLISH, with help — NOT in their first language. Replacing the
// English would be the easy build and the wrong one: they need English CS
// vocabulary for documentation, compiler errors, and exams, and a translated
// course quietly denies them that practice.
//
// So this is scaffolding, never substitution:
//   - The English text always stays on screen as the primary content.
//   - A short assist in their language is available ON DEMAND, underneath.
//   - Technical vocabulary (System.out.println, int, loop, String, compile)
//     stays in English even inside the assist, because those are the words
//     they must actually end up knowing.
//
// And never touch the code. A browser's whole-page auto-translate will happily
// turn `System.out.println` into `Sistema.fuera.imprimir` — breaking the lesson
// at exactly the moment a struggling reader needed help. Code, targets,
// solutions, stdin and literal program output are left strictly alone.
//
// Cheap by design: the "minimal text" thesis means all 6 lessons hold roughly
// 7k characters of prose, so assisting the whole curriculum costs a fraction of
// a cent per language.

// Chosen for Markham, Ontario — one of the most linguistically diverse places
// in Canada. Chinese (both scripts: Mandarin-speaking families generally read
// Simplified, Hong Kong/Cantonese heritage families Traditional) and South Asian
// languages dominate, plus French as an official language.
// `label` is what a student sees, in their OWN language, so they can find it
// without reading English first.
export const LANGUAGES: Record<string, { name: string; label: string }> = {
  "zh-Hans": { name: "Simplified Chinese", label: "简体中文" },
  "zh-Hant": { name: "Traditional Chinese", label: "繁體中文" },
  ta: { name: "Tamil", label: "தமிழ்" },
  ur: { name: "Urdu", label: "اردو" },
  pa: { name: "Punjabi (Gurmukhi script)", label: "ਪੰਜਾਬੀ" },
  hi: { name: "Hindi", label: "हिन्दी" },
  fa: { name: "Persian (Farsi)", label: "فارسی" },
  tl: { name: "Tagalog", label: "Tagalog" },
  ko: { name: "Korean", label: "한국어" },
  vi: { name: "Vietnamese", label: "Tiếng Việt" },
  fr: { name: "French", label: "Français" },
  es: { name: "Spanish", label: "Español" },
};

// Right-to-left scripts need dir="rtl" on the assist line only — the English
// and all code stay left-to-right.
export const RTL_LOCALES = new Set(["ur", "fa", "ar"]);

/**
 * Translate one lesson's prose into `locale` and store it under Lesson.flowI18n.
 * Returns how many steps were translated.
 */
export async function translateLesson(lessonCode: string, locale: string, userId?: string) {
  const language = LANGUAGES[locale]?.name;
  if (!language) throw new Error(`unsupported locale "${locale}"`);

  const lesson = await prisma.lesson.findUnique({ where: { code: lessonCode } });
  if (!lesson) throw new Error("lesson not found");
  const steps = (((lesson.flow as any)?.steps as FlowStep[]) || []);
  if (!steps.length) throw new Error("this lesson has no interactive flow to translate");

  const items = extractTranslatable(steps);
  if (!items.length) throw new Error("nothing to translate in this lesson");

  const r = await complete<{ items: { id: string; text: string }[] }>(
    {
      feature: "generate",
      system: `You translate a beginner Java course into ${language} for students in Canada who are still learning English.

WHERE THIS APPEARS: beside the English, in a second column — not underneath it, and not instead of it. The student reads both. So translate the sentence properly and completely; do not summarise it and do not shorten it into a caption.

TECHNICAL VOCABULARY STAYS IN ENGLISH, with the ${language} in brackets after it the first time it appears in a passage:
  "A variable (变量) holds one value."   <- correct shape, in ${language}
These are the words the student has to end up knowing, because their exam, their compiler errors and every piece of documentation they will ever read use the English. Words in this group: ${GLOSSARY.join(", ")}.

CODE IS NEVER TOUCHED, and never gets a bracket. Leave exactly as written, character for character: System.out.println, println, readLine, .length, size(), get(i), ArrayList<Integer>, int, String, and every identifier or variable name such as i, n, hp, total. If a sentence quotes code, the code inside it is unchanged.

ALSO KEEP EXACTLY: every \\n and \\t, all quotes, all punctuation around code, and any number.

Plain, direct sentences. This is a course for beginners, not a manual.

You will receive: {"items":[{"id":"...","text":"..."}]}
Return EXACTLY: {"items":[{"id":"...","text":"<the ${language} translation>"}]}
The "id" values are opaque — copy each one back CHARACTER FOR CHARACTER and never invent, merge, reorder or drop one. Return one item for every item you received.`,
      messages: [{ role: "user", content: JSON.stringify({ items: items.map((i) => ({ id: i.id, text: i.text })) }) }],
      json: true,
      maxTokens: 16000,
      reasoningEffort: "low",
    },
    { userId }
  );

  const returned = Array.isArray(r.data?.items) ? r.data!.items : [];
  if (!returned.length) {
    throw new Error(
      r.degraded === "budget"
        ? "Today's AI budget is spent, so the offline stub answered. Raise the daily cap on the Usage page, or wait for it to reset at midnight UTC."
        : r.provider === "stub"
          ? "No AI key configured — add one in Settings."
          : `translator returned no items (got: ${Object.keys((r.data as object) || {}).slice(0, 4).join(", ") || "nothing"})`
    );
  }

  // Rebuild by looking the path up from the id. A malformed item is skipped on
  // its own rather than taking the whole language down.
  const byId = new Map(items.map((i) => [i.id, i.path]));
  const cleaned: FlowTranslation = {};
  let used = 0;
  for (const it of returned) {
    if (!it || typeof it.id !== "string" || typeof it.text !== "string" || !it.text.trim()) continue;
    const path = byId.get(it.id);
    if (!path) continue;
    const [stepId, ...rest] = path;
    if (typeof stepId !== "string") continue;
    setAt((cleaned[stepId] ||= {}), rest, it.text);
    used++;
  }

  if (!used) throw new Error("translator returned items but none matched this lesson");

  // SPARSE ARRAYS ARE THE BUG THAT KILLED THE FIRST BATCH RUN.
  //
  // The model does not always return every item, and it does not always return
  // them in order. When body[0] and body[2] come back but body[1] does not,
  // setAt leaves a HOLE, and a hole reads back as `undefined` — which Prisma's
  // Json serializer refuses, failing the whole lesson with an error that named
  // the Chinese text and looked like an encoding problem.
  //
  // A JSON round-trip turns holes into null and drops undefined outright. The
  // client already treats a missing entry as "no translation for this line",
  // so a null simply shows the English, which is the correct fallback anyway.
  const safe: FlowTranslation = JSON.parse(JSON.stringify(cleaned));

  // Merge into the existing map rather than replacing other languages.
  const current = ((lesson.flowI18n as any) || {}) as Record<string, FlowTranslation>;
  current[locale] = safe;
  await prisma.lesson.update({ where: { id: lesson.id }, data: { flowI18n: current as any } });

  return {
    translated: Object.keys(safe).length,
    of: steps.length,
    strings: used,
    ofStrings: items.length,
    provider: r.provider,
    model: r.model,
  };
}

/**
 * Shape the stored assist for the client — deliberately NOT merged into the
 * steps. The English stays the primary text; the player renders these
 * underneath on request. Returns stepId → { field → assist text }.
 *
 * Only fields the student can actually see are included, and only when a real
 * assist exists, so the UI can show its affordance solely where it helps.
 */
export function assistForClient(steps: FlowStep[], t: FlowTranslation): Record<string, StepTranslation> {
  const out: Record<string, StepTranslation> = {};
  const ids = new Set(steps.map((s) => s.id));
  for (const [stepId, tr] of Object.entries(t || {})) {
    // Only steps that still exist, so a stale translation cannot resurrect a
    // deleted step. Everything stored is already a readable field — the
    // extractor is the gate, and answer keys never pass it.
    if (ids.has(stepId) && tr && Object.keys(tr).length) out[stepId] = tr;
  }
  return out;
}
