// The CodeHS course this platform mirrors, as data.
//
// WHY THIS FILE EXISTS: the owner's requirement is exact — "EVERY SINGLE concept
// in CodeHS is taught exactly as it is, and we do not teach anything extra."
// That is impossible to honour if the curriculum lives only in prose inside a
// prompt, because every lesson author (human or model) re-invents the boundary.
// So the boundary is data: what each lesson teaches, and — just as important —
// what it must NOT use yet because CodeHS hasn't covered it.
//
// SOURCE: the owner's own CodeHS course "Mocha CS" (teacher_course_id 562034),
// read directly from a logged-in teacher session, plus the public course outline
// and lesson-plan pages. Objectives are paraphrased, not copied.
//
// NUMBERING — READ THIS BEFORE "FIXING" ANYTHING. In the owner's course, Basic
// Java is **Unit 3**, and its lessons are numbered 3.1–3.16. It is Unit 2 only in
// CodeHS's public catalogue, because the owner's course inserts "Java Pretest" as
// Unit 1 and appends "Java Posttest" as Unit 12. The `code` field below is what
// THIS platform calls the lesson; `codehsCode` is what the student sees in
// CodeHS. Item numbering follows the CodeHS one (e.g. exercise 3.3.4 About You).
//
// Verified against the live course: unit list, all 16 lesson titles in order, and
// all 100 item titles in Unit 3. Lessons carrying `unverified` have had their
// per-item content (Check-for-Understanding questions, example code, exercise
// specs) NOT yet opened; the others have.

export type CodeHSLesson = {
  /** What this platform calls the lesson. */
  code: string;
  /** What the student sees in the owner's CodeHS course. */
  codehsCode: string;
  title: string;
  /** What CodeHS says students should be able to do. */
  objectives: string[];
  /** Exact syntax, methods and operators introduced HERE. Nothing else is new. */
  teaches: string[];
  /** CodeHS's own exercise titles for this lesson. */
  exercises: string[];
  /** Condensed specs for the graded exercises, read from the live course. */
  exerciseSpecs?: { codehsCode: string; name: string; requires: string }[];
  /** What the Check-for-Understanding quiz actually tests. */
  cfu?: string[];
  /** True when the content was checked against a logged-in view of the course. */
  unverified?: boolean;
};

