import { NextResponse } from "next/server";
import { resolveActor } from "@/lib/actor";
import { rateLimit } from "@/lib/ratelimit";
import { check } from "@/lib/ts/check";

// Type-check a TypeScript snippet, and hand back the compiled JavaScript.
//
// NO RUNNER. Unlike /api/run this reaches no external service: the compiler is
// a library in this process. So it costs nothing, cannot be down, and answers
// fast enough to run on every keystroke rather than on a button press.
//
// The browser executes the JavaScript, sandboxed. Nothing student-written runs
// on the server — this route only compiles.

// The compiler reads its lib files from disk, so this cannot run on the edge.
export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(req: Request) {
  const me = await resolveActor(req);
  if (!me) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  // Generous: this fires while typing, on a debounce. It exists to stop a
  // runaway loop, not to ration normal use.
  if (!rateLimit(`ts:${me.id}`, 240, 60 * 1000)) {
    return NextResponse.json({ error: "Slow down a moment." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : null;
  if (code === null) return NextResponse.json({ error: "code required" }, { status: 400 });
  if (code.length > 20_000) return NextResponse.json({ error: "too long" }, { status: 413 });

  return NextResponse.json(check(code));
}
