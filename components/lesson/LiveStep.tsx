"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { javascript } from "@codemirror/lang-javascript";

// The TypeScript step: errors appear while you type.
//
// EVERY OTHER STEP IN THIS COURSE WAITS FOR A BUTTON. Java has to — the code
// goes to a compiler on another machine and comes back a second or two later,
// so a keystroke-by-keystroke check would be both slow and expensive.
// TypeScript's compiler runs in our own process in about 8ms, so it does not
// have to wait, and a beginner finding out they are wrong while the thought is
// still in their head is a different experience from finding out afterwards.
//
// THE PROGRAM RUNS IN THE BROWSER, in a sandboxed iframe with no network and no
// same-origin access. Nothing a student writes executes on the server. That is
// also why these steps cost nothing to serve and keep working when the code
// runner is down.

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
  loading: () => <div className="cm-wrap" style={{ height: 180, background: "#1c2230" }} />,
});

type Diag = { line: number; col: number; length: number; message: string; code: number };
type Goal = "clean" | "error" | "output";

export default function LiveStep({
  step,
  onDone,
}: {
  step: { id: string; instruction: string; code?: string; goal?: Goal; expectCode?: number; target?: string; hint?: string; after?: string };
  onDone: (firstTry: boolean) => void;
}) {
  const goal: Goal = step.goal || "clean";
  const [code, setCode] = useState(step.code || "");
  const [diags, setDiags] = useState<Diag[] | null>(null);
  const [js, setJs] = useState("");
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [won, setWon] = useState(false);
  const [touched, setTouched] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  // DEBOUNCED, not per-keystroke. Checking mid-word reports errors about
  // half-typed identifiers, which reads as the editor shouting at someone for
  // not having finished their sentence.
  const run = useCallback(async (src: string) => {
    setBusy(true);
    const r = await fetch("/api/ts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: src }),
    }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (!r || r.error) return;
    setDiags(r.diagnostics || []);
    setJs(r.js || "");
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => run(code), 500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [code, run]);

  // Output goal: execute the compiled JavaScript in a sandbox and listen for
  // what it printed.
  useEffect(() => {
    if (goal !== "output" || !js) return;
    const onMsg = (e: MessageEvent) => {
      if (e.data?.__polyglot === step.id) setOut(String(e.data.out ?? ""));
    };
    window.addEventListener("message", onMsg);
    const html = `<script>
      const lines = [];
      const console = { log: (...a) => lines.push(a.join(" ")), error: (...a) => lines.push(a.join(" ")) };
      try { ${js} } catch (e) { lines.push(String(e)); }
      parent.postMessage({ __polyglot: ${JSON.stringify(step.id)}, out: lines.join("\\n") }, "*");
    <\/script>`;
    if (frame.current) frame.current.srcdoc = html;
    return () => window.removeEventListener("message", onMsg);
  }, [js, goal, step.id]);

  const errs = diags || [];
  const met =
    goal === "clean" ? diags !== null && errs.length === 0 && code.trim().length > 0
    : goal === "error" ? errs.some((d) => d.code === step.expectCode)
    : out !== null && out.trim() === (step.target || "").trim();

  useEffect(() => {
    if (met && !won) { setWon(true); onDone(!touched); }
  }, [met, won, touched, onDone]);

  return (
    <div className="live">
      <p className="flowq">{step.instruction}</p>

      <div className="cm-wrap">
        <CodeMirror
          value={code}
          height="200px"
          theme="dark"
          extensions={[javascript({ typescript: true })]}
          onChange={(v) => { setCode(v); setTouched(true); }}
          basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
        />
      </div>

      <div className={`livebar ${busy ? "busy" : errs.length ? "bad" : diags ? "good" : ""}`}>
        {busy ? "checking…"
          : diags === null ? "start typing"
          : errs.length === 0 ? "no type errors"
          : `${errs.length} type ${errs.length === 1 ? "error" : "errors"}`}
      </div>

      {errs.length > 0 && (
        <ul className="livediags">
          {errs.slice(0, 4).map((d, i) => (
            <li key={i}>
              <b>line {d.line}</b>
              <span>{d.message}</span>
              <code>TS{d.code}</code>
            </li>
          ))}
        </ul>
      )}

      {goal === "output" && (
        <>
          <p className="meta" style={{ margin: "10px 0 4px" }}>WHAT IT SHOULD PRINT</p>
          <pre className="flowout">{step.target}</pre>
          {out !== null && (
            <>
              <p className="meta" style={{ margin: "10px 0 4px" }}>WHAT YOURS PRINTS</p>
              <pre className="flowout">{out || "(nothing)"}</pre>
            </>
          )}
          <iframe ref={frame} sandbox="allow-scripts" title="output" style={{ display: "none" }} />
        </>
      )}

      {won && <div className="flowwhy yes">✓ {step.after || "That's it."}</div>}
      {!won && step.hint && touched && errs.length > 0 && <p className="livehint">{step.hint}</p>}
    </div>
  );
}
