// Which wrapper a snippet needs, worked out from the snippet itself.
//
// WHY THIS EXISTS INSTEAD OF A BUTTON. The scratchpad used to carry a
// main/methods toggle, because Java forbids declaring a method or a class
// inside another method and the beginner wrapper puts everything inside main().
// A student who typed `class Player { ... }` in the wrong mode got
// "illegal start of expression", which tells them nothing about the real
// problem — the wrapper they cannot see.
//
// Asking them to know which mode they are in is asking them to understand the
// wrapper before they understand classes. So the editor decides: if the code
// declares a class, an interface or a method, it belongs at class level.

/** Strip strings, chars and comments so their contents cannot match. */
function stripLiterals(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
}

const DECLARES_TYPE = /(^|\n)\s*(?:(?:public|private|protected|final|abstract|static|sealed)\s+)*(?:class|interface|enum|record)\s+[A-Za-z_$]/;

// A method declaration at the start of a line: modifiers, a return type, a
// name, a parameter list, then an opening brace. Deliberately requires the
// modifier — `if (x) {` and `for (...) {` must not match.
const DECLARES_METHOD = /(^|\n)\s*(?:public|private|protected)\s+(?:static\s+)?(?:abstract\s+)?[A-Za-z_$][\w<>\[\],.\s]*\s+[A-Za-z_$]\w*\s*\([^;{]*\)\s*(?:throws\s+[\w.,\s]+)?\{/;

/**
 * True when the snippet must be compiled at class level.
 *
 * Verified against the real compiler: two classes plus client code, and
 * inheritance with an interface, both build in methods mode and both fail in
 * beginner mode with "illegal start of expression".
 */
export function needsMethodsMode(code: string): boolean {
  const c = stripLiterals(code);
  return DECLARES_TYPE.test(c) || DECLARES_METHOD.test(c);
}

/**
 * The methods wrapper calls run(). A snippet that declares only classes has no
 * run(), so one is added — otherwise defining a class and pressing Run fails on
 * a missing method the student never heard of.
 */
export function ensureRun(code: string): string {
  return /(^|\n)\s*(?:public\s+)?void\s+run\s*\(\s*\)/.test(stripLiterals(code))
    ? code
    : `${code}\n\npublic void run() {\n}`;
}
