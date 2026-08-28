import ts from "typescript";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

// Type-check and compile a snippet, in this process.
//
// WHY NOT THE CODE RUNNER. Java needs a compiler on a machine somewhere, which
// is why there is a Piston lane and a Compiler Explorer fallback and a health
// check for both. TypeScript's compiler is a library we already depend on, so
// checking a snippet is a function call — about 30ms — with no network, no
// runner, no cost, and nothing to be down.
//
// It also means a type error can be shown WHILE THE STUDENT TYPES rather than
// after they press Run. That is the one thing this language can do that Java
// cannot, and the `live` step kind is built on it.

export interface Diag {
  /** 1-based, so it matches what the editor gutter shows. */
  line: number;
  col: number;
  length: number;
  message: string;
  code: number;
}
export interface CheckResult {
  ok: boolean;
  diagnostics: Diag[];
  /** The compiled JavaScript, for the browser to run. Empty when it will not compile. */
  js: string;
}

const FILE = "student.ts";
const GLOBALS = "globals.d.ts";

// THE TEACHING SURFACE, DECLARED EXPLICITLY.
//
// lib.es2020 has no console — that lives in lib.dom or @types/node. Pulling in
// lib.dom would fix it and also hand a beginner document, window, fetch and
// several thousand other names, none of which this course teaches and all of
// which would autocomplete.
//
// So the globals are written out instead. What is declared here is what exists,
// which makes the environment part of the lesson design rather than an accident
// of which lib file got loaded.
const GLOBAL_SRC = `
declare const console: {
  log(...values: any[]): void;
  error(...values: any[]): void;
};
`;

// STRICT ON PURPOSE. With strict off, noImplicitAny is off, null is assignable
// to everything, and roughly half the errors a lesson is built to demonstrate
// simply never fire. A teaching checker that is more permissive than the real
// thing teaches the wrong language.
const OPTIONS: ts.CompilerOptions = {
  strict: true,
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  lib: ["lib.es2020.d.ts"],
  noEmitOnError: false,
  skipLibCheck: true,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
};

// The lib files live next to the compiler. Read once and cached: they are a few
// hundred KB and re-reading them per keystroke would dominate the cost.
let libDirCached = "";
function libDir(): string {
  if (!libDirCached) libDirCached = dirname(createRequire(import.meta.url).resolve("typescript"));
  return libDirCached;
}
const libCache = new Map<string, ts.SourceFile>();
function lib(name: string): ts.SourceFile | undefined {
  if (libCache.has(name)) return libCache.get(name);
  try {
    const sf = ts.createSourceFile(name, readFileSync(join(libDir(), name), "utf8"), ts.ScriptTarget.ES2020, true);
    libCache.set(name, sf);
    return sf;
  } catch {
    return undefined;
  }
}

export function check(code: string): CheckResult {
  const source = ts.createSourceFile(FILE, code, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS);
  const globals = ts.createSourceFile(GLOBALS, GLOBAL_SRC, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS);
  let js = "";

  const host: ts.CompilerHost = {
    getSourceFile: (name) => (name === FILE ? source : name === GLOBALS ? globals : lib(name)),
    getDefaultLibFileName: () => "lib.es2020.d.ts",
    writeFile: (name, text) => { if (name.includes("student")) js = text; },
    getCurrentDirectory: () => "/",
    getCanonicalFileName: (f) => f,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
    fileExists: (name) => name === FILE || name === GLOBALS || Boolean(lib(name)),
    readFile: (name) => (name === FILE ? code : name === GLOBALS ? GLOBAL_SRC : undefined),
  };

  const program = ts.createProgram([GLOBALS, FILE], OPTIONS, host);
  const emit = program.emit();
  const raw = [
    ...program.getSyntacticDiagnostics(source),
    ...program.getSemanticDiagnostics(source),
    ...emit.diagnostics,
  ];

  const diagnostics: Diag[] = raw
    .filter((d) => d.file?.fileName === FILE && d.start !== undefined)
    .map((d) => {
      const { line, character } = source.getLineAndCharacterOfPosition(d.start!);
      return {
        line: line + 1,
        col: character + 1,
        length: d.length || 1,
        message: ts.flattenDiagnosticMessageText(d.messageText, " "),
        code: d.code,
      };
    })
    // Same position, same message twice is noise — emit and semantic passes
    // both report some errors.
    .filter((d, i, a) => a.findIndex((x) => x.line === d.line && x.col === d.col && x.code === d.code) === i)
    .sort((a, b) => a.line - b.line || a.col - b.col);

  return { ok: diagnostics.length === 0, diagnostics, js };
}
