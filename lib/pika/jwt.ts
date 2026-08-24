import { createHmac, timingSafeEqual } from "node:crypto";

// PURE verification for the short-lived read token Pika mints for one student.
//
// Split from token.ts so it can be exercised directly by
// scripts/pika-token-check.ts. It reads no environment and touches no request:
// the secret is an argument. Everything that needs the environment lives in
// token.ts behind `server-only`.
//
// SHAPE COPIED FROM PAL, deliberately. Pika already mints exactly this kind of
// token for @codepet/pal-widget at /api/student/pal/read-token: five minutes,
// 30s clock-skew allowance, 30s refresh buffer on the client. Matching it means
// Pika's existing caching client works against us unchanged, and the teacher
// reviews a pattern he wrote rather than one we invented. See
// PIKA-INTEGRATION.md.
//
// NO JWT LIBRARY. HS256 verification is a signature compare and three claim
// checks. A dependency here would be more code to audit than the code it
// replaces, and this sits directly on an authentication boundary.

/** Hard ceiling. Pal's client refuses anything longer, so nothing longer is useful. */
const MAX_LIFETIME_MS = 10 * 60 * 1000;
const CLOCK_SKEW_MS = 30 * 1000;

export type PikaClaims = {
  /** SHA256(salt + raw_student_id) — never the raw Pika user id. */
  sub: string;
  /** Pika classroom id this session is scoped to. */
  classroom?: string;
  email?: string;
  name?: string;
  role?: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
};

export class PikaTokenError extends Error {}

const b64urlToBuf = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

/** Constant-time compare that cannot throw on a length mismatch. */
function sameSignature(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Verify a Pika read token and return its claims.
 *
 * Throws PikaTokenError for every failure, with a reason safe to log but never
 * safe to return to the caller — a verifier that explains which check failed is
 * a verifier that helps someone forge the next attempt.
 */
export function verifyPikaTokenWith(token: string, secret: string, now: number = Date.now()): PikaClaims {
  if (!secret) throw new PikaTokenError("no signing secret supplied");
  // Pal caps the token it will even parse; an 8KB header is not a real token.
  if (!token || token.length > 8192) throw new PikaTokenError("token missing or absurdly long");

  const parts = token.split(".");
  if (parts.length !== 3) throw new PikaTokenError("not three segments");
  const [headerB64, payloadB64, sigB64] = parts;

  let header: { alg?: string; typ?: string };
  let claims: Partial<PikaClaims>;
  try {
    header = JSON.parse(b64urlToBuf(headerB64).toString("utf8"));
    claims = JSON.parse(b64urlToBuf(payloadB64).toString("utf8"));
  } catch {
    throw new PikaTokenError("header or payload is not JSON");
  }

  // Pin the algorithm. Accepting whatever `alg` says is the classic JWT hole:
  // "none" walks straight through, and RS256 lets a public key be used as an
  // HMAC secret. We only ever issue HS256, so only ever accept HS256.
  if (header.alg !== "HS256") throw new PikaTokenError(`unexpected alg ${header.alg}`);

  const expected = createHmac("sha256", secret).update(`${headerB64}.${payloadB64}`).digest();
  if (!sameSignature(expected, b64urlToBuf(sigB64))) throw new PikaTokenError("bad signature");

  if (claims.iss !== "pika") throw new PikaTokenError(`unexpected iss ${claims.iss}`);
  if (claims.aud !== "classos") throw new PikaTokenError(`unexpected aud ${claims.aud}`);
  if (typeof claims.sub !== "string" || !claims.sub) throw new PikaTokenError("no subject");
  if (typeof claims.exp !== "number" || typeof claims.iat !== "number") throw new PikaTokenError("no iat/exp");

  const expMs = claims.exp * 1000;
  const iatMs = claims.iat * 1000;
  if (expMs + CLOCK_SKEW_MS <= now) throw new PikaTokenError("expired");
  if (iatMs - CLOCK_SKEW_MS > now) throw new PikaTokenError("issued in the future");
  // A token minted with a long life is a standing key, not a read token. Refuse
  // it even though the signature is good.
  if (expMs - iatMs > MAX_LIFETIME_MS + CLOCK_SKEW_MS) throw new PikaTokenError("lifetime over ten minutes");

  return claims as PikaClaims;
}
