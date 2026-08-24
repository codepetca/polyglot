
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
  kind: "teach" | "run" | "tweak" | "note" | "ask" | "predict" | "spot" | "trace" | "fix" | "write" | "arrange" | "fill" | "bucket" | "match" | "table" | "compare" | "explain" | "branch" | "card" | "walk" | "workout";
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
  // Zero-based line numbers in `code` that are NEW on this step. The player
  // tints them, so a growing program shows what just arrived instead of
  // re-presenting the whole thing as an undifferentiated block. Reviewer's
  // note: "highlight certain lines of code (that are newly introduced) and
  // explain what they do below."
  highlight?: number[];
  // Which wrapper the snippet needs. "beginner" (default) puts the code inside
  // main(); "methods" puts it at class level so the student can DEFINE methods,
  // which Java forbids inside another method. Unit 4 onward needs "methods".
  wrap?: "beginner" | "methods";
  // write/fix: code the PLATFORM supplies around the student's answer.
  //
  // CodeHS's Methods exercises hand the student a bare method and run test
  // cases against it — 4.3.4 Double Number is just `public int doubleNumber(int
  // x)` with a Check button. Matching on printed output would test the wrong
  // thing: whether they remembered a println, not whether the method returns
  // the right value.
  //
  // So the harness is a run() that calls their method with known inputs and
  // prints the results. The student writes only the method; target is what the
  // harness prints. Shown to them read-only, because seeing how it will be
  // called is how they know the signature to write.
  harness?: string;
  // compare: two snippets shown SIDE BY SIDE with their outputs.
  //
  // Reviewer's first example was print vs println. Explaining a difference in
  // prose makes the student hold both versions in their head; showing them
  // adjacent makes the difference the thing they see first. Same pattern for
  // 7 / 2 vs 7.0 / 2 and == vs .equals().
  //
  // Each side's output is compiler-checked, exactly like a teach step.
  sides?: { label: string; code: string; output: string; stdin?: string }[];
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
  /**
   * DEPRECATED. A stack of highlighted labels above a wall of prose. The owner
   * has asked for it gone twice. Use `annotate` to point at parts of a line,
   * `body` for sentences, `rules` for an enumerated set. New lessons must not
   * use this; `flows.mjs audit` counts what is left.
   */
  points?: { label: string; text: string }[];
  /**
   * Arrows pointing at parts of ONE line of code, with a short note under each.
   * This is what a stack of labels was always trying to be: the reader sees
   * which characters are meant, instead of matching a chip to a token by eye.
   * Notes are two or three words. If it needs a sentence, it is not an
   * annotation.
   */
  annotate?: { token: string; note: string }[];
  /**
   * The one idea this step is worth remembering. When the student clears the
   * step it rolls into a scroll and drops into the lesson's tome, which is
   * what they re-read later instead of replaying the whole lesson. Keep it to
   * a single sentence a student would actually write in their notes — this is
   * revision material, not a restatement of the instruction.
   */
  keypoint?: string;
  /**
   * A plain reference table, shown not asked. `table` is an exercise — its
   * cells get compiled and checked — so it cannot carry a comparison like
   * String against char, or a slice of the ASCII chart. Headers and rows,
   * rendered as-is.
   */
  facts?: { columns: string[]; rows: string[][] };
  /**
   * A chain of stages with arrows between them, for a process the student has
   * to be able to recite in order — source to bytecode to JVM being the one
   * this was built for. A prose paragraph describing three arrows is the kind
   * of thing nobody remembers; the shape is the memorable part.
   */
  pipeline?: { label: string; note?: string; kind?: "file" | "tool" | "end" }[];
  /**
   * workout: a problem solved in two moves — plan it, then write it.
   *
   * WHY IT IS TWO MOVES. The owner's own account of learning this unit: the
   * hard part was never the syntax, it was not knowing how to plan a loop over
   * a String before starting to type. A `write` step lets a student flail at
   * the editor. This one makes them put the pseudocode in order first, so the
   * habit gets drilled every single time rather than mentioned once.
   *
   * `plan` is the pseudocode in the CORRECT order — the client is sent it
   * shuffled. `methods` is the reference rail: which methods are worth
   * reaching for, since not knowing them is the other half of being stuck.
   */
  plan?: string[];
  methods?: string[];
  level?: "warm-up" | "standard" | "hard" | "olympic";
  // PLAIN PROSE. Short lines, rendered as ordinary sentences with no label and
  // no highlight. This exists because `points` was the only way to say anything,
  // so every explanation got forced into a highlighted label — including ones
  // where the label was filler ("after that", "so", "the rule"). If a sentence
  // does not need a piece of code attached to it, it belongs here.
  body?: string[];
  // A NUMBERED LIST of rules, each with an optional example. For content that
  // genuinely is an enumerated set — naming rules, an ordered procedure. Not a
  // highlight in sight.
  rules?: { text: string; example?: string }[];
  // card: the variables the student fills in. Their typed value is checked
  // against the declared type (quotes for String, a decimal point for double,
  // single quotes for char), then a card is drawn from what they entered.
  vars?: { type: string; name: string; placeholder?: string; label?: string }[];
  // walk: a loop, stepped through one move at a time by the student. Each frame
  // says which line is executing, what the variables hold, and what has been
  // printed so far. Authored by hand rather than simulated, because the whole
  // point is to name what is happening ("is 0 < 3? yes") in words a beginner
  // can read. The compiler gate checks the LAST frame's output against what the
  // program really prints, so a walkthrough cannot drift from the code it
  // claims to describe.
  frames?: { line: number; note: string; vars?: Record<string, string>; out?: string }[];
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
    // Non-ASCII inside anything that reaches the Java compiler comes back
    // mangled — an em dash in a string literal prints as "?". Caught once by
    // the output gate; rejected here so it cannot recur. The fill-blank markers
    // are stripped before compiling, so they are exempt.
    const javaFacing: [string, string | undefined][] = [
      ["code", s.code], ["target", s.target], ["output", s.output], ["solution", s.solution],
      ...(s.sides || []).flatMap((sd, i) => [[`sides[${i}].code`, sd.code], [`sides[${i}].output`, sd.output]] as [string, string][]),
    ];
    for (const [field, val] of javaFacing) {
      if (typeof val !== "string") continue;
      const m = val.replace(/[\u27E6\u27E7]/g, "").match(/[^\x00-\x7F]/);
      if (m) errors.push(`${at}: ${field} contains non-ASCII "${m[0]}" — it will print as "?". Use plain ASCII in anything Java compiles.`);
    }
    for (const h of s.highlight || []) {
      const lines = (s.code || "").split("\n").length;
      if (!s.code) errors.push(`${at}: highlight needs code`);
      else if (h < 0 || h >= lines) errors.push(`${at}: highlight line ${h} is outside the ${lines}-line snippet`);
    }
    if (s.keypoint !== undefined && !String(s.keypoint).trim()) errors.push(`${at}: keypoint is empty`);
    for (const st of s.pipeline || []) if (!st.label) errors.push(`${at}: every pipeline stage needs a label`);
    if (s.pipeline && s.pipeline.length < 2) errors.push(`${at}: a pipeline needs 2+ stages`);
    if (s.facts) {
      if (!s.facts.columns?.length) errors.push(`${at}: facts needs columns`);
      if (!s.facts.rows?.length) errors.push(`${at}: facts needs rows`);
      for (const [i, r] of (s.facts.rows || []).entries()) {
        if (r.length !== s.facts.columns.length) errors.push(`${at}: facts row ${i + 1} has ${r.length} cells, expected ${s.facts.columns.length}`);
      }
    }
    for (const a of s.annotate || []) {
      if (!s.code) errors.push(`${at}: annotate needs code`);
      else if (!s.code.includes(a.token)) errors.push(`${at}: annotate token ${JSON.stringify(a.token)} is not in the snippet`);
      if (!a.note) errors.push(`${at}: annotation for ${JSON.stringify(a.token)} needs a note`);
    }
    switch (s.kind) {
      case "run": if (!s.code) errors.push(`${at}: needs code`); break;
      case "tweak": if (!s.code || s.target === undefined) errors.push(`${at}: needs code + target (the ORIGINAL output)`); break;
      case "teach":
        if (!s.code && !(s.points || []).length && !(s.body || []).length && !(s.rules || []).length && !s.facts && !(s.pipeline || []).length) {
          errors.push(`${at}: needs code, points[], body[], rules[], facts or pipeline`);
        }
        break;
      case "workout": {
        if (!s.plan || s.plan.length < 2) errors.push(`${at}: needs plan[] — the pseudocode, in the right order`);
        if (s.target === undefined) errors.push(`${at}: needs target`);
        if (!s.solution) errors.push(`${at}: needs solution`);
        break;
      }
      case "walk": {
        if (!s.code) errors.push(`${at}: needs code`);
        if (!s.frames || s.frames.length < 2) errors.push(`${at}: needs 2+ frames`);
        const n = (s.code || "").split("\n").length;
        for (const [i, fr] of (s.frames || []).entries()) {
          if (typeof fr.line !== "number" || fr.line < 0 || fr.line >= n) errors.push(`${at}: frame ${i + 1} points at line ${fr.line}, outside the ${n}-line snippet`);
          if (!fr.note) errors.push(`${at}: frame ${i + 1} needs a note`);
        }
        break;
      }
      case "card":
        if (!s.vars || s.vars.length < 2) errors.push(`${at}: needs 2+ vars`);
        for (const v of s.vars || []) {
          if (!v.type || !v.name) errors.push(`${at}: every var needs a type and a name`);
        }
        break;
      case "note": break;
      case "compare":
        if (!s.sides || s.sides.length < 2) errors.push(`${at}: needs 2+ sides`);
        (s.sides || []).forEach((sd, i) => {
          if (!sd.label) errors.push(`${at}: side ${i + 1} needs a label`);
          if (!sd.code) errors.push(`${at}: side ${i + 1} needs code`);
          if (sd.output === undefined) errors.push(`${at}: side ${i + 1} needs the output it claims`);
        });
        break;
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
  const base = { id: s.id, kind: s.kind, instruction: s.instruction, hint: s.hint, after: s.after, code: s.code, target: s.target, stdin: s.stdin, highlight: s.highlight, wrap: s.wrap, harness: s.harness, keypoint: s.keypoint };
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
    case "teach": return { ...base, points: s.points, body: s.body, rules: s.rules, annotate: s.annotate, facts: s.facts, pipeline: s.pipeline, output: s.output };
    case "card": return { ...base, vars: s.vars };
    case "walk": return { ...base, frames: s.frames };
    case "workout": {
      // Shuffle the plan; the right order is the answer to the first move.
      const pool = [...(s.plan || [])];
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      return { ...base, plan: pool, methods: s.methods, level: s.level };
    }
    case "compare": return { ...base, sides: s.sides, points: s.points };
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
