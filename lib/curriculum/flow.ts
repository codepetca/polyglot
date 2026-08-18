
// ─── The interactive-lesson vocabulary ───────────────────────────────────────
//
// A flow is { v: 1, steps: FlowStep[] }. Each step is ONE screen: one-line
// instruction, one interaction, feedback, next. The gate is DOING, not reading
// — captions ("why"/"after") appear AFTER the reveal, where surprise teaches.
//
// 14 kinds, grouped by what the learner does:
//
//  watch & touch     run      press ▶, see it happen
//                    tweak    change the code, make the output yours
//                    note     one-beat divider card (no grading; use sparingly)
//  think-first       predict  tap what it prints, THEN see the reveal
//                    spot     tap the line (the bug / the one that prints X)
//                    trace    follow a variable: answer "x = ?" checkpoints
//  build             fix      broken code → make it match the target
//                    write    starter/blank → build the target from scratch
//                    arrange  tap shuffled lines into order (+ distractors)
//                    fill     code with ⟦1⟧⟦2⟧ blanks → tap the right chip
//  sort & connect    bucket   deal each item into the right bucket
//                    match    connect pairs (term↔meaning, code↔output)
//  talk it out       explain  convince the AI in a sentence — it judges/probes
//  flow control      branch   "seen this before?" → jump to another step
//
// Server-secret fields (never reach the browser; see stripStepForClient):
//   predict.correct/.why · spot.correct/.why · trace.questions[].correct/.why
//   fill.blanks[].answer/.why · bucket.items[].bucket/.why · match right-order
//   fix/write.solution · explain.rubric/.fallback
//
// Evidence: steps may carry `skills: ["statement", ...]` — the import tags the
// step id to those Skill rows so answers feed mastery + the overseer.

export type FlowStep = {
  id: string;
  kind: "teach" | "run" | "tweak" | "note" | "ask" | "predict" | "spot" | "trace" | "fix" | "write" | "arrange" | "fill" | "bucket" | "match" | "table" | "explain" | "branch";
  instruction: string;
  skills?: string[];
  hint?: string; // shown on demand after 1 failure
  after?: string; // one-line caption after success
  why?: string; // one-line caption after a graded reveal
  // per-kind payload (see validate below for exact requirements)
  code?: string;
  target?: string;
  // Pre-supplied keyboard input for run-and-watch steps (run/tweak/fix/write/
  // arrange). One line per read call the code makes, newline-joined. NOT
  // secret — ships to the client like `code`.
  //
  // PREFER `ask` FOR TEACHING INPUT. Pre-supplying stdin and captioning it
  // "we'll type Ada for you" is theatre: the student watches a value they did
  // not choose appear from nowhere, which is the opposite of understanding that
  // readLine collects what THEY typed. Use stdin only where the typing is
  // incidental to the point being made; use `ask` whenever the input itself is
  // the thing being taught.
  stdin?: string;
  // ask: one field per read call the code makes, in order. The student types a
  // real value into each; those become stdin. `sample` never reaches the
  // browser — it exists so the compiler gate can still run the snippet.
  // `holds` is the variable this answer lands in. After the run, the step spells
  // out "name now holds Ada" — the single connection the whole lesson exists to
  // make, and the one a pre-supplied stdin can never demonstrate.
  fields?: { label: string; sample: string; placeholder?: string; holds?: string }[];
  // teach: the output to display without making the student run it.
  output?: string;
  opts?: string[];
  correct?: number;
  questions?: { prompt: string; opts: string[]; correct: number; why?: string }[];
  solution?: string;
  lines?: string[];
  distractors?: string[];
  blanks?: { chips: string[]; answer: number }[];
  buckets?: string[];
  items?: { text: string; bucket: number }[];
  pairs?: [string, string][];
  // table: a truth table the student completes.
  //
  // Sequential predict steps can teach what `true && false` gives, but they
  // cannot show the SHAPE — that && is true in exactly one row of four and ||
  // is false in exactly one. That contrast is the whole idea, and it only
  // exists when the rows sit together. 3.14 needs it even more: two columns
  // side by side is what "these expressions are equivalent" actually looks like.
  //
  // Columns before `fillFrom` are given; the rest are tapped in from `chips`.
  // `exprs` (one per fillable column) lets the compiler gate check the answers
  // against real Java instead of trusting the author's logic.
  columns?: string[];
  rows?: string[][];
  fillFrom?: number;
  chips?: string[];
  exprs?: string[];
  // teach: short labelled explanation lines shown beside/below the code.
  points?: { label: string; text: string }[];
  prompt?: string;
  rubric?: string;
  persona?: string;
  fallback?: string;
  options?: { label: string; goto: string }[];
};

