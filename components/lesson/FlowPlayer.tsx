"use client";

import { useEffect, useRef, useState } from "react";
import ScopeDiagram from "@/components/lesson/ScopeDiagram";
import Link from "next/link";
import CodeBox from "./CodeBox";
import Docs from "./Docs";
import { readLang, LANG_EVENT } from "@/components/LanguagePicker";

// The interactive lesson player — one step per screen, do-first, near-zero
// text. 15 step kinds (see lib/curriculum/flow.ts, the canonical spec):
//   run · tweak · note · ask · predict · spot · trace · fix · write · arrange ·
//   fill · bucket · match · explain · branch
// `ask` is the input kind: the student types real values into one field per
// read call, and those become the program's stdin.
// All answer keys live server-side; grading happens at /api/lesson/flow.
// Help ladder on doing-steps: fail once → authored 💡 hint; twice → 🤖 tutor
// called with the step's code/target/actual-output as context.

type Step = {
  id: string;
  kind: string;
  instruction: string;
  hint?: string;
  after?: string;
  code?: string;
  target?: string;
  stdin?: string;
  highlight?: number[];
  wrap?: "beginner" | "methods";
  harness?: string;
  sides?: { label: string; code: string; output: string }[];
  // ask: one field per read call. `sample` is stripped server-side, so the
  // browser only ever sees the label the student is answering.
  fields?: { label: string; placeholder?: string; holds?: string }[];
  // table: rows arrive with the fillable cells blanked out
  columns?: string[];
  rows?: string[][];
  fillFrom?: number;
  chips?: string[];
  opts?: string[];
  questions?: { prompt: string; opts: string[] }[];
  lines?: string[];
  count?: number;
  blanks?: { chips: string[] }[];
  buckets?: string[];
  items?: { text: string }[];
  lefts?: string[];
  rights?: string[];
  prompt?: string;
  points?: { label: string; text: string }[];
  body?: string[];
  rules?: { text: string; example?: string }[];
  annotate?: { token: string; note: string }[];
  scopes?: { name: string; from: number; to: number; kind?: string }[];
  keypoint?: string;
  facts?: { columns: string[]; rows: string[][] };
  pipeline?: { label: string; note?: string; kind?: string }[];
  plan?: string[];
  methods?: string[];
  level?: string;
  vars?: { type: string; name: string; placeholder?: string; label?: string }[];
  frames?: { line: number; note: string; vars?: Record<string, string>; out?: string }[];
  output?: string;
  options?: { label: string; goto: string }[];
};

type RunOut = { compiled: boolean; stdout: string; error: string };
const norm = (s: string) => (s || "").replace(/\r\n/g, "\n").trimEnd();

const RTL = new Set(["ur", "fa", "ar"]);

// Each language names itself, so a student can find theirs without first

// ESL scaffolding. The English above it is the lesson; this is a help line the
// student opens when a sentence blocks them, then goes back to the English.
// Collapsed by default ON PURPOSE — the goal is learning the course in English,
// so the assist must never be the thing you read first.
function Assist({ text, lang }: { text?: string; lang: string }) {
  const [open, setOpen] = useState(false);
  if (!text || !lang) return null;
  return (
    <div className="assist">
      {open ? (
        <p className="assisttext" dir={RTL.has(lang) ? "rtl" : "ltr"} lang={lang}>
          {text}
          <button className="assistbtn" onClick={() => setOpen(false)} aria-label="Hide translation">✕</button>
        </p>
      ) : (
        <button className="assistbtn" onClick={() => setOpen(true)}>文 what does this mean?</button>
      )}
    </div>
  );
}

