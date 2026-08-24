# Handoff — finishing Unit 6

Everything a fresh session needs. Read this, then `LESSON-AUTHORING.md`
(especially **House style**) and `LESSON-PLANS.md` before writing a single step.

---

## Where things stand

| Unit | Lessons | State |
| --- | --- | --- |
| Unit 3 — Basic Java | 3.1–3.15 | Reworked, owner-reviewed |
| Unit 4 — Methods | 4.0–4.9 | Reworked |
| Unit 5 — Classes and OOP | 5.1–5.17 | Reworked |
| **Unit 6 — Data Structures** | **6.1–6.14** | **NOT reworked. This is the job.** |

Unit 6 lessons exist and are compiler-verified, but predate the current house
style. They still use the deprecated `points[]` highlight template that the
owner has asked to be rid of three times.

Also unfinished: `5.18`, `4.9` and a few Unit 3 lessons still carry `points[]`.
`node scripts/flows.mjs audit` prints the exact list every run. Unit 6 first.

---

## Numbering: internal vs student-facing

Lessons are stored under an **internal** code that is one unit behind what the
student sees. `lib/curriculum/codehs.ts` maps between them.

| Student sees | Internal code | Directory / CLI |
| --- | --- | --- |
| 6.1 | `5.1` | `5.1` |
| 6.14 | `5.14` | `5.14` |

So **Unit 6 work means editing lessons `5.1` through `5.14`.** Getting this
wrong edits the OOP unit by mistake. Always confirm with:

```bash
node --import tsx -e "import('./lib/curriculum/codehs.ts').then(m=>console.log(m.studentCode('5.1')))"
```

---

## The authoring loop

```bash
# 1. Write a lesson to a JSON file (see the shape below), then:
PISTON_URL= node --env-file=.env --import tsx scripts/lesson.ts verify /tmp/l5_1.json

# 2. Only once it verifies clean:
PISTON_URL= node --env-file=.env --import tsx scripts/lesson.ts add /tmp/l5_1.json

# 3. Course-wide checks (no database needed):
node scripts/flows.mjs audit

# 4. Push the content to the database:
node --env-file=.env scripts/flows.mjs restore

# 5. Build, commit, push:
npm run build && git add -A && git commit && git push

# 6. Confirm the deploy actually landed — do not assume:
curl -s https://classos.arronwang.com/api/version
```

**`PISTON_URL=` is not optional.** The owner's self-hosted runner is down. With
it set, every snippet waits 4s for a dead host before falling through to
godbolt, and a lesson verify times out. Clearing it for the command skips
straight to the working lane. A full lesson then verifies in about 10 seconds.

**Never skip step 1.** Every snippet is compiled against real Java before it
ships. This has caught genuine errors repeatedly — a HashMap iteration order
that was the opposite of what the lesson claimed, a `"mel" + "lon"` that Java
interns so `==` is genuinely `true`, a mis-traced loop that left 2 items not 1.

---

## Step shape

```js
{
  id: 'x_task',              // unique within the lesson
  kind: 'teach',             // see the table below
  instruction: 'One short sentence.',
  body: ['Plain sentences.', 'One idea each.'],
  code: '...',               // compiled if `output` is present
  output: '...',             // the claim the compiler checks
  wrap: 'methods',           // ONLY when the snippet declares a class or method
  keypoint: 'The one idea worth remembering.',
  skills: ['an existing skill statement'],
}
```

### Step kinds

| Kind | Use for |
| --- | --- |
| `teach` | Explaining. Carries `body[]`, `rules[]`, `facts`, `annotate[]`, `pipeline[]`, `scopes[]` |
| `write` | Student writes code. Needs `target` + `solution` |
| `fix` | Broken code to repair. Needs `code`, `target`, `solution` |
| `predict` | Multiple choice. **The correct option must be the literal program output** |
| `trace` | Multiple choice about code. Options are free text, not output |
| `fill` | Blanks with `⟦1⟧` markers and chips |
| `bucket` | Sort items into categories |
| `match` | Pair things up |
| `run` | Run and observe. No target, just must not crash |
| `walk` | Step through execution frame by frame |
| `workout` | **Only** when the task has a genuinely required order |
| `card` | Fill in variable values, get a styled card |

### Presentation helpers on `teach`

