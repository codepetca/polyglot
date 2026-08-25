"use client";

import { useState } from "react";

// The global daily spend kill-switch (lib/settings.ts BudgetConfig): once
// today's real AI spend crosses this, every AI call degrades to the offline
// stub for the rest of the day rather than keep charging. Bounds total
// platform exposure — per-user/IP limits alone don't, since an anonymous
// session costs nothing to mint.
export default function BudgetCap({
  capUsd,
  spentToday,
  studentDailyCalls,
}: {
  capUsd: number;
  spentToday: number;
  studentDailyCalls: number;
}) {
  const [cap, setCap] = useState(capUsd);
  const [perStudent, setPerStudent] = useState(studentDailyCalls);
  const [status, setStatus] = useState("");
  const pct = Math.min(100, (spentToday / Math.max(0.01, cap)) * 100);
  const over = spentToday >= cap;

  async function save() {
    setStatus("saving…");
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ budget: { dailyCapUsd: cap, studentDailyCalls: perStudent } }) });
    setStatus("saved ✓");
  }

  return (
    <div className="panel" style={{ marginTop: 20, borderColor: over ? "#b3352e" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <b>🛑 Global daily spend cap</b>
        {over && <span className="statuschip" style={{ borderColor: "#b3352e", color: "#b3352e" }}>CAP HIT — serving offline replies</span>}
      </div>
      <p className="meta" style={{ marginTop: 6 }}>
        Per-user limits stop one abuser; this stops everyone at once. Once today's real spend reaches the cap, every AI
        feature (tutor, grading, generation) falls back to a canned offline reply for the rest of the day — nothing crashes,
        it just stops costing money. Resets at midnight.
      </p>
      <div style={{ height: 8, borderRadius: 4, background: "var(--line)", overflow: "hidden", margin: "10px 0" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: over ? "#b3352e" : "var(--accent)" }} />
      </div>
      <div className="meta" style={{ margin: 0 }}>${spentToday.toFixed(4)} spent today of ${cap.toFixed(2)} cap</div>
      <div className="runrow" style={{ marginTop: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5 }}>
          $ <input className="f" type="number" min={0.5} step={0.5} value={cap} onChange={(e) => setCap(Number(e.target.value))} style={{ width: 90 }} /> / day
        </label>
      </div>

      <hr style={{ border: 0, borderTop: "1.5px solid var(--line)", margin: "16px 0 12px" }} />

      <b>👤 Per-student daily limit</b>
      <p className="meta" style={{ marginTop: 6 }}>
        AI questions one student may ask in a day — tutor replies, error explanations and code annotations all count.
        The cap above protects the bill; this protects the other students, because without it one person in a loop
        spends the whole class&rsquo;s budget and everyone else drops to offline replies for the rest of the day.
        Counted per account, so it applies the same way to students arriving from Pika.
      </p>
      <div className="runrow" style={{ marginTop: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5 }}>
          <input
            className="f"
            type="number"
            min={1}
            step={10}
            value={perStudent}
            onChange={(e) => setPerStudent(Number(e.target.value))}
            style={{ width: 90 }}
          />{" "}
          calls / student / day
        </label>
        <button className="btn green" onClick={save}>Save limits</button>
        {status && <span className="meta" style={{ margin: 0 }}>{status}</span>}
      </div>
    </div>
  );
}
