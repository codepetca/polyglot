"use client";

import { useEffect, useState } from "react";
import { readPrefs, onPrefsChange, RTL, type EslPrefs } from "@/lib/i18n/prefs";

// A lesson's key points, in English and — when the student has asked for it —
// their language beside each one.
//
// The translation comes from the SAME store as the lessons: a keypoint is a
// flow field, so translating a lesson translates its notes. There is no second
// pipeline to keep in step.
export default function NoteList({
  points,
}: {
  points: { en: string; alt: Record<string, string> }[];
}) {
  const [p, setP] = useState<EslPrefs | null>(null);
  useEffect(() => {
    setP(readPrefs());
    return onPrefsChange(setP);
  }, []);

  const lang = p?.esl && p.notes ? p.lang : "";

  return (
    <ul className="notelist">
      {points.map((pt, j) => {
        const alt = lang ? pt.alt[lang] : "";
        return (
          <li key={j}>
            <span>{pt.en}</span>
            {alt && (
              <span className="notealt" dir={RTL.has(lang) ? "rtl" : "ltr"} lang={lang}>
                {alt}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