export default function FlowPlayer({ lessonCode, lessonTitle, nextHref }: { lessonCode: string; lessonTitle: string; nextHref?: string | null }) {
  const [steps, setSteps] = useState<Step[] | null>(null);
  // Language assist (ESL): English stays primary; this is shown UNDER it on
  // request. Never replaces the English — see lib/curriculum/translate.ts.
  const [lang, setLang] = useState<string>("");
  const [assist, setAssist] = useState<Record<string, Record<string, any>> | null>(null);
  const [i, setI] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [kept, setKept] = useState<string[]>([]);
  const [flying, setFlying] = useState(false);
  const [tomeOpen, setTomeOpen] = useState(false);
  const attemptsRef = useRef<Record<string, number>>({});

  // Remember the student's assist language across lessons — an ESL student
  // shouldn't have to re-pick it on every page.
  // Language help is a profile setting now (top bar), not a per-lesson control.
  useEffect(() => {
    setLang(readLang());
    const onChange = (e: Event) => setLang((e as CustomEvent).detail || "");
    window.addEventListener(LANG_EVENT, onChange);
    return () => window.removeEventListener(LANG_EVENT, onChange);
  }, []);

  useEffect(() => {
    let alive = true;
    const q = lang ? `&lang=${encodeURIComponent(lang)}` : "";
    fetch(`/api/lesson/flow?lessonCode=${encodeURIComponent(lessonCode)}${q}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setSteps(d.steps || []);
        // Restore the tome. Scrolls are earned once and stay earned.
        const already: string[] = d.cleared || [];
        setKept(
          (d.steps || [])
            .filter((s: Step) => s.keypoint && already.includes(s.id))
            .map((s: Step) => s.keypoint as string)
        );
        setAssist(d.assist || null);
        // The translation for this language doesn't exist yet. Don't make the
        // student wait for it — the lesson is already on screen; fetch the
        // assist separately and slot it in whenever it lands.
        if (d.assistPending) {
          fetch(`/api/lesson/flow?lessonCode=${encodeURIComponent(lessonCode)}${q}&assistOnly=1`)
            .then((r) => r.json())
            .then((a) => { if (alive && a?.assist) setAssist(a.assist); })
            .catch(() => {});
        }
      });
    return () => { alive = false; };
  }, [lessonCode, lang]);

  if (!steps) return <div className="panel" style={{ color: "var(--muted)" }}>Loading…</div>;
  if (!steps.length) return null;

  const done = i >= steps.length;
  const step = done ? null : steps[i];

  function completed(stepId: string, wasFirstTry: boolean) {
    if (wasFirstTry) setFirstTry((n) => n + 1);
    fetch("/api/lesson/flow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", lessonCode, stepId, attempts: attemptsRef.current[stepId] || 1 }),
    }).catch(() => {});
  }

  return (
    <div className="flowplay">
      {/* REVIEW. A student could previously only ever go forwards: once a step
          was answered it was gone, so "wait, what did that say?" had no answer
          and the only way back was reloading the lesson from step one. For
          someone who is behind, being unable to re-read the thing that just
          confused them is the moment they give up.

          It costs no new buttons: the progress dots were already on screen, so
          any dot you have reached is now a way back to it. The arrow is there
          because 9px dots are a poor target for the one move — one step back —
          that gets used most. */}
      {/* THE TOME. A lesson is a performance; this is what survives it. Each
          key point rolls into a scroll and drops in here, and the student
          re-reads the tome later instead of replaying fifteen steps. */}
      {kept.length > 0 && (
        <button
          className={`tome ${flying ? "catching" : ""}`}
          onClick={() => setTomeOpen((o) => !o)}
          aria-label={`Notes from this lesson, ${kept.length} collected`}
          title="Notes from this lesson"
        >
          <span className="tomeicon">📕</span>
          <span className="tomecount">{kept.length}</span>
        </button>
      )}
      {flying && <span className="scrollfly" aria-hidden="true">📜</span>}
      {/* PLACEHOLDER. Enough to tell the student something was earned; the real
          motion comes with the Pika style pass. */}
      {flying && (
        <div className="unlocked" role="status">
          <span className="unlockedicon">📜</span>
          <span>Note unlocked</span>
        </div>
      )}
      {tomeOpen && (
        <div className="tomepanel">
          <h4>What this lesson taught</h4>
          <ol>{kept.map((k, j) => <li key={j}>{k}</li>)}</ol>
          <button className="btn" onClick={() => setTomeOpen(false)}>Close</button>
        </div>
      )}

      <div className="flowbar">
        {(i > 0 || done) && (
          <button
            className="flowback"
            onClick={() => setI((n) => Math.max(0, Math.min(n, steps.length) - 1))}
            title="Go back a step"
            aria-label="Go back a step"
          >
            ←
          </button>
        )}
        <span className="flowdots">
          {steps.map((s, j) => (
            <button
              key={s.id}
              type="button"
              className={j < i ? "d on" : j === i ? "d now" : "d"}
              disabled={j > i}
              onClick={() => setI(j)}
              title={j <= i ? `Back to step ${j + 1}` : undefined}
              aria-label={`Step ${j + 1} of ${steps.length}`}
            />
          ))}
        </span>
        <span className="meta" style={{ margin: 0 }}>{done ? "done!" : `${i + 1} / ${steps.length}`}</span>
        <span style={{ flex: 1 }} />
      </div>

      {done ? (
        <FlowDone total={steps.length} firstTry={firstTry} nextHref={nextHref} />
      ) : (
        <StepView
          key={step!.id}
          step={step!}
          lessonCode={lessonCode}
          assist={assist?.[step!.id]}
          lang={lang}
          onAttempt={(id) => (attemptsRef.current[id] = (attemptsRef.current[id] || 0) + 1)}
          attemptsOf={(id) => attemptsRef.current[id] || 0}
          onDone={(wasFirstTry) => {
            completed(step!.id, wasFirstTry);
            const kp = step!.keypoint;
            if (kp && !kept.includes(kp)) {
              setKept((prev) => [...prev, kp]);
              setFlying(true);
              window.setTimeout(() => setFlying(false), 1600);
            }
            setI(i + 1);
          }}
          onSkip={() => setI(i + 1)}
          onGoto={(id) => {
            const j = steps.findIndex((s) => s.id === id);
            setI(j >= 0 ? j : i + 1);
          }}
        />
      )}
    </div>
  );
}

function StepView({ step, lessonCode, assist, lang, onDone, onSkip, onGoto, onAttempt, attemptsOf }: {
  step: Step;
  assist?: Record<string, any>;
  lang: string;
  lessonCode: string;
  onDone: (firstTry: boolean) => void;
  onSkip: () => void;
  onGoto: (id: string) => void;
  onAttempt: (id: string) => void;
  attemptsOf: (id: string) => number;
}) {
  const [code, setCode] = useState(step.code || "");
  const [out, setOut] = useState<RunOut | null>(null);
  const [busy, setBusy] = useState(false);
  // Real Java compiles on a remote service: measured median ~2.5s, worst ~8s.
  // A bare "running…" for 8s reads as broken, so count up and reassure.
  const [elapsed, setElapsed] = useState(0);
  const [won, setWon] = useState(false);
  // What the student types at the console. Seeded from step.stdin so the step
  // works untouched, but editable on `run` steps: the point of an input lesson
  // is that the value came from THEM.
  // A real terminal. The runner is one-shot, so we re-run the program with one
  // more line of input each time the student presses enter. Because the output
  // is deterministic, the transcript grows exactly the way a console does, and
  // the value in it is one THEY typed. Scanner.nextLine() throws on EOF after
  // the prompt has already printed, which is precisely the "waiting for you"
  // signal we need.
  const [termIn, setTermIn] = useState<string[]>([]);
  const [termOut, setTermOut] = useState<string | null>(null);
  const [termWait, setTermWait] = useState(false);
  const [termLine, setTermLine] = useState("");
  const [frame, setFrame] = useState(0);
  // workout: move one is ordering the pseudocode, move two is writing the code.
  const [planPick, setPlanPick] = useState<string[]>([]);
  const [planOk, setPlanOk] = useState(false);
  const [planWrong, setPlanWrong] = useState(false);
  const [cardVals, setCardVals] = useState<string[]>([]);
  const [cardErrs, setCardErrs] = useState<(string | null)[]>([]);
  const [reveal, setReveal] = useState<{ correct: boolean; correctIndex?: number; why?: string; chosen?: number } | null>(null);
  const [picked, setPicked] = useState<string[]>([]); // arrange
  // predict/spot: which option is SELECTED but not yet committed (see below).
  const [choice, setChoice] = useState<number | null>(null);
  const [traceIdx, setTraceIdx] = useState(0); // trace progress
  const [traceReveal, setTraceReveal] = useState<{ correct: boolean; correctIndex: number; why?: string; chosen: number } | null>(null);
  const [fillPick, setFillPick] = useState<number[]>([]); // fill: chip index per blank
  const [verdicts, setVerdicts] = useState<boolean[] | null>(null); // fill/bucket/match
  const [serverAnswers, setServerAnswers] = useState<number[] | null>(null);
  const [assign, setAssign] = useState<number[]>([]); // bucket: bucket idx per item
  const [pairsMade, setPairsMade] = useState<[number, string][]>([]); // match
  const [leftSel, setLeftSel] = useState<number | null>(null);
  // ask: what the student actually types, one entry per read call in the code.
  const [typed, setTyped] = useState<string[]>(() => (step.fields || []).map(() => ""));
  // table: one entry per blank cell, row-major over the fillable columns.
  const blankCount = (step.rows || []).length * Math.max(0, (step.columns || []).length - (step.fillFrom ?? 1));
  const [cells, setCells] = useState<string[]>(() => Array(blankCount).fill(""));
  const [cellSel, setCellSel] = useState<number | null>(null);
  const [explainText, setExplainText] = useState("");
  const [explainReply, setExplainReply] = useState("");
  const [hintOpen, setHintOpen] = useState(false);
  const [aiHint, setAiHint] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const fails = attemptsOf(step.id);

  const post = (payload: Record<string, unknown>) =>
    fetch("/api/lesson/flow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonCode, stepId: step.id, ...payload }),
    }).then((r) => r.json());

  // ── runnable kinds ──
  // The harness wraps the student's method in a run() that calls it, so what
  // gets compiled is the platform's calls around their answer.
  const written = step.kind === "arrange" ? picked.join("\n") : code;
  const assembled = step.harness ? `${step.harness}\n\n${written}` : written;
  async function run() {
    onAttempt(step.id);
    setBusy(true);
    setOut(null);
    setElapsed(0);
    const startedAt = Date.now();
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    let r: RunOut;
    try {
      r = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // On an `ask` step the keyboard is real: whatever the student typed
        // into the fields IS the stdin the program reads.
        body: JSON.stringify({
          code: assembled,
          wrap: true,
          lessonCode,
          stepId: step.id,
          stdin: step.kind === "ask" ? typed.join("\n") : step.stdin || "",
          wrapMode: step.wrap || "beginner",
        }),
      }).then((x) => x.json());
    } catch {
      // Network died mid-run — say so plainly instead of hanging on "running…".
      r = { compiled: false, stdout: "", error: "Lost connection while running. Check your internet and try again." };
    } finally {
      clearInterval(tick);
      setBusy(false);
    }
    setOut(r);
    const ok =
      step.kind === "run" || step.kind === "ask" ? r.compiled && !r.error
      : step.kind === "tweak" ? r.compiled && !r.error && norm(r.stdout) !== norm(step.target || "") && norm(r.stdout).length > 0
      : r.compiled && !r.error && norm(r.stdout) === norm(step.target || "");
    if (ok) setWon(true);
  }

  const readsInput = /\bread(Line|Int|Double|Boolean)\s*\(/.test(step.code || "");
  const interactive = step.kind === "run" && readsInput;

  async function runTerminal(lines: string[]) {
    onAttempt(step.id);
    setBusy(true);
    setOut(null);
    setElapsed(0);
    const startedAt = Date.now();
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    let r: RunOut;
    try {
      r = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: assembled, wrap: true, lessonCode, stepId: step.id, stdin: lines.join("\n"), wrapMode: step.wrap || "beginner" }),
      }).then((x) => x.json());
    } catch {
      r = { compiled: false, stdout: "", error: "Lost connection while running. Check your internet and try again." };
    } finally {
      clearInterval(tick);
      setBusy(false);
    }
    if (!r.compiled) { setTermOut(null); setTermWait(false); setOut(r); return; }
    setTermOut(r.stdout || "");
    // Out of input: the prompt is already on screen and the program is waiting.
    if (r.error && /NoSuchElementException|No line found/i.test(r.error)) {
      setTermWait(true);
      return;
    }
    setTermWait(false);
    if (r.error) { setOut(r); return; }
    setWon(true);
  }

  // ── graded taps ──
  async function answer(choice: number) {
    if (reveal) return;
    onAttempt(step.id);
    const d = await post({ action: "answer", choice, attempt: 1 });
    setReveal({ ...d, chosen: choice });
  }
  async function traceAnswer(choice: number) {
    if (traceReveal) return;
    if (traceIdx === 0) onAttempt(step.id);
    const d = await post({ action: "trace", qIndex: traceIdx, choice, attempt: traceIdx === 0 ? 1 : 2 });
    setTraceReveal({ ...d, chosen: choice });
  }
  function traceNext() {
    setTraceReveal(null);
    if (traceIdx + 1 >= (step.questions || []).length) setWon(true);
    else setTraceIdx(traceIdx + 1);
  }
  async function checkFill() {
    onAttempt(step.id);
    const d = await post({ action: "fill", choices: fillPick, attempt: fails + 1 });
    setVerdicts(d.verdicts || []);
    setServerAnswers(d.answers || null);
    if (d.correct) { setReveal({ correct: true, why: d.why }); setWon(true); }
  }
  async function checkBucket() {
    onAttempt(step.id);
    const d = await post({ action: "bucket", assignments: assign, attempt: fails + 1 });
    setVerdicts(d.verdicts || []);
    setServerAnswers(d.answers || null);
    if (d.correct) { setReveal({ correct: true, why: d.why }); setWon(true); }
  }
  async function checkTable() {
    onAttempt(step.id);
    const d = await post({ action: "table", cells, attempt: fails + 1 });
    setVerdicts(d.verdicts || []);
    if (d.correct) { setReveal({ correct: true, why: d.why }); setWon(true); }
  }
  async function checkMatch() {
    onAttempt(step.id);
    const d = await post({ action: "match", pairs: pairsMade, attempt: fails + 1 });
    setVerdicts(d.verdicts || []);
    if (d.correct) { setReveal({ correct: true, why: d.why }); setWon(true); }
    else setPairsMade(pairsMade.filter((_, j) => d.verdicts?.[j])); // keep the right ones, retry the rest
  }
  async function sendExplain() {
    onAttempt(step.id);
    setBusy(true);
    const d = await post({ action: "explain", text: explainText, attempt: fails + 1 });
    setBusy(false);
    setExplainReply(d.reply || d.error || "");
    if (d.correct) setWon(true);
  }

  async function askTutor() {
    setAiBusy(true);
    const msg =
      `I'm on an interactive step in this lesson. The task: ${step.instruction}` +
      (step.target ? `\nTarget output:\n${step.target}` : "") +
      (assembled ? `\nMy code:\n${assembled}` : "") +
      (out ? `\nWhat happened: ${out.compiled ? out.error ? `runtime error: ${out.error}` : `it printed:\n${out.stdout}` : `compile error: ${out.error}`}` : "") +
      `\nGive me ONE small hint. Don't solve it for me.`;
    const d = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature: "tutor", lessonCode, message: msg }),
    }).then((r) => r.json());
    setAiHint(d.text || d.error || "The tutor is unavailable right now.");
    setAiBusy(false);
  }

  const runnable = ["run", "tweak", "fix", "write", "arrange", "ask"].includes(step.kind) || (step.kind === "workout" && planOk);
  const editable = ["tweak", "fix", "write"].includes(step.kind) || (step.kind === "workout" && planOk);
  const codeLines = (step.code || "").split("\n");
  const advanceReady = won || (reveal && step.kind !== "fill" && step.kind !== "bucket");

  return (
    <div className={`panel flowstep ${won ? "won" : ""}`}>
      <div className="flowq">{step.instruction}</div>
      <Assist text={assist?.instruction} lang={lang} />
      {(step.body || []).length > 0 && (
        <div className="teachbody">
          {(step.body || []).map((line, j) => <p key={j}>{line}</p>)}
        </div>
      )}
      {/* The documentation stays on screen while the student works. Hiding it
          the moment an exercise starts is the whole reason 5.3 felt unfair. */}
      {step.facts && step.kind !== "teach" && (
        <details className="docsfold" open>
          <summary>Documentation</summary>
          <div className="factswrap">
            <table className="facts">
              <thead><tr>{step.facts.columns.map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
              <tbody>{step.facts.rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, ci) => <td key={ci}>{c}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>
        </details>
      )}

      {/* ── code surface ── */}
      {step.kind === "spot" ? (
        <div className="flowspot">
          {codeLines.map((l, j) => {
            const cls = reveal
              ? j === reveal.correctIndex ? "right" : j === reveal.chosen ? "wrong" : "dim"
              : choice === j ? "sel" : "";
            return (
              <button key={j} className={`spotline ${cls}`} disabled={!!reveal} onClick={() => setChoice(j)}>
                <span className="ln">{j + 1}</span>
                <pre>{l || " "}</pre>
              </button>
            );
          })}
          {!reveal && (
            <div className="flowrun">
              <button className="btn green" style={{ fontSize: 15, padding: "9px 24px" }} disabled={choice === null} onClick={() => answer(choice!)}>
                {choice === null ? "Tap a line first" : "Check my answer"}
              </button>
            </div>
          )}
        </div>
      ) : step.kind === "arrange" ? (
        <div className="flowarrange">
          <div className="pool">
            {(step.lines || []).filter((l) => !picked.includes(l)).map((l) => (
              <button key={l} className="linebtn" onClick={() => { setPicked((prev) => [...prev, l]); setOut(null); }}>{l}</button>
            ))}
          </div>
          <div className="built">
            {picked.length === 0 && <span className="meta" style={{ margin: 0 }}>tap the lines above, in order — some may be decoys</span>}
            {picked.map((l, j) => (
              <button key={l} className="linebtn placed" title="tap to remove" onClick={() => { setPicked(picked.filter((x) => x !== l)); setOut(null); setWon(false); }}>
                <span className="n">{j + 1}</span> {l}
              </button>
            ))}
          </div>
        </div>
      ) : step.kind === "fill" ? (
        <FillSurface
          step={step}
          fillPick={fillPick}
          onPick={(bi, ci) => { setFillPick((prev) => { const p = [...prev]; p[bi] = ci; return p; }); setVerdicts(null); }}
          verdicts={verdicts}
          serverAnswers={serverAnswers}
        />
      ) : editable ? (
        <CodeBox value={code} onChange={(v) => { setCode(v); setWon(false); }} />
      ) : step.code ? (
        // Tint the lines that are NEW on this step, so a program that grows
        // across a lesson shows what just arrived rather than re-presenting
        // itself whole each time.
        (step.scopes || []).length ? (
          // One colour-coded box per variable, covering exactly the lines it
          // exists on. See components/lesson/ScopeDiagram.tsx.
          <ScopeDiagram code={step.code} scopes={step.scopes || []} />
        ) : (step.annotate || []).length ? (
          // ONE GRID. The arrows only line up if the note rows are laid out in
          // the same monospace box as the code, from the same left edge — the
          // previous version put them in a sibling element with its own
          // padding, so every arrow sat a few characters off.
          <div className="flowcode ro anncode">
            {step.code.split("\n").map((ln, li) => {
              const marks = (step.annotate || [])
                .map((a) => ({ ...a, col: ln.indexOf(a.token) }))
                .filter((a) => a.col >= 0)
                .sort((x, y) => x.col - y.col);
              return (
                <div key={li}>
                  <div className="annline">{ln || " "}</div>
                  {marks.map((m, mi) => (
                    <div className="annrow" key={mi}>
                      <span className="annpad" style={{ width: `${m.col}ch` }} />
                      <span className="anntick">└─</span>
                      <span className="annnote">{m.note}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (step.highlight || []).length ? (
          <pre className="flowcode ro">
            {step.code.split("\n").map((ln, li) => (
              <span key={li} className={(step.highlight || []).includes(li) ? "cl new" : "cl"}>
                {ln || " "}
              </span>
            ))}
          </pre>
        ) : (
          <pre className="flowcode ro">{step.code}</pre>
        )
      ) : null}

      {/* The calls the platform will make around their method. Read-only, and
          shown because the signature they must write is visible in it. */}
      {step.harness && (
        <div className="harness">
          <div className="lbl">WE WILL CALL IT LIKE THIS</div>
          <pre className="flowcode ro">{step.harness}</pre>
        </div>
      )}

      {/* ── ask: the student types the input themselves ──
          The whole point of an input lesson is that YOU supply the value. A
          pre-filled stdin captioned "we'll type Ada for you" teaches nothing —
          the value appears from nowhere and the link between the prompt, the
          typing and the variable is never made. Here each read call in the
          code gets its own field, and what you type is genuinely what the
          program reads. */}
      {step.kind === "ask" && (
        <div className="askbox">
          <div className="lbl">WHAT YOU TYPE WHEN IT ASKS</div>
          {(step.fields || []).map((fl: any, j: number) => (
            <label key={j} className="askrow">
              <span className="askq">{fl.label}</span>
              <input
                className="askin"
                value={typed[j] ?? ""}
                placeholder={fl.placeholder || "type your answer"}
                onChange={(e) => {
                  const v = e.target.value;
                  // functional updater: two quick edits in one render must not
                  // lose the first (this bit us before on fill/bucket).
                  setTyped((prev) => { const n = [...prev]; n[j] = v; return n; });
                  setWon(false);
                  setOut(null);
                }}
              />
            </label>
          ))}
        </div>
      )}

      {/* After the run, name the connection out loud. */}
      {step.kind === "ask" && won && (step.fields || []).some((fl: any) => fl.holds) && (
        <div className="askheld">
          {(step.fields || []).map((fl: any, j: number) =>
            fl.holds ? (
              <div key={j}>
                <code>{fl.holds}</code> now holds <b>{typed[j] === "" ? "(nothing)" : typed[j]}</b>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* no real keyboard in a run-and-watch step — show what's "typed" */}
      {/* A console, not a caption. Showing "simulated typing: Ada" taught the
          student to watch a value they did not choose arrive from nowhere. On a
          run step they type here and the program reads exactly that; on a graded
          step the typing is fixed, and the transcript echoes it anyway, so
          there is nothing to caption. */}
      {interactive && termOut !== null && (
        <div className="term">
          <div className="lbl">CONSOLE</div>
          <div className="termbody">
            {/* The prompt ends without a newline, so the caret has to sit on the
                same line as it. Split the last line off and lay it beside the
                input rather than nudging a block with a negative margin. */}
            {termWait ? (
              (() => {
                const ls = (termOut || "").split("\n");
                const head = ls.slice(0, -1).join("\n");
                return head ? <pre>{head}</pre> : null;
              })()
            ) : (
              <pre>{termOut}</pre>
            )}
            {termWait && (
              <form
                className="termline"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  if (busy) return;
                  const next = [...termIn, termLine];
                  setTermIn(next);
                  setTermLine("");
                  setTermWait(false);
                  runTerminal(next);
                }}
              >
                <span className="termprompt">{(termOut || "").split("\n").slice(-1)[0]}</span>
                <input
                  className="terminput"
                  value={termLine}
                  autoFocus
                  spellCheck={false}
                  aria-label="type your answer"
                  disabled={busy}
                  onChange={(ev) => setTermLine(ev.target.value)}
                />
              </form>
            )}
          </div>
          {termWait && <div className="typenote">Type your answer and press enter.</div>}
        </div>
      )}

      {/* ── target ── */}
      {step.target && !["tweak", "run", "predict", "spot", "trace"].includes(step.kind) && (
        <div className="flowtarget">
          <div className="lbl">TARGET OUTPUT</div>
          <pre>{step.target}</pre>
        </div>
      )}

      {/* ── kind-specific interaction ── */}
      {step.kind === "predict" && (
        <>
          <div className="flowopts">
            {(step.opts || []).map((o, j) => {
              // Selecting is NOT answering. Tapping used to grade instantly, so
              // a stray tap or a change of mind became an immediate red cross —
              // exactly the "I'm bad at this" feeling this platform exists to
              // avoid. Now you pick, you can re-pick, and you commit when ready.
              const cls = reveal
                ? j === reveal.correctIndex ? "right" : j === reveal.chosen ? "wrong" : "dim"
                : choice === j ? "sel" : "";
              return (
                <button key={j} className={`optbtn ${cls}`} disabled={!!reveal} onClick={() => setChoice(j)}>
                  <pre style={{ margin: 0, fontFamily: "inherit", whiteSpace: "pre-wrap" }}>{o}</pre>
                </button>
              );
            })}
          </div>
          {!reveal && (
            <div className="flowrun">
              <button className="btn green" style={{ fontSize: 15, padding: "9px 24px" }} disabled={choice === null} onClick={() => answer(choice!)}>
                {choice === null ? "Pick one first" : "Check my answer"}
              </button>
              <span className="meta" style={{ margin: 0 }}>you can change your mind before checking</span>
            </div>
          )}
        </>
      )}

      {step.kind === "trace" && !won && (
        <div className="flowtracer">
          <div className="meta" style={{ margin: "8px 0 4px" }}>checkpoint {traceIdx + 1} / {(step.questions || []).length}</div>
          <div className="flowq" style={{ fontSize: 16 }}>{step.questions?.[traceIdx]?.prompt}</div>
          <div className="flowopts">
            {(step.questions?.[traceIdx]?.opts || []).map((o, j) => {
              const cls = !traceReveal ? "" : j === traceReveal.correctIndex ? "right" : j === traceReveal.chosen ? "wrong" : "dim";
              return <button key={j} className={`optbtn ${cls}`} disabled={!!traceReveal} onClick={() => traceAnswer(j)}>{o}</button>;
            })}
          </div>
          {traceReveal && (
            <div className={`flowwhy ${traceReveal.correct ? "yes" : "no"}`} aria-live="polite">
              <b>{traceReveal.correct ? "✓" : "not quite —"}</b> {traceReveal.why || ""}
              <button className="btn ghost" style={{ marginLeft: 10, padding: "3px 12px" }} onClick={traceNext}>
                {traceIdx + 1 >= (step.questions || []).length ? "finish" : "next checkpoint →"}
              </button>
            </div>
          )}
        </div>
      )}

      {step.kind === "fill" && !won && (
        <button className="btn green" style={{ marginTop: 10 }} disabled={(step.blanks || []).some((_, bi) => fillPick[bi] === undefined)} onClick={checkFill}>
          Check
        </button>
      )}

      {step.kind === "bucket" && (
        <div className="flowbuckets">
          {(step.items || []).map((it, i2) => (
            <div key={i2} className={`bucketrow ${verdicts ? (verdicts[i2] ? "right" : "wrong") : ""}`}>
              <span className="itext">{it.text}</span>
              <span className="bchips">
                {(step.buckets || []).map((b, bi) => (
                  <button
                    key={bi}
                    className={`bchip ${assign[i2] === bi ? "on" : ""} ${verdicts && !verdicts[i2] && serverAnswers && serverAnswers[i2] === bi ? "hintright" : ""}`}
                    // Functional update — see the fill step: reading `assign`
                    // directly loses a pick when two items are tapped fast.
                    onClick={() => { setAssign((prev) => { const a = [...prev]; a[i2] = bi; return a; }); setVerdicts(null); }}
                  >
                    {b}
                  </button>
                ))}
              </span>
            </div>
          ))}
          {!won && (
            <button className="btn green" style={{ marginTop: 10 }} disabled={(step.items || []).some((_, i2) => assign[i2] === undefined)} onClick={checkBucket}>
              Check
            </button>
          )}
        </div>
      )}

      {/* ── table ──
          The rows have to sit together, because the pattern IS the lesson:
          && is true in exactly one row of four, || false in exactly one. A
          sequence of separate questions can teach each row and still leave the
          shape invisible. */}
      {step.kind === "table" && (() => {
        const from = step.fillFrom ?? 1;
        const cols = step.columns || [];
        const fillCols = cols.length - from;
        return (
          <div className="flowtable">
            <table>
              <thead>
                <tr>{cols.map((c, ci) => <th key={ci} className={ci >= from ? "fillcol" : ""}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {(step.rows || []).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => {
                      if (ci < from) return <td key={ci} className="given">{cell}</td>;
                      const idx = ri * fillCols + (ci - from);
                      const v = verdicts ? verdicts[idx] : null;
                      return (
                        <td key={ci} className={v === null ? "" : v ? "right" : "wrong"}>
                          <button
                            className={`tcell ${cells[idx] ? "filled" : ""} ${cellSel === idx ? "sel" : ""}`}
                            onClick={() => setCellSel(idx)}
                          >
                            {cells[idx] || "?"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="tchips">
              {(step.chips || []).map((ch) => (
                <button
                  key={ch}
                  className="bchip"
                  disabled={cellSel === null}
                  onClick={() => {
                    if (cellSel === null) return;
                    // functional update: rapid taps must not drop one
                    setCells((prev) => { const n = [...prev]; n[cellSel] = ch; return n; });
                    setVerdicts(null);
                    setCellSel((s) => (s === null ? null : s + 1 < blankCount ? s + 1 : null));
                  }}
                >
                  {ch}
                </button>
              ))}
              <span className="meta" style={{ margin: 0 }}>
                {cellSel === null ? "tap a ? then pick a value" : "now pick a value"}
              </span>
            </div>
            {!won && (
              <button
                className="btn green"
                style={{ marginTop: 10 }}
                disabled={cells.some((c) => !c)}
                onClick={checkTable}
              >
                Check
              </button>
            )}
          </div>
        );
      })()}

      {step.kind === "match" && (
        <div className="flowmatch">
          <div className="mcol">
            {(step.lefts || []).map((l, li) => {
              const pairedWith = pairsMade.find((p) => p[0] === li)?.[1];
              return (
                <button key={li} className={`mchip ${leftSel === li ? "sel" : ""} ${pairedWith ? "paired" : ""}`} onClick={() => { setLeftSel(li); }}>
                  {l} {pairedWith ? `↔ ${pairedWith}` : ""}
                </button>
              );
            })}
          </div>
          <div className="mcol">
            {(step.rights || []).filter((r) => !pairsMade.some((p) => p[1] === r)).map((r) => (
              <button key={r} className="mchip" disabled={leftSel === null} onClick={() => {
                if (leftSel === null) return;
                setPairsMade((prev) => [...prev.filter((p) => p[0] !== leftSel), [leftSel, r]]);
                setLeftSel(null);
                setVerdicts(null);
              }}>
                {r}
              </button>
            ))}
          </div>
          {!won && (
            <button className="btn green" style={{ marginTop: 10 }} disabled={pairsMade.length !== (step.lefts || []).length} onClick={checkMatch}>
              Check
            </button>
          )}
        </div>
      )}

      {step.kind === "explain" && (
        <div className="flowexplain">
          {step.prompt && <p style={{ margin: "4px 0 8px", fontSize: 15 }}>{step.prompt}</p>}
          <textarea className="f" rows={2} value={explainText} placeholder="one or two sentences, your own words…" onChange={(e) => setExplainText(e.target.value)} disabled={won} />
          {!won && (
            <div className="runrow" style={{ marginTop: 8 }}>
              <button className="btn purple" disabled={busy || !explainText.trim()} onClick={sendExplain}>{busy ? "reading…" : "✦ Convince me"}</button>
              {fails >= 2 && <button className="skiplink" onClick={onSkip}>move on ›</button>}
            </div>
          )}
          {explainReply && <div className={`flowwhy ${won ? "yes" : "no"}`} aria-live="polite">{won ? "✓ " : ""}{explainReply}</div>}
        </div>
      )}

      {step.kind === "branch" && (
        <div className="flowopts">
          {(step.options || []).map((o, j) => (
            <button key={j} className="optbtn" onClick={() => onGoto(o.goto)}>{o.label}</button>
          ))}
        </div>
      )}

      {step.kind === "compare" && (
        <div className="cmp">
          {(step.sides || []).map((sd, si) => (
            <div className="cmpside" key={si}>
              <div className="cmplabel">{sd.label}</div>
              <pre className="flowcode ro">{sd.code}</pre>
              <div className="lbl">PRINTS</div>
              <pre className="cmpout">{sd.output}</pre>
            </div>
          ))}
        </div>
      )}

      {step.kind === "workout" && !planOk && (
        <div className="workout">
          {step.level && <span className={`wlevel wl-${step.level.replace(" ", "-")}`}>{step.level}</span>}
          <div className="worksub">First, put the plan in order. You write the code after.</div>
          {(step.methods || []).length > 0 && (
            <div className="workmethods">
              <span className="lbl">MIGHT BE USEFUL</span>
              {(step.methods || []).map((m) => <code key={m}>{m}</code>)}
            </div>
          )}
          <ol className="planpicked">
            {planPick.map((t, j) => (
              <li key={j}>
                <span>{t}</span>
                <button className="planx" onClick={() => setPlanPick((p) => p.filter((_, k) => k !== j))} aria-label="remove">×</button>
              </li>
            ))}
            {planPick.length === 0 && <li className="planempty">tap the lines below, in the order they should happen</li>}
          </ol>
          <div className="planpool">
            {(step.plan || []).filter((t) => !planPick.includes(t)).map((t) => (
              <button key={t} className="planchip" onClick={() => { setPlanWrong(false); setPlanPick((p) => [...p, t]); }}>{t}</button>
            ))}
          </div>
          {planWrong && <div className="planwrong">Not that order. Think about what has to exist before the loop starts, and what happens after it ends.</div>}
          <button
            className="btn green"
            disabled={busy || planPick.length !== (step.plan || []).length}
            onClick={async () => {
              setBusy(true);
              const d = await post({ action: "plan", order: planPick, attempt: fails + 1 });
              setBusy(false);
              if (d.correct) { setPlanOk(true); setPlanWrong(false); }
              else { setPlanWrong(true); onAttempt(step.id); }
            }}
          >
            Check the plan
          </button>
        </div>
      )}
      {step.kind === "workout" && planOk && !won && (
        <div className="workplan">
          <span className="lbl">YOUR PLAN</span>
          <ol>{(planPick.length ? planPick : step.plan || []).map((t, j) => <li key={j}>{t}</li>)}</ol>
        </div>
      )}

      {step.kind === "walk" && (() => {
        const frames = step.frames || [];
        const f = frames[Math.min(frame, frames.length - 1)];
        const atEnd = frame >= frames.length - 1;
        return (
          <div className="walk">
            <pre className="walkcode">
              {(step.code || "").split("\n").map((ln, li) => (
                <span key={li} className={li === f.line ? "wl now" : "wl"}>{ln || " "}</span>
              ))}
            </pre>
            <div className="walknote">{f.note}</div>
            <div className="walkstate">
              {Object.entries(f.vars || {}).map(([k, v]) => (
                <span className="wvar" key={k}><b>{k}</b>{v}</span>
              ))}
            </div>
            <div className="walkout">
              <div className="lbl">PRINTED SO FAR</div>
              <pre>{f.out || "(nothing yet)"}</pre>
            </div>
            <div className="walkbar">
              <button className="btn" disabled={frame === 0} onClick={() => setFrame((n) => Math.max(0, n - 1))}>Back</button>
              {!atEnd ? (
                <button className="btn green" onClick={() => setFrame((n) => n + 1)}>Next step</button>
              ) : !won ? (
                <button className="btn green" onClick={() => { setWon(true); post({ action: "complete", attempts: 1 }); }}>Done</button>
              ) : null}
              <span className="walkcount">{Math.min(frame + 1, frames.length)} of {frames.length}</span>
            </div>
          </div>
        );
      })()}

      {step.kind === "card" && (
        <div className="cardstep">
          <div className="cardform">
            {(step.vars || []).map((v, j) => (
              <div className="cardrow" key={j}>
                <code className="cv-decl">
                  <span className="cv-type">{v.type}</span> {v.name} =
                </code>
                <input
                  className={`cv-in ${cardErrs[j] ? "bad" : ""}`}
                  value={cardVals[j] ?? ""}
                  placeholder={v.placeholder || ""}
                  aria-label={`value for ${v.name}`}
                  disabled={won}
                  onChange={(ev) => {
                    const next = [...cardVals];
                    next[j] = ev.target.value;
                    setCardVals(next);
                    if (cardErrs[j]) { const e2 = [...cardErrs]; e2[j] = null; setCardErrs(e2); }
                  }}
                />
                <span className="cv-semi">;</span>
                {cardErrs[j] ? <span className="cv-err">{cardErrs[j]}</span> : null}
              </div>
            ))}
          </div>
          {!won && (
            <button
              className="btn primary"
              onClick={() => {
                const vs = step.vars || [];
                const errs = vs.map((v, j) => checkLiteral(v.type, (cardVals[j] ?? "").trim()));
                setCardErrs(errs);
                if (errs.every((e2) => !e2)) {
                  setWon(true);
                  post({ action: "complete", attempts: fails + 1 });
                } else {
                  onAttempt(step.id);
                }
              }}
            >
              Make my card
            </button>
          )}
          {won && (
            <div className="pcard">
              <div className="pc-top">
                <span className="pc-name">{strip(cardVals[0] ?? "")}</span>
                {(step.vars || [])[4] ? <span className="pc-rank">{strip(cardVals[4] ?? "")}</span> : null}
              </div>
              <div className="pc-rows">
                {(step.vars || []).slice(1, 4).map((v, j) => (
                  <div className="pc-row" key={j}>
                    <span>{v.label || v.name}</span>
                    <b>{strip(cardVals[j + 1] ?? "")}</b>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step.kind === "teach" && (
        <div className="teachcard">
          {step.output !== undefined && (
            <div className="flowout" style={{ marginTop: 10 }}>
              <div className="lbl">WHAT IT PRINTS</div>
              <pre>{step.output || "(nothing)"}</pre>
            </div>
          )}
          {(step.pipeline || []).length > 0 && (
            <div className="pipe">
              {(step.pipeline || []).map((st, j) => (
                <div className="pipestage" key={j}>
                  <div className={`pipebox pb-${st.kind || "tool"}`}>
                    <span className="pipelabel">{st.label}</span>
                    {st.note && <span className="pipenote">{st.note}</span>}
                  </div>
                  {j < (step.pipeline || []).length - 1 && <span className="pipearrow" aria-hidden="true">↓</span>}
                </div>
              ))}
            </div>
          )}
          {step.facts && (
            <div className="factswrap">
              <table className="facts">
                <thead><tr>{step.facts.columns.map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
                <tbody>
                  {step.facts.rows.map((r, ri) => (
                    <tr key={ri}>{r.map((c, ci) => <td key={ci}>{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(step.rules || []).length > 0 && (
            <ol className="rulelist">
              {(step.rules || []).map((r, j) => (
                <li key={j}>
                  <span className="rl-t">{r.text}</span>
                  {r.example ? <code className="rl-e">{r.example}</code> : null}
                </li>
              ))}
            </ol>
          )}
          {(step.points || []).map((p, j) => (
            <div className="teachpoint" key={j}>
              <code className="tp-label">{p.label}</code>
              <span className="tp-text">
                {p.text}
                <Assist text={assist?.points?.[j]?.text} lang={lang} />
              </span>
            </div>
          ))}
        </div>
      )}

      {step.kind === "note" && <div style={{ marginTop: 4 }} />}



      {/* ── run + output ── */}
      {runnable && (
        <div className="flowrun">
          <button className="btn green" style={{ fontSize: 15, padding: "10px 26px" }} disabled={busy || (step.kind === "arrange" && picked.length !== (step.count ?? (step.lines || []).length))} onClick={() => (interactive ? (setTermIn([]), setTermLine(""), runTerminal([])) : run())}>
            {busy ? `running… ${elapsed}s` : "▶ Run"}
          </button>
          {/* Past a few seconds a silent spinner reads as broken — say what's
              actually happening. */}
          {busy && elapsed >= 3 && (
            <span className="meta" style={{ margin: 0 }}>
              {elapsed >= 8 ? "still compiling — slow connection to the compiler, hang on" : "compiling your code on a real Java compiler…"}
            </span>
          )}
          {step.kind === "arrange" && picked.length > 0 && !won && (
            <button className="btn ghost" onClick={() => { setPicked([]); setOut(null); }}>↺ reset</button>
          )}
        </div>
      )}
      {/* Output and feedback appear as new DOM after a keypress, so they must be
          announced — otherwise a screen-reader user presses Run and hears
          nothing at all. */}
      <div aria-live="polite" aria-atomic="false">
        {out && (
          <div className={`flowout ${out.compiled && !out.error ? "" : "err"}`}>
            <div className="lbl">{out.compiled ? (out.error ? "RUNTIME ERROR" : "OUTPUT") : "COMPILE ERROR — read it, it tells you where"}</div>
            <pre>{out.compiled ? (out.error || out.stdout || "(nothing printed)") : out.error}</pre>
          </div>
        )}

        {/* ── reveal / success beats ── */}
        {reveal && reveal.why !== undefined && reveal.why !== "" && (
          <div className={`flowwhy ${reveal.correct ? "yes" : "no"}`}>
            <b>{reveal.correct ? "✓ exactly." : "Good guess — here's the catch:"}</b> {reveal.why}
            <Assist text={assist?.why} lang={lang} />
          </div>
        )}
        {won && step.after && <div className="flowwhy yes"><b>✓</b> {step.after}<Assist text={assist?.after} lang={lang} /></div>}
        {won && !step.after && !reveal?.why && step.kind !== "note" && <div className="flowwhy yes"><b>✓ nailed it.</b></div>}
      </div>

      {/* ── help ladder ── */}
      {!won && !reveal && (runnable || step.kind === "fill" || step.kind === "bucket") && fails >= 1 && (
        <div className="flowhelp">
          {step.hint && !hintOpen && <button className="btn ghost" onClick={() => setHintOpen(true)}>💡 hint</button>}
          {hintOpen && <span className="hinttext">💡 {step.hint}<Assist text={assist?.hint} lang={lang} /></span>}
          {fails >= 2 && !aiHint && runnable && (
            <button className="btn purple" disabled={aiBusy} onClick={askTutor}>{aiBusy ? "…" : "🤖 I'm stuck"}</button>
          )}
          {aiHint && <span className="hinttext">🤖 {aiHint}</span>}
        </div>
      )}

      {/* ── advance ── */}
      <div className="flownext">
        {step.kind === "note" || step.kind === "teach" ? (
          <button className="btn green" style={{ fontSize: 15, padding: "10px 30px" }} onClick={() => onDone(true)} autoFocus>Next →</button>
        ) : step.kind === "branch" ? (
          <span />
        ) : advanceReady ? (
          <button className="btn green" style={{ fontSize: 15, padding: "10px 30px" }} onClick={() => onDone((won || reveal?.correct === true) && fails <= 1)} autoFocus>
            Next →
          </button>
        ) : (
          <button className="skiplink" onClick={onSkip} title="Skip this step (it won't count)">skip ›</button>
        )}
      </div>
    </div>
  );
}

// fill: code with ⟦n⟧ markers rendered inline as the currently-picked chip
function FillSurface({ step, fillPick, onPick, verdicts, serverAnswers }: {
  step: Step;
  fillPick: number[];
  onPick: (blankIndex: number, chipIndex: number) => void;
  verdicts: boolean[] | null;
  serverAnswers: number[] | null;
}) {
  const parts = (step.code || "").split(/(⟦\d+⟧)/g);
  return (
    <div>
      <pre className="flowcode ro" style={{ whiteSpace: "pre-wrap" }}>
        {parts.map((p, j) => {
          const m = p.match(/^⟦(\d+)⟧$/);
          if (!m) return <span key={j}>{p}</span>;
          const bi = Number(m[1]) - 1;
          const picked = fillPick[bi];
          const v = verdicts?.[bi];
          return (
            <span key={j} className={`fillslot ${picked === undefined ? "" : v === undefined ? "set" : v ? "right" : "wrong"}`}>
              {picked === undefined ? `?${bi + 1}` : step.blanks?.[bi]?.chips[picked]}
            </span>
          );
        })}
      </pre>
      {(step.blanks || []).map((b, bi) => (
        <div key={bi} className="fillrow">
          <span className="meta" style={{ margin: 0 }}>?{bi + 1}</span>
          {b.chips.map((c, ci) => (
            <button
              key={ci}
              className={`bchip ${fillPick[bi] === ci ? "on" : ""} ${verdicts && !verdicts[bi] && serverAnswers && serverAnswers[bi] === ci ? "hintright" : ""}`}
              // Functional update: reading fillPick directly meant two chip
              // taps in the same render lost the first one.
              onClick={() => onPick(bi, ci)}
            >
              {c}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// Finishing a lesson should feel like finishing, not like being handed a test.
// This used to lead with a locked "Prove it — clean quiz" button and explain
// that the steps you just did were only a warm-up and didn't count. For a
// student who struggles, that turns a win into a hurdle. One button: keep going.
function FlowDone({ total, firstTry, nextHref }: { total: number; firstTry: number; nextHref?: string | null }) {
  return (
    <div className="panel flowstep won" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 40 }}>🎉</div>
      <h2 style={{ fontFamily: "var(--serif)", margin: "6px 0" }}>Lesson complete</h2>
      <p className="meta">you got {firstTry} of {total} right first try</p>
      {nextHref && (
        <Link href={nextHref} className="btn green" style={{ textDecoration: "none", fontSize: 15, padding: "11px 26px", display: "inline-block", marginTop: 10 }}>
          Next lesson →
        </Link>
      )}
    </div>
  );
}

/**
 * Checks a typed value against the type declared next to it. This IS the
 * lesson: a String needs double quotes, a char needs single ones, a double
 * needs a decimal point. Returning the reason rather than a boolean lets the
 * student see which rule they missed.
 */
function checkLiteral(type: string, v: string): string | null {
  if (!v) return "needs a value";
  switch (type) {
    case "String":
      return /^".*"$/.test(v) ? null : 'text needs double quotes, like "Ada"';
    case "int":
      return /^-?\d+$/.test(v) ? null : "a whole number, no decimal point";
    case "double":
      return /^-?\d+\.\d+$/.test(v) ? null : "a number with a decimal point, like 2.5";
    case "boolean":
      return v === "true" || v === "false" ? null : "only true or false";
    case "char":
      return /^'.'$/.test(v) ? null : "one character in single quotes, like 'A'";
    default:
      return null;
  }
}

/** Strips the quotes so the finished card shows the value, not the literal. */
function strip(v: string): string {
  return v.trim().replace(/^["']|["']$/g, "");
}
