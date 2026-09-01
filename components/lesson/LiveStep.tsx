"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { SANDBOX_RUNTIME } from "@/lib/ts/sandbox";
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

// The compiler writes for people who write compilers. These are the errors a
// beginner actually hits, said the way a person would say them. The original
// message is still shown underneath, quieter — a student who searches the web
// for it should find the same thing everyone else finds.
function plain(d: Diag): string {
  const m = d.message;
  switch (d.code) {
    case 2322: {
      const g = /Type '(.+?)' is not assignable to type '(.+?)'/.exec(m);
      return g ? `That is ${g[1]}, but this holds ${g[2]}.` : m;
    }
    case 2588: return "This was made with const, so it cannot be changed.";
    case 7006: return "TypeScript cannot tell what type this is. Write it after a colon.";
    case 2345: {
      const g = /Argument of type '(.+?)' is not assignable to parameter of type '(.+?)'/.exec(m);
      return g ? `You passed ${g[1]}, but it expects ${g[2]}.` : m;
    }
    case 2339: {
      const g = /Property '(.+?)' does not exist on type '(.+?)'/.exec(m);
      return g ? `${g[2]} has no ${g[1]}.` : m;
    }
    case 2367: return "These two can never be equal, because they are different types.";
    case 18047: return "This might be null, so check it before using it.";
    case 2304: {
      const g = /Cannot find name '(.+?)'/.exec(m);
      return g ? `Nothing called ${g[1]} exists here. Check the spelling.` : m;
    }
    case 1005: case 1109: case 1128: return "Something is missing here — often a bracket, a quote or a semicolon.";
    default: return m;
  }
}

export default function LiveStep({
  step,
  onSolved,
}: {
  step: { id: string; instruction: string; code?: string; goal?: Goal; expectCode?: number; target?: string; hint?: string; after?: string };
  /** Fired once, when the goal is met. The player shows Next; it does not skip ahead. */
  onSolved: (firstTry: boolean) => void;
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
      ${SANDBOX_RUNTIME}
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
    if (met && !won) { setWon(true); onSolved(!touched); }
  }, [met, won, touched, onSolved]);

  return (
    <div className="live">
      {/* The instruction is rendered by FlowPlayer, above every step. Repeating
          it here printed it twice, one paragraph under the other. */}
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
        <span className="livedot" aria-hidden />
        {busy ? "checking as you type…"
          : diags === null ? "TypeScript is watching. Start typing."
          : errs.length === 0 ? "TypeScript found no problems."
          : `TypeScript found ${errs.length} problem${errs.length === 1 ? "" : "s"}:`}
      </div>

      {errs.length > 0 && (
        <ul className="livediags">
          {errs.slice(0, 4).map((d, i) => (
            <li key={i}>
              <b>line {d.line}</b>
              <div>
                <span>{plain(d)}</span>
                <em>{d.message}</em>
              </div>
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
