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

## P1 — Retention visibility (next)

The owner must be able to answer, without asking anyone: did people come back?
Did anyone finish a lesson? Where do they quit? All derivable from the existing
`Event` log — nothing new to collect, just a read.

## P1 — Landing page

`/join` is a sign-in card. A cold visitor from a link needs: what this is, one
piece of proof it works, and the "no signup" promise, above the fold.
