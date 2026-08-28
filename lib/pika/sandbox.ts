import { UNITS } from "./sandbox-fixture";

// The sandbox: the shape of the Pika endpoints, with nothing real behind them.
//
// WHY IT EXISTS. Building the Pika side against the live endpoints means first
// agreeing a shared secret, minting tokens, and having a real student with real
// progress — before anyone has seen whether the tab is even worth having. This
// removes all of that: fixed data, no token, open CORS, so a lessons tab can be
// built and clicked through on a laptop.
//
// IT TOUCHES NO DATABASE. Not "it filters out student data" — it cannot reach
// any. Every response is computed from a checked-in fixture of lesson codes and
// titles, which is public course content. There is nothing here to leak, which
// is exactly why it can be open.

export type Persona = "fresh" | "partway" | "done";
export const PERSONAS: Persona[] = ["fresh", "partway", "done"];

export function personaOf(url: URL): Persona {
  const p = url.searchParams.get("student");
  return (PERSONAS as string[]).includes(p || "") ? (p as Persona) : "partway";
}

/** Deterministic, so the same call always renders the same screen. */
function statusFor(persona: Persona, index: number, total: number): "MASTERED" | "IN_PROGRESS" | "NOT_STARTED" {
  if (persona === "fresh") return index === 0 ? "IN_PROGRESS" : "NOT_STARTED";
  if (persona === "done") return "MASTERED";
  const cut = Math.floor(total * 0.45);
  if (index < cut) return "MASTERED";
  if (index === cut) return "IN_PROGRESS";
  return "NOT_STARTED";
}

function readiness(status: string, index: number): number | null {
  if (status === "NOT_STARTED") return null;
  if (status === "MASTERED") return Number((0.82 + ((index * 37) % 17) / 100).toFixed(3));
  return Number((0.3 + ((index * 23) % 30) / 100).toFixed(3));
}

const flat = UNITS.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u.unit })));

export function summary(persona: Persona) {
  let i = 0;
  const total = flat.length;
  const units = UNITS.map((u) => {
    const lessons = u.lessons.map((l) => ({ code: l.code, title: l.title, status: statusFor(persona, i++, total) }));
    return {
      unit: u.unit,
      title: u.title,
      lessons,
      mastered: lessons.filter((l) => l.status === "MASTERED").length,
      total: lessons.length,
    };
  });
  return {
    student: { name: `Sandbox student (${persona})`, classroom: "sandbox-classroom" },
    units,
  };
}

export function results(persona: Persona) {
  const total = flat.length;
  return {
    results: flat.map((l, i) => {
      const status = statusFor(persona, i, total);
      return {
        lesson: l.code,
        title: l.title,
        status,
        // null, never 0, for a lesson nobody reached — the same rule the live
        // endpoint follows, because a gradebook that reads "not started" as
        // zero quietly destroys a real mark.
        score: readiness(status, i),
        completedAt: status === "MASTERED" ? new Date(Date.UTC(2026, 8, 1 + (i % 20))).toISOString() : null,
      };
    }),
  };
}

/** Wide open on purpose: there is no data here worth an allowlist. */
export const SANDBOX_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=60",
  "X-Sandbox": "fixture-data-no-database",
};
