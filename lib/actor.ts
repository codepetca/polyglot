import "server-only";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { verifyPikaToken, bearerFrom, PikaTokenError } from "@/lib/pika/token";
import { resolvePikaStudent } from "@/lib/pika/identity";

/**
 * Who is making this request, however they arrived.
 *
 * WHY THIS EXISTS. Every AI and runner route authenticated with currentUser(),
 * which reads a cookie session. That is fine while polyglot is its own site and
 * useless the moment it is a tab inside Pika: a student there carries a Pika
 * bearer token, has no polyglot cookie, and would be turned away by the very
 * features the tab exists to provide. A per-student AI limit that only counts
 * cookie sessions is, as the owner put it, pointless.
 *
 * Both paths end at the same User row — a Pika student is resolved to one by
 * pikaSubject (lib/pika/identity.ts) — so quotas, rate limits and the usage
 * dashboard count them identically without a second mechanism.
 *
 * ORDER: cookie first. It is a local read; token verification is HMAC plus a
 * lookup, and there is no reason to pay for it when someone is signed in here.
 */
export async function resolveActor(req: Request): Promise<User | null> {
  const session = await currentUser();
  if (session) return session;

  const token = bearerFrom(req);
  if (!token) return null;

  try {
    const claims = verifyPikaToken(token);
    const { userId } = await resolvePikaStudent(claims);
    return await prisma.user.findUnique({ where: { id: userId } });
  } catch (e) {
    console.warn("[actor] pika token rejected:", e instanceof PikaTokenError ? e.message : e);
    return null;
  }
}
