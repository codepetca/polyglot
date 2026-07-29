import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isInternalChapter } from "@/lib/curriculum/internal";
import TryStep from "@/components/landing/TryStep";
import PracticeButton from "@/components/PracticeButton";

// The public landing page — this is what a shared link actually opens.
//
// It used to redirect straight to /join, a bare sign-in card, which told a cold
// visitor nothing and asked for a click on faith. The job here is: say what this
// is, let them TRY a real step before committing to anything, and be honest
// about how much content exists. Counts are read from the DB so the page can't
// drift into overclaiming as lessons are added.
export default async function Home() {
  const me = await currentUser();
  if (me) redirect(me.role === "STUDENT" ? "/lessons" : "/teacher");

  const lessons = await prisma.lesson.findMany({
    orderBy: [{ chapter: { order: "asc" } }, { order: "asc" }],
    select: { code: true, title: true, flow: true, chapter: { select: { title: true } } },
  });
  const visible = lessons.filter((l) => !isInternalChapter(l.chapter.title));
  const interactive = visible.filter((l) => (((l.flow as any)?.steps as unknown[]) || []).length > 0);
  const totalSteps = interactive.reduce((n, l) => n + (((l.flow as any).steps as unknown[]).length || 0), 0);

  return (
    <div className="main" style={{ maxWidth: 760 }}>
      <div className="crumb">FREE · NO ACCOUNT</div>
      <h1 className="title" style={{ fontSize: 34, marginBottom: 8, maxWidth: "24ch" }}>
        Learn Java by doing, not by reading.
      </h1>
      <p style={{ fontSize: 16.5, lineHeight: 1.55, maxWidth: "56ch", marginTop: 0 }}>
        Every step is something you <b>do</b> — run real code, guess what it prints, fix what's broken. Explanations show up
        after you act, never as a wall of text before.
      </p>

      <div style={{ margin: "22px 0" }}>
        <TryStep />
      </div>

      <div className="panel" style={{ padding: "18px 22px" }}>
        <PracticeButton />
      </div>

      <h2 style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "30px 0 10px" }}>Why it's different</h2>
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <b>Your code really runs.</b>{" "}
          <span>
            Every ▶ Run sends your Java to a real compiler and shows you the real output — including real error messages, which
            you'll learn to read.
          </span>
        </div>
        <div>
          <b>The AI helps, it doesn't answer.</b>{" "}
          <span>
            Get stuck twice and a tutor offers <i>one</i> hint about your exact code. It won't hand you the solution, because
            that isn't learning.
          </span>
        </div>
        <div>
          <b>Nothing to sign up for.</b>{" "}
          <span>
            No name, no email, no school. Your progress saves to this browser.{" "}
            <Link href="/privacy" style={{ textDecoration: "underline" }}>What we store →</Link>
          </span>
        </div>
        <div>
          <b>Already know some Java?</b>{" "}
          <span>Skip any step, or jump straight to the quiz and prove it — nobody makes you re-learn what you know.</span>
        </div>
      </div>

      <h2 style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "30px 0 10px" }}>What's in it right now</h2>
      <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 0 }}>
        Being straight with you: <b>{interactive.length} lessons</b> are the full interactive experience ({totalSteps} steps
        total). The other {visible.length - interactive.length} are written explanations with a quiz — still useful, not yet
        rebuilt. More are being converted.
      </p>
      <div className="panel" style={{ padding: "14px 18px" }}>
        {interactive.map((l) => (
          <div key={l.code} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "3px 0" }}>
            <span className="playmark">▶</span>
            <b style={{ fontSize: 14.5 }}>{l.code}</b>
            <span style={{ fontSize: 14.5 }}>{l.title}</span>
            <span style={{ flex: 1 }} />
            <span className="meta" style={{ margin: 0 }}>{((l.flow as any).steps as unknown[]).length} steps</span>
          </div>
        ))}
      </div>

      <p className="meta" style={{ marginTop: 24 }}>
        Built for intro Java / AP CSA. Free, self-hosted, and not affiliated with any school.{" "}
        <Link href="/login" style={{ textDecoration: "underline" }}>Teacher sign-in</Link>
      </p>
    </div>
  );
}
