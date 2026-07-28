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
  if (me.role !== "STUDENT" || me.email) {
    return NextResponse.json({ error: "this only applies to anonymous practice sessions" }, { status: 403 });
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
