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
import { useAi } from "@/lib/features";
import BenchFrame, { type BenchMode, type BenchGeom } from "./BenchFrame";
import BenchIcon from "./BenchIcon";
import { allSections, sectionsForLesson, type Section } from "@/lib/curriculum/reference";
import { snapshot } from "@/lib/tutor-history";
import { readPrefs, onPrefsChange, RTL, type EslPrefs } from "@/lib/i18n/prefs";

const SCRATCH_KEY = "classos_scratchpad";
const OPEN_KEY = "classos_bench_open";
const PANE_KEY = "classos_bench_pane";
const WIN_KEY = "classos_bench_win";

const DEFAULT_GEOM: BenchGeom = { x: 200, y: 110, w: 520, h: 560 };

// CODEHS PARITY: this course teaches readLine, never input() or Scanner.
const DEFAULT_CODE = 'String name = readLine("Your name? ");\nSystem.out.println("Hi, " + name + "!");';

type PaneId = "scratchpad" | "reference" | "tutor";
const ALL_PANES: { id: PaneId; label: string }[] = [
  { id: "scratchpad", label: "Scratchpad" },
  { id: "reference", label: "Reference" },
  { id: "tutor", label: "AI Tutor" },
];

export default function Workbench({ askTeacher }: { askTeacher: { id: string; name: string } | null }) {
  // With AI off the tutor is not disabled, it is absent: the rail has two
  // spines, the arrow keys cycle two panes, and nothing anywhere hints at a
  // third that does not answer.
  const ai = useAi();
  const PANES = ai ? ALL_PANES : ALL_PANES.filter((p) => p.id !== "tutor");
  const path = usePathname() || "";
  const lessonCode = decodeURIComponent(path.split("/lessons/")[1] || "").split("/")[0];
  // The reference pane carries the WHOLE course and scrolls to where you are,
  // rather than showing only this lesson's slice. Same effect when you are
  // following along, but looking something up from an earlier unit no longer
  // means leaving the lesson.
  const reference = allSections();
  const here = sectionsForLesson(lessonCode).map((s) => s.id);

  const [open, setOpen] = useState(false);
  const [pane, setPane] = useState<PaneId>("scratchpad");
  const [mode, setMode] = useState<BenchMode>("docked");
  const [geom, setGeomState] = useState<BenchGeom>(DEFAULT_GEOM);
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
    else if (p === "tutor") setPane("scratchpad"); // AI was switched off since their last visit
    try {
      const w = JSON.parse(localStorage.getItem(WIN_KEY) || "null");
      if (w) {
        if (w.mode === "float" || w.mode === "docked") setMode(w.mode);
        setGeomState({ ...DEFAULT_GEOM, ...w.geom });
      }
    } catch {
      /* a corrupt entry is not worth failing the page over */
    }
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
  useEffect(() => {
    if (loaded) localStorage.setItem(WIN_KEY, JSON.stringify({ mode, geom }));
  }, [mode, geom, loaded]);

  const setGeom = useCallback((g: Partial<BenchGeom>) => setGeomState((cur) => ({ ...cur, ...g })), []);

  // Publish how much room the rail is taking, so anything the lesson pins to
  // the bottom-right can sit clear of it. The tome button used to be
  // position:fixed at right:22px, which parked it on top of the tutor and the
  // terminal — CSS cannot know the rail's width because it changes with the
  // pane state, so it has to be told.
  useEffect(() => {
    const w = !open ? 46 : mode === "docked" ? geom.w : 0; // floating overlays anyway
    document.documentElement.style.setProperty("--bench-w", `${w}px`);
    return () => document.documentElement.style.setProperty("--bench-w", "0px");
  }, [open, mode, geom.w]);

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

  const idx = PANES.findIndex((p) => p.id === pane);
  const current = PANES[idx];
  // What each arrow will take you to. The icon goes ON the arrow so the
  // shortcut is legible without pressing it — left is that pane, right is that
  // one — rather than only telling you where you already are.
  const prev = PANES[(idx - 1 + PANES.length) % PANES.length];
  const next = PANES[(idx + 1) % PANES.length];

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
              <span className="bicon">
                <BenchIcon name={p.id} />
              </span>
              <span className="blabel">{p.label}</span>
            </button>
          ))}
        </aside>
      ) : (
        <BenchFrame
          mode={mode}
          geom={geom}
          setMode={setMode}
          setGeom={setGeom}
          label={current.label}
          header={
            <>
              <button
                className="benchnav"
                onClick={() => swap(-1)}
                title={`${prev.label} (←)`}
                aria-label={`Go to ${prev.label}`}
              >
                <span className="navarrow">‹</span>
                <BenchIcon name={prev.id} size={13} />
              </button>
              <div className="benchtitle">{current.label}</div>
              <button
                className="benchnav"
                onClick={() => swap(1)}
                title={`${next.label} (→)`}
                aria-label={`Go to ${next.label}`}
              >
                <BenchIcon name={next.id} size={13} />
                <span className="navarrow">›</span>
              </button>
              <span className="benchdots" aria-hidden>
                {PANES.map((p) => (
                  <i key={p.id} className={p.id === pane ? "on" : ""} />
                ))}
              </span>
              <button className="benchclose" onClick={() => setOpen(false)} title="Close" aria-label="Close tools">
                ✕
              </button>
            </>
          }
        >
          {/* key on the pane id restarts the animation on every swap */}
          <div className={`benchbody ${dir > 0 ? "fromright" : "fromleft"}`} key={pane}>
            {pane === "scratchpad" && <ScratchpadPanel code={code} setCode={setCode} lessonCode={lessonCode} />}
            {pane === "reference" && <ReferencePane sections={reference} here={here} lessonCode={lessonCode} />}
            {pane === "tutor" && (
              <TutorPanel
                lessonCode={lessonCode}
                scratchCode={code}
                seed={seed}
                // The tutor and the editor share this rail, so a snippet it
                // writes should land in the editor rather than be retyped.
                onUseCode={(snippet, mode) => {
                  setCode((cur) => {
                    // Replacing the buffer throws away whatever was there, so
                    // keep a version first. This is the one action in the app
                    // that destroys a student's own work.
                    snapshot(cur, mode === "append" ? "before appending tutor code" : "before tutor code replaced it");
                    return mode === "append" && cur.trim() ? `${cur.replace(/\s+$/, "")}\n\n${snippet}` : snippet;
                  });
                  setPane("scratchpad");
                }}
              />
            )}
          </div>
        </BenchFrame>
      )}
    </>
  );
}

