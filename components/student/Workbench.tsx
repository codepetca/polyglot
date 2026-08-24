"use client";

// The workbench: one rail on the right holding three panes — Scratchpad,
// Reference, AI Tutor — with only one visible at a time.
//
// IT PUSHES, IT DOES NOT COVER. These used to be floating windows, so opening
// the scratchpad put it on top of the lesson you were reading it against. A
// student comparing their code to the worked example had to drag a window out
// of the way every time. The rail is a flex sibling of the lesson, so the
// lesson narrows instead of disappearing.
//
// ONE PANE AT A TIME, because all three are for the same moment — you are
// stuck, and you want code, or the syntax, or a question answered. Swapping is
// ‹ ›, or the arrow keys, which is faster than aiming at a tab.
//
// REFERENCE IS IN HERE, not on its own page. It is read WHILE working; a
// separate tab means leaving the lesson to look something up and losing your
// place. /docs still exists for browsing outside a lesson.

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ScratchpadPanel from "./ScratchpadPanel";
import TutorPanel from "./TutorPanel";
import { sectionsForLesson, type Section } from "@/lib/curriculum/reference";

const SCRATCH_KEY = "classos_scratchpad";
const OPEN_KEY = "classos_bench_open";
const PANE_KEY = "classos_bench_pane";

// CODEHS PARITY: this course teaches readLine, never input() or Scanner.
const DEFAULT_CODE = 'String name = readLine("Your name? ");\nSystem.out.println("Hi, " + name + "!");';

type PaneId = "scratchpad" | "reference" | "tutor";
const PANES: { id: PaneId; label: string; icon: string }[] = [
  { id: "scratchpad", label: "Scratchpad", icon: "▶" },
  { id: "reference", label: "Reference", icon: "❋" },
  { id: "tutor", label: "AI Tutor", icon: "✦" },
];

