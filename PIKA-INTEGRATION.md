# classOS inside Pika

How classOS becomes a tab in Pika: shared student, matched art style, lesson
scores in Pika's gradebook.

**The shape is copied from Pal on purpose.** Pika already embeds a second
service this exact way, in `src/integrations/pal/`. Copying a pattern the
teacher designed, documented and shipped is cheaper than proposing a new one,
and it is the pattern he will review fastest.

---

## Decisions taken

| Question | Answer |
| --- | --- |
| Integration shape | Minimal port between two services, Pal-style. classOS stays its own deploy. |
| Identity | Pika owns it outright. classOS keeps no account system on this path — no login, no password, no join code. |
| First slice | Full: lesson results reach Pika's gradebook as assignment grades. |
| Art style | Theme boundary. Pika supplies semantic tokens, classOS keeps its layout. |

**One tension, named.** "Minimal port" and "gradable assignments" pull against
each other — grading needs scores crossing the boundary, which is more than
account and basic info. Resolved by keeping the *contract* small (identity in,
results out; two directions, four endpoints) and shipping it in three steps so
each one can break separately.

---

## Why not one repo

Recorded here because it will be asked again.

| | Pika | classOS |
| --- | --- | --- |
| Next | 14.2 | 15.1 |
| React | 18.3 | **19** |
| Data | Supabase, 132 migrations | Prisma + Neon |
| Auth | WorkOS AuthKit + iron-session | own scrypt sessions |

A single repo means resolving two framework majors, rewriting every Prisma call
onto Supabase, moving auth to WorkOS, and passing Pika's architecture,
design-policy, UI-policy, E2E and canary gates. The Pal pattern needs none of
that, and it surfaces the integration problems *sooner* — which is the stated
reason for going early.

---

## Who builds which half

**This matters before any work is scheduled.**

`codepetca/pika` reports `push: false, admin: false` for this account, and
`@codepet` is the teacher's npm scope. So:

| Half | Owner | Notes |
| --- | --- | --- |
| classOS API, token verification, identity linking, results feed | us | Fully unblocked. |
| Theme bridge variables consumed by classOS | us | We define the names; Pika supplies values. |
| The widget package | us to write, **teacher to publish** | Cannot publish under `@codepet`. Either he publishes, or it ships under our own scope, or Pika vendors it. |
| Pika's read-token route, tab, feature flag, gradebook write | **teacher** | Needs a PR from a fork, and his review. |

Nothing on the Pika side lands without him, but he is one text message away —
this is a dependency with a short turnaround, not a blocker. The asks are in
`docs/pika-ask.md`, written to be forwarded as-is.

---

## The contract

Mirrors `pal/docs/integration.md`, endpoint for endpoint.

### 1. Registration

The teacher registers classOS once and gets a shared `secret`. classOS stores it
as `PIKA_INTEGRATION_SECRET`. **The secret never leaves either backend.**

### 2. Student identity

Pika hashes student ids before sending, exactly as it does for Pal:

```
SHA256(salt + raw_student_id)
```

classOS stores that hash on `User` as `pikaSubject` (unique). The raw Pika user
id is never persisted.

### 3. Read token — Pika mints, classOS verifies

Pika adds `POST /api/student/classos/read-token`, same-origin, cookie-authed,
mirroring its existing Pal route. It returns:

```json
{ "token": "<jwt>", "expires_at": "2026-08-24T09:40:00.000Z" }
```

Token rules, taken from Pal's client so the caching code is identical:

- **Five minutes**, and never more than ten.
- 30s clock-skew allowance, 30s refresh buffer.
- Claims: `sub` (the hashed subject), `classroom` (Pika classroom id), `email`,
  `name`, `role`, `iat`, `exp`, `aud: "classos"`, `iss: "pika"`.
- Signed HS256 with the shared secret.

classOS verifies signature, `aud`, `iss` and `exp` on every request. A token is
a read credential for one student, nothing more.

### 4. Identity — Pika owns it outright

classOS has **no account system** on this path. No login, no password, no join
code, no session. The only way in is a valid Pika token.

On a valid token:

1. Find the row with that `pikaSubject`. If it exists, use it.
2. Otherwise create one, copying `name` and `email` for display only.

That row is not an account. It exists because `Progress` needs something to
point at. classOS never authenticates against it.

