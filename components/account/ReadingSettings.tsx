"use client";

import { useEffect, useState } from "react";
import { offeredLangs, readPrefs, writePrefs, onPrefsChange, DEFAULT_PREFS, type EslPrefs } from "@/lib/i18n/prefs";

// The same reading settings as the profile menu, with room to explain them.
//
// The menu is for changing one thing mid-lesson; this is for setting it up
// once. Both write the same store, so they cannot disagree.
export default function ReadingSettings() {
  const [p, setP] = useState<EslPrefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setP(readPrefs());
    setLoaded(true);
    return onPrefsChange(setP);
  }, []);

  function update(patch: Partial<EslPrefs>) {
    const next = { ...p, ...patch };
    setP(next);
    writePrefs(next);
  }

  if (!loaded) return null;

  return (
    <>
      <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>
        Shows each lesson in English and your language together. Java words like <code>println</code> stay in
        English, and terms keep the English with your language in brackets — “variable (变量)”. The interface stays
        in English.
      </p>

      <label className="pmrow">
        <input
          type="checkbox"
          checked={p.esl}
          onChange={(e) => update({ esl: e.target.checked, lang: p.lang || "zh-Hans" })}
        />
        <span>Reading help on</span>
      </label>

      <div className="frlangs" style={{ marginTop: 10 }}>
        {offeredLangs().map(([code, label]) => (
          <button
            key={code}
            className={`frlang ${p.lang === code ? "on" : ""}`}
            lang={code}
            onClick={() => update({ lang: code, esl: true })}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="pmrow">
        <span className="pmlabel">Layout</span>
        <select value={p.layout} disabled={!p.esl} onChange={(e) => update({ layout: e.target.value as EslPrefs["layout"] })}>
          <option value="side">Two blocks, side by side</option>
          <option value="under">A line underneath each line</option>
        </select>
      </label>
      <label className="pmrow">
        <input type="checkbox" checked={p.notes} disabled={!p.esl} onChange={(e) => update({ notes: e.target.checked })} />
        <span>Translate my notes</span>
      </label>
      <label className="pmrow">
        <input type="checkbox" checked={p.reference} disabled={!p.esl} onChange={(e) => update({ reference: e.target.checked })} />
        <span>Translate the reference</span>
      </label>
    </>
  );
}
