"use client";

import { useState } from "react";

// The three things the owner has to be able to change without a deploy, in one
// place: who is paying, whether students can send free text, and what the
// product is called here.
//
// EACH ONE WRITES ON CLICK. The requirement was "one button, so I can bring it
// back with one click" — so there is no form-wide Save to forget, and no draft
// state to lose. Each control says what it did.
//
// The label states the CONSEQUENCE, not the setting. "chat: false" tells an
// admin nothing they can act on; "students cannot send free text to anyone"
// tells them exactly what they are turning off, which is the sentence they
// will have to repeat to somebody else.

function Row({
  on, title, when, whenNot, onLabel, offLabel, onFlip,
}: {
  on: boolean; title: string; when: string; whenNot: string;
  onLabel: string; offLabel: string; onFlip: (next: boolean) => Promise<boolean>;
}) {
  const [val, setVal] = useState(on);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  return (
    <div className={`aiswitch ${val ? "on" : "off"}`}>
      <div className="aisw-txt">
        <b>{title} {val ? "ON" : "OFF"}</b>
        <span>{val ? when : whenNot}</span>
      </div>
      <button
        className="aisw-btn"
        disabled={busy}
        aria-pressed={val}
        onClick={async () => {
          setBusy(true);
          setMsg("");
          const ok = await onFlip(!val);
          setBusy(false);
          if (ok) { setVal(!val); setMsg("Saved."); }
          else setMsg("That did not save. Try again.");
        }}
      >
        {busy ? "…" : val ? offLabel : onLabel}
      </button>
      {msg && <p className="aisw-msg">{msg}</p>}
    </div>
  );
}

async function post(body: unknown): Promise<boolean> {
  const r = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((x) => x.json()).catch(() => null);
  return !!r?.ok;
}

export default function PlatformSwitches({ ai, chat, brand }: { ai: boolean; chat: boolean; brand: string }) {
  const [name, setName] = useState(brand);
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="switches">
      <Row
        on={ai}
        title="AI is"
        when="Students see the AI Tutor, the ✦ error explainer and code review. Calls are billed to the configured key, up to the daily cap."
        whenNot="The tutor, the error explainer and code review are hidden everywhere. No request reaches a paid provider, so nothing can be billed."
        onLabel="Turn AI on"
        offLabel="Turn AI off"
        onFlip={(next) => post({ features: { ai: next } })}
      />
      <Row
        on={chat}
        title="Student messaging is"
        when="Students can write to you in the Tell me thread and read replies. Free text, both directions — check this is allowed before leaving it on."
        whenNot="Students cannot send free text to anyone, and the inbox is closed to them by URL as well as by menu. The questionnaire below still works: it is one-way and has fixed answers."
        onLabel="Allow messaging"
        offLabel="Turn messaging off"
        onFlip={(next) => post({ features: { chat: next } })}
      />

      <div className="aiswitch brandrow">
        <div className="aisw-txt">
          <b>NAME</b>
          <span>
            What this deployment calls itself in the top bar. The repository, the licence and the source stay named
            classOS whatever this says — this is the sign on the door, not the deed.
          </span>
        </div>
        <div className="brandedit">
          <input value={name} maxLength={32} onChange={(e) => setName(e.target.value)} aria-label="Product name" />
          <button
            className="aisw-btn"
            disabled={busy || !name.trim() || name === brand}
            onClick={async () => {
              setBusy(true);
              const ok = await post({ brand: name.trim() });
              setBusy(false);
              setSaved(ok ? "Saved — reload to see it." : "That did not save.");
            }}
          >
            {busy ? "…" : "Save name"}
          </button>
        </div>
        {saved && <p className="aisw-msg">{saved}</p>}
      </div>
    </div>
  );
}
