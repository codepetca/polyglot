"use client";

import { useState } from "react";

// One switch, at the top of the AI settings page.
//
// The requirement was "one button, so I can always bring it back with one
// click" — so this is not buried in a form with a Save button. It writes on
// click and says what it did. There is no draft state to lose.
//
// It states the CONSEQUENCE, not the setting. "AI is on" tells an admin
// nothing they can act on; "students can use the tutor, calls are billed"
// tells them exactly what turning it off changes.

export default function AiSwitch({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function flip() {
    const next = !on;
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features: { ai: next } }),
    })
      .then((x) => x.json())
      .catch(() => null);
    setBusy(false);
    if (r?.ok) {
      setOn(next);
      setMsg(next ? "AI is back on." : "AI is off. Nothing can be billed.");
    } else {
      setMsg("That did not save. Try again.");
    }
  }

  return (
    <div className={`aiswitch ${on ? "on" : "off"}`}>
      <div className="aisw-txt">
        <b>{on ? "AI is ON" : "AI is OFF"}</b>
        <span>
          {on
            ? "Students see the AI Tutor, the ✦ error explainer and code review. Calls are billed to the configured key, up to the daily cap."
            : "The tutor, the error explainer and code review are hidden everywhere. No request reaches a paid provider, so nothing can be billed."}
        </span>
      </div>
      <button className="aisw-btn" onClick={flip} disabled={busy} aria-pressed={on}>
        {busy ? "…" : on ? "Turn AI off" : "Turn AI on"}
      </button>
      {msg && <p className="aisw-msg">{msg}</p>}
    </div>
  );
}
