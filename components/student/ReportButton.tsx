"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Talking to the person who built this.
//
// IT IS A CHAT, NOT A FORM. The first version was a modal with named reasons, a
// text box and a Send button — which is a suggestion box, and nobody uses a
// suggestion box twice, because nothing ever comes back out of it. Replies had
// nowhere to land except an inbox a student had no reason to open.
//
// So the same button now opens the thread. Reasons survive as chips, but only
// on the FIRST message, where they help someone who does not know what this is
// for; after that it is a conversation and stamping every line like a support
// ticket is exactly what made it feel long.
//
// The badge is the whole point. Two-way communication does not happen because
// a channel exists, it happens because a student can see that the last time
// they said something, a person answered.

const REASONS = [
  { id: "broken", label: "Something is broken" },
  { id: "confusing", label: "This is confusing" },
  { id: "language", label: "Add my language" },
  { id: "idea", label: "I have an idea" },
] as const;

type Reason = (typeof REASONS)[number]["id"];
type Msg = { id: string; mine: boolean; body: string; at: string };
type Who = { name: string; avatar: string | null };

/** A face, or the initial when there is no picture yet. */
function Face({ who, big = false }: { who: Who; big?: boolean }) {
  return (
    <span className={`rpface ${big ? "big" : ""}`} title={who.name}>
      {who.avatar ? <img src={who.avatar} alt="" /> : who.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export default function ReportButton({ initialReason }: { initialReason?: Reason }) {
  const path = usePathname() || "";
  const lessonCode = decodeURIComponent(path.split("/lessons/")[1] || "").split("/")[0];

  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
  const [me, setMe] = useState<Who>({ name: "You", avatar: null });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [unread, setUnread] = useState(0);
  const [reason, setReason] = useState<Reason | null>(initialReason ?? null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async (markRead: boolean) => {
    const r = await fetch(`/api/report${markRead ? "?read=1" : ""}`)
      .then((x) => x.json())
      .catch(() => null);
    if (!r || r.error) return;
    setAdmin(r.admin || null);
    setMe({ name: r.meName || "You", avatar: r.meAvatar || null });
    setMsgs(Array.isArray(r.messages) ? r.messages : []);
    setUnread(markRead ? 0 : r.unread || 0);
  }, []);

  // Check for a reply on load, and now and then while the page is open. Polling
  // rather than sockets: a reply arriving within a minute is soon enough for a
  // conversation that runs over days.
  useEffect(() => {
    load(false);
    const t = setInterval(() => {
      if (!document.hidden) load(false);
    }, 60_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) scroller.current?.scrollTo(0, scroller.current.scrollHeight);
  }, [open, msgs]);

  function show() {
    setOpen(true);
    load(true);
  }

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setErr("");
    let code = "";
    if (reason === "broken") {
      try {
        code = localStorage.getItem("classos_scratchpad") || "";
      } catch {
        /* not worth failing the message over */
      }
    }
    const r = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: msgs.length === 0 ? reason : "", body, lessonCode, code }),
    })
      .then((x) => x.json())
      .catch(() => null);

    if (r?.ok) {
      setText("");
      setReason(null);
      await load(true);
    } else {
      setErr(r?.error || "That did not send. Try again in a moment.");
    }
    setBusy(false);
  }

  return (
    <div className="reportwrap" ref={box}>
      <button className="reportbtn" onClick={() => (open ? setOpen(false) : show())} aria-expanded={open}>
        <span aria-hidden>✎</span> Tell me
        {unread > 0 && <span className="reportdot">{unread}</span>}
      </button>

      {open && (
        <div className="reportpanel" role="dialog" aria-label="Talk to the person who built this">
          <header className="rphead">
            <Face who={admin ? { name: admin.name, avatar: admin.avatar } : { name: "classOS", avatar: null }} big />
            <div>
              <b>{admin ? admin.name : "classOS"}</b>
              <span>Maker of ClassOS. Replies here</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </header>

          <div className="rpthread" ref={scroller}>
            {/* A blank box gets a blank response. Saying who is on the other end,
                and that it is one person, is most of what makes anyone type. */}
            <p className="rpintro">
              Hi! I built classOS. Talk to me about anything and I will actually read it and reply. Nobody else sees
              this — not even Mr. Chan.
            </p>
            {msgs.map((m) => (
              <div key={m.id} className={`rprow ${m.mine ? "mine" : ""}`}>
                <Face who={m.mine ? me : admin ? { name: admin.name, avatar: admin.avatar } : { name: "?", avatar: null }} />
                <div className="rpmsg">{m.body}</div>
              </div>
            ))}
            {msgs.length === 0 && reason === null && (
              <div className="reasons">
                {REASONS.map((r) => (
                  <button key={r.id} className="reason" onClick={() => setReason(r.id)}>
                    {r.label}
                  </button>
                ))}
              </div>
            )}
            {msgs.length === 0 && reason && (
              <p className="rpchosen">
                {REASONS.find((r) => r.id === reason)!.label}
                <button onClick={() => setReason(null)} aria-label="Change">change</button>
              </p>
            )}
          </div>

          {err && <p className="reporterr">{err}</p>}

          <div className="rpcompose">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              placeholder={reason === "language" ? "Which language do you speak at home?" : "Type here…"}
            />
            <button className="frgo" onClick={send} disabled={!text.trim() || busy}>
              {busy ? "…" : "Send"}
            </button>
          </div>
          {lessonCode && <p className="rpfoot">Lesson {lessonCode} is attached, so I know where you were.</p>}
        </div>
      )}
    </div>
  );
}
