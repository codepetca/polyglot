"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { offeredLangs, readPrefs, writePrefs, DEFAULT_PREFS, type EslPrefs } from "@/lib/i18n/prefs";

// Quick settings, behind the name and avatar in the top bar.
//
// The name badge looked clickable and was not, and the only settings page was
// staff-only, so a student had no way to reach any of this. The language select
// used to sit loose in the top bar, which put a twelve-item dropdown in the
// chrome of every page for the small minority who need it. It belongs here.

type MiniUser = { name: string; role: string; className?: string | null; avatar?: string | null; anonymous?: boolean };

export default function ProfileMenu({
  me,
  onSignOut,
  embed = "",
}: {
  me: MiniUser;
  onSignOut: () => void;
  /** Set when classOS is running inside a host that owns identity. */
  embed?: "" | "pika";
}) {
  const [open, setOpen] = useState(false);
  const [p, setP] = useState<EslPrefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setP(readPrefs());
    setLoaded(true);
  }, []);

  // Close on an outside click or Escape — a menu you cannot dismiss is worse
  // than no menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function update(patch: Partial<EslPrefs>) {
    const next = { ...p, ...patch };
    setP(next);
    writePrefs(next);
  }

  return (
    <div className="profilewrap" ref={box}>
      <button
        className="modelbox profilebtn"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={me.anonymous ? "Private practice session — progress is saved to this browser only" : me.className ? `Class: ${me.className}` : "Settings"}
      >
        <span className="avatar-sm">{me.avatar ? <img src={me.avatar} alt="" /> : me.name.slice(0, 1).toUpperCase()}</span>
        <span className="profilename">{me.name}</span>
        {me.anonymous && <span className="guesttag" title="private, on this device only">guest</span>}
        <span className="profilecaret" aria-hidden>▾</span>
      </button>

      {open && loaded && (
        <div className="profilemenu" role="menu">
          <div className="pmhead">
            {me.name}
            {me.className && <span>{me.className}</span>}
          </div>

          <div className="pmsection">
            <label className="pmrow">
              <input
                type="checkbox"
                checked={p.esl}
                onChange={(e) => update({ esl: e.target.checked, lang: p.lang || "zh-Hans" })}
              />
              <span>Reading help (ESL)</span>
            </label>
            <p className="pmnote">
              Lessons in English and your language together. Java words like <code>println</code> stay English, and
              terms keep the English with your language in brackets — “variable (变量)”.
            </p>

            <label className="pmrow">
              <span className="pmlabel">Language</span>
              <select value={p.lang} disabled={!p.esl} onChange={(e) => update({ lang: e.target.value, esl: true })}>
                {!p.lang && <option value="">Choose…</option>}
                {offeredLangs().map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="pmrow">
              <span className="pmlabel">Layout</span>
              <select
                value={p.layout}
                disabled={!p.esl}
                onChange={(e) => update({ layout: e.target.value as EslPrefs["layout"] })}
              >
                <option value="side">Two blocks, side by side</option>
                <option value="under">A line underneath each line</option>
              </select>
            </label>

            <label className="pmrow">
              <input
                type="checkbox"
                checked={p.notes}
                disabled={!p.esl}
                onChange={(e) => update({ notes: e.target.checked })}
              />
              <span>Translate my notes</span>
            </label>

            <label className="pmrow">
              <input
                type="checkbox"
                checked={p.reference}
                disabled={!p.esl}
                onChange={(e) => update({ reference: e.target.checked })}
              />
              <span>Translate the reference</span>
            </label>

            <p className="pmnote">The interface stays in English. Only lesson content, notes and the reference change.</p>
          </div>

          <div className="pmsection pmlinks">
            {/* Account and Sign out are Pika's to offer when Pika owns
                identity. Signing out of classOS from inside a Pika tab would
                leave a student in a tab they cannot use, in a session they did
                not know they had. The reading settings stay, because they are
                genuinely ours. */}
            {!embed && (
              <Link href="/account" onClick={() => setOpen(false)}>
                Account
              </Link>
            )}
            <Link href="/docs" onClick={() => setOpen(false)}>
              Java reference
            </Link>
            {/* A GUEST MUST HAVE A WAY OUT. Sign out was hidden for anonymous
                sessions — reasonable on its own, since there is no account to
                sign out OF — but combined with a staff-only Account link it
                left a guest with no route to the login page at all except
                typing the URL. That is how the owner got stuck in one. */}
            {embed ? null : me.anonymous ? (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>
                  Sign in to an account
                </Link>
                <button onClick={onSignOut} className="pmsignout">
                  Leave guest session
                </button>
              </>
            ) : (
              <button onClick={onSignOut} className="pmsignout">
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
