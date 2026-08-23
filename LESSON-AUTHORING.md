# Writing a lesson

You need a laptop, this repo, and Claude Code. You do **not** need admin access,
a database, or a deploy. You write a JSON file, a script checks every line of
Java in it against a real compiler, and if it passes you open a PR.

```bash
npx tsx scripts/lesson.ts verify my-lesson.json   # check it
npx tsx scripts/lesson.ts add    my-lesson.json   # check it, then write it into prisma/flows.json
```

If `.env` has `PISTON_URL`, it uses our runner; otherwise it falls back to
Compiler Explorer. Either way every snippet actually runs.

## The one rule

**Nothing claims an output that Java does not produce.** Every `output`,
`target` and correct answer is executed and compared. If a lesson says a program
prints `35` and it prints `0`, `verify` fails and nothing is written. This is
the whole point of the tool — a wrong lesson is worse than no lesson, because
the student trusts it.

## Curriculum boundary

We mirror CodeHS **AP Computer Science A (Mocha)**, Basic Java. The rule from
the teacher is exact: teach every concept CodeHS teaches, in its order, and
nothing extra.

`lib/curriculum/codehs.ts` holds that as data — objectives, the syntax each
lesson introduces, the real exercise specs and what each quiz asks. Two helpers
matter:

- `taughtBefore("2.5")` — everything available to you
- `notYetTaught("2.5")` — everything you must **not** use, even in code the
  student only reads

`curriculumBrief("2.5")` prints the whole boundary as prompt text. Paste it into
Claude Code and it will stay inside the lines. The admin FlowKit page does this
for you.

> Numbering: the student sees CodeHS's number (3.5), the code uses ours (2.5).
> Don't rename lesson codes — they are database keys and URLs.

## Shape of a lesson

Four phases, in order:

1. **TASK** — what we're making. A player card, splitting loot, an XP bar. The
   task states the need; nothing is engineered to fail.
2. **BUILD** — concepts arrive because the task needs them, used immediately.
   Never more than two graded steps in a row.
3. **SHARPEN** — the exact rules and traps, tied to what the CodeHS quiz asks.
4. **DRILL** — reps, ending on CodeHS's real graded exercise.

## Writing style

- A `points` label is **a thing you point at** — `7.0 / 2`, `readInt`,
  `int score = 5;`. Never `so`, `but`, `why`, `the rule`. If it isn't concrete,
  it doesn't earn a highlight.
- Headings state the fact. "17 coins between 5 players. Java says 3, not 3.4."
  Not "this is the one that catches everybody."
- Explain with real numbers: "the .4 is discarded — discarded, not rounded.
  19 / 5 also gives 3."


## Design checklist — run this BEFORE writing a step

Everything below came from the owner or a reviewer looking at real lessons and
saying what was wrong. It is not style preference; each line is a fix for
something that shipped badly.

**Plan first.** Write the four phases out before authoring anything: what the
task is, which concepts it forces, what the SHARPEN questions are, what the
DRILL exercises are. If you cannot name the task in one sentence, you do not
have a lesson yet.

**Structure**
- TASK -> BUILD -> SHARPEN -> DRILL. No engineered failure: introducing the task
  is motivation enough. Never set the student up to stumble.
- Never more than 2 teach steps in a row, except a lesson opening (task + first
  concept).
- Never more than 2 graded steps in a row during BUILD. DRILL may be consecutive
  — that is the point of it.
- End on CodeHS's real exercise where the spec is known.

**Writing**
- Be terse. "7 / 20 = 0.35. As an integer, this is 0, so Java prints 0" — not a
  paragraph building up to it. Average point text is ~75 characters.
- Instructions (what to DO) may be longer. Descriptions of code must not be.
- A point `label` is a thing you POINT AT: `7.0 / 2`, `readInt`, `int x = 5;`.
  Never `so`, `but`, `why`, `the rule`, `the catch`. If it is not concrete it
  does not earn a highlight.
