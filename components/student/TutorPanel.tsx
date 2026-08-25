"use client";

// Tutor tool content. Owns its chat history. Accepts a `seed` (from highlight-
// to-ask); when its nonce changes, it auto-sends that question. Sees the
// scratchpad code so "review my code" works.

import { useEffect, useRef, useState } from "react";
import { loadChat, saveChat, clearChat, chatContext, type ChatMsg } from "@/lib/tutor-history";

/**
 * Split a reply into prose and ```java blocks.
 *
 * The tutor is allowed to write code now, so a reply arrives as markdown. Left
 * as plain text it renders as a wall with stray backticks in it; split, the
 * code becomes something a student can read and, more to the point, RUN.
 */
function parseReply(text: string): { kind: "text" | "code"; body: string }[] {
  const out: { kind: "text" | "code"; body: string }[] = [];
  const re = /```(?:java|Java)?\n?([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const before = text.slice(last, m.index).trim();
    if (before) out.push({ kind: "text", body: before });
    const code = m[1].replace(/\s+$/, "");
    if (code.trim()) out.push({ kind: "code", body: code });
    last = m.index + m[0].length;
  }
  const rest = text.slice(last).trim();
  if (rest) out.push({ kind: "text", body: rest });
  return out.length ? out : [{ kind: "text", body: text }];
}

export default function TutorPanel({
  lessonCode,
  scratchCode,
  seed,
  onUseCode,
}: {
  lessonCode: string;
  scratchCode: string;
  seed: { text: string; prompt?: string; nonce: number };
  /** Put a snippet into the scratchpad. The whole point of the tutor sitting
   *  in the same rail as the editor. */
  onUseCode?: (code: string, mode: "replace" | "append") => void;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [loaded, setLoaded] = useState(false);

  // ONE THREAD PER LESSON, restored on mount. The panel is unmounted every time
  // the rail swaps pane — and "Put in scratchpad" swaps pane — so holding the
  // conversation in component state alone deleted it mid-sentence.
  useEffect(() => {
    setMsgs(loadChat(lessonCode));
    setLoaded(true);
  }, [lessonCode]);
  useEffect(() => {
    if (loaded) saveChat(lessonCode, msgs);
  }, [msgs, lessonCode, loaded]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSeed = useRef(0);

  async function ask(message: string) {
    if (!message.trim() || busy) return;
    // Snapshot the thread BEFORE adding this turn: the model should see what
    // was said before the question, not the question twice.
    const prior = chatContext(msgs);
    setMsgs((m) => [...m, { role: "u", text: message }]);
    setInput("");
    setBusy(true);
    const r = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature: "tutor", lessonCode, message, code: scratchCode, history: prior }),
    }).then((x) => x.json());
    setMsgs((m) => [...m, { role: "a", text: r.text || r.error || "…", meta: r.meta }]);
    setBusy(false);
  }

  // highlight-to-ask: when a new selection is sent, ask about it.
  useEffect(() => {
    if (seed.nonce && seed.nonce !== lastSeed.current) {
      lastSeed.current = seed.nonce;
      const q = seed.prompt?.trim() || "Can you explain this part of the lesson?";
      ask(`${q}\n\n"${seed.text}"`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed.nonce]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [msgs, busy]);

  return (
    <div className="tutor" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="msgs" ref={scrollRef} style={{ maxHeight: "none", flex: 1 }}>
        {/* The thread is stored per lesson, so say so — otherwise coming back to
            a full conversation on one lesson and an empty one on the next looks
            like history was lost. */}
        <p className="threadfor">This chat is about lesson {lessonCode}. Each lesson keeps its own.</p>
        <div className="msg a">
          <span className="who">TUTOR</span>
          Hi! Ask me about this topic, or about the code in your scratchpad. Highlight any part of the lesson and hit “Ask
          AI”. I can write and fix code too — any snippet I send has a button to drop it straight into the scratchpad.
        </div>
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.role === "a" && <span className="who">TUTOR</span>}
            {m.role === "a"
              ? parseReply(m.text).map((part, j) =>
                  part.kind === "code" ? (
                    <div className="tutorcode" key={j}>
                      <pre>{part.body}</pre>
                      {onUseCode && (
                        <div className="tutorcodebar">
                          <button onClick={() => onUseCode(part.body, "replace")} title="Replace the scratchpad with this">
                            Put in scratchpad
                          </button>
                          <button onClick={() => onUseCode(part.body, "append")} title="Add to the end of the scratchpad">
                            Append
                          </button>
                          <button onClick={() => navigator.clipboard?.writeText(part.body)} title="Copy">
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="tutortext" key={j}>
                      {part.body}
                    </p>
                  ),
                )
              : m.text}
            {m.meta && <span className="meta">{m.meta}</span>}
          </div>
        ))}
        {busy && <div className="msg a think">tutor is thinking…</div>}
      </div>
      <div className="quick">
        {msgs.length > 0 && (
          <button
            className="chip"
            title="Start this lesson's conversation again"
            onClick={() => {
              setMsgs([]);
              clearChat(lessonCode);
            }}
          >
            New chat
          </button>
        )}
        <button className="chip" onClick={() => ask("Can you review the code in my scratchpad?")}>Review my code</button>
        <button className="chip" onClick={() => ask("I'm stuck — a hint please?")}>Hint</button>
        <button className="chip" onClick={() => ask("What is wrong with my scratchpad code? Show me the fixed version.")}>Fix my code</button>
        <button className="chip" onClick={() => ask("Show me a small worked example for this lesson.")}>Example</button>
      </div>
      <div className="askrow">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(input)}
          placeholder="Ask about this topic or your code…"
          disabled={busy}
        />
        <button className="btn" onClick={() => ask(input)} disabled={busy}>
          Ask
        </button>
      </div>
    </div>
  );
}
