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
  const linesRef = useRef<string[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    consoleRef.current?.scrollTo(0, consoleRef.current.scrollHeight);
    if (waiting) inputRef.current?.focus();
  }, [out, waiting]);

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
      </div>

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
        {error && <span className="termerr">{error}</span>}
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
