# What actually earns a yes from the teacher

Armor's four questions (evaluation, cost, coverage, UI/UX) were the right due-diligence
questions for a **technical evaluator** deciding whether this is well-built. They're
answered, and the answers hold up (see the addendum at the bottom — coverage moved from
1/15 to 3/15 lessons since they were first asked).

But a **teacher** deciding whether to put his own name behind recommending something to
his students is answering a different question underneath those four: *not* "is this
well-engineered," but **"can I trust this enough to say it out loud to a class, for
basically zero cost to me, with nothing that can blow up in my face."** That's the actual
gate. Below is what that gate needs, most of which hasn't been said out loud yet.

## 1. It costs him nothing — say this explicitly, don't make him infer it

No account for him to create. No roster to import. No gradebook to reconcile, because
there's nothing to grade — it's not an assignment, it's a resource. He doesn't maintain
it, doesn't configure it, doesn't get a support ticket when a student can't log in
(there's no login). The entire teacher-facing surface of this recommendation is: **one
link, mentioned once.** That needs to be the first thing he hears, not something he
figures out three questions in.

## 2. The AI guardrails, spelled out plainly — this is what a wary teacher actually checks

He's not going to read the code. He needs the plain-English version of "why won't this
embarrass me":

- The AI tutor is built to **never give a full answer** — one guiding hint, always, even
  if asked directly. That rule lives in the system prompt itself, not a suggestion.
- **95% of grading has no AI in it at all** — it's the real Java compiler, or an exact
  match, deciding right/wrong. There's very little surface area for an AI to say
  something wrong, because for most of the experience there's no AI in the loop.
- Where AI *is* the judge (one narrow step type, rarely used so far), it degrades to a
  plain canned answer if it's unavailable — it never blocks a student or fails silently.
- **Nothing is collected.** No name, no email, no answer tied to a real identity. There is
  nothing here that becomes a FERPA conversation, because there's no data to be a
  conversation about.

## 3. Be honest about what's unproven — and say why that's a feature, not a gap

The one thing that would genuinely hurt: overselling. He's watched a tool (his own) look
good on paper and not hold up with real kids. The credible move is to tell him exactly
where the evidence stops:

- Every code snippet in every lesson has been **compiled and run against the real Java
  compiler** — that part isn't a claim, it's mechanically checked, every time.
- What hasn't happened yet: **a real student who isn't in on the project clicking through
  it cold.** Say that directly. A teacher trusts "here's exactly what we know and don't
  know" far more than confidence.
- The ask that follows naturally from this: **let a handful of his students be that first
  real test**, with the explicit framing "tell us where it's bad" — which also, quietly,
  gives him zero risk, because "try this experimental thing and tell us what's wrong with
  it" is a completely different, much safer ask than "I'm recommending this because it
  works."

## 4. "What happens if you get busy and stop maintaining this"

A fair, unasked question. The honest answer is actually reassuring: because grading is
compiler-and-exact-match for almost everything, **a frozen, unmaintained snapshot of this
still works correctly forever** — it doesn't rot the way a tool with live human grading or
a live subscription would. Nothing breaks if development slows down; it just stops
growing. Worth saying plainly rather than making a commitment that might not be kept.

## 5. Pika — frame this as *next to*, not *instead of*

He built pika. Whatever its real problems, it's his, and it's presumably still the actual
system-of-record for grades and assignments this semester. The tactful and accurate frame:
**this doesn't touch anything pika does — it's optional extra practice, the same category
as recommending a textbook website.** Nothing here proposes replacing pika; that's a much
bigger, much later conversation, if it's ever the right one at all. Don't lead with "pika
is bad" — lead with "this is a free, separate thing for kids who want more reps."

## 6. The actual ask — say it in this shape, not a bigger one

> "This doesn't need you to do anything — no signup, no grading, nothing tied to your
> class. If a few students want extra Java practice, would you be willing to just mention
> the link, the same way you'd mention any free practice site? That's genuinely the whole
> ask."

If he says yes to *that* specifically — not to "adopt this," not to "evaluate this
formally" — that's the opening. Everything bigger (pika integration, more lessons, wider
rollout) is a conversation for after there's real usage to point to, not before.

---

## Addendum — updated technical answers (for armor / anyone doing due diligence)

- **Coverage**: now **3 of 15 lessons** fully interactive (2.1 Printing, 2.2 Variables and
  Types, 2.4 Arithmetic Expressions), up from 1 when first asked. Each one compiler-verified
  and independently pedagogy-reviewed against the same bar.
- **Cost**: unchanged from the corrected estimate — ≈$0.04–0.08/student/semester with
  reasoning-token capping applied, ≈$4–8 for 100 students, ≈$6–12 for 150.
- **Evaluation**: unchanged — ~95% deterministic (compiler/exact-match), one AI-judged step
  type with a non-AI fallback.
- **UI/UX**: still genuinely blocked on seeing pika's actual design system — nothing to
  report until that happens.

## Open unknowns (can't answer without more info — not blocking, just honest)

- Is the teacher the sole decision-maker here, or does "bringing it to pika" mean a
  broader team (armor and others) actually decides? Changes who the ask above is really for.
- What pika actually is (stack, design system) — still needed before UI/UX can be answered
  for real, or before "native in pika" can be scoped honestly.
