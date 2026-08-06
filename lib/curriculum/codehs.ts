// The CodeHS course this platform mirrors, as data.
//
// WHY THIS FILE EXISTS: the owner's requirement is exact — "EVERY SINGLE concept
// in CodeHS is taught exactly as it is, and we do not teach anything extra."
// That is impossible to honour if the curriculum lives only in prose inside a
// prompt, because every lesson author (human or model) re-invents the boundary.
// So the boundary is data: what each lesson teaches, and — just as important —
// what it must NOT use yet because CodeHS hasn't covered it.
//
// SOURCE: CodeHS "AP Computer Science A (Mocha)" course, Unit 2 "Basic Java".
// Lesson list and objectives are from the publicly readable course outline and
// lesson-plan pages (codehs.com/course/apcsamocha/outline2 and /lessons).
// Objectives are paraphrased, not copied.
//
// KNOWN GAP: the per-item content (videos, Check-for-Understanding questions,
// example code, exercise specs) is behind a teacher login and is NOT reflected
// here. `exercises` lists CodeHS's exercise TITLES only — the specs are unknown.
// Anything marked `unverified` needs a logged-in pass to confirm.

export type CodeHSLesson = {
  code: string;
  title: string;
  /** What CodeHS says students should be able to do. */
  objectives: string[];
  /** Exact syntax, methods and operators introduced HERE. Nothing else is new. */
  teaches: string[];
  /** CodeHS's own exercise titles for this lesson (specs are login-gated). */
  exercises: string[];
  /** True when the content was checked against a logged-in view of the course. */
  unverified?: boolean;
};

export const CODEHS_UNIT2: CodeHSLesson[] = [
  {
    code: "2.1",
    title: "Printing in Java",
    objectives: [
      "call system class methods to produce console output",
      "tell apart the display behaviour of System.out.print and System.out.println",
      "create string literals",
    ],
    teaches: ["System.out.println", "System.out.print", "string literals (double quotes)"],
    exercises: ["Welcome Program", "ASCII Art"],
    unverified: true,
  },
  {
    code: "2.2",
    title: "Variables and Types",
    objectives: [
      "explain what variables are for",
      "declare, assign and initialise variables of different types",
      "find and fix errors in declarations and assignments",
      "use variables to store and change data",
    ],
    teaches: ["int", "double", "char", "boolean", "String", "declaration and assignment", "char uses single quotes", "case sensitivity", "naming rules"],
    exercises: ["Our First Integer", "Answering Questions"],
    unverified: true,
  },
  {
    code: "2.3",
    title: "User Input",
    objectives: [
      "read user input in a Java program",
      "choose the right input method for the kind of answer",
      "use an entered value in the rest of the program",
    ],
    teaches: ["readLine", "readInt", "readDouble", "readBoolean", "the prompt is an argument, not a separate print"],
    exercises: ["About You", "Poetry"],
  },
  {
    code: "2.4",
    title: "Arithmetic Expressions",
    objectives: [
      "perform arithmetic and evaluate expressions",
      "understand how types affect a calculation",
      "recognise round-off error and integer overflow",
      "write programs that solve arithmetic problems",
    ],
    teaches: ["+", "-", "*", "/", "%", "order of operations", "integer division", "double division", "mixed division", "++", "--", "+=", "-=", "*=", "/=", "round-off error", "integer overflow"],
    exercises: ["Weight of a Pyramid", "Add Fractions"],
    unverified: true,
  },
  {
    code: "2.5",
    title: "Casting",
    objectives: [
      "apply type casting",
      "cast between int and double in both directions",
      "use casting to solve maths problems",
      "work out how casting changes an arithmetic result",
    ],
    teaches: ["(int) cast", "(double) cast", "casting and order of operations", "rounding using casting"],
    exercises: ["Casting to an Int", "Casting to a Double", "Movie Ratings"],
    unverified: true,
  },
  {
    code: "2.6",
    title: "Booleans",
    objectives: [
      "create boolean variables",
      "use boolean expressions in conditions",
      "use boolean logic to control program flow",
    ],
    teaches: ["boolean variables", "true", "false", "boolean expressions"],
    exercises: ["Ice Cream"],
    unverified: true,
  },
  {
    code: "2.7",
    title: "Logical Operators",
    objectives: [
      "use logical operators",
      "combine conditions with &&, || and !",
      "debug logical statements",
    ],
    teaches: ["&&", "||", "!"],
    exercises: ["Roller Coaster"],
    unverified: true,
  },
  {
    code: "2.8",
    title: "Comparison Operators",
    objectives: [
      "use comparison operators",
      "write conditions that compare values",
      "apply comparisons to real problems",
    ],
    teaches: ["==", "!=", ">", "<", ">=", "<="],
    exercises: ["Triple Double"],
    unverified: true,
  },
  {
    code: "2.9",
    title: "For Loops",
    objectives: [
      "write basic for loops",
      "control the start, end and step of a loop",
      "use loops to count, sum and iterate over ranges",
      "debug and analyse loop code",
    ],
    teaches: ["for loop", "initialise / condition / increment", "i++", "i--", "i += 2", "loop variable scope"],
    exercises: ["Repeat 1000 Times", "Print The Odds", "Factorial"],
    unverified: true,
  },
  {
    code: "2.10",
    title: "While Loops",
    objectives: [
      "understand while-loop structure",
      "write and debug while loops",
      "avoid infinite loops",
      "compare while loops with for loops",
    ],
    teaches: ["while loop", "infinite loops", "when to prefer while over for"],
    exercises: ["Making Taffy"],
    unverified: true,
  },
  {
    code: "2.11",
    title: "If Statements",
    objectives: [
      "use if statements to control program flow",
      "nest if statements",
      "use the modulus operator and string methods in conditions",
    ],
    teaches: ["if", "else", "nested if", "% in conditions", "string methods in conditions"],
    exercises: ["Find the Minimum"],
    unverified: true,
  },
  {
    code: "2.12",
    title: "Loop-and-a-Half",
    objectives: [
      "implement the loop-and-a-half structure",
      "compare it with a plain while loop",
      "apply it to practical problems",
    ],
    teaches: ["while (true) with break", "sentinel values"],
    exercises: ["Guess the Number"],
    unverified: true,
  },
  {
    code: "2.13",
    title: "Short-Circuit Evaluation",
    objectives: [
      "understand short-circuit evaluation",
      "use it to avoid unnecessary work and crashes",
      "modify existing code to short-circuit",
    ],
    teaches: ["short-circuit && and ||", "truth tables"],
    exercises: ["Divisibility"],
    unverified: true,
  },
  {
    code: "2.14",
    title: "De Morgan's Laws",
    objectives: [
      "explain De Morgan's Laws",
      "simplify boolean expressions with them",
      "compare equivalent boolean expressions",
    ],
    teaches: ["!(a && b) == !a || !b", "!(a || b) == !a && !b"],
    exercises: ["Amusement Park"],
    unverified: true,
  },
  {
    code: "2.15",
    title: "Strings",
    objectives: [
      "create and manipulate String variables",
      "compare Strings with .equals()",
      "use String operations to solve problems",
    ],
    teaches: ["String variables", ".equals()", "why == is wrong for Strings"],
    exercises: ["Three Strings"],
    unverified: true,
  },
];

