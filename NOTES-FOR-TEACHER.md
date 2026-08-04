# Quick answers: privacy, cost, and what happens later

Short version for anyone who asks.

## Privacy

- **No accounts.** Students click one button and start. No name, no email, no
  school, no password.
- **Nothing identifiable is stored.** Progress is tied to a random label like
  "Swift Otter 482" that means nothing to anyone.
- **IP addresses are never saved** — used in memory for a few seconds to stop
  abuse, then gone.
- **One-click delete.** Any student can erase everything about themselves from
  their own progress page. It's a real delete, not a hide.
- **Nothing to consent to, nothing to review.** Because no personal data is
  collected, there's no data-protection process to go through.

## Cost today

- **AI: about $0.05 per student per semester.** For 100 students that's roughly
  $5 total.
- **Hard ceiling built in.** The platform stops spending at $5/day no matter
  what — if it hits the cap, the AI features fall back to offline responses and
  nothing breaks. It cannot run up a bill.
- **Most of the platform uses no AI at all.** About 95% of marking is done by
  actually compiling and running the student's Java, not by asking an AI.

## The server, after the free credits run out (~60 days)

There's one rented machine that runs students' Java code. Right now it's free
(Google Cloud trial credits). After that it's about **$25/month**.

Three options, all fine:

1. **Turn it off.** The platform automatically falls back to free public code
   runners. One command, nothing breaks. **This is the default and costs $0.**
2. **Keep it** if lots of students are using it — the free runners get slow and
   unreliable under load, and a paid box doesn't.
3. **Shrink it** to a smaller machine for roughly $7/month.

Nothing is locked in and nothing breaks by stopping. The decision can wait until
we know whether students actually use it.

## What "it works" currently means

- 6 lessons rebuilt as interactive, ~53 steps
- Every code example is **compiled and run for real** before it can be published,
  so a lesson can't contain a wrong answer
- Tested with 30 students running code at the same instant — all 30 work
- Runs on two independent code-runners, so one outage doesn't stop lessons
