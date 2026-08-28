# More than Java

How a second language would work, what is cheap, and what is not.

---

## The short version

Running TypeScript is nearly free. **Teaching** TypeScript the way it is worth
teaching is not, and the gap between those two is the whole decision.

---

## What is already language-agnostic

Most of it, which is the good news.

- **69% of the course needs no runner at all.** Of 762 steps, 524 are `teach`,
  `predict`, `bucket`, `fill`, `trace`, `match`, `spot`, `compare`, `table`.
  Those work for any subject, never mind any language.
- **`"java"` is hardcoded in exactly two lines**, both in `lib/java/piston.ts`.
  Piston speaks about eighty languages.
- Grading, mastery, evidence, translation, the step player, progress — none of
  it knows what language it is looking at.

## What is genuinely Java-shaped

- **`lib/java/wrapper.ts`** — supplies the class, `main`, and CodeHS's
  `readLine`/`readInt`. TypeScript needs no wrapper at all, which makes this
  simpler rather than harder, but it does have to become per-language.
- **`lib/curriculum/reference.ts`** — Java syntax, with a `wrap` mode per entry
  that `scripts/reference-check.ts` compiles. Needs to be per-course.
- **The tutor prompt** — says Java in a few places.
- **Syntax highlighting.**

None of that is hard. It is a day, maybe two.

---

## The part that is not cheap

The stated reason for wanting TypeScript is the **quick reward curve** — you
build a small website and you can see it.

This engine cannot show you that. Every runnable step works one way: run the
code, capture what it printed, compare it to expected text. `target` is a
string. A webpage is not a string, and "did it print the right thing" is not the
question anyone asks about a page they just built.

So there are two different projects hiding under one request:

**TypeScript as a console language** — `console.log`, string manipulation,
loops, functions. Two lines of runner change plus a wrapper that does nothing.
Cheap. It also delivers *less* reward than Java, not more, so it does not
actually answer the reason for asking.

**TypeScript as a web language** — write HTML/CSS/TS, see the page render.
This needs a new step kind whose output is a rendered iframe rather than stdout,
a way to author expected results that is not string comparison, and an answer to
"how is this graded". That is the thing worth building and it is not a day.

Deciding which of these is meant is the first question, before any code.

---

## The data model

There is no course concept today. `Chapter` is the top level, and lesson codes
like `"3.1"` are globally unique — so Java 3.1 and TypeScript 3.1 collide
immediately.

The smallest change that works:

```prisma
model Course {
  id       String    @id @default(cuid())
  slug     String    @unique   // "java" | "typescript"
  title    String
  language String                // Piston language id
  wrapper  String                // "java-beginner" | "none"
  order    Int
  chapters Chapter[]
}
```

`Chapter` gains `courseId`. `Lesson.code` stops being globally unique and
becomes unique **per course** — `@@unique([courseId, code])`.

Everything that reads lessons then filters by course: the sidebar, progress, the
Pika endpoints, the authoring pipeline, `flows.json`.

**This is the blocker, and it is not a code problem.** Prisma migrations need
port 5432, which is blocked on the network this is developed from. The schema
change can be written here but cannot be applied or tested here. It needs
running from somewhere that allows 5432, or from the Neon console.

---

## How a student would choose

Once courses exist, the navigation is not hard, but it should be **one decision
made once**, not a picker on every screen.

1. A course picker on entry — two cards, Java and TypeScript, with progress on
   each. Skipped entirely when only one course exists.
2. The sidebar scopes to the current course. The course name sits at the top of
   it, and clicking it is how you switch.
3. Progress, mastery and the reference are per-course. A student is not "40%
   done"; they are 40% through Java and 0% through TypeScript.
4. The Pika endpoints gain a course field. `summary` returns courses containing
   units, rather than units directly — a breaking change to that shape, so it
   is better decided before anyone builds against it than after.

---

## What I would actually do first

Not the schema. **Add language choice to the scratchpad only** — no course, no
lessons, no migration. A dropdown, and the two-line runner change.

It costs an afternoon, it puts a real TypeScript playground in front of anyone
who wants one, and it answers the question that matters before the expensive
work starts: does anybody actually use it?

If they do, the course layer is a well-understood week. If they do not, an
afternoon was spent instead of a month.
