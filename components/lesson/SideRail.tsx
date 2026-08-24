"use client";

import { useEffect, useState } from "react";
import LessonNav, { type NavUnit } from "./LessonNav";

// The lesson list, foldable out of the way.
//
// With the workbench open on the right, a fixed 280px of contents on the left
// squeezes the lesson itself into the middle third of the screen. Folding
// leaves a spine you can bring it back with, and the lesson gets the room.
export default function SideRail({ units }: { units: NavUnit[] }) {
  const [folded, setFolded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFolded(localStorage.getItem("classos_side_folded") === "1");
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem("classos_side_folded", folded ? "1" : "0");
  }, [folded, loaded]);

  if (folded) {
    return (
      <aside className="side folded">
        <button className="sidefold" onClick={() => setFolded(false)} title="Show lessons" aria-label="Show lessons">
          ›
        </button>
        <span className="sidespine">LESSONS</span>
      </aside>
    );
  }

  return (
    <aside className="side">
      <div className="sidetop">
        <span>Contents</span>
        <button className="sidefold" onClick={() => setFolded(true)} title="Fold the lesson list" aria-label="Fold the lesson list">
          ‹
        </button>
      </div>
      <LessonNav units={units} />
    </aside>
  );
}
