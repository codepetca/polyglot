"use client";

import { useEffect, useState } from "react";

// Language help, as a permanent profile setting — not something buried inside
// one lesson's toolbar.
//
// It used to live in the flow player, which meant an ESL student had to already
// be inside an interactive lesson to discover it, and it did nothing on the
// written lessons. Sitting in the top bar next to dark mode, it's found once and
// then applies everywhere.
//
// The lesson stays in English on purpose — this adds help underneath, it never
// replaces the English (see lib/curriculum/translate.ts).

// Each language names itself, so a student can find theirs without first being
// able to read English.
export { LANG_LABELS, LANG_EVENT, LANG_KEY as LANG_STORAGE_KEY } from "@/lib/i18n/prefs";
import { LANG_LABELS as LABELS, readPrefs, writePrefs, activeLang } from "@/lib/i18n/prefs";

/** The language in effect, or "" when the help is switched off. */
export function readLang(): string {
  return activeLang();
}

export default function LanguagePicker() {
  const [lang, setLang] = useState("");

  useEffect(() => setLang(activeLang()), []);

  function change(next: string) {
    setLang(next);
    // Picking a language here turns the help on; "English only" turns it off
    // but remembers which language was chosen.
    const cur = readPrefs();
    writePrefs({ lang: next || cur.lang, esl: Boolean(next) });
  }

  return (
    <select
      className="langpick"
      value={lang}
      onChange={(e) => change(e.target.value)}
      title="Add help in your language. Lessons stay in English."
      aria-label="Language help"
    >
      <option value="">🌐 English only</option>
      {Object.entries(LABELS).map(([code, label]) => (
        <option key={code} value={code}>+ {label}</option>
      ))}
    </select>
  );
}
