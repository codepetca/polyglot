"use client";

// Window chrome for the workbench: docked to the right, or floating free.
//
// RESTORED, not reinvented. Dragging a tool out, resizing it and snapping it
// back existed before the rail rework and were lost with FloatingWindow. The
// interaction model here is the old one, including the `e.buttons !== 1` guard
// — without it a missed pointerup leaves the window following the mouse around
// the page forever, which was a real bug once already.
//
// WHAT IS DIFFERENT FROM THE OLD ONE. Docked used to be `position: fixed`, so
// it sat on top of the lesson. Docked is now a flex sibling that PUSHES, and
// only floating overlays. So both behaviours exist and neither replaces the
// other: dock when you want to see the lesson and the tool together, float
// when you want the tool big and over everything.

import { useRef } from "react";

export type BenchMode = "docked" | "float";
export type BenchGeom = { x: number; y: number; w: number; h: number };

const MIN_W = 320;
const MIN_H = 240;
const TOPBAR = 57;

export default function BenchFrame({
  mode,
  geom,
  setMode,
  setGeom,
  label,
  header,
  children,
}: {
  mode: BenchMode;
  geom: BenchGeom;
  setMode: (m: BenchMode) => void;
  setGeom: (g: Partial<BenchGeom>) => void;
  label: string;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const size = useRef<{ px: number; py: number; ow: number; oh: number } | null>(null);

  function onHeadDown(e: React.PointerEvent) {
    // Primary button only, and never from a control inside the header.
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, input")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    // Dragging a docked panel pops it out, starting where it already sits so it
    // does not jump under the cursor.
    const startX = mode === "docked" ? Math.max(0, window.innerWidth - geom.w - 24) : geom.x;
    const startY = mode === "docked" ? TOPBAR + 24 : geom.y;
    drag.current = { px: e.clientX, py: e.clientY, ox: startX, oy: startY };
    if (mode === "docked") {
      setGeom({ x: startX, y: startY });
      setMode("float");
    }
  }
  function onHeadMove(e: React.PointerEvent) {
    if (!drag.current) return;
    // The follow-the-mouse fix: if the button is no longer held, stop.
    if (e.buttons !== 1) return void (drag.current = null);
    setGeom({
      x: Math.max(0, Math.min(window.innerWidth - 120, drag.current.ox + (e.clientX - drag.current.px))),
      y: Math.max(TOPBAR, Math.min(window.innerHeight - 80, drag.current.oy + (e.clientY - drag.current.py))),
    });
  }
  const endDrag = () => void (drag.current = null);

  function onSizeDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    size.current = { px: e.clientX, py: e.clientY, ow: geom.w, oh: geom.h };
  }
  function onSizeMove(e: React.PointerEvent) {
    if (!size.current) return;
    if (e.buttons !== 1) return void (size.current = null);
    const dx = e.clientX - size.current.px;
    // Docked grips the LEFT edge, so dragging left must make it wider.
    const w = mode === "docked" ? size.current.ow - dx : size.current.ow + dx;
    setGeom({
      w: Math.max(MIN_W, Math.min(window.innerWidth - 160, w)),
      ...(mode === "float"
        ? { h: Math.max(MIN_H, Math.min(window.innerHeight - TOPBAR - 20, size.current.oh + (e.clientY - size.current.py))) }
        : {}),
    });
  }
  const endSize = () => void (size.current = null);

  const docked = mode === "docked";
  const style: React.CSSProperties = docked
    ? { width: geom.w }
    : { position: "fixed", left: geom.x, top: geom.y, width: geom.w, height: geom.h, zIndex: 60 };

  const body = (
    <>
      <header
        className="benchhead"
        onPointerDown={onHeadDown}
        onPointerMove={onHeadMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        title="Drag to move"
      >
        {header}
        <button
          className="benchclose"
          title={docked ? "Float this panel" : "Dock to the right"}
          aria-label={docked ? "Float this panel" : "Dock to the right"}
          onClick={() => setMode(docked ? "float" : "docked")}
        >
          {docked ? "⧉" : "⇥"}
        </button>
      </header>
      <div className="benchinner">{children}</div>
      <div
        className={`benchgrip ${docked ? "edge" : "corner"}`}
        onPointerDown={onSizeDown}
        onPointerMove={onSizeMove}
        onPointerUp={endSize}
        onPointerCancel={endSize}
        onLostPointerCapture={endSize}
        title={docked ? "Drag to resize" : "Drag to resize"}
        aria-hidden
      />
    </>
  );

  return docked ? (
    <aside className="bench" style={style} aria-label={label}>
      {body}
    </aside>
  ) : (
    <div className="bench floating" style={style} role="dialog" aria-label={label}>
      {body}
    </div>
  );
}
