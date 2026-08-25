// Set a password on an existing account.
//
// WHY THIS EXISTS: there is no forgot-password flow, and Google sign-up is
// blocked while the OAuth app is unverified. So an owner who does not know
// their own admin password has no route back in at all. This is the route.
//
//   node --env-file=.env scripts/set-password.mjs you@example.com 'new-password'
//
// Quote the password so the shell does not eat characters like ! or $.
//
// Uses the SAME scrypt scheme as lib/auth.ts — salt:hash, scryptSync, 64 bytes.
// If that ever changes, this changes with it or logins silently stop working.
//
// It also clears failedLogins and lockedAt, because an account locked by
// repeated failures would still refuse the new password.
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("usage: node --env-file=.env scripts/set-password.mjs <email> '<password>'");
  process.exit(2);
}
if (password.length < 8) {
  console.error("✗ use at least 8 characters.");
  process.exit(2);
}

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(pw, stored) {
  const [salt, hash] = stored.split(":");
  const candidate = crypto.scryptSync(pw, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

// Same transport dance as scripts/flows.mjs: port 5432 is blocked on the
// owner's network, so fall through to Neon over HTTPS.
async function connect() {
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRawUnsafe("select 1");
    return { via: "postgres on 5432", q: (t, p = []) => prisma.$queryRawUnsafe(t, ...p), close: () => prisma.$disconnect() };
  } catch {
    await prisma.$disconnect().catch(() => {});
  }
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  await sql.query("select 1");
  return { via: "neon over https (5432 is blocked on this network)", q: (t, p = []) => sql.query(t, p), close: async () => {} };
}

const rows = (r) => (Array.isArray(r) ? r : r?.rows || []);

const db = await connect();
console.log(`· connected via ${db.via}\n`);
try {
  const found = rows(await db.q(`select id, name, role, "totpSecret" is not null as has_2fa from "User" where email = $1`, [email]));
  if (!found.length) {
    console.error(`✗ no account with email ${email}`);
    process.exit(1);
  }
  const u = found[0];

  const stored = hashPassword(password);
  if (!verifyPassword(password, stored)) {
    console.error("✗ the hash did not verify against its own password — refusing to write it.");
    process.exit(1);
  }

  await db.q(
    `update "User"
       set "passwordHash" = $1,
           "failedLogins" = 0,
           "lockedAt" = null,
           "emailVerifiedAt" = coalesce("emailVerifiedAt", now())
     where email = $2`,
    [stored, email],
  );

  const after = rows(await db.q(`select "passwordHash" from "User" where email = $1`, [email]))[0];
  const ok = after?.passwordHash && verifyPassword(password, after.passwordHash);

  console.log(`${ok ? "✓" : "✗"} ${u.name} (${u.role}) — password ${ok ? "set and verified" : "NOT set"}`);
  if (u.has_2fa) console.log("  note: this account has 2FA, so you will also need your authenticator code.");
  console.log("\n  Sign in at /login, then change it under Account.");
  process.exitCode = ok ? 0 : 1;
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
await db.close();
