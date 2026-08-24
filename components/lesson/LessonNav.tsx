"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The lesson list, folded by unit.
 *
 * WHY: 57 lessons in one flat column is roughly four screens of scrolling, and
 * a student looking for 6.4 has to scroll past everything they already did to
 * reach it. Folded, the whole course is six rows.
 *
 * The unit holding the current lesson opens itself, so landing on a lesson
 * never shows a wall of closed folders with no clue where you are. Units the
 * student opens by hand stay open — React only touches `open` when the value
 * it last rendered actually changes.
 */

export type NavLesson = {
  code: string;
  shown: string;
  title: string;
  dot: "m" | "p" | "n";
  interactive: boolean;
};
export type NavUnit = { id: string; title: string; lessons: NavLesson[] };

export default function LessonNav({ units }: { units: NavUnit[] }) {
  const path = usePathname() || "";
  const current = decodeURIComponent(path.split("/lessons/")[1] || "").split("/")[0];

  return (
    <>
      {units.map((u) => {
        const here = u.lessons.some((l) => l.code === current);
        const done = u.lessons.filter((l) => l.dot === "m").length;
        return (
          <details className="unitfold" key={u.id} open={here}>
            <summary>
              <span className="unitname">{u.title}</span>
              <span className="unitcount">
                {done}/{u.lessons.length}
              </span>
            </summary>
            <div className="unitbody">
              {u.lessons.map((l) => (
                <Link
                  key={l.code}
                  href={`/lessons/${l.code}`}
                  className={`topic${l.code === current ? " on" : ""}`}
                >
                  <span className={`dot ${l.dot}`} />
                  {l.title}
                  {/* Only some lessons are the do-first interactive experience
                      yet; the rest are still reading. Say which is which up
                      front rather than letting a student find out by landing in
                      a wall of text. */}
                  {l.interactive && (
                    <span className="playmark" title="Interactive — do it, don't read it">
                      ▶
                    </span>
                  )}
                  {/* CodeHS's number, not ours — see studentCode(). */}
                  <span className="mini">{l.shown}</span>
                </Link>
              ))}
            </div>
          </details>
        );
      })}
    </>
  );
}