| Field | Renders as |
| --- | --- |
| `body: string[]` | Plain paragraphs. **The default. Prefer this.** |
| `rules: [{text, example}]` | A numbered list |
| `facts: {columns, rows}` | A reference table. Works on ANY step kind, so documentation stays visible during exercises |
| `annotate: [{token, note}]` | Arrows under one line of code pointing at exact tokens |
| `pipeline: [{label, note, kind}]` | A chain of stages with arrows |
| `scopes: [{name, from, to, kind}]` | Lifetime bars beside code showing where variables exist |
| `library: '...'` | Classes compiled in but **never shown**, for client exercises |
| `points: [{label, text}]` | **DEPRECATED. Do not use.** |

---

## House style — the rules that keep getting broken

The owner has corrected these repeatedly. Read `LESSON-AUTHORING.md` for the
full don't/do tables.

1. **Name the thing.** Say class, object, method, field, state. Never describe
   around the word a student must learn.
   - Bad: *"Once it exists, you can ask it things."*
   - Good: *"rect.getWidth() returns the width of the object rect."*
2. **No run-on sentences.** One idea per sentence.
3. **No highlight stacks.** `points[]` is dead. Use `body[]`, or `annotate[]`
   when pointing at code.
4. **Cut sentences that carry no information.** If it would not change what the
   student types, delete it.
5. **Every lesson opens with a problem and an objective**, in complete
   sentences, ending in a question. The model is 3.1: *"We are building a game
   title screen. How do we print something on it?"* Technical lessons may open
   on the failing case instead of a story.
6. **A widget must earn its place.** Do not use `workout`'s ordering puzzle
   unless the order genuinely matters.
7. **Indent snippets properly.** One statement per line. Students copy what
   they see.

---

## Unit 6 — what each lesson covers

The owner has not yet sent a detailed plan for Unit 6. **Ask for one before
rewriting**, the way they supplied plans for Units 4 and 5. Current titles:

| Student | Internal | Title |
| --- | --- | --- |
| 6.1 | 5.1 | What are Data Structures? |
| 6.2 | 5.2 | Introduction to Arrays |
| 6.3 | 5.3 | Using Arrays |
| 6.4 | 5.4 | Enhanced For Loops |
| 6.5 | 5.5 | ArrayList Methods |
| 6.6 | 5.6 | Arrays vs ArrayLists |
| 6.7 | 5.7 | Additional Loop Examples |
| 6.8 | 5.8 | The List Interface |
| 6.9 | 5.9 | 2D Arrays (Matrices or Grids) |
| 6.10 | 5.10 | Traversing 2D Arrays |
| 6.11 | 5.11 | HashMaps |
| 6.12 | 5.12 | Binary |
| 6.13 | 5.13 | Ethical Issues Around Data Collection |
| 6.14 | 5.14 | Data Structures Quiz |

Two widgets are likely to earn their place here:

- **`walk`** for array traversal and nested 2D loops — watching an index move is
  exactly what beginners cannot picture.
- **`scopes`** for the loop-variable lifetime question, already used in 5.10.

---

## The cast

Unit 5 built a set of reusable classes, documented in `LESSON-PLANS.md`:
`Player`, `Monster`, `Weapon`, `Room`, `Chest`, `Randomizer`. Reuse them where
natural so Unit 6 feels continuous rather than starting over.

Class documentation tables use three columns: **Method, Return Type,
Description**. Never omit the return type.

`Randomizer` matches the CodeHS API exactly. It may only appear in `run` steps,
because random output cannot be checked against a fixed target.

---

## Environment facts that will waste time otherwise

1. **Port 5432 is blocked on this machine.** Prisma cannot reach Neon directly.
   `scripts/flows.mjs` falls back to Neon's HTTPS driver automatically and
   prints which transport it used. A local `npm run dev` **cannot** reach the
   database, so pages will 500 locally. This is not a real bug.
2. **The self-hosted Java runner is down.** Always prefix `PISTON_URL=`.
3. **You cannot log into the deployed site.** Production rejects any locally
   minted session. For anything behind auth, ask the owner what they see.
4. **`/api/version` reports the deployed commit.** Use it instead of guessing
   whether a deploy landed.
5. **Never use Prisma `startsWith` to filter the `__` internal prefix.**
   Underscore is a SQL wildcard, so it silently matches nothing. Use
   `excludeInternal()` from `lib/curriculum/internal.ts`. This bug has now
   shipped five times.

---

## Known outstanding work

- Unit 6 rework — the current job.
- `5.18`, `4.9` and several Unit 3 lessons still use deprecated `points[]`.
  `node scripts/flows.mjs audit` lists them.
- Unit 4/5/6 exercise specs were never verified against CodeHS, which is
  login-gated. Concepts match; the drills are ours.
- A student-built 2D game project was discussed and deferred. See the
  conversation summary in `LESSON-PLANS.md` if it comes up again.
