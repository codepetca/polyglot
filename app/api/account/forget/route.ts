import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser, endSession } from "@/lib/auth";

// Self-service delete for anonymous practice sessions (STUDENT, no email —
// see app/api/auth/practice/route.ts). Scoped to anonymous accounts only:
// a real registered student's record belongs to their class/teacher too, so
// this deliberately does NOT touch that flow. Deletes every row tied to the
// session's id, then the session itself — nothing is soft-deleted or kept.
export async function POST() {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  // WHO MAY ERASE THEMSELVES.
  //
  // The rule used to be "students with no email", which sounded like it meant
  // anonymous practice sessions and actually meant something worse: a Pika
  // student had an email written onto their row at first sight, so this refused
  // every single one of them. The people with the least account here had the
  // least ability to leave.
  //
  // Now: anyone whose record exists only for their own progress may delete it.
  // That is an anonymous practice session, or a Pika student — Pika owns their
  // identity and can erase them there, but their classOS rows are theirs.
  //
  // A student who joined a class with a real email is still excluded, because
  // that record belongs to their teacher's gradebook as well as to them, and
  // unilaterally deleting half of somebody's marks is a different question.
  const selfOwned = me.role === "STUDENT" && (!me.email || !!me.pikaSubject);
  if (!selfOwned) {
    return NextResponse.json(
      { error: "Your record belongs to your class as well. Ask your teacher to remove it." },
      { status: 403 }
    );
  }

  await prisma.$transaction([
    prisma.event.deleteMany({ where: { userId: me.id } }),
    prisma.attempt.deleteMany({ where: { userId: me.id } }),
    prisma.progress.deleteMany({ where: { userId: me.id } }),
    prisma.studentInsight.deleteMany({ where: { userId: me.id } }),
    prisma.testSubmission.deleteMany({ where: { userId: me.id } }),
    prisma.evidence.deleteMany({ where: { userId: me.id } }),
    prisma.message.deleteMany({ where: { OR: [{ fromId: me.id }, { toId: me.id }] } }),
    prisma.user.delete({ where: { id: me.id } }),
  ]);
  await endSession();
  return NextResponse.json({ ok: true });
}
