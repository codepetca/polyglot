# Handoff to whoever builds the Pika side

Written for the agent working in `codepetca/pika`. Everything below is
implemented and deployed on the classOS side unless it says otherwise.

**Keep this file current.** It is the contract, and a stale contract is worse
than none — if you change something here, change it here first.

- classOS lives at `https://classos.arronwang.com`, repo `arronwang01/lcl`.
- Last verified against production: 2026-08-25.

---

## 1. The read token — you mint, we verify

Add `POST /api/student/classos/read-token`, same-origin and cookie-authed. It is
the Pal one with a different audience.

```json
{ "token": "<jwt>", "expires_at": "2026-08-25T12:40:00.000Z" }
```

**HS256**, signed with the shared secret. Claims:

| Claim | Value |
| --- | --- |
| `sub` | `SHA256(salt + raw_student_id)` — never a raw Pika id |
| `classroom` | Pika classroom id |
| `email`, `name`, `role` | display only; classOS never authenticates on them |
| `iat`, `exp` | five minutes, ten maximum |
| `aud` | `"classos"` |
| `iss` | `"pika"` |

What we enforce, so you don't trip it:

- `alg` is pinned to HS256. `alg: none` and RS256 confusion both fail closed.
- 30s clock skew each way.
- **A token whose lifetime exceeds ten minutes is rejected even if the
  signature is good.** A long-lived token is a standing key, not a read token.
- The reason for a rejection is logged, never returned. Do not parse our error
  text.

Implementation: `lib/pika/jwt.ts` (pure), `lib/pika/token.ts` (env),
`scripts/pika-token-check.ts` (15 cases).

---

## 2. Identity

We resolve `sub` to a local row and create one on first sight. No password, no
session, no login. That row exists because progress needs something to point at.

**classOS roles are not derived from Pika.** A Pika student gets
`role: "STUDENT"`. The owner's own account has `role: "ADMIN"` and no
`pikaSubject`, and is untouched by any of this — he authors and reads stats
while teaching a different class.

---

## 3. Endpoints you can call

Bearer token on every request. Both are `GET`, both are read-only.

| Endpoint | Returns |
| --- | --- |
| `/api/pika/v1/student/summary` | units, lesson titles, per-lesson status — what a progress card renders |
| `/api/pika/v1/student/results` | per lesson: student-facing code, title, status, `score` 0–1, `completedAt` |

`score` is our `readiness`, 0–1. **`null` for a lesson never started** — do not
read that as zero. A lesson nobody reached is not a lesson failed, and turning
it into a 0 would tank a real grade.

**You pull; we never push.** classOS holds no Supabase credential and writes
nothing on your side. Smaller blast radius, and one fewer secret to rotate.

---

## 4. CORS

`CLASSOS_ALLOWED_WIDGET_ORIGINS` is an exact list. Send us every browser origin
Pika renders from, including previews if you want them to work. Unknown origins
are rejected **before** the token is verified, so the endpoint cannot be used as
an oracle for testing forged tokens.

---

## 5. The frame

Load `https://classos.arronwang.com/lessons/<code>?embed=pika`.

- `?embed=pika` is what puts us in embedded mode. We do **not** sniff
  `window.self !== window.top` — that is true of any embedding, and this decides
  what a student can click. The flag is kept in `sessionStorage` for the tab.
- In embedded mode our top bar keeps Notes, Reference, theme and reading
  settings, and drops the logo, Account and Sign out. The logo slot becomes
  **← Back to Pika**.
- **Third-party cookies are irrelevant to us.** Every AI and runner route
  authenticates from a cookie *or* a bearer token (`lib/actor.ts`), so in a
  frame we simply never use one. This is the thing that usually breaks an
  embed; it is already handled.

### postMessage

| Direction | Message | Meaning |
| --- | --- | --- |
| classOS → Pika | `{ type: "classos:back" }` | student pressed Back. Route them to the lessons tab. |
| Pika → classOS | `{ type: "classos:open", lesson: "6.3" }` | *(not implemented yet — tell us if you want it and we will add it)* |

If nobody is listening for `classos:back` we fall back to `history.back()`.

**The token should arrive by postMessage, not in the query string.** A URL
naming a student lands in history, server logs and the referer header.

---

## 6. Pal — what is settled and what is not

Nothing here is implemented yet; it is the shape we would build to.

**Works against your v1 contract as it stands.** A classOS lesson is a learning
item, so `learning_item.viewed` and `learning_item.completed` need no changes to
Pal — they earn the 75 XP and the on-time bonus, feed Weekly Rhythm, and
therefore drive the existing keepsake ladder. `learner_id` must be the opaque
hashed token, never a raw id.

**Not settled: admin-granted badges.** classOS can already create and award
them locally (`Badge`, `BadgeAward`, `/admin/badges`, recipients restricted to
students with a `pikaSubject`). They are meant to end up in Pal, with its claim
animation and its collection — but Pal's collection is *derived* from earned
Weekly Rhythms and the v1 contract has no event meaning "a person granted this".
That is a product decision for your side, not something to work around. Until it
is decided, awards sit in classOS and can be replayed.

---

## 7. Ground rules

- **classOS ships independently.** Own repo, own deploy, own release day.
  Nothing we ship runs inside your build, so nothing we ship can break Pika. The
  token contract is the only shared surface and changes only by agreement.
- **We never write to Supabase.**
- **We store no raw Pika ids** — only the hashed subject.
- If you need something from us, the fastest path is an issue on
  `arronwang01/lcl`.

---

## 8. Known gaps on our side

Honest list, so nobody discovers these late:

- `classos:open` deep-linking is not implemented.
- The progress-card widget for `today` / `achievements` is not built. The
  `/summary` endpoint it would render already exists.
- Nothing has been tested against a real Pika token — we have no secret yet.
  The verifier is tested against tokens we minted ourselves.
- The theme bridge (`--classos-*`) is specified in `PIKA-INTEGRATION.md` but not
  wired.