- Headings state the fact: "17 coins between 5 players. Java says 3, not 3.4."
  Not "this is the one that catches everybody."
- One new idea per screen.

**Show, do not describe**
- `compare` when a DIFFERENCE is the lesson (print vs println, == vs .equals).
- `table` when the PATTERN ACROSS ROWS is the lesson (&& truth table, De
  Morgan's equivalence).
- `highlight` the lines a step just added, so a growing program shows what is
  new instead of asking the student to diff it by eye.
- `ask` whenever INPUT is the thing being taught — the student types real values.
- Cut any `run` step that re-runs code a teach step already showed with its
  output. Clicking Run must reveal something.

**Correctness**
- Every claim about Java is compiler-checked. `npx tsx scripts/lesson.ts verify`.
- Respect `notYetTaught(code)`. Not one symbol the course has not reached.
- ASCII only in anything Java compiles — an em dash prints as `?`.
- `tweak.target` is the ORIGINAL output. For one specific result use `fix`.
- Unit-tested exercises use `harness`, so a correct method passes even without a
  println.

## Step kinds

`lib/curriculum/flow.ts` is the canonical spec. The ones worth knowing:

| kind | what the student does |
|---|---|
| `teach` | reads; may show code + its verified output |
| `run` / `tweak` | runs it; changes it and runs again |
| `ask` | **types real input** — one field per read call. Use this whenever input is the thing being taught |
| `fix` / `write` | reaches an exact target output |
| `predict` / `spot` / `trace` | thinks first, then sees the reveal |
| `fill` / `arrange` / `bucket` / `match` | assembles from parts |
| `table` | completes a truth table — use when the *pattern across rows* is the lesson |

Two traps that have bitten us:

- **`tweak`'s `target` is the ORIGINAL output**, not the goal. The student wins
  when the output *differs* from it. If you want one specific result, use `fix`.
- **`ask` needs a `sample` per field.** It never reaches the browser; it exists
  so the compiler gate can still run the snippet.

## Minimal example

```json
{
  "code": "2.6",
  "title": "Booleans",
  "objectives": ["create boolean variables that hold true or false"],
  "flow": { "v": 1, "steps": [
    { "id": "x1", "kind": "teach",
      "instruction": "boolean holds one of exactly two values.",
      "code": "boolean alive = true;\nSystem.out.println(alive);",
      "output": "true",
      "points": [{ "label": "boolean", "text": "The type. Only true or false fit in it." }] }
  ] }
}
```

## Then

```bash
npx tsx scripts/lesson.ts add my-lesson.json
git checkout -b lesson-2.6 && git commit -am "..." && git push
```

Open a PR. `prisma/flows.json` is the source of truth. Once merged:

```bash
node --env-file=.env scripts/flows.mjs diff      # what would change
node --env-file=.env scripts/flows.mjs seed      # rows for brand-new lessons
node --env-file=.env scripts/flows.mjs restore   # push the flows
```

`seed` only creates empty rows and `restore` only moves content, so both are
safe to re-run. A new unit needs its chapter listed in `CHAPTERS` at the top of
the script.

### Before you open the PR

```bash
node scripts/flows.mjs audit
```

Checks things no single lesson can fail on its own — chiefly whether the
correct answer keeps landing in the same position. Every MCQ in the course was
option 0 once, 152 of them, so the whole drill set was answerable without
reading. Each lesson looked fine alone. Vary the position as you write.

### If it says the database is unreachable

It probably isn't. Many school and office networks swallow port 5432 — they
accept the TCP connection so the port *looks* open, then drop the traffic, and
Prisma reports the database as down. The script falls back to Neon over HTTPS
on its own and prints which pipe it used; if you see `neon over https`, that is
what happened and nothing is wrong. `nc -z example.com 5432` succeeding is the
tell: nothing runs Postgres there, so a "success" means a middlebox is
answering for it.
