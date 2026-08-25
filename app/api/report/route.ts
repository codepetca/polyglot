import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveActor } from "@/lib/actor";
import { reportRecipient } from "@/lib/messaging";
import { rateLimit } from "@/lib/ratelimit";
import { studentCode } from "@/lib/curriculum/codehs";

// "Tell the person who built this."
//
// SEPARATE FROM MESSAGES ON PURPOSE. A student reporting a broken lesson
// should not have to choose a recipient, know who is responsible, or think of
// it as writing to somebody. They press a button that says what it does, and
// it arrives as a message the admin can reply to.
//
// resolveActor, not currentUser, so this still works from inside Pika — a
// student there has a token and no cookie, and "report a problem" is exactly
// the feature you cannot afford to have quietly missing.

const KINDS: Record<string, string> = {
  language: "Language request",
  broken: "Something is broken",
  confusing: "This is confusing",
  idea: "Idea",
};

export async function POST(req: Request) {
  const me = await resolveActor(req);
  if (!me) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  // Generous, but enough to stop a stuck key filling the inbox.
  if (!rateLimit(`report:${me.id}`, 6, 5 * 60 * 1000)) {
    return NextResponse.json({ error: "You've sent a few already — give it five minutes." }, { status: 429 });
  }

  const { kind, body, lessonCode, code } = await req.json();
  const text = String(body || "").trim().slice(0, 4000);
  const label = KINDS[String(kind)] || "Feedback";
  if (!text) return NextResponse.json({ error: "Write a line or two first." }, { status: 400 });

  const admin = await reportRecipient();
  if (!admin) return NextResponse.json({ error: "No admin account to send to." }, { status: 500 });

  // Context the student should not have to type. A report that names the lesson
  // is actionable; one that says "the array thing is broken" is not.
  const parts = [`[${label}]`, text];
  if (lessonCode) parts.push(`\n— lesson ${studentCode(String(lessonCode))}`);
  if (typeof code === "string" && code.trim()) {
    parts.push(`\n— their scratchpad:\n${code.trim().slice(0, 1200)}`);
  }

  await prisma.message.create({
    data: {
      kind: "report",
      fromId: me.id,
      toId: admin.id,
      body: parts.join("\n"),
      lessonCode: lessonCode ? String(lessonCode) : null,
    },
  });

  return NextResponse.json({ ok: true, to: admin.name });
}
