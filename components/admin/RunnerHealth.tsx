"use client";

import { useState } from "react";

// Runner diagnostics. Every interactive lesson step depends on this one
// external service, so when students report "it's broken", this answers
// "is it us or them" in one click.
type Lane = { name: string; healthy: boolean; cooldownEndsInMs: number };

export default function RunnerHealth({ initial }: { initial: Lane[] }) {
  const [lanes, setLanes] = useState<Lane[]>(initial);
  const [result, setResult] = useState<{ ok: boolean; servedBy?: string; ms?: number; error?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function ping() {
    setBusy(true);
    setResult(null);
    const d = await fetch("/api/admin/runner", { method: "POST" }).then((r) => r.json());
    setResult(d);
    if (d.lanes) setLanes(d.lanes);
    setBusy(false);
  }

  const allDown = lanes.length > 0 && lanes.every((l) => !l.healthy);

  return (
    <div className="panel" style={{ marginTop: 20, borderColor: allDown ? "#b3352e" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <b>⚙ Java runner</b>
        {allDown && <span className="statuschip" style={{ borderColor: "#b3352e", color: "#b3352e" }}>ALL LANES DOWN</span>}
        <span style={{ flex: 1 }} />
        <button className="btn ghost" disabled={busy} onClick={ping}>
          {busy ? "running…" : "Run a test program"}
        </button>
      </div>
      <p className="meta" style={{ marginTop: 6 }}>
        Every interactive lesson step runs real Java through these, in order. If one fails it's skipped for 60s and the next
        takes over. Set <code>PISTON_URL</code> to add a lane on a host you control — right now the defaults share one host,
        so a full godbolt.org outage would still stop lessons.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
        {lanes.map((l, i) => (
          <div key={l.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
            <span className="meta" style={{ margin: 0, width: 18 }}>{i + 1}.</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12.5 }}>{l.name}</span>
            <span style={{ color: l.healthy ? "var(--accent)" : "#b3352e" }}>
              {l.healthy ? "● ready" : `● cooling down (${Math.ceil(l.cooldownEndsInMs / 1000)}s)`}
            </span>
          </div>
        ))}
      </div>
      {result && (
        <div className="meta" style={{ marginTop: 10, color: result.ok ? "var(--accent)" : "#b3352e" }}>
          {result.ok ? `✓ ran in ${result.ms}ms via ${result.servedBy}` : `✗ failed: ${result.error?.slice(0, 160)}`}
        </div>
      )}
    </div>
  );
}
