import "server-only";
import { prisma } from "@/lib/db";
import type { PikaClaims } from "@/lib/pika/token";

// Resolving a Pika student to the row polyglot hangs their progress off.
//
// THIS IS NOT AN ACCOUNT SYSTEM. Pika owns identity: it authenticates, it holds
// the email and the name, it decides who is in which classroom. All polyglot
// keeps is a row keyed by the hashed subject, because Progress needs something
// to point at. No password, no session, no login screen, no way in except a
// valid Pika token.
//
// EARLIER VERSIONS OF THIS FILE linked to an existing polyglot account by email,
// to save progress made before the merge. That is gone: every account currently
// on polyglot is the owner's own testing, so there is nothing to preserve and no
// reason to carry a matching rule that can mis-fire. If real standalone
// progress ever needs importing, it comes back as a deliberate migration, not
// as a branch that runs on every request.

export type Resolved = { userId: string; created: boolean };

export async function resolvePikaStudent(claims: PikaClaims): Promise<Resolved> {
  const subject = claims.sub;

  const existing = await prisma.user.findFirst({
    where: { pikaSubject: subject },
    select: { id: true },
  });
  if (existing) return { userId: existing.id, created: false };

  // Email and name are copied for display only, and are whatever Pika last
  // said. polyglot never authenticates against either, so a change on Pika's
  // side is not a security event here.
  let email = (claims.email || "").trim().toLowerCase() || null;

  // User.email still carries a unique index from the old account system. Email
  // is now decoration, so a collision must never fail the request — drop it and
  // carry on. pikaSubject is the identifier that has to be unique.
  if (email) {
    const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (taken) email = null;
  }
  const created = await prisma.user.create({
    data: {
      name: claims.name?.trim() || email?.split("@")[0] || "Student",
      // Left null when Pika sends no email. The unique index is on
      // pikaSubject, which is the only identifier that matters.
      email,
      emailVerifiedAt: email ? new Date() : null,
      role: "STUDENT",
      pikaSubject: subject,
    },
    select: { id: true },
  });
  return { userId: created.id, created: true };
}
