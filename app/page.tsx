import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getBrand } from "@/lib/settings";
import PracticeButton from "@/components/PracticeButton";

// The public landing page.
//
// ONE LINE AND ONE BUTTON. Two rewrites ago this had an eyebrow, a headline, a
// paragraph, a playable step, a button, four selling points and a table of all
// 57 lessons. Trimming it to four points was still four points. The page's only
// job is to get somebody into a lesson, and every extra element is a chance to
// decide not to. Whatever the product is, it argues for itself one screen later
// — the walkthrough there does the explaining now.
export default async function Home() {
  const me = await currentUser();
  if (me) redirect(me.role === "STUDENT" ? "/lessons" : "/teacher");
  const brand = await getBrand();

  return (
    <div className="main landing">
      <h1>Learn Java by doing.</h1>
      <p className="lede">Run real code, guess what it prints, fix what is broken. No account needed.</p>

      <div className="landgo">
        <PracticeButton />
      </div>

      <p className="landfoot">
        Free and self-hosted, for intro Java and AP CSA.{" "}
        <Link href="/privacy">Privacy</Link> · <Link href="/login">Teacher sign-in</Link>
        {brand !== "polyglot" && <> · {brand} is built on polyglot</>}
      </p>
    </div>
  );
}