export default function Workbench({ askTeacher }: { askTeacher: { id: string; name: string } | null }) {
  const path = usePathname() || "";
  const lessonCode = decodeURIComponent(path.split("/lessons/")[1] || "").split("/")[0];
  // reference.ts is pure data, so the pane can pick the lesson's sections
  // itself rather than having them threaded down from a server component.
  const reference = sectionsForLesson(lessonCode);

  const [open, setOpen] = useState(false);
  const [pane, setPane] = useState<PaneId>("scratchpad");
  const [dir, setDir] = useState<1 | -1>(1);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [loaded, setLoaded] = useState(false);
  const [seed, setSeed] = useState({ text: "", prompt: "", nonce: 0 });
  const [popup, setPopup] = useState<{ x: number; y: number; text: string } | null>(null);
  const [prompt, setPrompt] = useState("");
  const [sentNote, setSentNote] = useState("");

  useEffect(() => {
    const s = localStorage.getItem(SCRATCH_KEY);
    if (s) setCode(s);
    setOpen(localStorage.getItem(OPEN_KEY) === "1");
    const p = localStorage.getItem(PANE_KEY) as PaneId | null;
    if (p && PANES.some((x) => x.id === p)) setPane(p);
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(SCRATCH_KEY, code);
  }, [code, loaded]);
  useEffect(() => {
    if (loaded) localStorage.setItem(OPEN_KEY, open ? "1" : "0");
  }, [open, loaded]);
  useEffect(() => {
    if (loaded) localStorage.setItem(PANE_KEY, pane);
  }, [pane, loaded]);

  const swap = useCallback((delta: 1 | -1) => {
    setDir(delta);
    setPane((cur) => {
      const i = PANES.findIndex((p) => p.id === cur);
      return PANES[(i + delta + PANES.length) % PANES.length].id;
    });
  }, []);

  // Arrow keys swap panes — but never while the student is typing. Stealing
  // Left/Right inside the editor or the tutor's message box would make both
  // unusable, which is a worse bug than not having the shortcut.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      swap(e.key === "ArrowRight" ? 1 : -1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, swap]);

  // Highlight lesson text to ask about it.
  useEffect(() => {
    function onUp(e: MouseEvent) {
      if ((e.target as HTMLElement).closest?.(".askpop2, .bench, .benchrail")) return;
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";
      if (!sel || sel.isCollapsed || text.length < 3) return setPopup(null);
      // .lesson-body is the classic reading layout, .flowplay the interactive
      // player. Matching only the first left this dead on every reworked lesson.
      const anchor = sel.anchorNode?.parentElement;
      if (!anchor || !anchor.closest(".lesson-body, .flowplay")) return setPopup(null);
      const r = sel.getRangeAt(0).getBoundingClientRect();
      setPopup({ x: Math.min(r.left + r.width / 2, window.innerWidth - 220), y: r.bottom + 8, text: text.slice(0, 500) });
      setPrompt("");
    }
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, []);

  function askAI() {
    if (!popup) return;
    setSeed({ text: popup.text, prompt, nonce: Date.now() });
    setPane("tutor");
    setOpen(true);
    setPopup(null);
    window.getSelection()?.removeAllRanges();
  }

  async function askTeacherNow() {
    if (!popup || !askTeacher) return;
    const body = `${prompt.trim() || "Can you help me with this part?"}\n> ${popup.text.slice(0, 300)}\n(lesson ${lessonCode})`;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toId: askTeacher.id, body, lessonCode }),
    });
    setPopup(null);
    window.getSelection()?.removeAllRanges();
    setSentNote(`Sent to ${askTeacher.name} ✓ — replies land in your ✉ Messages`);
    setTimeout(() => setSentNote(""), 3500);
  }

  const current = PANES.find((p) => p.id === pane)!;

  return (
    <>
      {popup && (
        <div className="askpop2" style={{ left: popup.x, top: popup.y }}>
          <div className="quoteprev">“{popup.text.slice(0, 90)}{popup.text.length > 90 ? "…" : ""}”</div>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askAI()}
            placeholder="Your question (optional)…"
            autoFocus
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn purple" style={{ flex: 1, padding: "7px 10px", fontSize: 12.5 }} onClick={askAI}>
              ✦ Ask AI
            </button>
            {askTeacher && (
              <button className="btn" style={{ flex: 1, padding: "7px 10px", fontSize: 12.5 }} onClick={askTeacherNow}>
                ✉ Ask {askTeacher.name.split(" ")[0]}
              </button>
            )}
            <button className="tbtn2" onClick={() => setPopup(null)}>✕</button>
          </div>
        </div>
      )}
      {sentNote && <div className="sentnote">{sentNote}</div>}

      {/* Closed: a thin rail of spines. Open: the pane itself. */}
      {!open ? (
        <aside className="benchrail" aria-label="Tools">
          {PANES.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPane(p.id);
                setOpen(true);
              }}
              title={p.label}
            >
              <span className="bicon">{p.icon}</span>
              <span className="blabel">{p.label}</span>
            </button>
          ))}
        </aside>
      ) : (
        <aside className="bench" aria-label={current.label}>
          <header className="benchhead">
            <button className="benchnav" onClick={() => swap(-1)} title="Previous tool (←)" aria-label="Previous tool">
              ‹
            </button>
            <div className="benchtitle">
              <span className="bicon">{current.icon}</span>
              {current.label}
            </div>
            <button className="benchnav" onClick={() => swap(1)} title="Next tool (→)" aria-label="Next tool">
              ›
            </button>
            <span className="benchdots" aria-hidden>
              {PANES.map((p) => (
                <i key={p.id} className={p.id === pane ? "on" : ""} />
              ))}
            </span>
            <button className="benchclose" onClick={() => setOpen(false)} title="Close" aria-label="Close tools">
              ✕
            </button>
          </header>

          {/* key on the pane id restarts the animation on every swap */}
          <div className={`benchbody ${dir > 0 ? "fromright" : "fromleft"}`} key={pane}>
            {pane === "scratchpad" && <ScratchpadPanel code={code} setCode={setCode} lessonCode={lessonCode} />}
            {pane === "reference" && <ReferencePane sections={reference} />}
            {pane === "tutor" && <TutorPanel lessonCode={lessonCode} scratchCode={code} seed={seed} />}
          </div>
        </aside>
      )}
    </>
  );
}

/** The lesson's own syntax, grouped by topic, filterable. */
function ReferencePane({ sections }: { sections: Section[] }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle
    ? sections
        .map((s) => ({
          ...s,
          entries: s.entries.filter(
            (e) =>
              e.name.toLowerCase().includes(needle) ||
              e.code.toLowerCase().includes(needle) ||
              e.note.toLowerCase().includes(needle),
          ),
        }))
        .filter((s) => s.entries.length)
    : sections;

  if (!sections.length) {
    return <p className="meta" style={{ padding: 12 }}>No syntax reference for this lesson yet.</p>;
  }

  return (
    <div className="refpane">
      <input
        className="refsearch"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter…"
        aria-label="Filter the reference"
      />
      {shown.length === 0 && <p className="meta">Nothing matches that.</p>}
      {shown.map((s) => (
        <section key={s.id}>
          <h4>{s.title}</h4>
          <dl>
            {s.entries.map((e) => (
              <div className="docs-item" key={e.name}>
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
  );
}
