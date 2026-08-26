"use client";

import { useState } from "react";

// A real lesson step, playable on the landing page BEFORE any signup.
//
// Deliberately self-contained/client-side: the answer lives in this file rather
// than behind the graded /api/lesson/flow endpoint. That's correct here — this
// is a shop window, not assessment, so it needs no auth, no rate limit, and
// contributes no evidence. Real lessons keep every answer server-side.
//
// It's the actual f21_10 step from lesson 2.1, verified against the real Java
// compiler like every other step (scripts/verify-flow-21.mjs).

const OPTS = ["123", "6", "15", "(an error)"];
const CORRECT = 0;
const WHY = 'Left to right: "1" + 2 makes the text "12", then "12" + 3 makes "123". Once text joins in, + glues instead of adding.';

export default function TryStep() {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div className="panel flowstep trystep">
      <div className="meta" style={{ margin: "0 0 8px" }}>A REAL STEP FROM THE COURSE · NO SIGNUP NEEDED</div>
      <div className="flowq">What does this print?</div>
      <pre className="flowcode ro">{'System.out.println("1" + 2 + 3);'}</pre>
      <div className="flowopts" style={{ marginTop: 12 }}>
        {OPTS.map((o, i) => {
          const cls = picked === null ? "" : i === CORRECT ? "right" : i === picked ? "wrong" : "dim";
          return (
            <button key={i} className={`optbtn ${cls}`} disabled={picked !== null} onClick={() => setPicked(i)}>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className={`flowwhy ${picked === CORRECT ? "yes" : "no"}`}>
          <b>{picked === CORRECT ? "✓ exactly." : "nope —"}</b> {WHY}
        </div>
      )}
      {picked === null && (
        <p className="meta" style={{ marginTop: 10 }}>Tap an answer — you find out if you're right straight after, which is how every step works.</p>
      )}
    </div>
  );
}
