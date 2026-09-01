"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Self-service delete, for anonymous practice sessions only. The concrete
// thing the privacy page points to — not a promise, a button.
export default function ForgetMe() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    await fetch("/api/account/forget", { method: "POST" });
    router.push("/join");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button className="skiplink" style={{ marginTop: 20 }} onClick={() => setConfirming(true)}>
        Delete everything about this session
      </button>
    );
  }
  return (
    <div className="panel" style={{ marginTop: 20, borderColor: "var(--bad)" }}>
      <b>Delete everything?</b>
      <p className="meta" style={{ marginTop: 6, marginBottom: 0 }}>
        Every lesson, answer, and coach note tied to this session is deleted immediately — permanently, not just hidden.
        There's nothing else to remove elsewhere; this session's data <i>is</i> the record.
      </p>
      <div className="runrow" style={{ marginTop: 10 }}>
        <button className="btn ghost" style={{ borderColor: "var(--bad)", color: "var(--bad)" }} disabled={busy} onClick={go}>
          {busy ? "deleting…" : "Yes, delete it all"}
        </button>
        <button className="btn ghost" onClick={() => setConfirming(false)}>Cancel</button>
      </div>
    </div>
  );
}
