"use client";

import { useMemo, useState } from "react";
import type { Section } from "@/lib/curriculum/reference";

// The whole Java reference for this course, on one page, filterable.
//
// The inline panel (components/lesson/Docs.tsx) exists because students who
// cannot help themselves will not go looking — so it puts the syntax for THIS
// lesson in front of them, unasked. This page is the other half: somewhere to
// go when you already know what you are looking for and just want the shape of
// it. Neither replaces the other.
//
// Every code sample here is compiled by scripts/reference-check.ts, so anything
// on this page can be pasted straight into the scratchpad and run.

type Where = Record<string, string[]>;
type Group = { unit: number; title: string; sections: Section[] };

export default function DocsBrowser({ groups, where }: { groups: Group[]; where: Where }) {
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return groups;
    return groups
      .map((g) => ({
        ...g,
        sections: g.sections
          .map((s) => ({
            ...s,
            entries: s.entries.filter(
              (e) =>
                e.name.toLowerCase().includes(needle) ||
                e.code.toLowerCase().includes(needle) ||
                e.note.toLowerCase().includes(needle) ||
                s.title.toLowerCase().includes(needle),
            ),
          }))
          .filter((s) => s.entries.length > 0),
      }))
      .filter((g) => g.sections.length > 0);
  }, [q, groups]);

  const count = (gs: Group[]) => gs.reduce((n, g) => n + g.sections.reduce((m, s) => m + s.entries.length, 0), 0);
  const total = count(groups);
  const found = count(shown);
  const topicCount = groups.reduce((n, g) => n + g.sections.length, 0);

  return (
    <>
      <div className="docsearch">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search — try substring, length, HashMap, for…"
          aria-label="Search the documentation"
          autoFocus
        />
        {q && (
          <button className="tbtn2" onClick={() => setQ("")} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>
      <p className="meta docscount">
        {q ? `${found} of ${total} entries` : `${total} entries across ${topicCount} topics, by unit`}
      </p>

      {/* Jump links. Hidden while filtering, when they would point at nothing. */}
      {!q && (
        <nav className="docsjump" aria-label="Topics">
          {groups.map((g) => (
            <span className="jumpgroup" key={g.unit}>
              <b>Unit {g.unit}</b>
              {g.sections.map((s) => (
                <a key={s.id} href={`#${s.id}`}>
                  {s.title}
                </a>
              ))}
            </span>
          ))}
        </nav>
      )}

      {shown.length === 0 && <p className="meta">Nothing matches that. Try a shorter word.</p>}

      {shown.map((g) => (
        <div key={g.unit}>
          <h2 className="docunit">{g.title}</h2>
          {g.sections.map((s) => (
        <section className="docsec" id={s.id} key={s.id}>
          <h2>
            {s.title}
            {(where[s.id] || []).length > 0 && (
              <span className="docwhere">
                taught in {(where[s.id] || []).length === 1 ? "lesson" : "lessons"} {(where[s.id] || []).join(", ")}
              </span>
            )}
          </h2>
          <dl>
            {s.entries.map((e) => (
              <div className="docs-item" key={s.id + e.name}>
                <dt>
                  <pre>{e.code}</pre>
                </dt>
                <dd>
                  <strong>{e.name}</strong>
                  {e.note}
                </dd>
              </div>
            ))}
          </dl>
        </section>
          ))}
        </div>
      ))}
    </>
  );
}
