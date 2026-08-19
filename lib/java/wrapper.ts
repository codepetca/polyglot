// The beginner wrapper, kept PURE on purpose.
//
// Students write only the body of main(); this supplies the class, the entry
// point and CodeHS's four input methods. It lives apart from piston.ts — which
// is server-only because it holds the runner token — so that the lesson
// authoring CLI can wrap snippets with the EXACT same header the site uses.
// If these ever drifted, a lesson could verify green on a teammate's laptop and
// then behave differently in the app, which is the one failure the compiler
// gate exists to prevent.
//
// CODEHS PARITY: CodeHS does not teach Scanner. Its programs extend
// ConsoleProgram and read input with readLine / readInt / readDouble /
// readBoolean, each taking the PROMPT as an argument.
//
// ECHO: CodeHS runs these in a console where the student TYPES, so the answer
// appears after the prompt. Here input arrives on stdin and would never be
// shown, so __rd prints what it read. Verified against CodeHS's own "About You"
// sample transcript, character for character.
export const HEADER = `import java.util.Scanner;
class Main {
    static Scanner __sc = new Scanner(System.in);
    static String __rd(String p){ System.out.print(p); String v = __sc.nextLine(); System.out.println(v); return v; }
    static String readLine(String p){ return __rd(p); }
    static int readInt(String p){ return Integer.parseInt(__rd(p).trim()); }
    static double readDouble(String p){ return Double.parseDouble(__rd(p).trim()); }
    static boolean readBoolean(String p){ return Boolean.parseBoolean(__rd(p).trim()); }
    public static void main(String[] args) {
`;

export const FOOTER = `
    }
}`;

/** Wrap a student snippet, and report how many lines were added above it. */
export function wrap(code: string): { source: string; offset: number } {
  return { source: HEADER + code + FOOTER, offset: HEADER.split("\n").length - 1 };
}

// ─── Methods mode (Unit 4 onward) ────────────────────────────────────────────
//
// Java has no nested methods, so a student cannot DEFINE a method inside the
// body of main(). The beginner wrapper puts their code there, which makes the
// entire Methods unit unwritable — the first lesson that says "write your own
// method" would not compile.
//
// So this mode places the student's code at CLASS level instead, and calls
// run() on an instance. That is exactly CodeHS's shape: a run() method plus
// whatever other instance methods they write. The readers stay static so they
// are callable from any of them.
export const HEADER_METHODS = `import java.util.Scanner;
class Main {
    static Scanner __sc = new Scanner(System.in);
    static String __rd(String p){ System.out.print(p); String v = __sc.nextLine(); System.out.println(v); return v; }
    static String readLine(String p){ return __rd(p); }
    static int readInt(String p){ return Integer.parseInt(__rd(p).trim()); }
    static double readDouble(String p){ return Double.parseDouble(__rd(p).trim()); }
    static boolean readBoolean(String p){ return Boolean.parseBoolean(__rd(p).trim()); }
    public static void main(String[] args) { new Main().run(); }
`;

export const FOOTER_METHODS = `
}`;

export type WrapMode = "beginner" | "methods";

/** Wrap a student snippet, and report how many lines were added above it. */
export function wrapAs(code: string, mode: WrapMode = "beginner"): { source: string; offset: number } {
  const head = mode === "methods" ? HEADER_METHODS : HEADER;
  const foot = mode === "methods" ? FOOTER_METHODS : FOOTER;
  return { source: head + code + foot, offset: head.split("\n").length - 1 };
}
