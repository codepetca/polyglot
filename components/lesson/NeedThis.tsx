"use client";

import { sectionsForLesson } from "@/lib/curriculum/reference";

// Documentation for the lesson you're on.
//
// Two rules, both learned the hard way:
//   1. Don't make them go looking. This is on screen during the steps where
//      they're typing, already open. Students who can't help themselves won't
//      open a menu or search for help — they just stall.
//   2. Don't make it interactive. It was click-to-copy, which turned reference
//      material into another thing to figure out. It's documentation: you read
//      it. Nothing to press.
export default function NeedThis({ lessonCode }: { lessonCode: string }) {
  const sections = sectionsForLesson(lessonCode);
  if (!sections.length) return null;

  // First section is this lesson's own topic — that's what goes on screen.
  // Everything else is revision, folded away so it isn't competing for eyes.
  const [primary, ...revision] = sections;
  const extra = [{ ...primary, entries: primary.entries.slice(3) }, ...revision].filter((s) => s.entries.length);

  const row = (s: { id: string; entries: { name: string; code: string; note: string }[] }, limit?: number) => (
    <div className="nt-row">
      {(limit ? s.entries.slice(0, limit) : s.entries).map((e) => (
        <div className="nt-card" key={e.name}>
          <div className="nt-name">{e.name}</div>
          <pre className="nt-code">{e.code}</pre>
          <div className="nt-note">{e.note}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="needthis">
      <div className="nt-head">
        <b>Documentation</b>
        <span className="meta" style={{ margin: 0 }}>{primary.title.toLowerCase()}</span>
      </div>
      {row(primary, 3)}

      {extra.length > 0 && (
        <details className="nt-more">
          <summary>Everything else</summary>
          {extra.map((s) => (
            <div key={s.id}>
              <div className="nt-subhead">{s.title}</div>
              {row(s)}
            </div>
          ))}
        </details>
      )}
    </div>
  );
}
