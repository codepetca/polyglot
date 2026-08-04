// The Java reference, and which bits matter for which lesson.
//
// DESIGN RULE (from the owner, and it governs this whole platform): this is
// built for students who cannot help themselves — who won't open a menu, won't
// search, won't go looking. So the relevant syntax is PUT IN FRONT OF THEM on
// the step where they need it. The searchable panel still exists, but nobody
// should ever have to use it.

export type Entry = { name: string; code: string; note: string };
export type Section = { id: string; title: string; entries: Entry[] };

export const REFERENCE: Section[] = [
  {
    id: "print",
    title: "Showing things",
    entries: [
      { name: "Print a line", code: 'System.out.println("Hello");', note: "Prints, then moves to the next line." },
      { name: "Print, stay on the line", code: 'System.out.print("Hello");', note: "No line break — the next print continues right after." },
      { name: "New line inside text", code: 'System.out.println("a\\nb");', note: "\\n breaks the line where you put it." },
      { name: "Tab / quote inside text", code: 'System.out.println("a\\tb \\"hi\\"");', note: "\\t is a tab. \\\" prints a real quote mark." },
      { name: "Join text and values", code: 'System.out.println("Age: " + age);', note: "+ glues text together. Number + text becomes text." },
    ],
  },
  {
    id: "vars",
    title: "Storing values",
    entries: [
      { name: "Whole number", code: "int age = 16;", note: "No decimal point. 7 / 2 gives 3, not 3.5." },
      { name: "Decimal number", code: "double price = 9.99;", note: "Use when the value can have a fraction." },
      { name: "Text", code: 'String name = "Ada";', note: "Capital S. Text always goes in double quotes." },
      { name: "True or false", code: "boolean done = false;", note: "Only two possible values." },
      { name: "Change it later", code: "age = age + 1;", note: "Replaces what was in the box. No type the second time." },
    ],
  },
  {
    id: "input",
    title: "Asking the user",
    entries: [
      { name: "Set up the reader", code: "Scanner input = new Scanner(System.in);", note: "Do this once, before reading anything." },
      { name: "Read text", code: 'System.out.print("Name? ");\nString name = input.nextLine();', note: "Ask first, then read — otherwise the user sees nothing." },
      { name: "Read a whole number", code: "int age = input.nextInt();", note: "Use when you want to do maths with the answer." },
      { name: "Read a decimal", code: "double h = input.nextDouble();", note: "For values like 1.75." },
    ],
  },
  {
    id: "maths",
    title: "Maths",
    entries: [
      { name: "The operators", code: "+   -   *   /   %", note: "% is the remainder: 7 % 2 is 1." },
      { name: "Order", code: "2 + 3 * 4   // 14\n(2 + 3) * 4 // 20", note: "× and ÷ happen before + and −. Brackets go first." },
      { name: "Whole-number division", code: "7 / 2   // 3, not 3.5", note: "Two whole numbers divide into a whole number." },
      { name: "Is it even?", code: "if (n % 2 == 0) { }", note: "Divides evenly means remainder 0." },
    ],
  },
  {
    id: "if",
    title: "Making decisions",
    entries: [
      { name: "If", code: 'if (age >= 18) {\n  System.out.println("adult");\n}', note: "Runs the block only when the condition is true." },
      { name: "If / else", code: 'if (n > 0) {\n  System.out.println("yes");\n} else {\n  System.out.println("no");\n}', note: "One or the other, never both." },
      { name: "Comparing", code: "==   !=   <   >   <=   >=", note: "== compares. A single = assigns — a very common bug." },
      { name: "And / or / not", code: "&&   ||   !", note: "&& needs both true. || needs at least one." },
    ],
  },
  {
    id: "loops",
    title: "Repeating",
    entries: [
      { name: "For loop", code: "for (int i = 1; i <= 5; i++) {\n  System.out.println(i);\n}", note: "Start; keep going while true; do this each time." },
      { name: "Count from 0", code: "for (int i = 0; i < 3; i++) { }", note: "Runs 3 times: 0, 1, 2. The usual way to repeat N times." },
      { name: "Step by 2", code: "for (int i = 2; i <= 10; i = i + 2) { }", note: "The last part doesn't have to be i++." },
      { name: "While loop", code: "while (fuel > 0) {\n  fuel--;\n}", note: "Use when you don't know the count in advance." },
      { name: "Never-ending loop", code: "// something inside MUST change the\n// variable the condition checks", note: "Otherwise it runs forever." },
    ],
  },
];

// Which sections a lesson actually needs, most relevant first. Later lessons
// keep earlier ones because students forget them, not because they're new.
const BY_LESSON: Record<string, string[]> = {
  "2.1": ["print"],
  "2.2": ["vars", "print"],
  "2.3": ["input", "vars", "print"],
  "2.4": ["maths", "vars"],
  "2.5": ["vars", "maths"],
  "2.6": ["if", "vars"],
  "2.7": ["if"],
  "2.8": ["if", "maths"],
  "2.9": ["loops", "print", "vars"],
  "2.10": ["loops", "vars"],
  "2.11": ["if", "vars"],
  "2.12": ["loops", "if"],
  "2.13": ["if"],
  "2.14": ["if"],
  "2.15": ["print", "vars"],
};

/** The sections to show inline on a lesson, in priority order. */
export function sectionsForLesson(lessonCode: string): Section[] {
  const ids = BY_LESSON[lessonCode];
  if (!ids) return [];
  return ids.map((id) => REFERENCE.find((s) => s.id === id)).filter(Boolean) as Section[];
}
