"use client";

import { useRef } from "react";

// A plain <textarea> is a hostile place to write code: Tab jumps focus out of
// the box, brackets and quotes must be typed and closed by hand, and Enter
// drops you back to column 0 inside a block. Beginners lose the thread fighting
// the editor instead of thinking about the program.
//
// This adds the three behaviours people expect from any code editor, without
// pulling in a heavyweight editor library:
//   Tab / Shift+Tab  → indent / outdent (never escapes the box)
//   ( [ { " '        → auto-close, and wrap the selection if text is selected
//   )] } " '         → typing the closer when it's already there just steps over it
//   Enter            → keep the current indent, and open a block after {
//   Backspace        → delete an empty auto-inserted pair in one press

const PAIRS: Record<string, string> = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'" };
const INDENT = "  ";

export default function CodeBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Apply a change and restore the caret where the user expects it.
  function apply(next: string, caret: number, caretEnd = caret) {
    onChange(next);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (el) el.setSelectionRange(caret, caretEnd);
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    const { selectionStart: s, selectionEnd: t } = el;
    const v = el.value;

    // ── Tab / Shift+Tab: indent, never leave the textarea ──
    if (e.key === "Tab") {
      e.preventDefault();
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      // Multi-line selection → shift the whole block.
      if (s !== t && v.slice(s, t).includes("\n")) {
        const endOfBlock = v.indexOf("\n", t) === -1 ? v.length : v.indexOf("\n", t);
        const block = v.slice(lineStart, endOfBlock);
        const shifted = e.shiftKey
          ? block.split("\n").map((l) => l.replace(new RegExp(`^${INDENT}`), "")).join("\n")
          : block.split("\n").map((l) => INDENT + l).join("\n");
        apply(v.slice(0, lineStart) + shifted + v.slice(endOfBlock), lineStart, lineStart + shifted.length);
        return;
      }
      if (e.shiftKey) {
        if (v.slice(lineStart, lineStart + INDENT.length) === INDENT) {
          apply(v.slice(0, lineStart) + v.slice(lineStart + INDENT.length), Math.max(lineStart, s - INDENT.length));
        }
        return;
      }
      apply(v.slice(0, s) + INDENT + v.slice(t), s + INDENT.length);
      return;
    }

    // ── Enter: keep indentation; opening a { gives you a formatted block ──
    if (e.key === "Enter") {
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      const indent = (v.slice(lineStart, s).match(/^[ \t]*/) || [""])[0];
      const before = v[s - 1];
      const after = v[s];
      if (before === "{" && after === "}") {
        e.preventDefault();
        const inner = `\n${indent}${INDENT}`;
        apply(v.slice(0, s) + inner + `\n${indent}` + v.slice(t), s + inner.length);
        return;
      }
      if (indent) {
        e.preventDefault();
        const extra = before === "{" ? INDENT : "";
        apply(v.slice(0, s) + "\n" + indent + extra + v.slice(t), s + 1 + indent.length + extra.length);
        return;
      }
      if (before === "{") {
        e.preventDefault();
        apply(v.slice(0, s) + "\n" + INDENT + v.slice(t), s + 1 + INDENT.length);
      }
      return;
    }

    // ── Auto-close, and wrap a selection in the pair ──
    if (PAIRS[e.key]) {
      const close = PAIRS[e.key];
      if (s !== t) {
        e.preventDefault();
        apply(v.slice(0, s) + e.key + v.slice(s, t) + close + v.slice(t), s + 1, t + 1);
        return;
      }
      // Don't double up quotes when closing an existing one.
      if ((e.key === '"' || e.key === "'") && v[s] === e.key) {
        e.preventDefault();
        apply(v, s + 1);
        return;
      }
      e.preventDefault();
      apply(v.slice(0, s) + e.key + close + v.slice(t), s + 1);
      return;
    }

    // ── Typing a closer that's already there: step over it ──
    if ([")", "]", "}"].includes(e.key) && v[s] === e.key && s === t) {
      e.preventDefault();
      apply(v, s + 1);
      return;
    }

    // ── Backspace inside an empty pair removes both halves ──
    if (e.key === "Backspace" && s === t && s > 0) {
      const before = v[s - 1];
      if (PAIRS[before] && v[s] === PAIRS[before]) {
        e.preventDefault();
        apply(v.slice(0, s - 1) + v.slice(s + 1), s - 1);
      }
    }
  }

  return (
    <textarea
      ref={ref}
      className="flowcode"
      rows={Math.max(4, (value.match(/\n/g)?.length || 0) + 2)}
      value={value}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      onKeyDown={onKeyDown}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
