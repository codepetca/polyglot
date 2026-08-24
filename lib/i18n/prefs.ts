"use client";

// The ESL preference: is the second language column on, and which language.
//
// TWO SETTINGS, NOT ONE. It used to be a single language value where "empty"
// meant off, so turning the help off forgot which language you had picked and
// you had to find yours in a list of twelve again. Keeping them apart means the
// switch is a switch.
//
// STORED IN THE BROWSER, deliberately. A reference and a reading aid must work
// in the account-free standalone mode, and there is no user row to hang a
// preference off there — see PIKA-INTEGRATION.md. Nothing here is secret.

export const LANG_KEY = "classos_assist_lang"; // kept: existing installs have it
export const ESL_KEY = "classos_esl";
export const LANG_EVENT = "classos:langchange";

/** Markham, Ontario. Each language names itself, so a student can find theirs
 *  without first being able to read English. */
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

/** Right-to-left scripts. Only the translated column flips; code never does. */
export const RTL = new Set(["ur", "fa", "ar"]);

export type EslPrefs = { esl: boolean; lang: string };

export function readPrefs(): EslPrefs {
  try {
    const lang = localStorage.getItem(LANG_KEY) || "";
    // An install that predates the switch had a language and no flag. If a
    // language is set, they had the help on, so keep it on.
    const raw = localStorage.getItem(ESL_KEY);
    const esl = raw === null ? Boolean(lang) : raw === "1";
    return { esl: esl && Boolean(lang), lang };
  } catch {
    return { esl: false, lang: "" };
  }
}

export function writePrefs(p: EslPrefs) {
  try {
    localStorage.setItem(LANG_KEY, p.lang);
    localStorage.setItem(ESL_KEY, p.esl ? "1" : "0");
  } catch {
    /* private mode — the setting simply will not persist */
  }
  window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: p }));
}

/** Subscribe to changes so open pages update without a reload. */
export function onPrefsChange(fn: (p: EslPrefs) => void): () => void {
  const h = () => fn(readPrefs());
  window.addEventListener(LANG_EVENT, h);
  return () => window.removeEventListener(LANG_EVENT, h);
}

/** The language actually in effect, or "" when the help is off. */
export function activeLang(): string {
  const p = readPrefs();
  return p.esl ? p.lang : "";
}
