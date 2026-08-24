# What classOS needs from Pika

Forward this as-is. Written to be answerable without reading the classOS repo.

---

## The short version

classOS is the Java course — lessons, a code runner, progress. I want it to be a
tab in Pika, using Pika accounts, with lesson results landing in the gradebook.
I do **not** want to move it into the pika repo.

I'm copying the Pal integration exactly: classOS stays on its own domain, Pika
mints a short-lived read token, a widget in Pika calls classOS with it. Same
shape as `src/integrations/pal/`, same token rules as
`/api/student/pal/read-token`.

The classOS half is already built and tested. What I need is the Pika half.

---

## Questions

**1. Can I register classOS as an integration and get a shared secret?**
Same as Pal's — I verify HS256 against it. It never leaves my backend.

**2. Which salt do you use for `SHA256(salt + raw_student_id)`?**
Pal's docs say integrations hash student ids before sending. I want to store the
same hash, never a raw Pika user id. Same salt as Pal, or a per-integration one?

**3. Will you publish the widget under `@codepet`, or should I use my own scope?**
I'll write the package. I can't publish to `@codepet`. Either you publish it,
Pika vendors the source, or it ships as `@arronwang/classos-widget`.

**4. Is `classroom_feature_visibility` the right gate for a `lessons` tab?**
Looks like `ClassroomTabId` would need a new member and `TAB_FEATURES` a new
entry. Fine by you?

**5. How should lesson results reach the gradebook?**
classOS exposes `GET /api/pika/v1/student/results` — per lesson: code, title,
status, score 0..1, completedAt. I'd rather Pika **pull** that than have classOS
push, so classOS never holds a Supabase credential. Does Pika have a path for
that, or does it need a new route on your side?

---

## What you'd be adding, roughly

1. `POST /api/student/classos/read-token` — a copy of the Pal one, `aud:
   "classos"`, five minutes.
2. A `lessons` tab that mounts the widget, gated by feature visibility.
3. Whatever maps `/results` onto assignments and grades.

## What's already done on my side

- HS256 verification, algorithm pinned. 15-case attack suite passing,
  including `alg:none` and RS256 confusion.
- Origin allowlist checked before token verification, no wildcard CORS.
- `GET /api/pika/v1/student/summary` and `/results`.
- Identity: no classOS account system on this path. Pika authenticates; classOS
  keeps one row keyed by the hashed subject so progress has somewhere to live.

## What I need from you to switch it on

- the shared secret
- the salt
- the exact browser origin(s) Pika renders from, for the allowlist
