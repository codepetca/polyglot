"use client";

import { useCallback, useEffect, useState } from "react";

// Translate lessons into one language, one at a time, with the failures shown.
//
// SEQUENTIAL ON PURPOSE. Firing 57 model calls at once would trip the rate
// limit and the daily budget cap, and the first failure would be lost in the
// noise. One at a time is slower and tells you exactly which lesson broke and
// why, which is what you need the first time you run this.
//
// RESUMABLE. "Translate everything missing" skips lessons that already have the
// language, so re-running after a failure costs nothing for the ones that
// worked.

type Lesson = { code: string; title: string; have: string[] };
type Lang = { code: string; name: string; label: string };
type Row = { code: string; state: "queued" | "running" | "done" | "failed"; note?: string };

export default function TranslateConsole() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [langs, setLangs] = useState<Lang[]>([]);
  const [locale, setLocale] = useState("zh-Hans");
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [busy, setBusy] = useState(false);
  const [stop, setStop] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/curriculum/translate").then((x) => x.json());
    if (r.error) return setErr(r.error);
    setLessons(r.lessons || []);
    setLangs(r.languages || []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const missing = lessons.filter((l) => !l.have.includes(locale));

  async function one(code: string) {
    setRows((s) => ({ ...s, [code]: { code, state: "running" } }));
    try {
      const r = await fetch("/api/curriculum/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonCode: code, locale }),
      }).then((x) => x.json());
      if (r.ok) {
        setRows((s) => ({ ...s, [code]: { code, state: "done", note: `${r.strings ?? "?"} strings · ${r.model || r.provider}` } }));
        return true;
      }
      setRows((s) => ({ ...s, [code]: { code, state: "failed", note: r.error || "failed" } }));
      return false;
    } catch (e) {
      setRows((s) => ({ ...s, [code]: { code, state: "failed", note: (e as Error).message } }));
      return false;
    }
  }

  async function runAll(list: Lesson[]) {
    setBusy(true);
    setStop(false);
    setRows(Object.fromEntries(list.map((l) => [l.code, { code: l.code, state: "queued" as const }])));
    for (const l of list) {
      if (stop) break;
      await one(l.code);
    }
    setBusy(false);
    await load();
  }

  const done = Object.values(rows).filter((r) => r.state === "done").length;
  const failed = Object.values(rows).filter((r) => r.state === "failed");

  return (
    <main className="wrap trwrap">
      <header className="noteshead">
        <h1>Translate lessons</h1>
        <p className="meta">
          Adds a second language beside the English. Code is never translated, and technical terms keep the English with
          your language in brackets. Students turn it on under their own name in the top bar.
        </p>
      </header>

      {err && <p className="trerr">{err}</p>}

      <div className="trbar">
        <label>
          Language
          <select value={locale} onChange={(e) => setLocale(e.target.value)} disabled={busy}>
            {langs.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label} — {l.name}
              </option>
            ))}
          </select>
        </label>
        <span className="trcount">
          {lessons.length - missing.length} of {lessons.length} lessons already have this language
        </span>
        <span style={{ flex: 1 }} />
        {busy ? (
          <button className="btn" onClick={() => setStop(true)}>
            Stop after this one
          </button>
        ) : (
          <>
            <button className="btn" disabled={!missing.length} onClick={() => runAll(missing)}>
              Translate {missing.length} missing
            </button>
            <button className="btn blue" disabled={!lessons.length} onClick={() => runAll(lessons)}>
              Redo all {lessons.length}
            </button>
          </>
        )}
      </div>

      {(busy || done > 0 || failed.length > 0) && (
        <p className="meta">
          {done} done{failed.length ? `, ${failed.length} failed` : ""}
          {busy ? " — still going, leave this tab open" : ""}
        </p>
      )}

      <table className="trtable">
        <thead>
          <tr>
            <th>Lesson</th>
            <th>Has</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((l) => {
            const r = rows[l.code];
            return (
              <tr key={l.code} className={r?.state === "failed" ? "bad" : undefined}>
                <td>
                  <code>{l.code}</code> {l.title}
                </td>
                <td className="trhave">{l.have.length ? l.have.join(" ") : "—"}</td>
                <td>
                  {r ? (
                    <span className={`trstate ${r.state}`}>
                      {r.state === "running" ? "translating…" : r.state}
                      {r.note ? ` · ${r.note}` : ""}
                    </span>
                  ) : (
                    <button className="tbtn2" disabled={busy} onClick={() => one(l.code).then(load)}>
                      Translate
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
