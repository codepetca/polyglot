"use client";

import { useState } from "react";

// The "how do I actually type this again?" panel.
//
// Interactive steps teach the IDEA, but a student two lessons later cannot
// remember the exact shape of a for-loop header, and nothing on screen told
// them. Without this they either guess, give up, or leave to search — and the
// ones most likely to leave are exactly the students this platform is for.
//
// Deliberately a reference, not a tutorial: the smallest correct example of each
// thing, copyable, always one tap away, never blocking the lesson.

import { REFERENCE } from "@/lib/curriculum/reference";

export default function SyntaxHelp() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState("");

  const query = q.trim().toLowerCase();
  const sections = query
    ? REFERENCE.map((s) => ({
        ...s,
        entries: s.entries.filter(
          (e) => e.name.toLowerCase().includes(query) || e.code.toLowerCase().includes(query) || e.note.toLowerCase().includes(query)
        ),
      })).filter((s) => s.entries.length)
    : REFERENCE;

  if (!open) {
    return (
      <button className="syntaxfab" onClick={() => setOpen(true)} title="How do I write this again?">
        📖 Syntax help
      </button>
    );
  }

  return (
    <div className="syntaxpanel">
      <div className="sp-head">
        <b>📖 Syntax help</b>
        <span className="meta" style={{ margin: 0 }}>the smallest correct example of each thing</span>
        <span style={{ flex: 1 }} />
        <button className="tbtn2" onClick={() => setOpen(false)} aria-label="Close syntax help">✕</button>
      </div>
      <input
        className="f"
        placeholder="search — e.g. loop, print, input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ margin: "10px 0" }}
      />
      <div className="sp-body">
        {sections.length === 0 && <p className="meta">Nothing matches “{q}”.</p>}
        {sections.map((s) => (
          <div key={s.title} className="sp-section">
            <h4>{s.title}</h4>
            {s.entries.map((e) => (
              <div className="sp-entry" key={e.name}>
                <div className="sp-name">{e.name}</div>
                <pre
                  className="sp-code"
                  title="Click to copy"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(e.code);
                      setCopied(e.name);
                      setTimeout(() => setCopied(""), 1200);
                    } catch { /* clipboard blocked */ }
                  }}
                >
                  {e.code}
                </pre>
                <div className="sp-note">{copied === e.name ? "copied ✓" : e.note}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
