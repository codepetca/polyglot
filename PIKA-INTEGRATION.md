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
| Identity | Pika owns it. classOS links by email — **but see 4a: 53 of 55 students have no email**, so a backfill has to come first. |
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

Nothing on the Pika side lands without him. Plan the classOS half as real work
and the Pika half as a proposal.

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

### 4. Identity linking, by email

On first request bearing a valid token:

1. Find a `User` by `pikaSubject`. If found, use it. Done.
2. Otherwise find a `User` by the token's `email`. If found, set its
   `pikaSubject` and use it. **This is the step that saves existing progress.**
3. Otherwise create a `User` with that email, name and `pikaSubject`.

Two edge cases that will otherwise bite:

- **Email reuse.** If a matched account already has a *different*
  `pikaSubject`, do not steal it. Fail closed and log — that is either a
  recycled school address or an attack. Implemented and tested.
- **Null emails — and this one is not hypothetical.** Measured against
  production on 2026-08-24:

  | Role | Accounts | No email |
  | --- | --- | --- |
  | STUDENT | 55 | **53** |
  | TEACHER | 3 | 0 |
  | ADMIN | 1 | 0 |

  **53 of 55 students cannot be matched by email.** They were created by
  join-code, which never collected one. Ship link-by-email as it stands and 96%
  of the student body starts from zero with their progress orphaned.

### 4a. So email alone is not enough

Linking has to be solved before step 1 ships. Three options, cheapest first:

1. **Backfill from Pika's roster.** Pika already holds a roster with real
   emails, uploaded by CSV. Match classOS join-code accounts to it by name
   within a classroom, have the teacher approve the mapping once, write the
   emails in. One-off, done before launch, and after it the email path works
   for everyone.
2. **A one-time claim screen.** On first entry from the Pika tab, an unmatched
   student is shown the join-code accounts in their classroom and picks their
   own. Needs the teacher to confirm, or it is an invitation to grab someone
   else's record.
3. **Accept the loss** for the 53 and start them fresh. Only reasonable if
   those accounts are test data.

Option 1 is the recommendation: it is a migration, not a permanent code path,
and it leaves the running system with one linking rule instead of two.

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

## Build order

Three shippable steps. Each one can break on its own, which is the point of
going early.

0. **Backfill emails** onto the 53 join-code accounts, from Pika's roster.
   Blocks everything below — see 4a.
1. **Identity.** Token verify, link by email, `/summary`. A student opens the
   tab and sees their own lessons. Nothing writes back. Proves signing, CORS,
   linking and theming in one go.
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
5. **Can he export the Pika roster (name, email, classroom) so the 53
   join-code accounts can be backfilled?** This blocks step 1.
