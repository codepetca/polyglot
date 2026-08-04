"use client";

import { useState } from "react";
import { sectionsForLesson, type Entry } from "@/lib/curriculum/reference";

// "You'll need this" — the syntax for THIS lesson, sitting right on the step.
//
// The searchable panel was the wrong shape for our actual student: it assumed
// they'd notice a button, decide they were stuck, open it, and search. Students
// who can't help themselves do none of that — they just stall. So the two or
// three lines they need are on screen, already open, no clicking required.
export default function NeedThis({ lessonCode }: { lessonCode: string }) {
  const [copied, setCopied] = useState("");
  const sections = sectionsForLesson(lessonCode);
  if (!sections.length) return null;

  // The first section is the lesson's own topic — that's what they need in
  // front of them. Anything after it is revision, one tap away.
  const [primary, ...revision] = sections;

  async function copy(e: Entry) {
    try {
      await navigator.clipboard.writeText(e.code);
      setCopied(e.name);
      setTimeout(() => setCopied(""), 1200);
    } catch { /* clipboard blocked */ }
  }

  const card = (e: Entry) => (
    <div className="nt-card" key={e.name} onClick={() => copy(e)} title="Click to copy">
      <div className="nt-name">{e.name}</div>
      <pre className="nt-code">{e.code}</pre>
      <div className="nt-note">{copied === e.name ? "copied ✓" : e.note}</div>
    </div>
  );

  return (
    <div className="needthis">
      <div className="nt-head">
        <b>You&apos;ll need this</b>
        <span className="meta" style={{ margin: 0 }}>tap any box to copy it</span>
      </div>
      <div className="nt-row">{primary.entries.slice(0, 3).map(card)}</div>

      {revision.length > 0 && (
        <details className="nt-more">
          <summary>Need something else?</summary>
          {[{ ...primary, entries: primary.entries.slice(3) }, ...revision].filter((s) => s.entries.length).map((s) => (
            <div key={s.id}>
              <div className="nt-subhead">{s.title}</div>
              <div className="nt-row">{s.entries.map(card)}</div>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}
