import "server-only";
import { prisma } from "./db";
import type { User } from "@prisma/client";
import { getFeatureFlags } from "@/lib/settings";

// Who may message whom:
// - ADMIN ↔ anyone
// - TEACHER ↔ students in their own classes (+ any admin)
// - STUDENT ↔ the teacher of their class (+ any admin)
// This keeps students from DMing each other or teachers they don't have.

export async function allowedRecipients(me: User): Promise<{ id: string; name: string; role: string; sub?: string }[]> {
  if (me.role === "ADMIN") {
    const users = await prisma.user.findMany({ where: { id: { not: me.id } }, include: { class: true }, orderBy: [{ role: "asc" }, { name: "asc" }] });
    return users.map((u) => ({ id: u.id, name: u.name, role: u.role, sub: u.class?.name || u.email || undefined }));
  }
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  if (me.role === "TEACHER") {
    const classes = await prisma.class.findMany({ where: { teacherId: me.id }, include: { students: true } });
    const students = classes.flatMap((c) => c.students.map((s) => ({ id: s.id, name: s.name, role: "STUDENT", sub: c.name })));
    return [...students, ...admins.map((a) => ({ id: a.id, name: a.name, role: "ADMIN", sub: "admin" }))];
  }
  // STUDENT
  const recips: { id: string; name: string; role: string; sub?: string }[] = [];
  if (me.classId) {
    const cls = await prisma.class.findUnique({ where: { id: me.classId }, include: { teacher: true } });
    if (cls?.teacher) recips.push({ id: cls.teacher.id, name: cls.teacher.name, role: "TEACHER", sub: "your teacher" });
  }
  recips.push(...admins.map((a) => ({ id: a.id, name: a.name, role: "ADMIN", sub: "admin" })));
  return recips;
}

export async function canMessage(me: User, toId: string): Promise<boolean> {
  // The board's rule is about students, so it is enforced where the student is,
  // not across the whole product: staff still need to talk to each other about
  // a class. Hiding the button was never the control — this is.
  if (!(await getFeatureFlags()).chat && me.role === "STUDENT") return false;
  return (await allowedRecipients(me)).some((r) => r.id === toId);
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.message.count({ where: { toId: userId, readAt: null } });
}

/**
 * The person a student reports TO.
 *
 * Students never pick a recipient for a report. A contact list turns "tell the
 * person who built this" into "compose a DM", which is the framing we are
 * trying not to have — and it makes a student decide who is responsible for a
 * broken lesson, which is not their job.
 *
 * The oldest admin, so this is stable as accounts come and go rather than
 * depending on whoever was created most recently.
 */
export async function reportRecipient() {
  return prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
}
