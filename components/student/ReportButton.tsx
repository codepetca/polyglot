"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// "Tell the person who built this."
//
// NOT A DM. The inbox exists and students can already message an admin through
// it, which nobody would ever discover and which frames the thing wrongly
// anyway: picking a name out of a contact list and composing a message is a
// social act, and reporting a broken lesson should not feel like one.
//
// So: a button that says what it does, in the same place on every lesson, with
// the reason pre-named. A student picks "Something is broken", types a line,
// and it goes. They never choose a recipient, and they never have to work out
// who is responsible for the thing that annoyed them.
//
// The lesson code rides along automatically, because a report naming the lesson
// is actionable and "the array thing is broken" is not.

const REASONS = [
  { id: "broken", label: "Something is broken", hint: "A button does nothing, the code will not run, a page looks wrong." },
  { id: "confusing", label: "This is confusing", hint: "The lesson lost you. Say where." },
  { id: "language", label: "Add my language", hint: "Tell me which one and it can be added." },
  { id: "idea", label: "I have an idea", hint: "Anything you wish this did." },
] as const;

type Reason = (typeof REASONS)[number]["id"];

export default function ReportButton({ initialReason }: { initialReason?: Reason }) {
  const path = usePathname() || "";
  const lessonCode = decodeURIComponent(path.split("/lessons/")[1] || "").split("/")[0];

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>(initialReason || "broken");
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function send() {
    if (!text.trim() || state === "sending") return;
    setState("sending");
    let code = "";
    try {
      code = localStorage.getItem("classos_scratchpad") || "";
    } catch {
      /* not important enough to fail the report */
    }
    const r = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // The scratchpad only goes with a "broken" report, where it is evidence.
      body: JSON.stringify({ kind: reason, body: text, lessonCode, code: reason === "broken" ? code : "" }),
    })
      .then((x) => x.json())
      .catch(() => null);

    if (r?.ok) {
      setState("sent");
      setText("");
      setTimeout(() => {
        setOpen(false);
        setState("idle");
      }, 1900);
    } else {
      setErr(r?.error || "That did not send. Try again in a moment.");
      setState("error");
    }
  }

  const current = REASONS.find((r) => r.id === reason)!;

  return (
    <>
      <button className="reportbtn" onClick={() => setOpen(true)}>
        <span aria-hidden>✎</span> Tell me
      </button>

      {open && (
        <div className="reportwrap" role="dialog" aria-modal="true" aria-label="Tell me">
          <div className="reportcard" ref={box}>
            <button className="frx" onClick={() => setOpen(false)} aria-label="Close">✕</button>

            {state === "sent" ? (
              <div className="reportsent">
                <p className="bigtick" aria-hidden>✓</p>
                <h2>Sent.</h2>
                <p className="frnote">It goes straight to me. Replies land in Messages.</p>
              </div>
            ) : (
              <>
                <p className="freyebrow">Straight to the person who built this</p>
                <h2>What is up?</h2>
                <p className="frnote">
                  Anything at all — broken, confusing, missing, or just an idea. It is not a survey and nobody
                  else sees it.
                </p>

                <div className="reasons">
                  {REASONS.map((r) => (
                    <button
                      key={r.id}
                      className={`reason ${reason === r.id ? "on" : ""}`}
                      onClick={() => setReason(r.id)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <p className="frnote small">{current.hint}</p>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    reason === "language"
                      ? "Which language do you speak at home?"
                      : "A line or two is plenty."
                  }
                  rows={4}
                  autoFocus
                />

                {lessonCode && <p className="frnote small">Lesson {lessonCode} is attached, so I know where you were.</p>}
                {state === "error" && <p className="reporterr">{err}</p>}

                <div className="frrow">
                  <button className="frghost" onClick={() => setOpen(false)}>Cancel</button>
                  <button className="frgo" onClick={send} disabled={!text.trim() || state === "sending"}>
                    {state === "sending" ? "Sending…" : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
