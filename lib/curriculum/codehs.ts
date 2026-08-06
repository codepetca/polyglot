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
// Verified against the live course: the unit list, all 16 lesson titles in order,
// all 100 item titles in Unit 3, and — opened one by one — every graded exercise
// spec and every Check-for-Understanding quiz for lessons 3.1 through 3.15.
// Nothing here is inferred from the public catalogue any more. `unverified` is
// kept on the type for whoever extends this to Unit 4.

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
    exerciseSpecs: [
      { codehsCode: "3.2.4", name: "Our First Integer", requires: "Declare an int named year, set it to the current year, print it in a sentence. Grader requires the year and the word 'year' in the output." },
      { codehsCode: "3.2.5", name: "Answering Questions", requires: "Given four declarations (String / int / double / boolean) with the values missing, fill them so the program prints exactly: Karel the Dog / 11 / 75.3 / true — one per line." },
    ],
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
    exerciseSpecs: [
      { codehsCode: "3.5.4", name: "Casting to an Int", requires: "Starter already reads a double with readDouble(\"Please input your double: \"). Print the (int) cast of it." },
      { codehsCode: "3.5.5", name: "Casting to a Double", requires: "Starter reads two ints ('First Int: ', 'Second Int: '). Print their division as a double — 3 and 4 must give 0.75, so cast before dividing." },
      { codehsCode: "3.5.8", name: "Movie Ratings", requires: "Read a rating with readDouble(\"Please enter a movie rating: \"), round to nearest int using the (int)(x + 0.5) technique, print 'Rating rounded: N'. 3.5 must round up to 4." },
    ],
    cfu: [
      "what casting is — turning a value of one type into another",
      "that (int) 9.9 is 9, not 10 — casting chops, it never rounds",
    ],
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
    exerciseSpecs: [
      { codehsCode: "3.6.4", name: "Ice Cream", requires: "Ask with readBoolean whether they like ice cream, store it in a boolean, print it. Output: 'Do you like ice cream? true' then 'true' on the next line." },
    ],
    cfu: [
      "what a boolean is — a true/false value, not a number, char or String",
      "which literal IS a boolean: `true`, versus the distractors \"true\" (a String), 'F' (a char) and 10.1",
    ],
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
    exerciseSpecs: [
      { codehsCode: "3.7.4", name: "Roller Coaster", requires: "Read two booleans (tallEnough, oldEnough) with readBoolean, combine them with a logical operator so the rider is allowed only when BOTH are true, print true or false." },
    ],
    cfu: [
      "which symbol is a logical operator — ! (the distractors are ##, ** and %)",
      "evaluating true && !false → true",
    ],
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
    exerciseSpecs: [
      { codehsCode: "3.8.4", name: "Triple Double", requires: "Read points, rebounds and assists with three separate readInt calls. Set a boolean tripleDouble that is true only when all three are at least 10, then print 'Got a Triple Double? ' + tripleDouble." },
    ],
    cfu: [
      "which symbol is NOT a comparison operator — ? (the others are <, == and >=)",
      "that 80 >= 80 evaluates to true (boolean true, not the String \"true\")",
    ],
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
    exerciseSpecs: [
      { codehsCode: "3.9.4", name: "Repeat 1000 Times", requires: "Print 'Hello Karel' exactly 1000 times." },
      { codehsCode: "3.9.8", name: "Print The Odds", requires: "Print the odd numbers from 1 to 100." },
      { codehsCode: "3.9.11", name: "Factorial", requires: "Read a number with readInt, compute its factorial with a for loop (no built-in operator), print it. Sample: input 4 → 24." },
    ],
    cfu: [
      "why for loops exist — to repeat a FIXED number of times (vs while / if / break)",
      "which of four for-loop forms is syntactically correct",
      "counting iterations: for (int i = 0; i < n; i += 2) runs (n + 1) / 2 times — AP-style, harder than the rest of the unit",
    ],
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
    exerciseSpecs: [
      { codehsCode: "3.10.4", name: "Making Taffy", requires: "Print 'Starting Taffy Timer...', then keep reading a temperature with readInt until it reaches 270. Below 270 print \"The mixture isn't ready yet.\"; at 270+ print 'Your taffy is ready for the next step!' and stop." },
    ],
    cfu: [
      "why while loops exist — repeat WHILE a condition holds (vs a fixed count)",
      "that while(true) with no exit is an infinite loop",
    ],
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
    exerciseSpecs: [
      { codehsCode: "3.11.5", name: "Find the Minimum", requires: "Read three ints ('Enter first number: ' etc.) and print the smallest. Sample: 10, 15, 20 → 10." },
    ],
    cfu: [
      "why if statements exist — do something ONLY IF a condition is true (vs while / for / break)",
      "which if syntax is correct: `if(expr) { }` with round brackets and braces — not a colon, not square brackets, not a bare condition",
    ],
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
    exerciseSpecs: [
      { codehsCode: "3.12.4", name: "Guess the Number", requires: "THE EXAM CAPSTONE. secretNumber = 6 (the grader requires exactly 6). Print \"I'm thinking of a number between 1 and 10.\" and 'See if you can guess the number!', then keep reading 'Enter your guess: ' — printing 'Try again!' for each wrong guess — until the guess matches, then print 'Correct!'." },
    ],
    cfu: [
      "that `break;` is the statement that ends a loop early",
      "the loop-and-a-half shape: while(true) { code; if(condition) { break; } code; }",
    ],
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
    exerciseSpecs: [
      { codehsCode: "3.13.4", name: "Divisibility", requires: "Given working code that crashes when the divisor is 0, add a short-circuit guard so the division never runs. Prompts 'Enter the dividend: ' / 'Enter the divisor: '; messages 'X is divisible by Y!' and 'X is not divisible by Y'." },
    ],
    cfu: [
      "in true || (5 / 0 == 0), the right side is NOT evaluated",
      "in true && (5 / 0 == 0), the right side IS evaluated — true does not decide an &&",
    ],
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
    exerciseSpecs: [
      { codehsCode: "3.14.5", name: "Amusement Park", requires: "Rewrite two given lines in De Morgan form: cannotRide = !(oldEnough && tallEnough) and cannotSwim = !(canSwim || hasLifeJacket). Both variables must still appear in the result." },
    ],
    cfu: [
      "!(A && B) is equivalent to !A || !B",
      "!(A || B) is equivalent to !A && !B",
    ],
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
    exerciseSpecs: [
      { codehsCode: "3.15.4", name: "Three Strings", requires: "Read three strings with readLine ('First string? ' etc). Print whether the first joined to the second equals the third: 'pepper + mint is equal to peppermint!' or '... is not equal to ...!'." },
    ],
    cfu: [
      "what a String is — a sequence of characters",
      "that .equals() is the correct way to compare Strings, NOT ==",
    ],
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
 * The number the STUDENT sees. Always CodeHS's, never ours.
 *
 * The platform's own lesson codes are database keys, URL segments and progress
 * rows, so renaming them is a migration. But a student who sees "2.3" here and
 * "3.3" in CodeHS has to work out that they are the same lesson, and this
 * platform exists for students who give up at exactly that kind of friction.
 * So the internal code stays put and the display follows CodeHS.
 */
export function studentCode(code: string): string {
  return lessonSpec(code)?.codehsCode ?? code;
}

/**
 * Accept either numbering in a URL. A student who types or is given the CodeHS
 * number should land on the lesson, not a 404.
 */
export function resolveLessonCode(input: string): string {
  if (lessonSpec(input)) return input;
  return CODEHS_BASIC_JAVA.find((l) => l.codehsCode === input)?.code ?? input;
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
