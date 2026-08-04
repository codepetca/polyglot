"use client";

// Last-resort boundary: catches failures in the root layout itself (for example
// the database being unreachable while loading the signed-in user), which
// app/error.tsx cannot catch because the layout never rendered. It must supply
// its own <html>/<body> and must not depend on the app's stylesheet.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf7f0",
          color: "#1e1b16",
          fontFamily: "-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 460 }}>
          <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: ".14em", color: "#8c8478", margin: 0 }}>
            HICCUP
          </p>
          <h1 style={{ fontSize: 26, lineHeight: 1.2, margin: "8px 0 10px" }}>
            That didn&apos;t load — give it a second.
          </h1>
          <p style={{ color: "#4a453c", lineHeight: 1.55, marginTop: 0 }}>
            Something on our end didn&apos;t respond. It&apos;s almost always temporary, and nothing you did caused it.
            Your progress is safe.
          </p>
          <button
            onClick={reset}
            style={{
              border: "none", borderRadius: 999, padding: "11px 24px", fontSize: 15, fontWeight: 600,
              background: "#2e7d50", color: "#fff", cursor: "pointer", marginTop: 8,
            }}
          >
            Try again
          </button>
          {error?.digest && (
            <p style={{ fontSize: 12, color: "#8c8478", marginTop: 18 }}>
              If it keeps happening, mention this code: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
