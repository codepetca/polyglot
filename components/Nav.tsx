"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import ProfileMenu from "./ProfileMenu";
import { useEffect, useState } from "react";
import { readEmbed, backToHost } from "@/lib/embed";
import ReportButton from "./student/ReportButton";

type MiniUser = { id: string; name: string; role: string; className?: string | null; avatar?: string | null; anonymous?: boolean };

export default function Nav({ me, cost, unread = 0 }: { me: MiniUser | null; cost: { total: number; calls: number } | null; unread?: number }) {
  const path = usePathname();
  const router = useRouter();
  // Inside Pika the bar stays — it carries Notes, Reference, theme and the ESL
  // switch, all of which a student wants mid-lesson. Only the half Pika already
  // owns is swapped out. See lib/embed.ts.
  const [embed, setEmbed] = useState<"" | "pika">("");
  useEffect(() => setEmbed(readEmbed()), []);
  const on = (p: string) => (path === p || path.startsWith(p + "/") ? "on" : "");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="topbar">
      {embed ? (
        // The way back lives in the bar rather than in a strip of its own, so
        // there is still only one bar on screen.
        <button className="backhost" onClick={backToHost}>
          <span aria-hidden>←</span> Back to Pika
        </button>
      ) : (
        <>
          <Link href="/" className="logo">
            class<em>OS</em>
          </Link>
          <div className="proto">SELF-HOSTED</div>
        </>
      )}
      <div className="spacer" />
      {me ? (
        <>
          {cost && (
            <div className="costbadge">
              AI cost: ${cost.total.toFixed(5)} · {cost.calls} calls
            </div>
          )}
          <nav className="viewswitch">
            {me.role === "STUDENT" ? (
              <>
                <Link href="/lessons" className={on("/lessons")}>My lessons</Link>
                {/* A guest has no class, so tests and grades are always empty
                    pages — offering them is just two more things to misread. */}
                {!me.anonymous && (
                  <>
                    <Link href="/tests" className={on("/tests")}>My tests</Link>
                    <Link href="/gradebook" className={on("/gradebook")}>My grades</Link>
                  </>
                )}
              </>
            ) : (
              <Link href="/class" className={on("/class") || on("/teacher") || on("/tests") || on("/gradebook")}>Classes</Link>
            )}
            <Link href="/notes" className={on("/notes")}>Notes</Link>
            {/* Reference needs no account and no class, so it sits beside Notes
                for everyone rather than behind a role check. */}
            <Link href="/docs" className={on("/docs")}>Reference</Link>
            {me.role === "ADMIN" && (
              <>
                <Link href="/admin/editor" className={on("/admin/editor")}>Editor</Link>
                <Link href="/admin/skills" className={on("/admin/skills")}>Skills</Link>
                <Link href="/admin/translate" className={on("/admin/translate")}>Translate</Link>
                <Link href="/admin/badges" className={on("/admin/badges")}>Badges</Link>
                <Link href="/admin/reach" className={on("/admin/reach")}>Reach</Link>
                <Link href="/admin/usage" className={on("/admin/usage")}>Usage</Link>
                <Link href="/admin/settings" className={on("/admin/settings")}>Settings</Link>
              </>
            )}
          </nav>
          {!me.anonymous && (
            <Link href="/inbox" className={`tbtn inbox-link ${on("/inbox")}`} style={{ textDecoration: "none", position: "relative" }}>
              ✉ Replies
              {unread > 0 && <span className="navbadge">{unread}</span>}
            </Link>
          )}
          {/* Always visible, on every page, saying what it does. The inbox
              already allowed a student to message an admin and nobody would
              ever have found it. */}
          <ReportButton />
          <ThemeToggle />
          <ProfileMenu me={me} onSignOut={logout} embed={embed} />
        </>
      ) : (
        <nav className="viewswitch">
          <ThemeToggle />
          <Link href="/join" className={on("/join")}>
            Join class
          </Link>
          <Link href="/login" className={on("/login")}>
            Staff sign-in
          </Link>
        </nav>
      )}
    </div>
  );
}
