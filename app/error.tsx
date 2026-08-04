"use client";

import { useEffect } from "react";

// A student should never see a raw 500.
//
// The most likely cause by far is the database being briefly unreachable — a
// blip that resolves in seconds. Before this, that blip rendered a blank error
// page, which reads as "this whole thing is broken" and is exactly the moment a
// discouraged learner closes the tab for good. Now it says what happened, in
// plain language, and offers the one action that usually works.
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surfaces in the server/browser console for whoever is debugging.
    console.error("page error:", error);
  }, [error]);

  return (
    <div className="main" style={{ maxWidth: 520, paddingTop: 60 }}>
      <div className="crumb">HICCUP</div>
      <h1 className="title" style={{ fontSize: 26, marginBottom: 8 }}>
        That didn&apos;t load — give it a second.
      </h1>
      <p style={{ marginTop: 0 }}>
        Something on our end didn&apos;t respond in time. It&apos;s almost always temporary, and{" "}
        <b>nothing you did caused it</b>. Your progress is safe.
      </p>
      <div className="runrow" style={{ marginTop: 16 }}>
        <button className="btn green" onClick={reset}>Try again</button>
        <a className="btn ghost" href="/lessons" style={{ textDecoration: "none" }}>Back to lessons</a>
      </div>
      {error?.digest && (
        <p className="meta" style={{ marginTop: 18 }}>
          If it keeps happening, mention this code: <code>{error.digest}</code>
        </p>
      )}
    </div>
  );
}
