"use client";

// The scratchpad: an editor, and a console you can type into.
//
// ONE BUTTON. It had five — run, main/methods, input, copy, clear — and every
// one was a decision a student had to make before they could try a line of
// Java. The wrapper mode is now worked out from the code (lib/java/detect.ts)
// and input is typed where input belongs, in the console. What is left is Run.
//
// HOW TYPING IN THE CONSOLE WORKS. The Java runner is stateless: it takes a
// program and a block of stdin and hands back the whole output. There is no
// socket to type down. So the console REPLAYS — it keeps the lines typed so
// far, and each new line re-runs the program with all of them. The programs
// here are short and deterministic, so the transcript is identical to a real
// terminal session, and the wrapper already echoes what it reads, so prompts
// and answers interleave the way a student expects.
//
// Knowing when the program wants input is the trick: with nothing left on
// stdin, Scanner.nextLine() throws NoSuchElementException. That exception is
// the signal to show a caret rather than an error.

import { useEffect, useRef, useState } from "react";
import CodeEditor from "../CodeEditor";
import { needsMethodsMode, ensureRun } from "@/lib/java/detect";
import { loadSnapshots, snapshot, describeAge, type Snapshot } from "@/lib/tutor-history";

const WANTS_INPUT = /NoSuchElementException/;

export default function ScratchpadPanel({
  code,
  setCode,
  lessonCode,
}: {
  code: string;
  setCode: (v: string) => void;
  lessonCode: string;
}) {
  const [out, setOut] = useState("");
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ran, setRan] = useState(false);
  const [typed, setTyped] = useState("");
  // AI explanation of the current code or the current error. Rendered against
  // the lines it refers to, not as a paragraph the student has to map back.
  const [notes, setNotes] = useState<{ line: number; note: string }[]>([]);
  const [summary, setSummary] = useState("");
  const [fix, setFix] = useState("");
  const [thinking, setThinking] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const linesRef = useRef<string[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    consoleRef.current?.scrollTo(0, consoleRef.current.scrollHeight);
    if (waiting) inputRef.current?.focus();
  }, [out, waiting]);

  function clearNotes() {
    setNotes([]);
    setSummary("");
    setFix("");
  }

  async function explain(mode: "error" | "review") {
    if (thinking) return;
    setThinking(true);
    clearNotes();
    const r = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature: "explain", mode, lessonCode, code, error, stdout: out }),
    }).then((x) => x.json()).catch(() => null);
    setSummary(r?.summary || r?.error || "Could not explain that one.");
    setNotes(Array.isArray(r?.notes) ? r.notes : []);
    setFix(typeof r?.fix === "string" ? r.fix : "");
    setThinking(false);
  }

  async function exec(lines: string[]) {
    setBusy(true);
    const methods = needsMethodsMode(code);
    const r = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: methods ? ensureRun(code) : code,
        stdin: lines.join("\n"),
        wrap: true,
        wrapMode: methods ? "methods" : "beginner",
        lessonCode,
      }),
    }).then((x) => x.json());

    const err: string = r.error || "";
    const wantsMore = WANTS_INPUT.test(err);
    setOut(r.stdout || "");
    // A program pausing for input is not a program that failed.
    setError(wantsMore ? "" : r.compiled === false || err ? err : "");
    setWaiting(wantsMore);
    setBusy(false);
    setRan(true);
  }

  function run() {
    if (busy) return;
    // Every run is a version worth getting back to.
    snapshot(code, "before a run");
    linesRef.current = [];
    setTyped("");
    setError("");
    exec([]);
  }

  function submitLine() {
    if (busy) return;
    linesRef.current = [...linesRef.current, typed];
    setTyped("");
    exec(linesRef.current);
  }

  return (
    <div
      className="padwrap"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          run();
        }
      }}
    >
      <div className="padtop">
        <button className="btn blue" onClick={run} disabled={busy}>
          {busy ? "Running…" : "▶ Run"}
        </button>
        <span className="runnote">⌘/Ctrl + Enter</span>
        <span style={{ flex: 1 }} />
        {/* One control, not a toolbar. It only exists because replacing the
            buffer — which the tutor's "Put in scratchpad" does — is otherwise
            destructive with no undo. */}
        <button
          className="tbtn2"
          title="Have the tutor annotate your code, line by line"
          onClick={() => explain("review")}
          disabled={thinking || !code.trim()}
        >
          ✦ Explain
        </button>
        <button
          className={`tbtn2 ${histOpen ? "on" : ""}`}
          title="Earlier versions of this code"
          onClick={() => {
            setSnaps(loadSnapshots());
            setHistOpen(!histOpen);
          }}
        >
          ⟲
        </button>
      </div>

      {histOpen && (
        <div className="padhist">
          {snaps.length === 0 && <p className="mutedtx">No earlier versions yet. One is kept every time you run.</p>}
          {snaps.map((sn) => (
            <button
              key={sn.at}
              onClick={() => {
                snapshot(code, "replaced from history");
                setCode(sn.code);
                setHistOpen(false);
              }}
            >
              <span className="padhistwhen">{describeAge(sn.at)}</span>
              <span className="padhistnote">{sn.note}</span>
              <span className="padhistcode">{sn.code.split("\n")[0].slice(0, 44)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="padcode">
        <CodeEditor value={code} onChange={setCode} height="100%" />
      </div>

      {/* The console. Click anywhere in it to type, when it is waiting. */}
      <div
        className={`padterm ${error ? "err" : ""}`}
        ref={consoleRef}
        onClick={() => waiting && inputRef.current?.focus()}
      >
        {!ran && !busy && (
          <span className="mutedtx">▶ Run to see the output. If the program asks a question, type your answer here.</span>
        )}
        {out && <span className="termout">{out}</span>}
        {error && (
          <>
            <span className="termerr">{error}</span>
            {/* The moment a beginner gives up. "cannot find symbol" tells them
                nothing, so the offer belongs here, not in another pane. */}
            <button className="explainbtn" onClick={(e) => { e.stopPropagation(); explain("error"); }} disabled={thinking}>
              ✦ What does this mean?
            </button>
          </>
        )}
        {waiting && (
          <span className="termline">
            <span className="caret">›</span>
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") submitLine();
              }}
              spellCheck={false}
              autoComplete="off"
              aria-label="Type your answer to the program"
            />
          </span>
        )}
      </div>
    </div>
  );
}
