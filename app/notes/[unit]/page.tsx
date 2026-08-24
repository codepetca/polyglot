import Link from "next/link";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { studentCode } from "@/lib/curriculum/codehs";

export const dynamic = "force-dynamic";

type Step = {
  id: string; kind: string; instruction?: string;
  body?: string[]; rules?: { text: string; example?: string }[];
  annotate?: { token: string; note: string }[];
  code?: string; output?: string; keypoint?: string;
  sides?: { label: string; code: string; output: string }[];
  columns?: string[]; rows?: string[][]; fillFrom?: number;
  facts?: { columns: string[]; rows: string[][] };
  pipeline?: { label: string; note?: string; kind?: string }[];
};

/**
 * The written lesson for a whole unit.
 *
 * GENERATED FROM THE LESSONS, deliberately. A study guide maintained by hand
 * drifts from what is actually taught within a week, and a student revising
 * from a stale guide is worse off than one revising from nothing. Everything
 * here — the explanations, the snippets, the outputs, the tables — is the same
 * data the lesson player renders, so the two cannot disagree.
 *
 * Only the teaching steps are included. Drills are practice, not reference.
 */
export default async function UnitNotes({ params }: { params: Promise<{ unit: string }> }) {
  const me = await currentUser();
  if (!me) redirect("/login");
  const { unit } = await params;

  const chapter = await prisma.chapter.findFirst({
    where: { order: Number(unit) - 1, title: { not: { startsWith: "__" } } },
    select: {
      title: true,
      lessons: { orderBy: { order: "asc" }, select: { code: true, title: true, objectives: true, flow: true } },
    },
  });
  if (!chapter) notFound();

  const lessons = chapter.lessons
    .map((l) => ({
      code: l.code,
      shown: studentCode(l.code),
      title: l.title,
      objectives: (l.objectives as string[] | null) || [],
      steps: ((((l.flow as any)?.steps as Step[]) || []).filter(
        (s) => s.kind === "teach" || s.kind === "compare" || s.kind === "table"
      )),
      points: (((l.flow as any)?.steps as Step[]) || []).map((s) => s.keypoint).filter(Boolean) as string[],
    }))
    .filter((l) => l.steps.length > 0);

  return (
    <main className="wrap notes guide">
      <header className="noteshead">
        <p className="meta"><Link href="/notes">← All notes</Link></p>
        <h1>{chapter.title}</h1>
        <p className="meta">The whole unit written out. {lessons.length} lessons.</p>
      </header>

      <nav className="guidetoc">
        {lessons.map((l) => (
          <a key={l.code} href={`#l-${l.code}`}><b>{l.shown}</b> {l.title}</a>
        ))}
      </nav>

      {lessons.map((l) => (
        <section className="guidelesson" key={l.code} id={`l-${l.code}`}>
          <h2><span className="notecode">{l.shown}</span> {l.title}</h2>
          {l.objectives.length > 0 && (
            <ul className="guideobj">{l.objectives.map((o, j) => <li key={j}>{o}</li>)}</ul>
          )}

          {l.steps.map((s, si) => (
            <div className="guideblock" key={si}>
              {s.instruction && <h3>{s.instruction}</h3>}
              {(s.body || []).map((b, j) => <p key={j}>{b}</p>)}

              {(s.rules || []).length > 0 && (
                <ol className="rulelist">
                  {(s.rules || []).map((r, j) => (
                    <li key={j}>
                      <span className="rl-t">{r.text}</span>
                      {r.example ? <code className="rl-e">{r.example}</code> : null}
                    </li>
                  ))}
                </ol>
              )}

              {s.code && (s.annotate || []).length > 0 ? (
                <div className="flowcode ro anncode">
                  {s.code.split("\n").map((ln, li) => {
                    const marks = (s.annotate || [])
                      .map((a) => ({ ...a, col: ln.indexOf(a.token) }))
                      .filter((a) => a.col >= 0)
                      .sort((x, y) => x.col - y.col);
                    return (
                      <div key={li}>
                        <div className="annline">{ln || " "}</div>
                        {marks.map((m, mi) => (
                          <div className="annrow" key={mi}>
                            <span className="annpad" style={{ width: `${m.col}ch` }} />
                            <span className="anntick">└─</span>
                            <span className="annnote">{m.note}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : s.code ? (
                <pre className="flowcode ro">{s.code}</pre>
              ) : null}

              {s.output !== undefined && (
                <div className="flowout"><div className="lbl">WHAT IT PRINTS</div><pre>{s.output || "(nothing)"}</pre></div>
              )}

              {(s.sides || []).length > 0 && (
                <div className="cmp">
                  {(s.sides || []).map((sd, j) => (
                    <div className="cmpside" key={j}>
                      <div className="lbl">{sd.label}</div>
                      <pre className="flowcode ro">{sd.code}</pre>
                      <div className="flowout"><pre>{sd.output}</pre></div>
                    </div>
                  ))}
                </div>
              )}

              {(s.pipeline || []).length > 0 && (
                <div className="pipe">
                  {(s.pipeline || []).map((st, j) => (
                    <div className="pipestage" key={j}>
                      <div className={`pipebox pb-${st.kind || "tool"}`}>
                        <span className="pipelabel">{st.label}</span>
                        {st.note && <span className="pipenote">{st.note}</span>}
                      </div>
                      {j < (s.pipeline || []).length - 1 && <span className="pipearrow">↓</span>}
                    </div>
                  ))}
                </div>
              )}
              {s.facts && (
                <div className="guidetablewrap">
                  <table className="facts">
                    <thead><tr>{s.facts.columns.map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
                    <tbody>{s.facts.rows.map((r, ri) => (
                      <tr key={ri}>{r.map((c, ci) => <td key={ci}>{c}</td>)}</tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
              {(s.columns || []).length > 0 && (
                <div className="guidetablewrap">
                  <table className="guidetable">
                    <thead><tr>{(s.columns || []).map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
                    <tbody>
                      {(s.rows || []).map((r, ri) => (
                        <tr key={ri}>{r.map((c, ci) => (
                          <td key={ci} className={ci >= (s.fillFrom ?? 0) ? "ans" : ""}>{c}</td>
                        ))}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {l.points.length > 0 && (
            <aside className="guidepoints">
              <h4>Remember</h4>
              <ul>{l.points.map((p, j) => <li key={j}>{p}</li>)}</ul>
            </aside>
          )}
        </section>
      ))}
    </main>
  );
}
