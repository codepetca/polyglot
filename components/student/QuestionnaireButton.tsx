"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// What sits where the chat button was.
//
// IT IS NOT A CHAT AND DOES NOT PRETEND TO BE. No thread, no unread badge, no
// reply, no avatars — every one of those was load-bearing in the chat and all
// of them would be a lie here, because nobody is going to answer. A student who
// thinks they are starting a conversation and gets silence is worse off than
// one who was told plainly it is a form.
//
// It hides itself completely when there is no live questionnaire, so the top
// bar does not carry a button that opens an apology.
//
// Answers go in one submit, all questions on one screen, same reasoning as the
// grouped lesson questions: a short form that shows its whole length gets
// finished, and one that reveals itself a question at a time does not.

type Q = { id: string; text: string; opts: string[] };
type Loaded = {
  active: boolean;
  title: string;
  intro: string;
  questions: Q[];
  askNote: boolean;
  noteLabel: string;
  answered: boolean;
};

export default function QuestionnaireButton() {
  const path = usePathname() || "";
  const lessonCode = decodeURIComponent(path.split("/lessons/")[1] || "").split("/")[0];

  const [q, setQ] = useState<Loaded | null>(null);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/questionnaire").then((x) => x.json()).catch(() => null);
    if (r?.active) {
      setQ(r);
      setDone(!!r.answered);
    } else setQ(null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  if (!q) return null;

  const answeredCount = Object.keys(picked).length;

  async function send() {
    if (busy || !answeredCount) return;
    setBusy(true);
    setErr("");
    const r = await fetch("/api/questionnaire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: picked, note, lessonCode }),
    })
      .then((x) => x.json())
      .catch(() => null);
    setBusy(false);
    if (r?.ok) setDone(true);
    else setErr(r?.error === "already answered" ? "You have already answered this one." : "That did not send. Try again in a moment.");
  }

  return (
    <div className="qnwrap" ref={box}>
      <button className="reportbtn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span aria-hidden>☑</span> {done ? "Answered" : "Quick question"}
        {!done && <span className="reportdot qndot" aria-label="not answered yet">{q.questions.length}</span>}
      </button>

      {open && (
        <div className="qnpanel" role="dialog" aria-label={q.title}>
          <header className="qnhead">
            <b>{q.title}</b>
            <button onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </header>

          {done ? (
            <div className="qndone">
              <p className="qnbig">Thanks — that&rsquo;s in.</p>
              <p className="qnmuted">
                Nothing comes back to you here; this is a form, not a message. If something is actually broken, tell
                your teacher.
              </p>
            </div>
          ) : (
            <>
              <p className="qnintro">{q.intro}</p>
              <ol className="qnlist">
                {q.questions.map((qq, i) => (
                  <li key={qq.id} className="qnq">
                    <p className="qnqt">
                      <span className="qnn">{i + 1}</span>
                      {qq.text}
                    </p>
                    <div className="qnopts">
                      {qq.opts.map((o, j) => (
                        <button
                          key={j}
                          className={`optbtn ${picked[qq.id] === j ? "picked-right" : ""}`}
                          onClick={() => setPicked((p) => ({ ...p, [qq.id]: j }))}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
              {q.askNote && (
                <label className="qnnote">
                  <span>{q.noteLabel}</span>
                  <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} />
                </label>
              )}
              {err && <p className="reporterr">{err}</p>}
              <div className="qnfoot">
                <span className="qnmuted">
                  {answeredCount} of {q.questions.length} answered
                </span>
                <button className="frgo" onClick={send} disabled={busy || !answeredCount}>
                  {busy ? "…" : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