export const CODEHS_BASIC_JAVA: CodeHSLesson[] = [
  {
    code: "2.1",
    codehsCode: "3.1",
    title: "Printing in Java",
    objectives: [
      "call system class methods to produce console output",
      "tell apart the display behaviour of System.out.print and System.out.println",
      "create string literals",
    ],
    // NOTE: `+` here is string concatenation, which every later lesson needs for
    // output. Numeric `+` is 2.4. Keeping them separate stops notYetTaught()
    // from forbidding "Name is: " + name in lessons 2.2–2.3, which is exactly
    // what CodeHS's own 3.3.3 example does.
    teaches: ["System.out.println", "System.out.print", "string literals (double quotes)", "string concatenation with +", "escape sequences \\n \\t \\\" \\\\"],
    exercises: ["Welcome Program", "ASCII Art"],
    exerciseSpecs: [
      { codehsCode: "3.1.5", name: "Welcome Program", requires: "Print two lines with println: a name line and a fun-fact line. Grader requires the word 'name' on line 1 and 'like' on line 2." },
      { codehsCode: "3.1.6", name: "ASCII Art", requires: "Reproduce a given drawing exactly with println. The drawing contains backslashes, so students must escape them as \\\\." },
    ],
    cfu: [
      "which of four spellings actually prints (System.out.println, vs printLine / System.println / bare print)",
      "that two printlns produce two lines",
    ],
  },
  {
    code: "2.2",
    codehsCode: "3.2",
    title: "Variables and Types",
    objectives: [
      "explain what variables are for",
      "declare, assign and initialise variables of different types",
      "find and fix errors in declarations and assignments",
      "use variables to store and change data",
    ],
    teaches: ["int", "double", "char", "boolean", "String", "declaration and assignment", "char uses single quotes", "case sensitivity", "naming rules"],
    exercises: ["Our First Integer", "Answering Questions"],
    cfu: [
      "which of int / char / boolean / double / apple is NOT a primitive type — char IS examinable here",
      "which form correctly declares AND initialises (`int myNumber = 10;`)",
    ],
  },
  {
    code: "2.3",
    codehsCode: "3.3",
    title: "User Input",
    objectives: [
      "read user input in a Java program",
      "choose the right input method for the kind of answer",
      "use an entered value in the rest of the program",
    ],
    teaches: ["readLine", "readInt", "readDouble", "readBoolean", "the prompt is an argument, not a separate print"],
    exercises: ["About You", "Poetry"],
    exerciseSpecs: [
      { codehsCode: "3.3.4", name: "About You", requires: "Ask favourite food, colour and movie, then print the three answers on their own lines. Sample output shows prompt and answer on the SAME line — which is what readLine does." },
      { codehsCode: "3.3.5", name: "Poetry", requires: "Print a 3-line haiku, then a 5-line acrostic, then read one line of the user's own poem and print it back." },
    ],
    cfu: [
      "which input method does NOT exist — readChar is the distractor; only readLine/readInt/readDouble/readBoolean are real",
      "that readInt returns a number, so printing it shows 10 and not the variable name or a quoted string",
    ],
  },
  {
    code: "2.4",
    codehsCode: "3.4",
    title: "Arithmetic Expressions",
    objectives: [
      "perform arithmetic and evaluate expressions",
      "understand how types affect a calculation",
      "recognise round-off error and integer overflow",
      "write programs that solve arithmetic problems",
    ],
    teaches: ["+ for numeric addition", "-", "*", "/", "%", "order of operations", "integer division", "double division", "mixed division", "++", "--", "+=", "-=", "*=", "/=", "round-off error", "integer overflow"],
    exercises: ["Weight of a Pyramid", "Add Fractions"],
    exerciseSpecs: [
      { codehsCode: "3.4.5", name: "Weight of a Pyramid", requires: "Read a block count, multiply by 2.5 tons, print the total. Sample: 2500000 blocks → 'The pyramid weighs 6250000 tons'." },
      { codehsCode: "3.4.6", name: "Add Fractions", requires: "Read 4 ints (two numerator/denominator pairs), add via (ad+bc)/bd, print as 'The sum of 1/2 + 2/5 = 9/10'. No reducing required." },
    ],
    cfu: [
      "evaluating a modulus expression (150 % 100)",
      "which symbol is NOT a Java arithmetic operator (# is the distractor)",
    ],
  },
  {
    code: "2.5",
    codehsCode: "3.5",
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
    codehsCode: "3.6",
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
    codehsCode: "3.7",
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
    codehsCode: "3.8",
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
    codehsCode: "3.9",
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
    codehsCode: "3.10",
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
    codehsCode: "3.11",
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
    codehsCode: "3.12",
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
    codehsCode: "3.13",
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
    codehsCode: "3.14",
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
    codehsCode: "3.15",
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

const ORDER = CODEHS_BASIC_JAVA.map((l) => l.code);

/** Everything CodeHS has already taught by the time this lesson starts. */
export function taughtBefore(code: string): string[] {
  const i = ORDER.indexOf(code);
  if (i <= 0) return [];
  return CODEHS_BASIC_JAVA.slice(0, i).flatMap((l) => l.teaches);
}

/** Everything CodeHS has NOT taught yet — a lesson must not use any of it. */
export function notYetTaught(code: string): string[] {
  const i = ORDER.indexOf(code);
  if (i < 0) return [];
  return CODEHS_BASIC_JAVA.slice(i + 1).flatMap((l) => l.teaches);
}

export function lessonSpec(code: string): CodeHSLesson | undefined {
  return CODEHS_BASIC_JAVA.find((l) => l.code === code);
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
    `CURRICULUM: this platform mirrors the "Basic Java" unit of CodeHS "AP Computer Science A (Mocha)". This lesson is "${l.title}" — ${l.codehsCode} in CodeHS, ${l.code} here.`,
    ``,
    `CodeHS's objectives for this lesson — teach these and only these:`,
    ...l.objectives.map((o) => `  - ${o}`),
    ``,
    `NEW in this lesson (introduce each one explicitly): ${l.teaches.join(", ")}.`,
    before.length ? `ALREADY TAUGHT (free to use, but don't re-teach): ${before.join(", ")}.` : `NOTHING has been taught before this lesson. Assume zero Java knowledge.`,
    after.length ? `NOT TAUGHT YET — must not appear anywhere in this lesson, not even in a code example the student only reads: ${after.join(", ")}.` : ``,
    ``,
    l.cfu?.length ? `CodeHS's own Check-for-Understanding quiz tests: ${l.cfu.join("; ")}. Make sure a student who finishes this lesson can answer that.` : ``,
    l.exerciseSpecs?.length
      ? `CodeHS's graded exercises for this lesson — the write step should build toward these, not something unrelated:\n${l.exerciseSpecs.map((e) => `  - ${e.codehsCode} ${e.name}: ${e.requires}`).join("\n")}`
      : ``,
    ``,
    `INPUT: CodeHS does not use Scanner. Read input with readLine("prompt"), readInt("prompt"), readDouble("prompt"), readBoolean("prompt") — the prompt is the argument, never a separate System.out.print.`,
    `Do not add anything CodeHS does not cover, however useful it seems. No String.repeat, no printf, no Math methods, no ternary, no switch, unless it is listed above.`,
  ]
    .filter(Boolean)
    .join("\n");
}
