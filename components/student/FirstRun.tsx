"use client";

import { useEffect, useState } from "react";
import { offeredLangs, readPrefs, writePrefs } from "@/lib/i18n/prefs";
import { useAi } from "@/lib/features";

// What a student meets the first time they open a lesson.
//
// TWO QUESTIONS, THEN OUT OF THE WAY. Reading help was a setting behind an
// avatar, which is the last place someone who cannot read the interface will
// look — so it is asked, once, in plain terms. And the three tools on the right
// are named, because a rail of icons is only obvious to whoever built it.
//
// It shows on the FIRST LESSON, not on sign-in. On a landing page it is chrome
// in front of someone who has not seen the thing it describes; on a lesson the
// scratchpad and the tutor are on screen behind it and the words point at
// something real.
//
// Dismissible at every step, never shown twice, and it stores nothing but a
// flag — a student who says no is not asked again.

const SEEN = "classos_firstrun_v1";

export default function FirstRun() {
  const ai = useAi();
  const [step, setStep] = useState<0 | 1>(0);
  const [show, setShow] = useState(false);
  const [lang, setLang] = useState("");

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN)) setShow(true);
    } catch {
      /* private mode: skip it rather than nag on every page */
    }
  }, []);

  function done() {
    try {
      localStorage.setItem(SEEN, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="frwrap" role="dialog" aria-modal="true" aria-label="Getting started">
      <div className="frcard">
        {step === 0 && (
          <>
            <p className="freyebrow">Before you start · 1 of 2</p>
            <h2>Is English your first language?</h2>
            <p className="frnote">
              If not, polyglot can show every lesson twice — English on one side, your language on the other. Java
              words like <code>println</code> always stay in English, because those are the words your exam uses.
            </p>
            <div className="frlangs">
              {offeredLangs().map(([code, label]) => (
                <button
                  key={code}
                  className={`frlang ${lang === code ? "on" : ""}`}
                  onClick={() => setLang(code)}
                  lang={code}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="frnote small">
              More languages are being added. You can change or switch this off any time from the menu with your name
              on it.
            </p>
            <div className="frrow">
              <button className="frghost" onClick={() => setStep(1)}>
                English is fine
              </button>
              <button
                className="frgo"
                disabled={!lang}
                onClick={() => {
                  const cur = readPrefs();
                  writePrefs({ ...cur, esl: true, lang });
                  setStep(1);
                }}
              >
                Use this language
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="freyebrow">One more thing</p>
            <h2>{ai ? "Three tools live on the right" : "Two tools live on the right"}</h2>
            <ul className="frtools">
              <li>
                <b>Scratchpad</b> — write Java and run it. Nothing here is marked, so try things.
              </li>
              <li>
                <b>Reference</b> — every piece of syntax in the course, opened at the part this lesson uses.
              </li>
              {ai && (
                <li>
                  <b>AI Tutor</b> — ask about the lesson or your code. It can write code and fix yours.
                </li>
              )}
            </ul>
            {ai && (
              <p className="frnote">
                And when your code will not run, the red error has a <b>“What does this mean?”</b> button under it
                that explains it in plain words.
              </p>
            )}
            <div className="frrow">
              <span />
              <button className="frgo" onClick={done}>
                Start the lesson
              </button>
            </div>
          </>
        )}

        <button className="frx" onClick={done} aria-label="Close">
          ✕
        </button>
      </div>
    </div>
  );
}
