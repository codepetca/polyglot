import "server-only";
import { prisma } from "@/lib/db";
import type { PikaClaims } from "@/lib/pika/token";

// Resolving a Pika student to a classOS User.
//
// THE POINT OF THIS FILE is step 2: linking by email. classOS already has
// students with real progress on it. If a Pika-authenticated student does not
// match an existing account, they silently start from zero and every lesson
// they finished is orphaned. Matching on email is what makes the merge
// non-destructive, and it only gets one chance — once a duplicate is created,
// the two accounts are indistinguishable from a genuine pair of students.

export type Resolved =
  | { ok: true; userId: string; created: boolean; linked: boolean }
  | { ok: false; reason: "email-taken" | "no-identity" };

export async function resolvePikaStudent(claims: PikaClaims): Promise<Resolved> {
  const subject = claims.sub;
  const email = (claims.email || "").trim().toLowerCase() || null;

  // 1. Already linked. The common path after the first visit.
  const bySubject = await prisma.user.findFirst({
    where: { pikaSubject: subject },
    select: { id: true },
  });
  if (bySubject) return { ok: true, userId: bySubject.id, created: false, linked: false };

  // 2. Link an existing account by email. This is the step that saves progress.
  if (email) {
    const byEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true, pikaSubject: true },
    });
    if (byEmail) {
      // Already claimed by a DIFFERENT Pika student. Fail closed rather than
      // moving the link — that is either a recycled school address or someone
      // trying to inherit another student's record. Neither should be resolved
      // silently in favour of the newcomer.
      if (byEmail.pikaSubject && byEmail.pikaSubject !== subject) {
        return { ok: false, reason: "email-taken" };
      }
      await prisma.user.update({ where: { id: byEmail.id }, data: { pikaSubject: subject } });
      return { ok: true, userId: byEmail.id, created: false, linked: true };
    }
  }

  // 3. No email to match on and no existing link. A join-code account can have
  // a null email, so it can never be matched here — see PIKA-INTEGRATION.md,
  // those students restart unless emails are backfilled first.
  if (!email) return { ok: false, reason: "no-identity" };

  const created = await prisma.user.create({
    data: {
      name: claims.name?.trim() || email.split("@")[0],
      email,
      // Pika verified them. classOS never sees or stores a password for these.
      emailVerifiedAt: new Date(),
      role: "STUDENT",
      pikaSubject: subject,
    },
    select: { id: true },
  });
  return { ok: true, userId: created.id, created: true, linked: false };
}
