# polyglot

A self-hosted platform for teaching intro Java. Lessons are **interactive first**: a student
runs code, predicts output and fixes bugs, and the explanation arrives after they act rather
than as a wall of text before it.

**57 lessons · 762 steps · no account required to use it.**

Live at [classos.arronwang.com](https://classos.arronwang.com). MIT licensed.

Guiding principle: **you own the content, the data, the keys and the deploy.**

---

## Run it locally

```bash
npm install
npm run setup      # Prisma client + schema + seed
npm run dev        # http://localhost:3000
```

No API key needed. With no AI provider configured the app serves an offline stub, and Java
runs on Compiler Explorer's free API. (The public Piston API went whitelist-only in Feb 2026 —
set `PISTON_URL` to point at your own Piston instead. See **RUNNER.md**.)

### Getting in

| Who | How |
|---|---|
| **Anyone** | The landing page's **Start practicing** button. No name, no email, no signup. |
| **Student in a class** | `/join` with the class code their teacher gives them. |
| **Staff** | `/login`. The seed prints random passwords — no public defaults. |

---

## The three switches that matter

All three live in **Admin → Settings** and take effect immediately, with no redeploy.

| Switch | Off means |
|---|---|
| **AI** | The tutor, the ✦ error explainer and code review are *hidden*, not disabled. No request reaches a paid provider, so nothing can be billed. Enforced in `complete()` (`lib/llm/index.ts`), the one function every AI call passes through — so a new AI feature is off by construction, not by remembering. Default **on**. |
| **Student messaging** | Students cannot send free text to anyone; `/inbox` is closed to them by URL as well as by menu. The one-way questionnaire still works. Default **off** — school boards generally do not permit unmonitored two-way messaging with students. |
| **Name** | What this deployment calls itself in the top bar. The repo, the licence and the source stay named polyglot. |

---

## What's in it

- **Interactive lesson player** — 17 step kinds (`teach`, `predict`, `write`, `fix`, `trace`,
  `bucket`, `fill`, `match`, `arrange`, `workout`…). Answers are graded server-side and never
  reach the browser.
- **Real Java execution** with interactive stdin, plus a scratchpad with run history.
- **A reference sheet** whose every snippet is compiled by `scripts/reference-check.ts` —
  documentation that does not compile is worse than none.
- **Reading help (ESL)** — the lesson in a second language beside or beneath the English, with
  Java keywords always left in English. Six languages ship translated: 简体中文, 繁體中文,
  हिन्दी, 한국어, 日本語, Français.
- **AI tutor** (optional) — lesson-aware, per-lesson history, explains compiler errors, can
  write into the scratchpad. Spend cap and per-student daily limit.
- **Mastery model** — a skills/evidence ledger; only a passing server-graded quiz sets
  `MASTERED`.
- **Teacher view** — classes, join codes, the mastery matrix, recent activity.
- **Questionnaire** — fixed-answer, one-way, with tallies at `/admin/questionnaire`.

---

## Layout

```
app/
  page.tsx            public landing page
  lessons/[code]/     the lesson player
  teacher/            mastery dashboard
  admin/              editor · settings · translate · usage · reach · questionnaire
  api/                run · ai · lesson/flow · auth · progress · settings · pika
components/
  lesson/FlowPlayer   the step player — every step kind lives here
  student/Workbench   scratchpad · reference · tutor, one rail
lib/
  llm/                provider-agnostic adapter, fallback lanes, cost tracking
  java/               wrapper (CodeHS parity: readLine, never Scanner) + execution
  curriculum/         flow types, verification, reference, i18n extraction
  settings.ts         DB-backed config, encrypted keys, feature switches
  progress.ts         the honesty chokepoint — only a passing quiz → MASTERED
prisma/
  schema.prisma       Chapter · Lesson · User · Attempt · Progress · AiCall · Setting …
  flows.json          every lesson's flow, in git, restorable with scripts/flows.mjs
```

---

## Authoring lessons

Lessons live in the database, and `prisma/flows.json` is the version-controlled copy.

```bash
npx tsx scripts/lesson.ts verify my-lesson.json   # compile-check every snippet
node --env-file=.env scripts/flows.mjs diff       # what would change
node --env-file=.env scripts/flows.mjs restore    # file → DB
node scripts/flows.mjs audit                      # course-wide quality checks
```

**Every code snippet is compiled before it ships.** The audit also reports answer-position
skew, deprecated constructs and missing prose. House style and the step-kind reference are in
**LESSON-AUTHORING.md**; what each unit covers is in **LESSON-PLANS.md**.

> If port 5432 is blocked on your network, `flows.mjs` falls back to Neon over HTTPS
> automatically. Prisma migrations do not — run those from somewhere that allows 5432.

---

## Privacy

No name, no email, no school. Work is stored against a random session id. With AI off, no
student text reaches any third party at all. `/privacy` states this in two sentences and
tracks the AI switch, so it cannot claim more than is true.

Relevant if you are in Ontario: O. Reg. 52/26 requires boards to inventory all software and
run privacy impact assessments. `docs/for-the-teacher.md` covers the data questions a board
will ask.

---

## Other documents

| | |
|---|---|
| **DEPLOY.md** | First-time hosting walkthrough and the security model |
| **RUNNER.md** | Self-hosting the Java runner |
| **LESSON-AUTHORING.md** | House style, step kinds, the compiler gate |
| **ARCHITECTURE.md** | How the pieces fit |
| **STUDENT-MODEL.md** | The competency model and event layer |
| **PIKA-INTEGRATION.md** | Embedding in a host platform (parked — see below) |

## Discord PR notifications

The `#polyglot` Discord channel gets one quiet, clickable line when a non-draft
PR is opened or reopened. Drafts wait until they are marked ready for review.
The PR title is the summary; bodies and rich previews are not posted.

```text
🔀 polyglot #42: Make Discord PR updates concise
```

The workflow uses the repository Actions secret `DISCORD_PR_WEBHOOK_URL`. It
must contain a standard incoming Discord webhook for `#polyglot`. Treat the URL
like a password.

**Status:** standalone. A planned integration with a host platform is on hold; polyglot ships
and deploys on its own.