**No linking, no backfill, no migration.** Every account currently on classOS is
the owner's own testing, so there is nothing to preserve. An earlier draft of
this document specified matching by email to rescue existing progress, and
flagged that 53 of 55 students had no email — both are moot. That branch has
been deleted rather than left in to mis-fire later.

`User.email` still carries a unique index from the old account system. Email is
decoration now, so a collision drops the email instead of failing the request.

### 5. Results out — three endpoints

```
GET  /api/pika/v1/student/summary     what the widget renders
GET  /api/pika/v1/student/results     lesson results for the gradebook
POST /api/pika/v1/events              optional: Pika-side signals in
```

`results` returns, per lesson: student-facing code, title, status, score,
`completedAt`. Pika maps those onto its own assignments and writes its own
grades.

**Pika pulls; classOS does not push.** Pal's direction is the opposite because
Pika is the signal *source* there. Here classOS is the source, and pulling keeps
classOS from ever holding write credentials into Supabase. Smaller blast radius,
smaller port.

### 6. CORS

`CLASSOS_ALLOWED_WIDGET_ORIGINS`, exact origins only. Reject unknown origins
*before* verifying the token. Never a wildcard on a credentialed policy. Same
rule as `PAL_ALLOWED_WIDGET_ORIGINS`.

### 7. Theme bridge

Pika supplies a narrow set of semantic variables; classOS maps its palette onto
them and keeps its own layout.

```
--classos-bg  --classos-surface  --classos-ink  --classos-muted
--classos-line --classos-accent  --classos-ok   --classos-warn
--classos-font-sans --classos-font-mono
```

Two rules from Pal's boundary that we keep: the package accepts no Pika user
object and no raw student id, and Pika owns the container while classOS owns
its contents.

**Code is never restyled.** Snippets, the runner and program output stay in the
classOS mono treatment whatever Pika's tokens say. A student reading a compiler
error should see the same thing they will see everywhere else.

---

## Two modes, one codebase

classOS runs in two shapes and must keep doing so.

| | Embedded in Pika | Standalone |
| --- | --- | --- |
| Lives at | a tab inside Pika | `classos.arronwang.com` |
| Who the student is | Pika token | nobody — anonymous |
| Sign-in | none, Pika already did it | none, and none wanted |
| Progress | `Progress` rows keyed to the Pika subject | the browser, local only |
| Gradebook | pulled by Pika | none |

The standalone version stays open to anyone with the link and asks for nothing.
That is what it is for: a student, or a teacher evaluating it, can do a lesson
without an account existing anywhere.

**One deploy, not two.** `classos.arronwang.com` serves the standalone app *and*
hosts the `/api/pika/*` endpoints the embedded widget calls. This is exactly how
Pal does it — Pal runs on its own domain, and the tab inside Pika is a widget
talking to that domain. There is no second build, no forked codebase, and no
environment flag deciding which product this is. What differs is only how a
request arrives: with a Pika bearer token, or without one.

The consequence worth stating: **the current login, signup, password, join-code
and session code serves neither mode.** 45 route files still call
`currentUser()`, so it cannot be pulled out casually, but nothing new should be
built on it and it should come out once both modes are real.

---

## Build order

Three shippable steps. Each one can break on its own, which is the point of
going early.

1. **Identity.** Token verify, resolve the subject, `/summary`. A student opens
   the tab and sees their own lessons. Nothing writes back. Proves signing,
   CORS, identity and theming in one go.
2. **Results.** `/results` plus Pika's pull. Lesson scores appear in the
   gradebook.
3. **Polish.** Feature flag per classroom via Pika's existing
   `classroom_feature_visibility`, then the widget package.

Step 1 is the whole risk. If the token, the linking and the theme bridge work,
the rest is plumbing.

---

## Open, needs the teacher

1. Will he publish `@codepet/classos-widget`, or should it ship under our scope?
2. Does Pika expose a gradebook write path we can target, or does the pull need
   a new route on his side?
3. Which salt does he use for `SHA256(salt + raw_student_id)` — the same one as
   Pal, or a per-integration salt?
4. Is `classroom_feature_visibility` the right gate for a `lessons` tab, and
   does `ClassroomTabId` need a new member?
(No roster export needed. Identity comes from the token; nothing is migrated.)
