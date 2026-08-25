"use client";

import { useEffect, useState } from "react";

type Award = { id: string; name: string; image: string; description: string; note: string; at: string };

// Badges the admin has given this student.
//
// Deliberately not XP. Pal counts work; this is for the things counting cannot
// see — spotting a bug, telling me the reference was unreadable, helping
// someone else. The note is shown because a badge without a reason is a
// sticker.
export default function MyBadges() {
  const [mine, setMine] = useState<Award[] | null>(null);

  useEffect(() => {
    fetch("/api/badges")
      .then((r) => r.json())
      .then((d) => setMine(Array.isArray(d.mine) ? d.mine : []))
      .catch(() => setMine([]));
  }, []);

  if (mine === null) return null;

  return (
    <div className="badgegrid">
      {mine.length === 0 && (
        <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
          None yet. These are handed out by hand, usually for telling me something I did not know — a bug, a
          confusing lesson, an idea worth building.
        </p>
      )}
      {mine.map((a) => (
        <div className="badgecard" key={a.id}>
          <span className="badgeimg">
            {a.image.startsWith("data:") ? <img src={a.image} alt="" /> : a.image}
          </span>
          <div>
            <b>{a.name}</b>
            {a.note && <span className="badgenote">{a.note}</span>}
            {!a.note && a.description && <span className="badgenote">{a.description}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
