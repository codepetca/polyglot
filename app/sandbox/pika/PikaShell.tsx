"use client";

import { useState } from "react";

// A FAKE PIKA, so the embedding question can be answered by clicking rather
// than by arguing.
//
// It is deliberately built with Pika's palette and geometry — Tailwind greys,
// blue-700, half-rem radius — and NONE of polyglot's design tokens. That is the
// point of the exercise: if the two designs are going to sit inside one screen,
// the seam has to be visible while we decide whether we can live with it.
//
// The real question is the one at the top right: does the host rail STAY while
// a lesson is open, or does the lesson take the whole screen with one way back?
// Both are one click apart here. Nothing else in this file matters.
//
// Nothing here talks to Pika. It is a drawing that happens to be interactive.

type Tab = { id: string; label: string; icon: string };
const TABS: Tab[] = [
  { id: "today", label: "Today", icon: "◎" },
  { id: "classroom", label: "Classroom", icon: "▤" },
  { id: "daily", label: "Daily Log", icon: "✓" },
  { id: "lessons", label: "Lessons", icon: "❯" },
  { id: "collection", label: "Collection", icon: "◆" },
];

const LESSON_SRC = "/lessons/6.1?embed=pika";

export default function PikaShell() {
  const [tab, setTab] = useState("lessons");
  const [collapsed, setCollapsed] = useState(false);
  // "rail" keeps Pika's navigation on screen beside the lesson.
  // "handoff" gives the lesson the whole width, with one way back.
  const [mode, setMode] = useState<"rail" | "handoff">("rail");

  const lessonOpen = tab === "lessons";
  const hideChrome = lessonOpen && mode === "handoff";

  return (
    <div className="pk">
      {!hideChrome && (
        <aside className={`pk-rail ${collapsed ? "collapsed" : ""}`}>
          <div className="pk-brand">
            <span className="pk-mark">P</span>
            {!collapsed && <b>pika</b>}
          </div>
          <nav>
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`pk-tab ${tab === t.id ? "on" : ""}`}
                onClick={() => setTab(t.id)}
                title={collapsed ? t.label : undefined}
              >
                <span className="pk-icon" aria-hidden>{t.icon}</span>
                {!collapsed && <span>{t.label}</span>}
              </button>
            ))}
          </nav>
          <button className="pk-collapse" onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? "»" : "« Collapse"}
          </button>
        </aside>
      )}

      <main className="pk-main">
        <header className="pk-top">
          {hideChrome ? (
            <button className="pk-back" onClick={() => setMode("rail")}>← Back to Pika</button>
          ) : (
            <b className="pk-title">{TABS.find((t) => t.id === tab)?.label}</b>
          )}
          <span className="pk-spacer" />
          <label className="pk-switch">
            <span>Lesson layout</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as "rail" | "handoff")}>
              <option value="rail">Keep the rail</option>
              <option value="handoff">Full screen + back</option>
            </select>
          </label>
        </header>

        {lessonOpen ? (
          <div className="pk-frame">
            <iframe src={LESSON_SRC} title="polyglot" />
            <p className="pk-note">
              Live polyglot in an iframe. It will show the join screen until you click{" "}
              <b>Start practicing</b> once — no signup.
            </p>
          </div>
        ) : (
          <div className="pk-stub">
            <div className="pk-card">
              <b>{TABS.find((t) => t.id === tab)?.label}</b>
              <p>Pika owns this tab. Drawn as a placeholder so the rail has somewhere to go.</p>
            </div>
            <div className="pk-card ghost" />
            <div className="pk-card ghost" />
          </div>
        )}
      </main>
    </div>
  );
}
