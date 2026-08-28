import Link from "next/link";
import { getFeatureFlags } from "@/lib/settings";

export const metadata = { title: "Privacy — polyglot" };

// A real, specific statement — not boilerplate. Written to be true, checkable
// against the actual code, and readable by a student or a skeptical teacher.
export default async function PrivacyPage() {
  const { ai } = await getFeatureFlags();
  return (
    <div className="main" style={{ maxWidth: 680 }}>
      <div className="crumb">PRIVACY</div>
      <h1 className="title" style={{ marginBottom: 4 }}>What we collect, in plain terms</h1>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>Short version: no name, no email, nothing sold, nothing shared.</p>

      {/* ── The two-sentence version ──
          Asked for by name: something short enough to be read out in a meeting
          and specific enough to be checked afterwards. It has to track the AI
          switch, because with AI off the honest answer is much stronger and
          leaving the weaker one up would be a lie in our own favour. */}
      <blockquote className="privsum">
        {ai ? (
          <p>
            polyglot never asks for a name, an email or a school, so there is nothing on file to identify a student
            with — work is stored against a random session id and nothing else. The only thing that leaves this
            server is what a student types at the AI tutor, sent to Google&rsquo;s model together with the lesson text
            and their own code, and never with a name, because one was never collected.
          </p>
        ) : (
          <p>
            polyglot never asks for a name, an email or a school, so there is nothing on file to identify a student
            with — work is stored against a random session id and nothing else. No student text reaches any AI
            provider at all: the AI is switched off, and that is enforced at the single function every AI call in the
            product passes through, not by a page remembering to check.
          </p>
        )}
      </blockquote>

      <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "24px 0 8px" }}>How you get in</h2>
      <p>
        Practicing here doesn't need an account. One click makes a private session with a random name (like "Swift Otter
        482") — no email, no password, nothing that identifies you. That session lives in a browser cookie and nothing else.
      </p>

      <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "24px 0 8px" }}>What's recorded against that session</h2>
      <p>Which lessons you open, which answers you get right or wrong (including which wrong answer, so the practice can actually adapt), code you run, and questions you ask the AI tutor. All of it is tied only to your random session id — never to a real name, because we never collect one.</p>

      <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "24px 0 8px" }}>What we don't collect</h2>
      <p>No name, no email, no school, no birthdate. IP addresses are used only in-memory, for a few minutes, to stop abuse (rate limiting) — they're never written to the database.</p>

      <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "24px 0 8px" }}>The AI tutor</h2>
      {ai ? (
        <p>
          When you ask the tutor something, that question is sent to a third-party AI provider (Google Gemini or similar) to
          generate a reply — the same way any AI chat tool works. It's sent with your question and the current lesson's
          context, never with a name or email, because there isn't one to send.
        </p>
      ) : (
        <p>
          The AI tutor is switched off. Nothing you type — not a question, not your code, not an error message — is sent to
          any AI provider, and the tutor is not shown anywhere in the app. This is not a setting each page checks; every AI
          call in polyglot goes through one function, and that function has no paid provider to reach while the switch is off.
        </p>
      )}

      <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "24px 0 8px" }}>Deleting your data</h2>
      <p>
        Open <Link href="/progress" style={{ textDecoration: "underline" }}>My progress</Link> and use "Delete everything
        about this session" — it removes every row tied to your session immediately, not just hides it. There's no separate
        copy anywhere else to ask about, because there's no name attached to look one up by.
      </p>

      <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "24px 0 8px" }}>If your teacher gave you a class code instead</h2>
      <p>
        That's a different, opt-in path — it asks for a real email so your teacher can see your grades, same as any school
        tool. Everything above still applies to how the platform behaves; the difference is you've chosen to be identified
        to your own teacher, not to us.
      </p>

      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 30 }}>
        This page describes what the code actually does, not a legal template — if anything here looks wrong, it's a bug, tell us.
      </p>
    </div>
  );
}