export type Flow = { v: number; steps: FlowStep[] };

// ─── Structural validation (cheap, no network) ───────────────────────────────

export function validateFlow(flow: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const f = flow as Flow;
  if (!f || !Array.isArray(f.steps) || f.steps.length === 0) return { ok: false, errors: ["flow.steps must be a non-empty array"] };
  const ids = new Set<string>();
  for (const s of f.steps) {
    const at = `step "${s?.id || "?"}" (${s?.kind || "?"})`;
    if (!s.id || ids.has(s.id)) errors.push(`${at}: missing or duplicate id`);
    ids.add(s.id);
    if (!s.instruction) errors.push(`${at}: missing instruction`);
    switch (s.kind) {
      case "run": if (!s.code) errors.push(`${at}: needs code`); break;
      case "tweak": if (!s.code || s.target === undefined) errors.push(`${at}: needs code + target (the ORIGINAL output)`); break;
      case "teach":
        if (!s.code && !(s.points || []).length) errors.push(`${at}: needs code and/or points[]`);
        break;
      case "note": break;
      case "ask":
        if (!s.code) errors.push(`${at}: needs code`);
        if (!s.fields?.length) errors.push(`${at}: needs fields[] — one per read call, in order`);
        (s.fields || []).forEach((fl, i) => {
          if (!fl.label) errors.push(`${at}: field ${i + 1} needs a label`);
          if (fl.sample === undefined || fl.sample === "") errors.push(`${at}: field ${i + 1} needs a sample (server-only, for the compiler gate)`);
        });
        break;
      case "predict":
        if (!s.code || !s.opts || s.opts.length < 2 || typeof s.correct !== "number" || !s.why) errors.push(`${at}: needs code, 2+ opts, correct, why`);
        else if (s.correct < 0 || s.correct >= s.opts.length) errors.push(`${at}: correct out of range`);
        break;
      case "spot":
        if (!s.code || typeof s.correct !== "number" || !s.why) errors.push(`${at}: needs code, correct (0-based line), why`);
        else if (s.correct >= s.code.split("\n").length) errors.push(`${at}: correct line ${s.correct} beyond code`);
        break;
      case "trace":
        if (!s.code || !s.questions?.length) errors.push(`${at}: needs code + questions[]`);
        for (const q of s.questions || []) if (!q.prompt || !q.opts || q.opts.length < 2 || typeof q.correct !== "number") errors.push(`${at}: bad trace question`);
        break;
      case "fix": case "write":
        if (!s.code && s.kind === "fix") errors.push(`${at}: needs code (the broken version)`);
        if (s.target === undefined) errors.push(`${at}: needs target`);
        if (!s.solution) errors.push(`${at}: needs solution (server-only; used to verify the step is solvable)`);
        break;
      case "arrange":
        if (!s.lines || s.lines.length < 2 || s.target === undefined) errors.push(`${at}: needs lines[] (in CORRECT order) + target`);
        break;
      case "fill":
        if (!s.code || !s.blanks?.length) errors.push(`${at}: needs code with ⟦1⟧… markers + blanks[]`);
        (s.blanks || []).forEach((b, i) => {
          if (!b.chips || b.chips.length < 2 || typeof b.answer !== "number" || b.answer < 0 || b.answer >= b.chips.length) errors.push(`${at}: bad blank ${i + 1}`);
          if (s.code && !s.code.includes(`⟦${i + 1}⟧`)) errors.push(`${at}: code missing ⟦${i + 1}⟧ marker`);
        });
        break;
      case "bucket":
        if (!s.buckets || s.buckets.length < 2 || !s.items?.length) errors.push(`${at}: needs buckets[] + items[]`);
        for (const it of s.items || []) if (typeof it.bucket !== "number" || it.bucket < 0 || it.bucket >= (s.buckets?.length || 0)) errors.push(`${at}: item "${it.text}" bad bucket index`);
        break;
      case "match":
        if (!s.pairs || s.pairs.length < 2) errors.push(`${at}: needs 2+ pairs`);
        break;
      case "table": {
        if (!s.columns || s.columns.length < 2) errors.push(`${at}: needs 2+ columns`);
        if (!s.rows?.length) errors.push(`${at}: needs rows[]`);
        if (!s.chips || s.chips.length < 2) errors.push(`${at}: needs chips[] to tap in`);
        const from = s.fillFrom ?? 0;
        if (from < 1) errors.push(`${at}: fillFrom must be >= 1 (at least one column must be given)`);
        if (s.columns && from >= s.columns.length) errors.push(`${at}: fillFrom leaves nothing to fill`);
        for (const [i, r] of (s.rows || []).entries()) {
          if (r.length !== (s.columns?.length || 0)) errors.push(`${at}: row ${i + 1} has ${r.length} cells, expected ${s.columns?.length}`);
          for (let c = from; c < r.length; c++) {
            if (!(s.chips || []).includes(r[c])) errors.push(`${at}: row ${i + 1} col ${c + 1} answer "${r[c]}" is not one of the chips`);
          }
        }
        if (s.exprs && s.exprs.length !== (s.columns?.length || 0) - from) {
          errors.push(`${at}: exprs must have one entry per fillable column`);
        }
        break;
      }
      case "explain":
        if (!s.prompt || !s.rubric) errors.push(`${at}: needs prompt + rubric`);
        break;
      case "branch":
        if (!s.options || s.options.length < 2) errors.push(`${at}: needs 2+ options`);
        for (const o of s.options || []) if (!ids.has(o.goto) && !f.steps.some((x) => x.id === o.goto)) errors.push(`${at}: goto "${o.goto}" doesn't exist`);
        break;
      default:
        errors.push(`${at}: unknown kind`);
    }
  }
  return { ok: errors.length === 0, errors };
}

