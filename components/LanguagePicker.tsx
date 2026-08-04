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
export const LANG_LABELS: Record<string, string> = {
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
  ta: "தமிழ்",
  ur: "اردو",
  pa: "ਪੰਜਾਬੀ",
  hi: "हिन्दी",
  fa: "فارسی",
  tl: "Tagalog",
  ko: "한국어",
  vi: "Tiếng Việt",
  fr: "Français",
  es: "Español",
};

export const LANG_STORAGE_KEY = "classos_assist_lang";
// Fired when the setting changes so open pages update without a reload.
export const LANG_EVENT = "classos:langchange";

export function readLang(): string {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export default function LanguagePicker() {
  const [lang, setLang] = useState("");

  useEffect(() => setLang(readLang()), []);

  function change(next: string) {
    setLang(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch { /* private mode */ }
    window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: next }));
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
      {Object.entries(LANG_LABELS).map(([code, label]) => (
        <option key={code} value={code}>+ {label}</option>
      ))}
    </select>
  );
}
