import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isInternalChapter } from "@/lib/curriculum/internal";
import { getBrand, getFeatureFlags } from "@/lib/settings";
import TryStep from "@/components/landing/TryStep";
import PracticeButton from "@/components/PracticeButton";

// The public landing page — what a shared link actually opens.
//
// REWRITTEN TO SAY ONE THING. The previous version opened with an eyebrow, a
// headline, a paragraph, a playable step and a button, then four selling points
// and a list of every lesson in the course. Five messages competing above the
// fold and a wall below it. A page that says five things says none.
//
// So: one sentence, one real step you can answer without an account, one
// button. Everything else is below and short.
//
// The AI line is conditional. It was claiming a tutor that the switch in
// Admin → Settings may well have turned off, and a landing page that promises a
// feature the product does not currently have is the worst kind of stale.
//
// Counts still come from the database so the page cannot drift into
// overclaiming — but they are a sentence now, not a table of 57 rows.
export default async function Home() {
  const me = await currentUser();
  if (me) redirect(me.role === "STUDENT" ? "/lessons" : "/teacher");

  const [lessons, brand, flags] = await Promise.all([
    prisma.lesson.findMany({
      orderBy: [{ chapter: { order: "asc" } }, { order: "asc" }],
      select: { flow: true, chapter: { select: { title: true } } },
    }),
    getBrand(),
    getFeatureFlags(),
  ]);
  const visible = lessons.filter((l) => !isInternalChapter(l.chapter.title));
  const interactive = visible.filter((l) => (((l.flow as any)?.steps as unknown[]) || []).length > 0);
  const totalSteps = interactive.reduce((n, l) => n + (((l.flow as any).steps as unknown[]).length || 0), 0);
  const units = [...new Set(interactive.map((l) => l.chapter.title))];

  return (
    <div className="main landing">
      <p className="crumb">FREE · NO ACCOUNT</p>
      <h1>Learn Java by doing.</h1>
      <p className="lede">
        Every step is something you <b>do</b> — run real code, guess what it prints, fix what is broken. The
        explanation comes after you act, never as a wall of text before.
      </p>

      <TryStep />

      <div className="landgo">
        <PracticeButton />
      </div>

      <ul className="landfacts">
        <li>
          <b>Your code really runs.</b> Every <span className="mono">▶ Run</span> sends your Java to a real compiler
          and shows the real output, including the real error messages — which you will learn to read.
        </li>
        {flags.ai && (
          <li>
            <b>The AI hints, it does not answer.</b> Get stuck twice and a tutor offers <i>one</i> hint about your
            exact code. It will not hand over the solution.
          </li>
        )}
        <li>
          <b>Nothing to sign up for.</b> No name, no email, no school. Progress saves to this browser.{" "}
          <Link href="/privacy">What we store →</Link>
        </li>
        <li>
          <b>{interactive.length} lessons, {totalSteps} steps.</b> {units.join(" · ")}. Skip anything you already
          know, or go straight to the quiz and prove it.
        </li>
      </ul>

      <p className="landfoot">
        Built for intro Java and AP CSA. Free, self-hosted, and not affiliated with any school.{" "}
        <Link href="/login">Teacher sign-in</Link>
      </p>
      {brand !== "classOS" && <p className="landfoot">Running as {brand}, built on classOS.</p>}
    </div>
  );
}
