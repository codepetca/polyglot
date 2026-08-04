# The Java runner (and the GCE box behind it)

Every interactive lesson step executes real Java. This is how, what it costs, and
how to turn it off.

## What exists right now

A VM in your Google Cloud account:

| | |
|---|---|
| Name | `classos-runner` |
| Zone | `us-central1-a` |
| Type | `e2-medium` (2 vCPU, 4 GB) |
| IP | `34.27.153.29` |
| Cost | **~$25/month**, billed against your free credits |
| Runs | Piston (sandboxed code execution) in Docker, + Caddy for HTTPS |

**Security:** Piston listens only on `127.0.0.1` — it is not exposed. Caddy sits
in front on 443 with a real Let's Encrypt certificate (via the `nip.io` hostname
`34.27.153.29.nip.io`) and rejects any request without the `X-Runner-Token`
header. Without that token you get a 403, so it can't be found and used as free
public compute. The token lives in `.env` (gitignored) as `PISTON_TOKEN`.

## Delete it / stop paying

```bash
gcloud compute instances delete classos-runner --zone=us-central1-a
```

Nothing breaks if you do — the app automatically falls back to the free public
runners. Remove `PISTON_URL` from `.env` (and Vercel) to skip it cleanly.

## Why it exists

Not for speed. Measured honestly, both are about the same:

| | median | worst |
|---|---|---|
| godbolt.org (free, public) | 2.45 s | 7.8 s |
| self-hosted Piston | 2.41 s | 6.6 s |

JVM startup dominates, so a faster box wouldn't change much either.

It exists for two real reasons:

1. **Independence.** Before this, both lanes were on godbolt.org. One outage
   there and *every lesson on the platform stops working*. This project has
   already lost a runner once — the public Piston API went whitelist-only in
   Feb 2026 and broke everything. Now there are two unrelated providers.
2. **Throttling.** During testing, godbolt started intermittently failing and
   slowed to ~5.7 s per request after sustained use — from *one* person. A class
   of 30 students hitting Run repeatedly would hit that far harder. The
   self-hosted box has no rate limit and stayed consistent throughout.

## The thing that would have broken a real class

Load-testing found a genuine showstopper. With **6 students running code at the
same moment, 5 of 6 got killed** — Java's default max heap is a quarter of the
machine's RAM (~980 MB *each*), so six JVMs asked for ~5.9 GB on a 3.9 GB box and
the kernel started killing them. At 15 and 30 concurrent, everything died.

Nobody would have noticed until a teacher put 30 kids on it at once, and then it
would have failed in front of the class.

Two fixes, both applied to the VM:

1. **Cap each JVM.** Piston's Java run script now uses
   `-Xmx192m -Xss512k -XX:TieredStopAtLevel=1 -XX:+UseSerialGC`. Student programs
   need nothing like 980 MB, and the startup flags also cut per-run time
   (1171 ms → 795 ms).
2. **Queue instead of dying.** `PISTON_MAX_CONCURRENT_JOBS=6`, so a 7th
   simultaneous request waits its turn rather than getting OOM-killed.

Result: **30/30 succeed** with a full class hitting Run simultaneously, taking
~26 s for the whole burst to clear.

Tuning note: raising the limit to 10 made it *slower* (32.7 s vs 25.8 s) — the
box only has 2 vCPUs, so extra parallelism just causes thrashing. 6 is the
measured sweet spot for this machine size.

Related fix in the app itself: lesson verification used to compile every step
simultaneously (a 12-step lesson = 12 concurrent JVMs), which tripped exactly
this problem and produced bogus "failures" that were really just load. It now
verifies in batches of 3.

## Lane order

1. `piston(self-hosted)` — your box, used first so free services aren't leaned on
2. `godbolt/java2102` — fallback
3. `godbolt/java2100` — fallback

A lane is skipped for 60 s after a **service** failure. A student's own code
failing to compile is a successful run and never triggers failover.

Check health any time: **Admin → Usage → Java runner → "Run a test program"**.

## Deploying it (Vercel)

The runner only works in production once Vercel knows about it. Two variables,
copied from `.env`:

- `PISTON_URL` = `https://34.27.153.29.nip.io/api/v2`
- `PISTON_TOKEN` = (the long random string in `.env`)

Vercel dashboard → your project → **Settings** → **Environment Variables** → add
both → **Redeploy**. Until then production quietly uses the godbolt lanes, which
still work.
