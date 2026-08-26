# Contributing

Welcome. A few rules, all of which exist because of something that went wrong.

## Every change goes through a pull request

No direct pushes to `main`, including by admins. One approving review to merge.

This is not bureaucracy — it is how the history stays readable. A repository where everyone
commits straight to `main` becomes impossible to attribute or to bisect six months later, and
"who changed this and why" is a question you will ask far more often than you expect.

## Lesson content is compiler-gated

**Never** commit a lesson whose code has not been run.

```bash
npx tsx scripts/lesson.ts verify my-lesson.json   # compiles every snippet
node scripts/flows.mjs audit                      # course-wide checks
```

A lesson that does not compile teaches a beginner that they are the problem. This gate has
caught a lot; do not route around it. The same applies to the reference sheet
(`scripts/reference-check.ts`) — documentation that does not compile is worse than none.

## Write commit messages that explain the decision

Not "fix bug". What was wrong, why it was wrong, and what you chose instead. The history
does this already and it is the most useful documentation in the project — most of what you
need to know about a decision is in the commit that made it.

## Assert your anchors

When patching a file with a script, assert that the text you are replacing exists. Two silent
no-op replacements once shipped a broken UI that looked fine in review.

## House style

Read **LESSON-AUTHORING.md** before writing lessons. Terse, show don't explain, one idea per
screen. Java only, matching CodeHS: `readLine` / `readInt`, never `Scanner`.

## Things that need a conversation first

- Changing the token contract in `PIKA-INTEGRATION.md`
- Anything touching what data leaves the server — see `/privacy`, which makes specific promises
- Turning the AI switch on for a class that has not agreed to it
