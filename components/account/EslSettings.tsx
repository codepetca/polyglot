"use client";

import { useEffect, useState } from "react";
import { LANG_LABELS, readPrefs, writePrefs, type EslPrefs } from "@/lib/i18n/prefs";

// The ESL setting, on the profile page.
//
// Turning it on puts a second column beside every lesson: English on one side,
// the chosen language on the other. The English is never replaced — technical
// vocabulary stays in English inside the translation too, glossed once in
// brackets, because those are the words the exam and the compiler use.
export default function EslSettings() {
  const [p, setP] = useState<EslPrefs>({ esl: false, lang: "" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setP(readPrefs());
    setLoaded(true);
  }, []);

  function update(next: EslPrefs) {
    setP(next);
    writePrefs(next);
  }

  if (!loaded) return null;

  return (
    <section className="card eslcard">
      <h2>Reading help (ESL)</h2>
      <p className="meta">
        Shows each lesson twice, side by side: English, and your language beside it. Java words like{" "}
        <code>println</code> stay in English, and terms like “variable (变量)” keep the English with your language in
        brackets — those are the words your exam and the compiler use.
      </p>

      <label className="eslrow">
        <input
          type="checkbox"
          checked={p.esl}
          onChange={(e) => update({ ...p, esl: e.target.checked, lang: p.lang || "zh-Hans" })}
        />
        <span>Show lessons in two languages</span>
      </label>

      <label className="eslrow">
        <span className="esllabel">Language</span>
        <select
          value={p.lang}
          disabled={!p.esl}
          onChange={(e) => update({ ...p, lang: e.target.value, esl: true })}
        >
          {!p.lang && <option value="">Choose…</option>}
          {Object.entries(LANG_LABELS).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <p className="meta eslnote">
        The interface stays in English. Only lesson content, your notes and the reference are translated.
      </p>
    </section>
  );
}
