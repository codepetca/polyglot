# polyglot + Pika — what I'm asking for

Short version: **polyglot becomes a tab in Pika. Pika owns the accounts. I keep
shipping lessons on my own schedule.** Almost all of the work is already done on
my side.

There is a clickable walkthrough if you'd rather see it than read it — ask me
for the link.

---

## What it looks like

Your left rail gets one more tab, **Java lessons**.

Opening it shows a short index built from your own cards — units, progress,
"continue where you left off". No polyglot chrome at all; it reads as part of
Pika because it is.

Clicking a lesson hands the whole screen to polyglot. Your rail goes away, my
top bar keeps one button that says **← Back to Pika**, and the lesson gets the
room it needs. You are never looking at two sets of navigation at once.

---

## What I need from you

Four small things, in rough order of how much they unblock:

1. **A `lessons` tab** — one entry in the list you already have, plus a key in
   `TAB_FEATURES` so it respects the per-classroom visibility you built.
2. **A read-token route** — `POST /api/student/classos/read-token`, a copy of
   the Pal one with `aud: "classos"`. Five minutes, HS256, subject is the
   hashed student id.
3. **A route with no rail**, so the lesson can fill the screen, and the frame
   that loads polyglot into it.
4. **A shared secret and salt**, and the exact browser origin Pika renders
   from, so I can allow it and nothing else.

That's it. No database work, no changes to how your accounts work, nothing that
touches attendance, assignments or the gradebook.

---

## What's already built on my side

- Token verification, algorithm pinned, 15 attack cases passing including the
  two standard JWT holes.
- Student identity. polyglot has **no account system** on this path — no login,
  no password, no join code. Your token is the only way in.
- A results feed at `GET /api/pika/v1/student/results`, so your gradebook can
  read lesson scores whenever it wants. polyglot never writes into Supabase and
  never holds a credential of yours.
- The embedded top bar, with Account and Sign out removed because those are
  yours to offer.
- An origin allowlist, checked before the token is even looked at.

---

## The bigger ask, and the one that needs a decision

**I'd like to hand out badges that land in Pal.**

Not XP — Pal already counts work properly and I don't want a second scoring
system next to a good one. I mean the things counting can't see: a student who
spots a bug in a lesson, or tells me the reference sheet was unreadable, or
helps somebody else. That's the behaviour I most want in a class and it earns
nothing today.

I've read the economy design. Pal's collection is **derived** — keepsakes
unlock from earned Weekly Rhythms through your pipeline — and the v1 contract
has six event types, none of which mean "a person decided this one deserved
something". So this is a real decision for you, not a config change, and I'm
not assuming the answer.

Two ways it could work, and I'm happy with either:

- A new event Pal accepts, that grants a specific collection item.
- Pal keeps sole control and I just send you the signal; you decide whether it
  becomes anything.

If the answer is no, that's fine and nothing else changes. I'll keep the badges
inside polyglot.

---

## What works today with no changes at all

A polyglot lesson is a **learning item**. I can send `learning_item.viewed` and
`learning_item.completed` against the existing v1 contract right now — which
earns the 75 XP and the on-time bonus you already defined, feeds Weekly Rhythm,
and therefore unlocks your existing keepsakes.

So the reward loop works from day one without you building anything. The badge
question is on top of that, not instead of it.

---

## Two things I want to be straight about

**I'll keep shipping.** polyglot stays its own repo and its own deploy, so I can
fix a lesson on a Tuesday without asking anyone. The only thing we both depend
on is the token contract, and that changes rarely and by agreement. Nothing I
ship can break Pika, because nothing I ship runs inside Pika's build.

**I need to stay an admin in polyglot.** I'll be in senior form, not in this
class, so "teacher of this classroom" won't describe me. polyglot roles aren't
derived from Pika — my account here is separate — so this already works. I just
want it said out loud rather than discovered later.

---

## Data and privacy — the short version

You will be asked about this, so here it is in plain terms.

**Pika keeps the students. polyglot never learns who they are.**

What crosses over is a scrambled id — `SHA256(salt + student id)`. It cannot be
reversed without your salt, which stays on your server. polyglot stores that
string and nothing else that identifies anybody. A name and email are sent only
so the screen can say hello, and nothing authenticates on them.

| | |
| --- | --- |
| Passwords on the polyglot side | **None.** There is no login on this path, so there is no credential to lose. |
| Writes into Pika's database | **None.** You pull results when you want them. I hold no credential of yours. |
| How long a pass lasts | Five minutes, signed, for one student. Anything longer is refused outright. |
| Who else can call it | Only browser origins you name. Everything else is refused before the pass is even read. |

**What the AI sees.** The lesson text, the student's question, and the code they
wrote. Not their name, not their email, not their id — the tutor is never told
who it is talking to. Calls are logged as a count for the cost dashboard, not as
a transcript tied to a person.

**Deletion.** Practice accounts can erase themselves from a button today. For
Pika students, deleting them in Pika is the instruction — send it to us and the
row goes with it. If the board wants that in writing, I will write it.

**Where it lives.** The database is Neon; the app runs on Vercel. If the board
requires Canadian residency, tell me before September and I will move the
database — it is a config change and a restore, not a rewrite. Better to know
now than after there is real data in it.

**One honest caveat.** The AI runs on Google Vertex. If the board's policy is
that no student-written text may go to a third-party model, then the tutor has
to be off for your class — which is a switch, not a rebuild. The lessons, the
code runner and the reference all work without it.

---

## Why a frame and not merging the code

Pika is Next 14 / React 18 / Supabase. polyglot is Next 15 / React 19 / Prisma.
Merging means resolving two framework majors, a data layer and an auth system
before a single student sees anything. A frame means neither of us has to care
what the other upgrades to.

And it isn't a one-way door: if the frame turns out to be wrong, serving polyglot
at `pika.app/java/…` with no frame is a config line on each side. Same tokens,
same code.
