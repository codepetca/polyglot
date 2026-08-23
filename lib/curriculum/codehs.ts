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
    // CORRECTION: this list used to include escape sequences and string
    // concatenation. Neither is justified here.
    //   - Escapes: 3.1's quiz tests only println spelling and that two printlns
    //     make two lines. Both exercises are solvable with plain printlns —
    //     ASCII Art's drawing is all FORWARD slashes, so nothing needs escaping.
    //     (An earlier version of this file claimed the opposite. It was wrong.)
    //   - Concatenation: you need a variable before joining text to anything is
    //     useful, and 3.2.4 Our First Integer is the first exercise that
    //     requires it. So it belongs to 2.2, and is listed there.
    // CONFIRMED from the live course: 3.1.4 "Printing Multiple Lines" is two
    // plain printlns ("Hello world." / "Another line") with no \n anywhere. The
    // multiple-lines idea is taught by stacking printlns, not by escaping.
    teaches: ["System.out.println", "System.out.print", "string literals (double quotes)", 'println("") for a blank line'],
    exercises: ["Welcome Program", "ASCII Art"],
    exerciseSpecs: [
      { codehsCode: "3.1.5", name: "Welcome Program", requires: "Print two lines with println: a name line and a fun-fact line. Grader requires the word 'name' on line 1 and 'like' on line 2." },
      { codehsCode: "3.1.6", name: "ASCII Art", requires: "Reproduce a given drawing exactly, one println per line. The drawing is all forward slashes and spaces — nothing needs escaping. Leading spaces go inside the quotes." },
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
    // Concatenation lives here, not 2.1: joining text is only useful once there
    // is a variable to join, and 3.2.4 Our First Integer is the first exercise
    // that needs it. Numeric `+` is different and stays in 2.4.
    teaches: ["int", "double", "char", "boolean", "String", "declaration and assignment", "char uses single quotes", "case sensitivity", "naming rules", "string concatenation with +"],
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

// ─── Unit 4: Methods ─────────────────────────────────────────────────────────
//
// Objectives are from the public lesson plans (scripts/syllabus.mjs). The
// `teaches` lists are derived from those objectives, NOT read from the course —
// exercise specs and quiz questions for this unit are still login-gated, so
// every entry is marked unverified until someone opens the items.
//
// Numbering: ours continues from Basic Java's 2.x, so Methods is 3.x here and
// 4.x for the student.
export const CODEHS_METHODS: CodeHSLesson[] = [
  {
    code: "3.1",
    codehsCode: "4.1",
    title: "Java Methods",
    objectives: ["Explain the purpose of methods", "Create their own methods", "Utilize methods to solve simple problems"],
    teaches: ["defining a method", "calling a method", "void methods"],
    exercises: ["Print Line Break", "Print Karel"],
    cfu: [
      "why we use methods — break the program into parts, avoid repeating code, and make it readable (the answer is 'all of the above')",
    ],
  },
  {
    code: "3.2",
    codehsCode: "4.2",
    title: "Methods and Parameters",
    objectives: ["Explore code examples that include methods and parameters", "Write methods that take parameters as inputs", "Apply knowledge of methods and parameters to solve coding exercises"],
    teaches: ["parameters", "arguments", "methods with multiple parameters"],
    exercises: ["Line Breaks with Parameters", "Sum", "Product", "Add10", "Countdown From", "Repeating Message"],
    exerciseSpecs: [
      { codehsCode: "4.2.4", name: "Sum", requires: "Example: private void sum(int a, int b) prints a + b; run() calls sum(2, 2) and sum(10, 400). NOTE CodeHS writes helper methods as `private`, not `public`." },
    ],
    cfu: [
      "what parameters are — the formal names given to the data passed into a method (not the return value, not what it prints)",
    ],
  },
  {
    code: "3.3",
    codehsCode: "4.3",
    title: "Methods and Return Values",
    objectives: ["Explain the purpose of returning a value from a method", "Create methods that return values", "Create programs that call methods with return values and store the result for later use", "Practice creating methods to perform specific calculations", "Apply method concepts to solve coding exercises"],
    teaches: ["return values", "the return keyword", "non-void return types", "storing a returned value"],
    exercises: ["Return Value", "Double Number", "Square", "Average"],
    exerciseSpecs: [
      { codehsCode: "4.3.4", name: "Double Number", requires: "UNIT-TESTED, not output-matched. The student is given only `public int doubleNumber(int x)` and must return 2 * x. CodeHS runs test cases against the method; there is no println and no ConsoleProgram." },
    ],
  },
  {
    code: "3.4",
    codehsCode: "4.4",
    title: "Javadocs and More Methods",
    objectives: ["Demonstrate an understanding of the purpose and syntax of Javadoc comments", "Analyze a given program for proper documentation", "Compare and contrast programs with good documentation against programs with poor documentation", "Write methods that perform specific calculations and return values", "Use Javadoc comments to document methods"],
    teaches: ["Javadoc comments", "/** */", "@param", "@return"],
    exercises: ["Javadoc Sum", "Is in Range", "Sum Range", "Is Divisible", "Fahrenheit to Celsius"],
    exerciseSpecs: [
      { codehsCode: "4.4.4", name: "Is in Range", requires: "UNIT-TESTED. Signature is fixed: public boolean inRange(int num, int min, int max). Returns true when num is between min and max INCLUSIVE. The starter already contains an empty Javadoc block for the student to fill in." },
    ],
  },
  {
    code: "3.5",
    codehsCode: "4.5",
    title: "Strings Methods",
    objectives: ["Read documentation for how to use the methods of the String class", "Either in the DOCS tab in the CodeHS editor, or elsewhere online", "Call methods on String objects to get information about the string, such as length or characters at given indices", "Utilize String methods to create programs that manipulate strings in different ways"],
    teaches: [".length()", ".substring()", ".indexOf()", ".charAt()", ".toUpperCase()", ".toLowerCase()", "looping through a String"],
    exercises: ["Looping Over a String", "Yelling", "Porky Pig", "Triple String", "Full Name", "Repeating String"],
    exerciseSpecs: [
      { codehsCode: "4.5.4", name: "Yelling", requires: "UNIT-TESTED. Signature is fixed: public String yell(String statement). Returns the text in capitals — yell(\"hello\") returns \"HELLO\". CodeHS hints at .toUpperCase()." },
    ],
  },
  {
    code: "3.6",
    codehsCode: "4.6",
    title: "Strings and Characters",
    objectives: ["Demonstrate an understanding of the differences between Strings and characters", "Examine how characters can be treated as numbers through their ASCII values", "Practice converting between char values and int values", "Print out special characters like quotes and new lines using escape sequence chars (such as", "Utilize Character class methods"],
    teaches: ["char vs String", "ASCII values", "casting char to int", "escape sequences \\\\n \\\\\" \\\\\\\\", "Character class methods"],
    exercises: ["Chars are Numbers", "Escape Sequences", "Character Methods", "Is it an Integer?"],
    exerciseSpecs: [
      { codehsCode: "4.6.5", name: "Is it an Integer?", requires: "UNIT-TESTED. Signature is fixed: public boolean isInteger(String str). True when EVERY character is a digit. CodeHS hints at Character.isDigit(). \"123\" is true, \"hello\" is false." },
    ],
  },
  {
    code: "3.7",
    codehsCode: "4.7",
    title: "Exceptions",
    objectives: ["Demonstrate an understanding of syntax errors, compiler errors, run-time errors, and logic errors", "Identify arithmetic exceptions", "Use comments to identify errors and explain what caused it", "Utilize exceptions to find and fix bugs in programs"],
    // CONFIRMED: 4.7.2 asks students to NAME the exception, so the names are
    // examinable content, not background.
    teaches: ["compile errors", "run-time errors", "logic errors", "ArithmeticException", "IndexOutOfBoundsException"],
    exercises: ["Arithmetic Exception", "Index Out Of Bounds Exception", "Bug Hunter"],
    exerciseSpecs: [
      { codehsCode: "4.7.5", name: "Bug Hunter", requires: "A ConsoleProgram seeded with deliberate errors to find and fix: a String assigned with SINGLE quotes, a missing semicolon, and a call with its arguments in the wrong order." },
    ],
    cfu: [
      "whether `int x = 3` with no semicolon is a run-time error, compile error, both or neither - it is a COMPILE error, so nothing runs",
      "which exception `\"hello\".charAt(10)` throws - IndexOutOfBoundsException",
    ],
  },
  {
    code: "3.8",
    codehsCode: "4.8",
    title: "String Processing",
    objectives: ["Create methods that perform advanced manipulations on Strings and characters", "Develop pseudocode algorithms for solutions before writing the actual Java code", "Debug their code", "Practice the common algorithm for String manipulation, including:", "Looping through each character of the String", "Performing specific actions based on each character", "Building a result String by appending processed characters to an initially empty String", "Returning the final result String"],
    teaches: ["building a result String", "looping over characters", "pseudocode before code"],
    exercises: ["Finding Palindromes", "String Concatenation", "Fix the Sum String", "Convert To Uppercase", "Double Vowels", "All Same Letter", "AltCase", "Do the Brackets Match?", "Teen Talk", "Fixing Grammar", "Password Checker", "Replace Letter"],
    // APPROXIMATE. These three are built from the standard reading of each
    // exercise NAME, not from the spec — 4.8's item pages are login-gated and
    // have not been opened. The concepts are right; the exact signatures and
    // edge cases (empty String? case sensitivity?) are unconfirmed.
    exerciseSpecs: [
      { codehsCode: "4.8.3", name: "Finding Palindromes", requires: "APPROXIMATE: boolean, true when the text reads the same backwards. Ours builds the reverse and compares with .equals()." },
      { codehsCode: "4.8.6", name: "Convert To Uppercase", requires: "APPROXIMATE: returns the text in capitals, built character by character with Character.toUpperCase rather than calling .toUpperCase() on the whole String." },
      { codehsCode: "4.8.8", name: "All Same Letter", requires: "APPROXIMATE: boolean, true when every character equals the first." },
    ],
  },
  {
    code: "3.9",
    codehsCode: "4.9",
    title: "Methods Quiz",
    objectives: ["Demonstrate an understanding of the concepts covered in the *Methods Unit* through a multiple choice quiz"],
    teaches: [],
    exercises: [],
    unverified: true,
  },
];

// ─── Unit 5: Classes and OOP ─────────────────────────────────────────────────
// Objectives from the public lesson plans. `teaches` is filled in per lesson as
// each is built, so notYetTaught() stays honest rather than forbidding nothing.
export const CODEHS_CLASSES: CodeHSLesson[] = [
  {
    code: "4.1",
    codehsCode: "5.1",
    title: "Introduction to Classes and Objects",
    objectives: ["Describe the relationship between classes and objects", "Create programs that create (instantiate) multiple objects from a given class", "Create programs that call methods on an object and print out the result"],
    // 5.1 is a CLIENT lesson: students use a class they are given. Writing one
    // is 5.4, so `new`, the dot and calling methods are all that belong here.
    teaches: ["a class is a blueprint, an object is an instance", "new to build an object", "object.method() dot notation", "creating several objects from one class"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.2",
    codehsCode: "5.2",
    title: "Classes vs. Objects",
    objectives: ["Describe the relationship between classes, objects, and instances", "An object is something that has both state and behavior. An object is an instance of a class", "A class is a template for creating objects. Objects are instantiated from classes", "Objects and instances generally refer to the same thing", "Identify if a given thing is an object or a class", "Create multiple objects of a given class", "Call methods on an object to access the object's state and behavior"],
    teaches: ["state and behaviour", "class vs object vs instance", "instantiate", "each object has its own state"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.3",
    codehsCode: "5.3",
    title: "Using a Class as a Client",
    objectives: ["Describe what it means to be a client of a class", "Explain the benefit of being able to use the functionality of a class without ever having to look at the source code for the class.", "Read documentation for a class to determine what methods are available to use", "Create programs that use other classes as a client to solve a specific problem"],
    teaches: ["being a client of a class", "reading a Javadoc to find methods", "using a class without its source"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.4",
    codehsCode: "5.4",
    title: "Writing Classes",
    objectives: ["Create their own class", "Create a constructor for a class", "Determine what instance variables a class should have and create them", "Create a toString method for a class so that it can be printed out", "Create a program that uses their own class as a client"],
    teaches: ["writing a class", "private instance variables", "constructors", "this.field = param", "toString()"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.5",
    codehsCode: "5.5",
    title: "Writing Classes and Instance Methods",
    objectives: ["Create their own classes", "Create instance methods for their classes", "Create objects of their class, and call instance methods on those objects (instances)", "Describe the difference between instance variables and instance methods"],
    teaches: ["instance methods", "methods that change fields", "methods that return a value about the object", "instance variable vs instance method"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.6",
    codehsCode: "5.6",
    title: "Getter and Setter Methods",
    objectives: ["Describe what a getter method is", "Describe what a setter method is", "Explain the difference between getter and setter methods", "Explain the purpose of getter and setter methods", "Create getter and setter methods for their classes", "Call getter and setter methods on an object to access the object's private instance variables"],
    teaches: ["getter methods", "setter methods", "validating in a setter", "why fields stay private"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.7",
    codehsCode: "5.7",
    title: "Class Methods and Class Variables",
    objectives: ["Explain the difference between *instance* methods and *class* methods", "Utilize class methods in a program that is a client of a class", "Utilize class variables in a program that is a client of a class", "Write their own static class methods on their classes", "Write their own static class variables on their classes", "Identify a class variable / method vs an instance variable / method", "Explain when class variables / methods would be appropriate instead of instance variables / methods"],
    teaches: ["static variables", "static methods", "ClassName.method() vs object.method()", "when a class member is right"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.8",
    codehsCode: "5.8",
    title: "Wrapper Classes",
    objectives: ["Create Integer and Double objects for wrapper classes", "Call Integer and Double methods for wrapper classes"],
    teaches: ["Integer", "Double", "autoboxing", "Integer.parseInt", "Double.parseDouble", "Integer.MAX_VALUE"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.9",
    codehsCode: "5.9",
    title: "Method Overloading",
    objectives: ["Describe what method overloading is", "Explain the purpose of method overloading", "Create classes that overload methods"],
    teaches: ["method overloading", "same name, different parameter lists", "overloaded constructors"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.10",
    codehsCode: "5.10",
    title: "Local Variables and Scope",
    objectives: ["Identify the scope of a variable", "Identify which variables are in scope at a given point in a program", "Compare two different variables and determine which has a more specific scope"],
    teaches: ["scope", "local variables", "a variable lives to its closing brace", "declaring outside a loop to keep a value"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.11",
    codehsCode: "5.11",
    title: "Key Terms for Classes",
    objectives: ["Define all the Object Oriented vocabulary terms in this lesson", "Use the this keyword to solve variable shadowing problems"],
    teaches: ["this", "variable shadowing", "OOP vocabulary: class, instance variable, constructor, instance method, static"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.12",
    codehsCode: "5.12",
    title: "Objects vs Primitives",
    objectives: ["Explain the differences between primitive and object data types", "Properly compare variables using the correct methods", "Explain the difference between passing a primitive vs an object to a method", "Explain why null pointer exceptions occur and how to avoid them"],
    teaches: ["primitives compare by value", "objects compare by reference", ".equals() for objects", "null", "NullPointerException", "passing a primitive vs an object"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.13",
    codehsCode: "5.13",
    title: "Inheritance",
    objectives: ["Describe the differences between a Is A and a Has A relationship.", "Explain how class hierarchy helps to reuse code.", "Create subclasses", "Explain that the Object class is the top of the Java hierarchy", "Demonstrate how a subclass makes a call to the superclass constructor"],
    teaches: ["extends", "super(...)", "subclass", "IS A vs HAS A", "Object is the top of the hierarchy", "inherited methods"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.14",
    codehsCode: "5.14",
    title: "Class Design and Abstract Classes",
    objectives: ["Explain what an abstract class is and why we use them", "Implement abstract classes and subclasses", "Explain design considerations for larger programs"],
    teaches: ["abstract class", "abstract method", "a class you cannot instantiate", "subclasses must supply the body"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.15",
    codehsCode: "5.15",
    title: "Polymorphism",
    objectives: [],
    teaches: ["polymorphism", "a parent-typed variable holding a subclass", "overriding", "the object decides which version runs", "parent type as a parameter"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.16",
    codehsCode: "5.16",
    title: "Object Superclass",
    objectives: ["Explain Object class methods through inheritance", "Utilize the Object class through inheritance", "Describe methods of the Object superclass that are commonly overridden"],
    teaches: ["every class extends Object", "overriding toString", "overriding equals(Object)", "casting inside equals"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.17",
    codehsCode: "5.17",
    title: "Interfaces",
    objectives: ["Implement interfaces from the Java library", "Create and implement their own interfaces", "Compare and contrast abstract classes and interfaces"],
    teaches: ["interface", "implements", "a class can implement several interfaces", "interface vs abstract class"],
    exercises: [],
    unverified: true,
  },
  {
    code: "4.18",
    codehsCode: "5.18",
    title: "Classes and Object-Oriented Programming Quiz",
    objectives: ["Demonstrate their knowledge of Classes and Object-Oriented Programming through a multiple-choice quiz"],
    teaches: [],
    exercises: [],
    unverified: true,
  },
];

// ─── Unit 6: Data Structures ─────────────────────────────────────────────────
// Objectives from the public lesson plans. `teaches` filled in per lesson as
// each is built.
export const CODEHS_DATA: CodeHSLesson[] = [
  {
    code: "5.1",
    codehsCode: "6.1",
    title: "What are Data Structures?",
    objectives: ["Explain the difference between an Array, an Array List, a 2D Array, and a Hash Map.", "Choose the correct  Data Structure for a given purpose", "Understand how Data Structures fit into their programs"],
    teaches: ["array", "ArrayList", "2D array", "HashMap", "choosing a structure"],
    exercises: [],
    unverified: true,
  },
  {
    code: "5.2",
    codehsCode: "6.2",
    title: "Introduction to Arrays",
    objectives: ["Initialize an Array of various types", "Access items in the list with indexes", "Change the value of a list item using indexes", "Find out the length of any array"],
    teaches: ["int[] declaration", "array literal {a, b, c}", "new Type[n]", "indexing from 0", "assigning by index", ".length"],
    exercises: [],
    unverified: true,
  },
  {
    code: "5.3",
    codehsCode: "6.3",
    title: "Using Arrays",
    objectives: ["Create arrays of various types, including objects.", "Traverse arrays using a for loop", "Explain what happens when a program tries to access an array index that doesn't exist", "Explain how different arrays can point to the same value and the implication of this.", "Apply arrays to real-world examples."],
    teaches: ["traversing with a for loop", "ArrayIndexOutOfBoundsException", "arrays are objects, so two names can alias one array"],
    exercises: [],
    unverified: true,
  },
  {
    code: "5.4",
    codehsCode: "6.4",
    title: "Enhanced For Loops",
    objectives: ["Traverse the elements in a 1D array object using an enhanced for loop"],
    teaches: ["enhanced for loop", "for (Type name : array)", "the loop variable is a copy"],
    exercises: [],
    unverified: true,
  },
  {
    code: "5.5",
    codehsCode: "6.5",
    title: "ArrayList Methods",
    objectives: ["Create an ArrayList", "Add to and access ArrayList elements", "Traverse an ArrayList", "Use basic ArrayList methods"],
    teaches: ["ArrayList<Type>", "add", "get", "size", "remove", "set", "enhanced for over a list"],
    exercises: [],
    unverified: true,
  },
  {
    code: "5.6",
    codehsCode: "6.6",
    title: "Arrays vs ArrayLists",
    objectives: ["Compare and contrast Arrays and ArrayLists.", "Explain when to use ArrayLists versus Arrays.", "Explain how ArrayList functionality can be built off an Array structure."],
    teaches: ["array vs ArrayList", "fixed size vs growing", "ArrayList is backed by an array", "ArrayList<Integer> not ArrayList<int>"],
    exercises: [],
    unverified: true,
  },
  {
    code: "5.7",
    codehsCode: "6.7",
    title: "Additional Loop Examples",
    objectives: ["Represent iterative processes using a for loop", "Traverse ArraysLists using a for or while loop", "Access elements in an ArrayList using iteration statements", "Remove elements in an ArrayList"],
    teaches: ["indexed loop over a list with size() and get(i)", "removing shifts later items down", "loop backwards when removing"],
    exercises: [],
    unverified: true,
  },
  {
    code: "5.8",
    codehsCode: "6.8",
    title: "The List Interface",
    objectives: ["Explain what the List interface is.", "Explain why we would use the List interface as a formal parameter", "Explain why we would use the List interface to define a List variable."],
    teaches: ["the List interface", "List<String> x = new ArrayList<String>()", "List as a parameter type"],
    exercises: [],
    unverified: true,
  },
  {
    code: "5.9",
    codehsCode: "6.9",
    title: "2D Arrays (Matrices or Grids)",
    objectives: ["Explain how 2D arrays are created by making an array of an array", "Represent collections of related primitive or object reference data using two-dimensional (2D) array objects.", "Traverse 2D arrays using nested loop statements."],
    teaches: ["2D array", "String[][] and int[][]", "grid[row][col]", "grid.length is rows", "grid[0].length is columns"],
    exercises: [],
    unverified: true,
  },
  {
    code: "5.10",
    codehsCode: "6.10",
    title: "Traversing 2D Arrays",
    objectives: ["Traverse 2D arrays using nested for loops", "Traverse 2D arrays using nested enhanced for loops"],
    teaches: ["nested for loops over a grid", "grid[r].length for the current row", "nested enhanced for with int[] row"],
    exercises: [],
    unverified: true,
  },
  {
    code: "5.11",
    codehsCode: "6.11",
    title: "HashMaps",
    objectives: ["Explain what a HashMap is and when it should be used versus other data structures.", "Create, modify, and retrieve values from a HashMap.", "Loop through all values of a HashMap using an enhanced for loop."],
    teaches: [],
    exercises: [],
    unverified: true,
  },
  {
    code: "5.12",
    codehsCode: "6.12",
    title: "Binary",
    objectives: ["Convert by hand from binary, octal, and hexadecimal to decimal", "Explain how to convert from any number system to decimal", "Write basic computer programs to convert numbers to decimal"],
    teaches: [],
    exercises: [],
    unverified: true,
  },
  {
    code: "5.13",
    codehsCode: "6.13",
    title: "Ethical Issues Around Data Collection",
    objectives: ["Explain the risks to privacy from collecting and storing personal data on computer systems", "Explain the role that programmers have considering safeguarding personal privacy", "Explain the beneficial and harmful impacts that computer use and the creation of programs have on personal security"],
    teaches: [],
    exercises: [],
    unverified: true,
  },
  {
    code: "5.14",
    codehsCode: "6.14",
    title: "Data Structures Quiz",
    objectives: ["Demonstrate their knowledge of data structures in Java"],
    teaches: [],
    exercises: [],
    unverified: true,
  },
];

/** Every lesson we mirror, in teaching order. */
export const CODEHS_ALL: CodeHSLesson[] = [...CODEHS_BASIC_JAVA, ...CODEHS_METHODS, ...CODEHS_CLASSES, ...CODEHS_DATA];

const ORDER = CODEHS_ALL.map((l) => l.code);

/** Everything CodeHS has already taught by the time this lesson starts. */
export function taughtBefore(code: string): string[] {
  const i = ORDER.indexOf(code);
  if (i <= 0) return [];
  return CODEHS_ALL.slice(0, i).flatMap((l) => l.teaches);
}

/** Everything CodeHS has NOT taught yet — a lesson must not use any of it. */
export function notYetTaught(code: string): string[] {
  const i = ORDER.indexOf(code);
  if (i < 0) return [];
  return CODEHS_ALL.slice(i + 1).flatMap((l) => l.teaches);
}

export function lessonSpec(code: string): CodeHSLesson | undefined {
  return CODEHS_ALL.find((l) => l.code === code);
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
  return CODEHS_ALL.find((l) => l.codehsCode === input)?.code ?? input;
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
