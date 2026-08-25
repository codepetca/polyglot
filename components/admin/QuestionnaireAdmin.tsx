"use client";

import { useState } from "react";
import type { QuestionnaireConfig, Tally } from "@/lib/questionnaire";

// Write the questions; read the answers. One page, because they are the same
// job — you change a question because of what the last answers told you.
//
// RESULTS ABOVE THE EDITOR. The reason to open this page is almost always to
// see what came back, not to write something new.

export default function QuestionnaireAdmin({ initial, tally }: { initial: QuestionnaireConfig; tally: Tally }) {
  const [c, setC] = useState<QuestionnaireConfig>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const set = (p: Partial<QuestionnaireConfig>) => setC((x) => ({ ...x, ...p }));
  const setQ = (i: number, p: Partial<QuestionnaireConfig["questions"][number]>) =>
    setC((x) => ({ ...x, questions: x.questions.map((q, j) => (j === i ? { ...q, ...p } : q)) }));

  async function save(extra: Partial<QuestionnaireConfig> = {}) {
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionnaire: { ...c, ...extra } }),
    }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    setMsg(r?.ok ? "Saved." : "That did not save.");
    if (r?.ok && extra.round) location.reload();
  }

  const max = Math.max(1, ...tally.perQuestion.flatMap((q) => q.opts.map((o) => o.count)));

  return (
    <>
      <section className="qres">
        <h2 className="qh">
          Answers <span className="qmuted">round {c.round} · {tally.responses} {tally.responses === 1 ? "response" : "responses"}</span>
        </h2>
        {tally.responses === 0 ? (
          <p className="qmuted">Nothing back yet.</p>
        ) : (
          tally.perQuestion.map((q) => (
            <div key={q.id} className="qresq">
              <p className="qrest">{q.text}</p>
              {q.opts.map((o, i) => (
                <div key={i} className="qbar">
                  <span className="qbarlab">{o.label}</span>
                  <span className="qbartrack">
                    <span className="qbarfill" style={{ width: `${(o.count / max) * 100}%` }} />
                  </span>
                  <span className="qbarn">{o.count}</span>
                </div>
              ))}
            </div>
          ))
        )}
        {tally.notes.length > 0 && (
          <div className="qnotes">
            <h3 className="qh3">What they typed</h3>
            {tally.notes.map((n, i) => (
              <blockquote key={i}>{n.note}</blockquote>
            ))}
          </div>
        )}
      </section>

      <section className="qedit">
        <h2 className="qh">The questions</h2>

        <label className="qfield">
          <span>Title</span>
          <input value={c.title} onChange={(e) => set({ title: e.target.value })} maxLength={60} />
        </label>
        <label className="qfield">
          <span>Opening line</span>
          <textarea rows={2} value={c.intro} onChange={(e) => set({ intro: e.target.value })} maxLength={300} />
        </label>

        {c.questions.map((q, i) => (
          <div key={i} className="qeq">
            <div className="qeqhead">
              <span className="qgn">{i + 1}</span>
              <input
                className="qeqt"
                value={q.text}
                placeholder="the question"
                onChange={(e) => setQ(i, { text: e.target.value })}
                maxLength={200}
              />
              <button className="qdel" onClick={() => set({ questions: c.questions.filter((_, j) => j !== i) })} aria-label="Remove">✕</button>
            </div>
            <textarea
              rows={4}
              className="qeqo"
              value={q.opts.join("\n")}
              placeholder={"one answer per line\nup to six"}
              onChange={(e) => setQ(i, { opts: e.target.value.split("\n").slice(0, 6) })}
            />
          </div>
        ))}

        <div className="qrow">
          <button
            className="aisw-btn"
            onClick={() => set({ questions: [...c.questions, { id: "", text: "", opts: ["Yes", "No"] }] })}
          >
            + Add a question
          </button>
          <label className="qcheck">
            <input type="checkbox" checked={c.askNote} onChange={(e) => set({ askNote: e.target.checked })} />
            <span>Include one optional comment box</span>
          </label>
        </div>

        <div className="qrow">
          <label className="qcheck">
            <input type="checkbox" checked={c.active} onChange={(e) => set({ active: e.target.checked })} />
            <span><b>Show it to students.</b> Off means no button appears at all.</span>
          </label>
        </div>

        <div className="qrow">
          <button className="frgo" disabled={busy} onClick={() => save()}>{busy ? "…" : "Save"}</button>
          {/* Changing the questions without this would mix old answers into the
              new tally, which is how a survey quietly starts lying. */}
          <button
            className="aisw-btn"
            disabled={busy}
            title="Keep the old answers, but ask everyone again from scratch"
            onClick={() => save({ round: c.round + 1 })}
          >
            Ask everyone again
          </button>
          {msg && <span className="qmuted">{msg}</span>}
        </div>
      </section>
    </>
  );
}
