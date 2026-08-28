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

  // NOTHING IDENTIFYING IS WRITTEN DOWN.
  //
  // This used to copy the name and email out of the token and store them on the
  // row, "for display only". That defeated the entire point: the subject is a
  // salted hash precisely so polyglot cannot tell who the student is, and a row
  // holding alice@school.org next to that hash tells anyone who reads it. We
  // were paying the cost of anonymisation and keeping none of the benefit.
  //
  // So the row gets a stable pseudonym derived from the hash, and no email at
  // all. The student is inside Pika, which already shows them their real name;
  // polyglot never needs it, and now never has it.
  const created = await prisma.user.create({
    data: {
      name: pseudonym(subject),
      email: null,
      role: "STUDENT",
      pikaSubject: subject,
    },
    select: { id: true },
  });
  return { userId: created.id, created: true };
}

// A friendly, stable label for a hashed subject — the same shape the
// account-free practice mode uses, so the two paths look alike on screen.
// Derived from the hash, so it never changes for the same student and cannot
// be turned back into anything.
const ADJ = ["Quiet", "Bright", "Steady", "Swift", "Clever", "Bold", "Calm", "Keen"];
const NOUN = ["Otter", "Falcon", "Fox", "Wren", "Lynx", "Heron", "Badger", "Comet"];
function pseudonym(subject: string): string {
  let h = 0;
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) >>> 0;
  return `${ADJ[h % ADJ.length]} ${NOUN[(h >> 5) % NOUN.length]} ${(h >> 10) % 900 + 100}`;
}
