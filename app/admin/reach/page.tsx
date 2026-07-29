import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getAnalytics } from "@/lib/analytics";
import Forbidden from "@/components/Forbidden";

// "Is anyone actually using this?" — the one page that answers it, so the
// difference between "nobody came" and "they came and it was bad" is visible.
// Reads the existing Event log; collects nothing new.
export default async function ReachPage() {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (me.role !== "ADMIN") return <Forbidden need="Admin" />;

  const a = await getAnalytics(30);
  const t = a.totals;
  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
  const maxDaily = Math.max(1, ...a.daily.map((d) => d.learners));
  const interactive = a.funnels.filter((f) => f.interactive);

  return (
    <div className="main" style={{ maxWidth: 940 }}>
      <div className="crumb">ADMIN · REACH</div>
      <h1 className="title" style={{ marginBottom: 4 }}>Is anyone using it?</h1>
      <p style={{ color: "var(--muted)", marginTop: 0, maxWidth: "60ch" }}>
        Last {a.windowDays} days, from the event log. Anonymous learners only — no names exist to show.
      </p>

      {t.learners === 0 ? (
        <div className="panel" style={{ borderColor: "var(--violet)" }}>
          <b>No learners yet.</b>
          <p className="meta" style={{ marginTop: 6 }}>
            Nothing has gone wrong — nobody has opened it. This page becomes useful the moment one person does, so share the
            link before building more. That's the whole point of measuring first.
          </p>
        </div>
      ) : (
        <>
          <div className="kpis" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
            <div className="kpi"><div className="n"><em>{t.learners}</em></div><p>learners ever</p></div>
            <div className="kpi"><div className="n"><em>{t.activated}</em></div><p>did ≥1 step <span className="meta">({pct(t.activated, t.learners)}%)</span></p></div>
            <div className="kpi"><div className="n"><em>{t.returned}</em></div><p>came back another day <span className="meta">({pct(t.returned, t.learners)}%)</span></p></div>
            <div className="kpi"><div className="n"><em>{t.stepsDone}</em></div><p>steps completed</p></div>
          </div>

          <p className="meta" style={{ marginTop: 10 }}>
            {t.runs} code runs · {t.tutorAsks} tutor questions ·{" "}
            {a.quietSince === null ? "no activity recorded" : a.quietSince === 0 ? "someone was active today" : `quiet for ${a.quietSince} day(s)`}
          </p>

          <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "24px 0 8px" }}>Learners per day</h2>
          <div className="panel" style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
            {a.daily.map((d) => (
              <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }} title={`${d.day}: ${d.learners} learners, ${d.newLearners} new, ${d.steps} steps`}>
                <div style={{ width: "70%", background: "var(--accent)", borderRadius: "3px 3px 0 0", height: `${(d.learners / maxDaily) * 100}%`, minHeight: d.learners ? 3 : 0 }} />
              </div>
            ))}
          </div>
          <p className="meta">{a.daily[0]?.day} → {a.daily[a.daily.length - 1]?.day}</p>
        </>
      )}

      <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "26px 0 8px" }}>Where people quit</h2>
      <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 0 }}>
        Per interactive lesson: how many opened it, started it, and reached the end. The step bars show exactly where the
        cliff is — that's the step to rewrite.
      </p>
      {interactive.length === 0 && <div className="panel" style={{ color: "var(--muted)" }}>No interactive lessons yet.</div>}
      {interactive.map((f) => {
        const maxReach = Math.max(1, ...f.dropoff.map((d) => d.reached));
        return (
          <div className="panel" key={f.code} style={{ padding: "12px 18px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <Link href={`/lessons/${f.code}`} style={{ fontWeight: 600, textDecoration: "underline dotted var(--muted)" }}>
                {f.code} {f.title}
              </Link>
              <span style={{ flex: 1 }} />
              <span className="meta" style={{ margin: 0 }}>
                {f.viewers} opened · {f.starters} started · <b>{f.finishers} finished</b>
                {f.starters > 0 && ` (${pct(f.finishers, f.starters)}% of starters)`}
              </span>
            </div>
            {f.starters > 0 && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 46, marginTop: 8 }}>
                {f.dropoff.map((d, i) => (
                  <div key={d.stepId} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }} title={`step ${i + 1} (${d.kind}): ${d.reached} reached`}>
                    <div style={{ background: d.reached === 0 ? "var(--line)" : "var(--accent)", height: `${Math.max(4, (d.reached / maxReach) * 100)}%`, borderRadius: "3px 3px 0 0" }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {a.hardestSteps.length > 0 && (
        <>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "26px 0 8px" }}>Hardest steps</h2>
          <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 0 }}>
            Most tries per learner. High numbers mean either a genuinely hard idea or a badly-worded step — worth reading
            the step to tell which.
          </p>
          <div className="dashgrid"><table>
            <thead><tr><th>Lesson</th><th>Step</th><th>Kind</th><th>Avg tries</th><th>First-try</th></tr></thead>
            <tbody>
              {a.hardestSteps.map((s) => (
                <tr key={`${s.lesson}-${s.stepId}`}>
                  <td className="name">{s.lesson}</td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{s.stepId}</td>
                  <td>{s.kind}</td>
                  <td><b>{s.attempts}</b></td>
                  <td>{s.firstTryRate === null ? "—" : `${Math.round(s.firstTryRate * 100)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </>
      )}
    </div>
  );
}
