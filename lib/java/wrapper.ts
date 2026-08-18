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
