"use client";

import { sectionsForLesson } from "@/lib/curriculum/reference";

// Documentation for this lesson. ALWAYS ON SCREEN. Every step, no exceptions.
//
// This was previously gated to steps where the student types, on the theory
// that showing it elsewhere was clutter. That was wrong: a student reading a
// worked example is exactly when they need to check what the syntax means, and
// documentation that appears and disappears teaches them not to rely on it.
// Reference material earns its place by being CONSTANT — you look down, it's
// there, every single time.
//
// It is also not a widget. Nothing to click, nothing to copy, nothing to open.
// You read it.
export default function Docs({ lessonCode }: { lessonCode: string }) {
  const sections = sectionsForLesson(lessonCode);
  if (!sections.length) return null;

  return (
    <aside className="docs" aria-label="Documentation for this lesson">
      <div className="docs-title">Documentation</div>
      {sections.map((s) => (
        <section key={s.id}>
          <h4>{s.title}</h4>
          <dl>
            {s.entries.map((e) => (
              <div className="docs-item" key={e.name}>
                <dt>
                  <pre>{e.code}</pre>
                </dt>
                <dd>{e.note}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </aside>
  );
}