// ─── Client stripping (the answer-key invariant) ─────────────────────────────

export function stripStepForClient(s: FlowStep): Record<string, unknown> {
  const base = { id: s.id, kind: s.kind, instruction: s.instruction, hint: s.hint, after: s.after, code: s.code, target: s.target, stdin: s.stdin };
  switch (s.kind) {
    case "predict": return { ...base, opts: s.opts };
    case "spot": return base;
    case "trace": return { ...base, questions: (s.questions || []).map((q) => ({ prompt: q.prompt, opts: q.opts })) };
    case "fix": case "write": return base; // solution stays server-side
    case "arrange": {
      // shuffle lines + mix in distractors so order isn't the giveaway
      const pool = [...(s.lines || []), ...(s.distractors || [])];
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      return { ...base, lines: pool, count: (s.lines || []).length };
    }
    case "fill": return { ...base, blanks: (s.blanks || []).map((b) => ({ chips: b.chips })) };
    case "bucket": return { ...base, buckets: s.buckets, items: (s.items || []).map((it) => ({ text: it.text })) };
    case "match": {
      const lefts = (s.pairs || []).map((p) => p[0]);
      const rights = (s.pairs || []).map((p) => p[1]);
      for (let i = rights.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rights[i], rights[j]] = [rights[j], rights[i]]; }
      return { ...base, lefts, rights };
    }
    case "teach": return { ...base, points: s.points, output: s.output };
    // Blank out every cell the student is meant to work out; the answers stay
    // on the server like every other answer key.
    case "table": {
      const from = s.fillFrom ?? 1;
      return {
        ...base,
        columns: s.columns,
        chips: s.chips,
        fillFrom: from,
        rows: (s.rows || []).map((r) => r.map((cell, c) => (c < from ? cell : ""))),
      };
    }
    // The samples stay server-side: if the browser knew them it would be
    // pre-filling the answer the student is supposed to invent.
    case "ask": return { ...base, fields: (s.fields || []).map((fl) => ({ label: fl.label, placeholder: fl.placeholder, holds: fl.holds })) };
    case "explain": return { ...base, prompt: s.prompt, persona: s.persona };
    case "branch": return { ...base, options: s.options };
    default: return base; // run / tweak / note
  }
}
