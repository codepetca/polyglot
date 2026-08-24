// Attack suite for the Pika read-token verifier.
//
// This sits on an authentication boundary: a token that verifies is a token
// that reads a named student's record. The two cases worth the most here are
// alg:none and alg confusion (RS256), the standard ways a hand-rolled JWT
// check gets walked through. Run it after touching lib/pika/jwt.ts.
//
//   npx tsx scripts/pika-token-check.ts

import { createHmac } from "node:crypto";
import { verifyPikaTokenWith } from "../lib/pika/jwt";

const SECRET = "test-secret-value";

const verify = (t: string) => verifyPikaTokenWith(t, SECRET);

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const sign = (h: object, p: object, secret = SECRET) => {
  const body = `${b64(h)}.${b64(p)}`;
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
};
const now = Math.floor(Date.now() / 1000);
const good = { sub: "abc123", email: "a@b.co", name: "Ada", classroom: "c1", iss: "pika", aud: "classos", iat: now, exp: now + 300 };
const H = { alg: "HS256", typ: "JWT" };

let pass = 0, fail = 0;
const check = (name: string, fn: () => void, wantThrow: boolean) => {
  let threw = false;
  try { fn(); } catch { threw = true; }
  const ok = threw === wantThrow;
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${name}`);
  ok ? pass++ : fail++;
};

check("valid token accepted", () => verify(sign(H, good)), false);
check("alg:none rejected", () => verify(`${b64({ alg: "none", typ: "JWT" })}.${b64(good)}.`), true);
check("alg:RS256 rejected", () => verify(sign({ alg: "RS256", typ: "JWT" }, good)), true);
check("wrong secret rejected", () => verify(sign(H, good, "other-secret")), true);
check("tampered payload rejected", () => {
  const t = sign(H, good).split(".");
  verify(`${t[0]}.${b64({ ...good, sub: "someone-else" })}.${t[2]}`);
}, true);
check("expired rejected", () => verify(sign(H, { ...good, iat: now - 600, exp: now - 60 })), true);
check("issued-in-future rejected", () => verify(sign(H, { ...good, iat: now + 600, exp: now + 900 })), true);
check("lifetime > 10min rejected", () => verify(sign(H, { ...good, exp: now + 3600 })), true);
check("wrong aud rejected", () => verify(sign(H, { ...good, aud: "pal" })), true);
check("wrong iss rejected", () => verify(sign(H, { ...good, iss: "evil" })), true);
check("no subject rejected", () => verify(sign(H, { ...good, sub: "" })), true);
check("30s skew tolerated", () => verify(sign(H, { ...good, iat: now - 310, exp: now - 10 })), false);
check("garbage rejected", () => verify("not.a.token"), true);
check("empty rejected", () => verify(""), true);

const claims = verify(sign(H, good));
check("claims survive", () => { if (claims.sub !== "abc123" || claims.email !== "a@b.co") throw new Error("x"); }, false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
