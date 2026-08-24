import type { FlowStep } from "@/lib/curriculum/flow";

// PURE extraction: which strings in a lesson a translator may see.
//
// Split from translate.ts, which is `server-only` because it holds the prisma
// and LLM calls. This half touches nothing but the flow object, so
// scripts/i18n-coverage.ts can run it directly — and that script is the reason
// the old five-field gap cannot silently come back.

/**
 * Every field the student can READ. Anything not listed here is either code or
 * an answer key and must never reach a translator.
 *
 * This list is the thing that was wrong. It used to be five fields plus the
 * deprecated `points[]`, which was fine when `points[]` carried the prose —
 * and became near-useless the moment the Unit 3–6 rework moved every
 * explanation into `body[]`, `keypoint`, `facts` and `rules`. A reworked
 * lesson translated its one-line instruction and nothing else.
 */
export const TRANSLATABLE_FIELDS = ["instruction", "why", "after", "hint", "prompt", "keypoint"] as const;

/** A location inside one step's translatable content. */
export type TPath = (string | number)[];
export type TItem = { id: string; text: string; path: TPath };

/** stepId -> a mirror of that step holding only translated strings. */
export type StepTranslation = Record<string, any>;
export type FlowTranslation = Record<string, StepTranslation>;

// Terms that stay in ENGLISH inside the translation, because they are the words
// a student has to end up knowing. The translator glosses them once in brackets
// — "variable (变量)" — rather than replacing them.
export const GLOSSARY = [
  "class", "object", "instance", "method", "parameter", "argument", "return",
  "variable", "field", "constructor", "getter", "setter", "static", "scope",
  "array", "index", "element", "list", "loop", "condition", "boolean",
  "key", "value", "interface", "inheritance", "override", "compile",
  "run-time", "exception", "String", "int", "double", "char",
];

// An option is program OUTPUT (don't translate) vs prose (do). "(an error)" is
// prose; "123" or "Hi\nBye" is output. Heuristic, but conservative: anything
// that isn't clearly a natural-language phrase is left alone.
function optionIsProse(opt: string): boolean {
  const s = opt.trim();
  if (!s) return false;
  if (/^\(.*\)$/.test(s)) return true; // "(an error)", "(nothing)"
  if (/[{};()\[\]]|System\.|\b(int|double|String|boolean|char|void|new|null|true|false)\b/.test(s)) return false;
  if (/^[\d\s.,+\-*/%]+$/.test(s)) return false; // pure numbers/operators
  return /\s/.test(s) && /[a-zA-Z]{3,}/.test(s); // multi-word with real words
}

// Code recognised by SHAPE, not by containing a keyword. "Returns the value, or
// null when there is none." is prose that happens to mention null; "new
// Room(int width, int height)" is a signature. Testing for brackets, a leading
// declaration keyword or dotted access separates them; testing for the word
// "null" does not.
const CODE_SHAPE = /[(){}\[\]<>;]|^\s*(class|interface|enum|new|public|private|protected|static|abstract|final|return|import)\b|\b\w+\.\w+/;

/** Is this cell / label prose worth translating, or is it code? */
function cellIsProse(v: string): boolean {
  const t = (v || "").trim();
  if (!t) return false;
  if (CODE_SHAPE.test(t)) return false;
  // A single token is a name, a literal or a type — Array, HashMap, true. Those
  // are the words a student must keep in English anyway.
  if (!/\s/.test(t)) return false;
  return /[A-Za-z]{3,}/.test(t);
}

/**
 * Every readable string in a flow, as a flat list with an opaque id.
 *
 * OPAQUE COUNTER IDS, and a path kept server-side. The previous scheme encoded
 * the location INTO the id ("stepId::field::0::sub") and parsed it back out of
 * the model's reply, which meant any field shape it did not anticipate — a
 * plain string array, a table cell — simply could not be represented. A counter
 * cannot collide, cannot be mis-parsed, and supports any depth.
 */
export function extractTranslatable(steps: FlowStep[]): TItem[] {
  const items: TItem[] = [];
  const add = (path: TPath, text: unknown) => {
    if (typeof text !== "string" || !text.trim()) return;
    items.push({ id: String(items.length), text, path });
  };

  for (const s of steps) {
    const at = (...rest: TPath) => [s.id, ...rest];

    for (const f of TRANSLATABLE_FIELDS) add(at(f), (s as any)[f]);
    (s.body || []).forEach((line, i) => add(at("body", i), line));
    (s.rules || []).forEach((r, i) => add(at("rules", i, "text"), r.text)); // .example is code
    (s.annotate || []).forEach((a, i) => add(at("annotate", i, "note"), a.note)); // .token is code
    (s.buckets || []).forEach((b, i) => { if (cellIsProse(b)) add(at("buckets", i), b); });
    (s.items || []).forEach((it, i) => { if (cellIsProse(it.text)) add(at("items", i, "text"), it.text); });
    (s.pairs || []).forEach((p, i) => p.forEach((half, j) => { if (cellIsProse(half)) add(at("pairs", i, j), half); }));
    // PREDICT OPTIONS ARE PROGRAM OUTPUT. flow.ts is explicit that the correct
    // option must be the literal output, and lesson.ts compiles it to prove it.
    // Translating "You collapse." would make the right answer stop matching
    // what Java prints. `trace` options are free text, so those are fine.
    if (s.kind !== "predict") {
      (s.opts || []).forEach((o, i) => { if (optionIsProse(o)) add(at("opts", i), o); });
    }
    (s.questions || []).forEach((q, i) => {
      add(at("questions", i, "prompt"), q.prompt);
      add(at("questions", i, "why"), q.why);
      // trace questions are free text about the code, never its output.
      (q.opts || []).forEach((o, j) => { if (optionIsProse(o)) add(at("questions", i, "opts", j), o); });
    });
    (s.frames || []).forEach((fr, i) => add(at("frames", i, "note"), fr.note));
    (s.plan || []).forEach((line, i) => add(at("plan", i), line));
    (s.sides || []).forEach((sd, i) => add(at("sides", i, "label"), sd.label));
    (s.vars || []).forEach((v, i) => add(at("vars", i, "label"), v.label));
    (s.points || []).forEach((pt, i) => add(at("points", i, "text"), pt.text)); // deprecated, still on old lessons
    if (s.facts) {
      s.facts.columns.forEach((c, i) => { if (cellIsProse(c)) add(at("facts", "columns", i), c); });
      s.facts.rows.forEach((row, r) => row.forEach((cell, c) => { if (cellIsProse(cell)) add(at("facts", "rows", r, c), cell); }));
    }
  }
  return items;
}

/** Write a value at a path into a nested object, creating containers as needed. */
export function setAt(root: Record<string, any>, path: TPath, value: string) {
  let node: any = root;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    const nextIsIndex = typeof path[i + 1] === "number";
    if (node[k] === undefined) node[k] = nextIsIndex ? [] : {};
    node = node[k];
  }
  node[path[path.length - 1]] = value;
}

