import "server-only";
import { prisma } from "@/lib/db";
import { complete } from "@/lib/llm";
import type { FlowStep } from "@/lib/curriculum/flow";

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

export const TRANSLATABLE_FIELDS = ["instruction", "why", "after", "hint", "prompt"] as const;

export type StepTranslation = {
  instruction?: string;
  why?: string;
  after?: string;
  hint?: string;
  prompt?: string;
  opts?: string[]; // only when the options are prose, not program output
  questions?: { prompt?: string; why?: string }[];
  // teach steps: the labelled explanation lines. The label is a code token
  // (e.g. "nextLine()") and stays English; only `text` is assisted.
  points?: { text?: string }[];
};
export type FlowTranslation = Record<string, StepTranslation>; // stepId → fields

// An option is program OUTPUT (don't translate) vs prose (do). "(an error)" is
// prose; "123" or "Hi\nBye" is output. Heuristic, but conservative: anything
// that isn't clearly a natural-language phrase is left alone.
function optionIsProse(opt: string): boolean {
  const s = opt.trim();
  if (!s) return false;
  if (/^\(.*\)$/.test(s)) return true; // "(an error)", "(nothing)"
  if (/[{};()]|System\.|\bint\b|\bdouble\b|\bString\b/.test(s)) return false; // code-ish
  if (/^[\d\s.,+\-*/%]+$/.test(s)) return false; // pure numbers/operators
  return /\s/.test(s) && /[a-zA-Z]{3,}/.test(s); // multi-word with real words
}

/** Only the parts of a flow a translator should ever see. */
export function extractTranslatable(steps: FlowStep[]): Record<string, StepTranslation> {
  const out: Record<string, StepTranslation> = {};
  for (const s of steps) {
    const t: StepTranslation = {};
    for (const f of TRANSLATABLE_FIELDS) {
      const v = (s as any)[f];
      if (typeof v === "string" && v.trim()) t[f] = v;
    }
    if (Array.isArray(s.opts)) {
      const proseIdx = s.opts.map((o, i) => (optionIsProse(o) ? i : -1)).filter((i) => i >= 0);
      if (proseIdx.length) {
        // Keep positions stable: untranslated entries stay as the original.
        t.opts = s.opts.map((o, i) => (proseIdx.includes(i) ? o : o));
      }
    }
    if (Array.isArray(s.questions) && s.questions.length) {
      t.questions = s.questions.map((q) => ({ prompt: q.prompt, why: q.why }));
    }
    if (Array.isArray(s.points) && s.points.length) {
      t.points = s.points.map((pt) => ({ text: pt.text }));
    }
    if (Object.keys(t).length) out[s.id] = t;
  }
  return out;
}

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

  const source = extractTranslatable(steps);

  const r = await complete<FlowTranslation>(
    {
      feature: "generate",
      system: `You write short ${language} comprehension notes for an English-language beginner Java course. The student is learning IN ENGLISH and will keep reading English. Your note appears UNDERNEATH the English sentence as a help line — it never replaces it.

Because of that:
- The goal is to unblock understanding, not to substitute for the English. Keep each note SHORTER than the English line where you can. A student should be able to glance at it and get straight back to the English.
- KEEP TECHNICAL VOCABULARY IN ENGLISH, even inside your ${language} note: System.out.println, print, println, int, double, String, boolean, loop, variable, compile, error, method, quotes. These are the words the student must actually learn. Explain around them; do not replace them.
- NEVER translate or alter anything that is code — keywords, identifiers, method names, variable names like i, n, total. If a sentence quotes code, keep the code EXACTLY as-is.
- Keep any \\n, \\t, quotes and punctuation exactly as they appear.
- Plain, encouraging, and no longer than necessary. These are one-line captions, not paragraphs.
- Keep every key and array position exactly as given.

Return ONLY JSON with the same shape you receive: {"<stepId>": {"instruction": "...", "why": "...", ...}}`,
      messages: [{ role: "user", content: JSON.stringify(source, null, 1) }],
      json: true,
      maxTokens: 6000,
      reasoningEffort: "low",
    },
    { userId }
  );

  const data = r.data;
  if (!data || typeof data !== "object") {
    throw new Error(r.provider === "stub" ? "No AI key configured — add one in Settings." : "The model returned no usable translation.");
  }

  // Models don't reliably return the exact envelope they're asked for — some
  // wrap the map under a key like "translations" or "steps". Unwrap one level
  // if the top level clearly isn't keyed by step id, rather than silently
  // producing nothing.
  const ids = new Set(steps.map((s) => s.id));
  let map: any = data;
  if (!Object.keys(map).some((k) => ids.has(k))) {
    const inner = Object.values(map).find(
      (v) => v && typeof v === "object" && Object.keys(v as object).some((k) => ids.has(k))
    );
    if (inner) map = inner;
  }

  const cleaned: FlowTranslation = {};
  for (const s of steps) {
    const got = map?.[s.id];
    if (got && typeof got === "object") cleaned[s.id] = got;
  }

  // NEVER cache an empty result. Storing {} used to mark the language as "done"
  // so the on-demand path skipped it forever — one bad response permanently
  // disabled that language.
  if (Object.keys(cleaned).length === 0) {
    throw new Error(`translator returned no matching steps (got keys: ${Object.keys(data as object).slice(0, 4).join(", ") || "none"})`);
  }

  // Merge into the existing map rather than replacing other languages.
  const current = ((lesson.flowI18n as any) || {}) as Record<string, FlowTranslation>;
  current[locale] = cleaned;
  await prisma.lesson.update({ where: { id: lesson.id }, data: { flowI18n: current as any } });

  return { translated: Object.keys(cleaned).length, of: steps.length, provider: r.provider, model: r.model };
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
  for (const s of steps) {
    const tr = t[s.id];
    if (!tr) continue;
    const keep: StepTranslation = {};
    for (const f of TRANSLATABLE_FIELDS) {
      const v = tr[f];
      // `why` is only revealed after answering, but it ships with the reveal —
      // it's already stripped for unanswered predict steps upstream.
      if (typeof v === "string" && v.trim() && (s as any)[f]) keep[f] = v;
    }
    if (Array.isArray(tr.questions) && Array.isArray(s.questions)) {
      keep.questions = tr.questions.slice(0, s.questions.length);
    }
    if (Object.keys(keep).length) out[s.id] = keep;
  }
  return out;
}
