"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Badge = { id: string; name: string; image: string; description: string; _count?: { awards: number } };
type Person = { id: string; name: string; role: string };

// Make a badge, give a badge.
//
// THESE ARE MEANT TO END UP IN PAL, not here. Pal owns the reward surface: the
// companion, the celebration animation, the collection in the world. A badge
// that only exists in classOS is a second, worse rewards system sitting next to
// a good one.
//
// Pal cannot accept them yet. Its collection is DERIVED — keepsakes unlock from
// earned Weekly Rhythms through its own pipeline — and there is no event type
// for "a person decided you deserved this". That is the ask in
// docs/for-the-teacher.md. Until it is agreed, awards are recorded here and
// will be replayed to Pal once the bridge exists.
//
// The image is a data URL, exactly like a profile picture — no bucket, no CDN
// for something forty pixels wide. Emoji works too and is usually better.
export default function BadgeAdmin({ people }: { people: Person[] }) {
  const [list, setList] = useState<Badge[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState("🏅");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [pick, setPick] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const file = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch("/api/badges").then((r) => r.json()).then((d) => setList(d.catalogue || [])).catch(() => {});
  }, []);
  useEffect(load, [load]);

  function readFile(f: File) {
    // 200KB of data URL is plenty for a 42px badge and keeps the row small.
    if (f.size > 200_000) return setMsg("That image is too big — keep it under 200KB.");
    const fr = new FileReader();
    fr.onload = () => setImage(String(fr.result || ""));
    fr.readAsDataURL(f);
  }

  async function create() {
    if (!name.trim() || busy) return;
    setBusy(true);
    const r = await fetch("/api/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name, image, description: desc }),
    }).then((x) => x.json());
    setBusy(false);
    if (r.ok) {
      setName(""); setDesc(""); setImage("🏅");
      if (file.current) file.current.value = "";
      load();
    } else setMsg(r.error || "Could not create that.");
  }

  async function award(badgeId: string) {
    const userId = pick[badgeId];
    if (!userId) return setMsg("Pick who it goes to first.");
    const r = await fetch("/api/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "award", badgeId, userId, note: note[badgeId] || "" }),
    }).then((x) => x.json());
    if (r.ok) {
      setMsg(`Given to ${people.find((p) => p.id === userId)?.name} — they will see it in the chat.`);
      setNote((n) => ({ ...n, [badgeId]: "" }));
      load();
    } else setMsg(r.error || "Could not give that.");
  }

  return (
    <main className="wrap trwrap">
      <header className="noteshead">
        <h1>Badges</h1>
        <p className="meta">
          For the things XP cannot see — spotting a bug, telling you a lesson was confusing, helping someone else.
          Pal counts work; this is for everything else.
        </p>
        <p className="meta" style={{ color: "var(--warn)" }}>
          These are meant to land in Pal, with its claim animation and its collection. Pal cannot accept them yet —
          its keepsakes are earned from Weekly Rhythms, and there is no event for “a person decided you deserved
          this”. Awards are recorded here and will be replayed once that bridge exists. See
          <code> docs/for-the-teacher.md</code>.
        </p>
      </header>

      {msg && <p className="meta" style={{ color: "var(--ok)" }}>{msg}</p>}

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>New badge</h2>
        <div className="badgemake">
          <span className="badgeimg big">
            {image.startsWith("data:") ? <img src={image} alt="" /> : image}
          </span>
          <div className="badgefields">
            <input className="f" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name — e.g. Bug Hunter" />
            <input className="f" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="One line — what it is for" />
            <div className="badgeimgrow">
              <input className="f emoji" value={image.startsWith("data:") ? "" : image}
                     onChange={(e) => setImage(e.target.value.slice(0, 4) || "🏅")} placeholder="🏅" />
              <span className="meta">or</span>
              <input ref={file} type="file" accept="image/*"
                     onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
            </div>
            <button className="btn green" onClick={create} disabled={!name.trim() || busy}>Create</button>
          </div>
        </div>
      </div>

      {list.map((b) => (
        <div className="panel" key={b.id}>
          <div className="badgemake">
            <span className="badgeimg big">
              {b.image.startsWith("data:") ? <img src={b.image} alt="" /> : b.image}
            </span>
            <div className="badgefields">
              <b style={{ fontSize: 16 }}>{b.name}</b>
              <span className="meta">{b.description || "—"} · given {b._count?.awards ?? 0}×</span>
              <div className="badgeimgrow">
                <select className="f" value={pick[b.id] || ""} onChange={(e) => setPick((p) => ({ ...p, [b.id]: e.target.value }))}>
                  <option value="">{people.length ? "Give to…" : "No Pika students yet"}</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · {p.role.toLowerCase()}</option>
                  ))}
                </select>
                <input className="f" value={note[b.id] || ""} placeholder="Why — “spotted the bug in 6.7”"
                       onChange={(e) => setNote((n) => ({ ...n, [b.id]: e.target.value }))} />
                <button className="btn" onClick={() => award(b.id)}>Give</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </main>
  );
}
