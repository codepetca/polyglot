import "server-only";
import { verifyPikaTokenWith, PikaTokenError, type PikaClaims } from "@/lib/pika/jwt";

// The environment-facing half of Pika token verification. The actual checks are
// in lib/pika/jwt.ts, which takes the secret as an argument so it can be tested
// without a running server — see scripts/pika-token-check.ts.

export { PikaTokenError };
export type { PikaClaims };

/**
 * Verify a Pika read token and return its claims.
 *
 * Throws PikaTokenError for every failure, with a reason safe to log but never
 * safe to return to the caller — a verifier that explains which check failed is
 * a verifier that helps someone forge the next attempt.
 */
export function verifyPikaToken(token: string, now: number = Date.now()): PikaClaims {
  const secret = process.env.PIKA_INTEGRATION_SECRET || "";
  if (!secret) throw new PikaTokenError("PIKA_INTEGRATION_SECRET is not set");
  return verifyPikaTokenWith(token, secret, now);
}

/** Pull the bearer token off a request, or null. */
export function bearerFrom(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = /^Bearer (.+)$/.exec(h.trim());
  return m ? m[1] : null;
}