/**
 * The WHOLE reference, scrolled to the part this lesson uses.
 *
 * It used to show only the current lesson's sections. That is fine while you
 * are following along and useless the moment you need something from three
 * units back — which is most of why anyone opens a reference. Showing
 * everything and jumping to the right place gives the same "it is already on
 * the right page" effect without the dead end.
 */
function ReferencePane({
  sections,
  here,
  lessonCode,
}: {
  sections: Section[];
  here: string[];
  lessonCode: string;
}) {
  const [q, setQ] = useState("");
  // Reference is translated only when the student asked for it — it is a
  // separate switch from the lessons, because plenty of people want the
  // lesson in two languages and the API names left alone.
  const [esl, setEsl] = useState<EslPrefs | null>(null);
  const [dict, setDict] = useState<Record<string, string>>({});
  useEffect(() => {
    setEsl(readPrefs());
    return onPrefsChange(setEsl);
  }, []);
  const refLang = esl?.esl && esl.reference ? esl.lang : "";
  useEffect(() => {
    if (!refLang) return setDict({});
    let alive = true;
    fetch(`/api/curriculum/reference-i18n?locale=${encodeURIComponent(refLang)}`)
      .then((r) => r.json())
      .then((d) => { if (alive) setDict(d?.entries || {}); })
      .catch(() => { if (alive) setDict({}); });
    return () => { alive = false; };
  }, [refLang]);
  const scroller = useRef<HTMLDivElement>(null);

  // Jump to this lesson's first topic on open and whenever the lesson changes.
  // Not smooth: this runs on mount, and animating a scroll the student did not
  // ask for just delays them seeing where they are.
  useEffect(() => {
    if (q || !here.length) return;
    const el = scroller.current?.querySelector(`[data-sec="${here[0]}"]`);
    if (el && scroller.current) {
      scroller.current.scrollTop = (el as HTMLElement).offsetTop - 8;
    }
  }, [lessonCode, here, q]);

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
        .filter((s) => s.entries.length || s.title.toLowerCase().includes(needle))
    : sections;

  return (
    <div className="refpane" ref={scroller}>
      <input
        className="refsearch"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter the whole reference…"
        aria-label="Filter the reference"
      />
      {shown.length === 0 && <p className="meta">Nothing matches that.</p>}
      {shown.map((s) => (
        <section key={s.id} data-sec={s.id} className={here.includes(s.id) ? "refhere" : undefined}>
          <h4>
            {s.title}
            {here.includes(s.id) && <span className="refbadge">this lesson</span>}
          </h4>
          <dl>
            {s.entries.map((e) => (
              // Signature first, description under it — the shape every piece
              // of API documentation uses, and the one a student will meet
              // everywhere else. The friendly label is dropped here: in a
              // narrow rail it made three lines of text per entry, which is
              // what turned this into a wall.
              <div className="refentry" key={e.name}>
                <dt>
                  <code>{e.code}</code>
                </dt>
                <dd>
                  {e.note}
                  {dict[`${s.id}::${e.name}`] && (
                    <span className="refalt" dir={RTL.has(refLang) ? "rtl" : "ltr"} lang={refLang}>
                      {dict[`${s.id}::${e.name}`]}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
