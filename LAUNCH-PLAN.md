# Launch readiness — self-directed work plan

Written by the agent, ordered by *what would kill a real launch*, not by what's
fun to build. Updated as items land.

## Risk register

| # | Risk | Impact if it happens | Why it's credible | Priority |
|---|------|----------------------|-------------------|----------|
| 1 | The Java runner (Compiler Explorer) rate-limits, blocks, or disappears | **Total product failure.** Every interactive step calls it. No lesson works. | Not hypothetical: the public Piston API this project *originally* used went whitelist-only on 2026-02-15 and broke the runner. Same class of free, keyless, no-SLA dependency. | **P0** |
| 2 | No way to tell whether anyone actually uses it | Repeats the exact failure mode the owner has hit before ("it got ignored and I couldn't tell"). Ship criterion #5, still unbuilt. | Certain — the event log captures data but nothing reads it. | **P1** |
| 3 | A stranger from r/APCSA lands on a bare sign-in card | Wasted the one real distribution shot. Nothing explains what this is or why to trust it. | High — `/join` is a login card, not a landing page. | **P1** |
| 4 | Only 4 of 15 lessons are interactive | Student exhausts content in ~15 min, then hits text walls. | Certain, but the owner has explicitly chosen the self-serve template as the scaling path over hand-authoring. | P2 |
| 5 | Accessibility / keyboard-only use | Chromebook-heavy school context; unusable = unadoptable for some students. | Unknown, unaudited. | P2 |

## P0 — Runner resilience

**Goal:** no single third-party service can take the whole product down, and
when one does fail the student sees something honest instead of a broken step.

- [x] Audit current failure behaviour
- [x] Make the runner a list of ordered backends with automatic failover
- [x] Add a second live backend (verified reachable, not assumed)
- [x] Cache which backend is healthy so every request doesn't retry a dead one
- [x] Admin visibility: which runner served, what's failing
- [x] Verified by actually breaking the primary and watching failover happen

## P1 — Retention visibility ✅ done

`/admin/reach` ("Reach" in the admin nav) answers it from the existing `Event`
log; collects nothing new.

- [x] learners ever · activated (did ≥1 step) · returned another day · steps done
- [x] learners-per-day chart
- [x] per-lesson funnel: opened → started → finished, with a per-step bar chart
      so the exact drop-off step is visible
- [x] hardest steps (avg tries, first-try rate) — separates "hard idea" from
      "badly worded step"
- [x] honest empty state that says *nothing is broken, nobody has come yet*
- [x] **excludes demo-seeded students** — they have no email but DO have a
      class, and were inflating every number with fake people until caught

Caveat worth knowing: the owner's own testing sessions do count as learners
(they're genuinely anonymous), so early numbers include a handful of self-visits.

## P1 — Landing page ✅ done

`/` is now a real landing page for signed-out visitors (signed-in users still
redirect to their home).

- [x] Concrete headline + what this actually is
- [x] **A real lesson step, playable before signup** — client-side on purpose:
      shop window, not assessment, so no auth and no abuse surface
- [x] Honest scope: lesson/step counts read from the DB so the page can't drift
      into overclaiming; states outright that 4 are interactive and 11 aren't yet
- [x] Fixed an app-wide dark-mode contrast bug found here (topbar text used
      var(--paper), which inverts in dark mode → logo/nav at ~1:1 contrast)

## P2 — Accessibility audit ✅ mostly done

Audited live in a browser.

**Already fine (by construction):** every interactive element in the flow player
— predict options, arrange lines, bucket/match chips, spot lines, Run, skip — is
a real `<button>`, so all of it is natively keyboard-reachable and
Enter/Space-operable. Verified: 63/63 interactive elements are `button`/`a`, zero
click-handler-on-a-div. The app also never suppressed focus rings.

**Fixed:**
- [x] No focus indicator was ever *defined*, so keyboard users got the browser
      default — low-contrast against the near-black code blocks and green
      buttons. Added an explicit two-tone `:focus-visible` ring that stays
      visible on paper, dark panels, and code surfaces. Verified the rules parse
      and match all 63 elements (a silently-dropped rule was the real risk).
- [x] `prefers-reduced-motion` was unhandled while the UI uses a wrong-answer
      shake and a highlight pulse. Now honoured — the state change stays, the
      movement goes.

- [x] Run output and answer reveals were plain DOM insertions with no
      `aria-live`, so a screen-reader user pressed Run and heard nothing. Now
      wrapped in a polite live region (plus the trace and explain replies).

**Caveat:** the live regions are implemented to spec but *not* verified with a
real screen reader — I can't run one here. The markup is the standard pattern,
but if a11y is ever a hard requirement, this needs one real VoiceOver/NVDA pass.

## P2 — More interactive lessons

## P2 — More interactive lessons (in progress)

**6 of 15** now interactive: 2.1 Printing, 2.2 Variables/Types, 2.3 User Input,
2.4 Arithmetic, 2.9 For Loops, 2.10 While Loops. That's ~51 steps — enough that a
learner has real work to do rather than a demo.

**Content is now backed up in git** (`prisma/flows.json`, via
`scripts/flows.mjs export|restore|diff`). This mattered: pipeline-authored
lessons live only in the DB, so 2.10 briefly existed nowhere else. Re-export
after authoring anything.

The pipeline is the scaling path, and it's now self-correcting (a rejection
returns a paste-back fix request for the AI, plus a "Check only" mode that
compile-checks without publishing). Authoring 2.9 by hand was worth it once
because it shook out the `fill` and `spot` kinds in a live lesson for the first
time — which immediately exposed a real stale-state bug affecting four step
kinds. Remaining lessons should go through the pipeline.

Suggested next by teaching value, not sequence: **2.10 While Loops** (pairs with
2.9), **2.11 If Statements**, then 2.6–2.8 booleans/logic/comparison.

## Verified-by-hand log (what's actually been driven, not just built)

- Core loop: Run → real Java compiles remotely → output → success → Next ✓
- Anonymous entry → lesson → step completion ✓
- Runner failover with a deliberately broken primary ✓
- Student compile error does NOT trigger failover ✓
- Total runner outage → honest student-facing message ✓
- Import rejects a false claim; leaves the live lesson untouched ✓
- verifyOnly writes nothing ✓
- `spot` and `fill` step kinds in a real lesson ✓
- Admin pages blocked from a student session ✓
- Mobile (375px) and desktop (1280px) navigation ✓
- Light + dark themes ✓

**Not verified (stated honestly):** aria-live announcements with a real screen
reader; behaviour under more than one concurrent user; any real student.

## P1 — Landing page

`/join` is a sign-in card. A cold visitor from a link needs: what this is, one
piece of proof it works, and the "no signup" promise, above the fold.
