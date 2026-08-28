// The languages the runner knows about.
//
// ONE PLACE, so adding a third is a table entry rather than a search. Until
// now "java" was written into two lines of piston.ts and everything else simply
// assumed it — which is fine right up until it isn't.
//
// HONEST LIMITATION, stated here rather than discovered later: the Compiler
// Explorer lane is Java-only. It is configured with Java compiler ids and its
// executor request is shaped for them. So anything that is not Java runs ONLY
// on a self-hosted Piston, and without PISTON_URL it cannot run at all. That is
// a deployment fact, not a bug, and the run route says so in plain words rather
// than failing with a lane error nobody can act on.

export type LangId = "java" | "typescript";

export interface LangSpec {
  id: LangId;
  label: string;
  /** Piston's own language id. */
  piston: string;
  pistonVersion: string;
  filename: string;
  /** Java needs a class and a main(); TypeScript needs nothing around it. */
  wraps: boolean;
  /** False when the Compiler Explorer fallback cannot serve this language. */
  godbolt: boolean;
  /** What the scratchpad starts you with. */
  starter: string;
}

export const LANGS: Record<LangId, LangSpec> = {
  java: {
    id: "java",
    label: "Java",
    piston: "java",
    pistonVersion: process.env.PISTON_JAVA_VERSION || "15.0.2",
    filename: "Main.java",
    wraps: true,
    godbolt: true,
    // CODEHS PARITY: this course teaches readLine, never Scanner.
    starter: 'String name = readLine("Your name? ");\nSystem.out.println("Hi, " + name + "!");',
  },
  typescript: {
    id: "typescript",
    label: "TypeScript",
    piston: "typescript",
    pistonVersion: process.env.PISTON_TS_VERSION || "5.0.3",
    filename: "main.ts",
    wraps: false,
    godbolt: false,
    starter: 'const names: string[] = ["Ada", "Ben", "Mia"];\n\nfor (const n of names) {\n  console.log(`Hi, ${n}!`);\n}',
  },
};

export const DEFAULT_LANG: LangId = "java";

export function isLangId(v: unknown): v is LangId {
  return typeof v === "string" && v in LANGS;
}

export function langOf(v: unknown): LangSpec {
  return LANGS[isLangId(v) ? v : DEFAULT_LANG];
}