const ORDER = CODEHS_UNIT2.map((l) => l.code);

/** Everything CodeHS has already taught by the time this lesson starts. */
export function taughtBefore(code: string): string[] {
  const i = ORDER.indexOf(code);
  if (i <= 0) return [];
  return CODEHS_UNIT2.slice(0, i).flatMap((l) => l.teaches);
}

/** Everything CodeHS has NOT taught yet — a lesson must not use any of it. */
export function notYetTaught(code: string): string[] {
  const i = ORDER.indexOf(code);
  if (i < 0) return [];
  return CODEHS_UNIT2.slice(i + 1).flatMap((l) => l.teaches);
}

export function lessonSpec(code: string): CodeHSLesson | undefined {
  return CODEHS_UNIT2.find((l) => l.code === code);
}

/**
 * The curriculum boundary for one lesson, as prompt text. This is what stops a
 * generated lesson from quietly reaching forward into a later concept — the
 * single most common way "aligned" content stops being aligned.
 */
export function curriculumBrief(code: string): string {
  const l = lessonSpec(code);
  if (!l) return "";
  const before = taughtBefore(code);
  const after = notYetTaught(code);
  return [
    `CURRICULUM: this platform mirrors CodeHS "AP Computer Science A (Mocha)", Unit 2 (Basic Java). Lesson ${l.code} is "${l.title}".`,
    ``,
    `CodeHS's objectives for this lesson — teach these and only these:`,
    ...l.objectives.map((o) => `  - ${o}`),
    ``,
    `NEW in this lesson (introduce each one explicitly): ${l.teaches.join(", ")}.`,
    before.length ? `ALREADY TAUGHT (free to use, but don't re-teach): ${before.join(", ")}.` : `NOTHING has been taught before this lesson. Assume zero Java knowledge.`,
    after.length ? `NOT TAUGHT YET — must not appear anywhere in this lesson, not even in a code example the student only reads: ${after.join(", ")}.` : ``,
    ``,
    `INPUT: CodeHS does not use Scanner. Read input with readLine("prompt"), readInt("prompt"), readDouble("prompt"), readBoolean("prompt") — the prompt is the argument, never a separate System.out.print.`,
    `Do not add anything CodeHS does not cover, however useful it seems. No String.repeat, no printf, no Math methods, no ternary, no switch, unless it is listed above.`,
  ]
    .filter(Boolean)
    .join("\n");
}
