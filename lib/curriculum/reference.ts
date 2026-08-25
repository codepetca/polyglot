// The Java reference, and which bits matter for which lesson.
//
// DESIGN RULE (from the owner, and it governs this whole platform): this is
// built for students who cannot help themselves — who won't open a menu, won't
// search, won't go looking. So the relevant syntax is PUT IN FRONT OF THEM on
// the step where they need it. The searchable panel still exists, but nobody
// should ever have to use it.

export type Entry = {
  name: string;
  code: string;
  note: string;
  /**
   * How the checker should compile this entry's `code`.
   *
   * "beginner" (default) splices it inside main(). "methods" puts it at class
   * level, for anything that DEFINES a method or a class. "none" means the code
   * is a fragment — an operator list, a signature, a comment — and is not
   * compilable on its own.
   *
   * Every entry that is not "none" is compiled by scripts/reference-check.ts.
   * Documentation that does not compile is worse than no documentation: a
   * student who copies it and fails has no way to tell whose fault it was.
   */
  wrap?: "beginner" | "methods" | "none";
  /** Keyboard input the sample needs, one value per line. */
  stdin?: string;
};
export type Section = { id: string; title: string; entries: Entry[] };

export const REFERENCE: Section[] = [
  {
    id: "print",
    title: "Output",
    entries: [
      { name: "Print a line", code: 'System.out.println("Hello");', note: "Prints, then moves to the next line." },
      { name: "Print, stay on the line", code: 'System.out.print("Hello");', note: "No line break — the next print continues right after." },
      { name: "New line inside text", code: 'System.out.println("a\\nb");', note: "\\n breaks the line where you put it." },
      { name: "Tab / quote inside text", code: 'System.out.println("a\\tb \\"hi\\"");', note: "\\t is a tab. \\\" prints a real quote mark." },
      { name: "Join text and values", code: 'int age = 16;\nSystem.out.println("Age: " + age);', note: "+ glues text together. Number + text becomes text." },
    ],
  },
  {
    id: "vars",
    title: "Variables and Types",
    entries: [
      { name: "Whole number", code: "int age = 16;", note: "No decimal point. 7 / 2 gives 3, not 3.5." },
      { name: "Decimal number", code: "double price = 9.99;", note: "Use when the value can have a fraction." },
      { name: "Text", code: 'String name = "Ada";', note: "Capital S. Text always goes in double quotes." },
      { name: "True or false", code: "boolean done = false;", note: "Only two possible values." },
      { name: "Change it later", code: "int age = 16;\nage = age + 1;", note: "Replaces what was in the box. No type the second time." },
    ],
  },
  {
    id: "input",
    title: "Input",
    entries: [
      { name: "Read text", code: 'String name = readLine("Name? ");\nSystem.out.println(name);', note: "The question goes inside the brackets. You get back what they typed.", stdin: "Ada" },
      { name: "Read a whole number", code: 'int age = readInt("Age? ");\nSystem.out.println(age + 1);', note: "Use when you want to do maths with the answer.", stdin: "16" },
      { name: "Read a decimal", code: 'double h = readDouble("Height? ");\nSystem.out.println(h);', note: "For values like 1.75.", stdin: "1.75" },
      { name: "Read true or false", code: 'boolean ok = readBoolean("Ready? ");\nSystem.out.println(ok);', note: "They type true or false.", stdin: "true" },
    ],
  },
  {
    id: "maths",
    title: "Arithmetic Operators",
    entries: [
      { name: "The operators", code: "+   -   *   /   %", note: "% is the remainder: 7 % 2 is 1.", wrap: "none" },
      { name: "Order", code: "2 + 3 * 4   // 14\n(2 + 3) * 4 // 20", note: "× and ÷ happen before + and −. Brackets go first.", wrap: "none" },
      { name: "Whole-number division", code: "7 / 2   // 3, not 3.5", note: "Two whole numbers divide into a whole number. The rest is thrown away.", wrap: "none" },
      { name: "Decimal division", code: "7.0 / 2   // 3.5", note: "If either side is a decimal, the answer keeps its decimal.", wrap: "none" },
      { name: "Shortcuts", code: "int n = 10;\nn++;\nn += 5;\nSystem.out.println(n);", note: "n++ means n = n + 1. n += 5 means n = n + 5." },
    ],
  },
  // SPLIT ON PURPOSE. Comparisons and logical operators are CodeHS 3.7/3.8;
  // `if` is 3.11, three lessons later. Keeping them in one section meant the
  // always-visible reference showed if/else syntax during Booleans, Logical
  // Operators and Comparison Operators — teaching ahead of the curriculum on
  // exactly the panel that is meant to be trustworthy.
  {
    id: "logic",
    title: "Booleans and Comparison",
    entries: [
      { name: "True or false", code: "boolean passed = true;", note: "Only two values. No quotes — \"true\" with quotes is text, not a boolean." },
      { name: "Comparing", wrap: "none", code: "==   !=   <   >   <=   >=", note: "Each one answers a yes/no question. == compares; a single = assigns instead — a very common bug." },
      { name: "At least / at most", code: "int points = 12;\nSystem.out.println(points >= 10);", note: ">= includes the number itself. > does not." },
      { name: "And / or / not", code: "&&   ||   !", note: "&& needs both true. || needs at least one. ! flips it.", wrap: "none" },
      { name: "Store the answer", code: "int age = 20;\nboolean oldEnough = age >= 18;\nSystem.out.println(oldEnough);", note: "A comparison gives back true or false, so it fits in a boolean." },
    ],
  },
  {
    id: "if",
    title: "Conditionals",
    entries: [
      { name: "If", code: 'int age = 20;\nif (age >= 18) {\n  System.out.println("adult");\n}', note: "Runs the block only when the condition is true." },
      { name: "If / else", code: 'int n = 3;\nif (n > 0) {\n  System.out.println("yes");\n} else {\n  System.out.println("no");\n}', note: "One or the other, never both." },
    ],
  },
  {
    id: "loops",
    title: "Loops",
    entries: [
      { name: "For loop", code: "for (int i = 1; i <= 5; i++) {\n  System.out.println(i);\n}", note: "Start; keep going while true; do this each time." },
      { name: "Count from 0", code: "for (int i = 0; i < 3; i++) {\n  System.out.println(i);\n}", note: "Runs 3 times: 0, 1, 2. The usual way to repeat N times." },
      { name: "Step by 2", code: "for (int i = 2; i <= 10; i = i + 2) {\n  System.out.println(i);\n}", note: "The last part doesn't have to be i++." },
      { name: "While loop", code: "int fuel = 3;\nwhile (fuel > 0) {\n  fuel--;\n}\nSystem.out.println(fuel);", note: "Use when you don't know the count in advance." },
      { name: "Never-ending loop", code: "// something inside MUST change the\n// variable the condition checks", note: "Otherwise it runs forever.", wrap: "none" },
    ],
  },
  {
    id: "methods",
    title: "Methods",
    entries: [
      { name: "Define one", code: "public void greet() {\n  System.out.println(\"Hi\");\n}", note: "public void means it gives nothing back. The body runs when it is called.", wrap: "methods" },
      { name: "Call one", code: "greet();", note: "The brackets are what runs it. Without them nothing happens.", wrap: "none" },
      { name: "Take a value in", code: "public void greet(String name) {\n  System.out.println(\"Hi \" + name);\n}", note: "name is a parameter. The caller supplies it: greet(\"Ada\").", wrap: "methods" },
      { name: "Give a value back", code: "public int doubled(int n) {\n  return n * 2;\n}", note: "The type before the name is what comes back. return sends it and stops the method.", wrap: "methods" },
      { name: "Use what came back", code: "int total = doubled(5) + doubled(3);", note: "A method that returns can be used anywhere a value can.", wrap: "none" },
      { name: "Two parameters", code: "public int add(int a, int b) {\n  return a + b;\n}", note: "Separated by commas, each with its own type.", wrap: "methods" },
      { name: "Javadoc", code: "/**\n * Doubles a number.\n * @param n the number\n * @return twice n\n */", note: "Written above the method. @param per parameter, @return for what comes back.", wrap: "none" },
    ],
  },
  {
    id: "strings",
    title: "Strings",
    entries: [
      { name: "How long", code: "String s = \"hello\";\nSystem.out.println(s.length());", note: "Brackets, because it is a method. An array uses .length with no brackets." },
      { name: "One character", code: "String s = \"hello\";\nSystem.out.println(s.charAt(0));", note: "Counts from 0, so charAt(0) is the first letter." },
      { name: "Part of it", code: "String s = \"hello\";\nSystem.out.println(s.substring(1, 3));", note: "From the first index up to but NOT including the second." },
      { name: "To the end", code: "String s = \"hello\";\nSystem.out.println(s.substring(2));", note: "One number means from there to the end." },
      { name: "Find something", code: "String s = \"hello\";\nSystem.out.println(s.indexOf(\"l\"));", note: "The index of the first match, or -1 when it is not there." },
      { name: "Upper and lower", code: "String s = \"Ada\";\nSystem.out.println(s.toUpperCase());", note: "Returns a NEW String. The original is unchanged." },
      { name: "Compare text", code: "String a = \"hi\";\nString b = \"hi\";\nSystem.out.println(a.equals(b));", note: "Always .equals for text. == compares identity, not letters." },
      { name: "Loop over letters", code: "String s = \"abc\";\nfor (int i = 0; i < s.length(); i++) {\n  System.out.println(s.charAt(i));\n}", note: "The standard shape: 0 up to length - 1." },
      { name: "Build a new String", code: "String out = \"\";\nfor (int i = 0; i < 3; i++) {\n  out = out + i;\n}\nSystem.out.println(out);", note: "Start empty before the loop, add inside, use after." },
    ],
  },
  {
    id: "chars",
    title: "Characters (char)",
    entries: [
      { name: "char vs String", code: "char c = 'a';\nString s = \"a\";", note: "Single quotes for one character. Double quotes for text." },
      { name: "Is it a letter", code: "System.out.println(Character.isLetter('a'));", note: "Also isDigit, isUpperCase, isLowerCase, isWhitespace." },
      { name: "Change case", code: "System.out.println(Character.toUpperCase('a'));", note: "Works on one char, not a String." },
      { name: "Character to number", code: "char c = 'A';\nSystem.out.println((int) c);", note: "'A' is 65. Casting a char to int gives its ASCII value." },
      { name: "Escapes", code: "System.out.println(\"a\\tb\\n\\\"q\\\"\");", note: "\\n new line, \\t tab, \\\" a quote mark, \\\\ a backslash." },
    ],
  },
  {
    id: "errors",
    title: "Errors and Exceptions",
    entries: [
      { name: "Compile error", code: "// int x = \"text\";", note: "Java refuses to build it. Nothing runs at all. The editor usually says the line." },
      { name: "Run-time error", code: "// int[] a = new int[2];\n// System.out.println(a[5]);", note: "It builds, then stops partway. Everything before it already printed." },
      { name: "Logic error", code: "// average = a + b / 2;", note: "It builds and runs and the answer is wrong. Nothing tells you. The hardest kind." },
      { name: "Divide by zero", code: "// System.out.println(5 / 0);", note: "ArithmeticException. Only for whole numbers." },
      { name: "Past the end", code: "// hp[hp.length]", note: "ArrayIndexOutOfBoundsException. The last index is length - 1." },
      { name: "Nothing there", code: "// String s = null;\n// s.length();", note: "NullPointerException. The variable holds no object to call a method on." },
    ],
  },
  {
    id: "classes",
    title: "Classes and Objects",
    entries: [
      { name: "Write a class", code: "class Player {\n  private String name;\n  private int hp;\n}", note: "A class is the blueprint. private keeps the fields to itself.", wrap: "methods" },
      { name: "Constructor", code: "class Player {\n  private String name;\n\n  public Player(String name) {\n    this.name = name;\n  }\n}", note: "Same name as the class, no return type. this.name is the field, name is the parameter.", wrap: "methods" },
      { name: "Build an object", code: "// Player p = new Player(\"Ada\");", note: "new runs the constructor and hands back one object. Many objects, one class." },
      { name: "Instance method", code: "class Player {\n  private int hp = 10;\n\n  public void takeDamage(int n) {\n    hp = hp - n;\n  }\n}", note: "Changes only the object it was called on.", wrap: "methods" },
      { name: "Getter", code: "class Player {\n  private int hp = 10;\n\n  public int getHp() {\n    return hp;\n  }\n}", note: "Lets the outside read a private field without being able to change it.", wrap: "methods" },
      { name: "Setter with a guard", code: "class Player {\n  private int hp;\n\n  public void setHp(int n) {\n    if (n >= 0) {\n      hp = n;\n    }\n  }\n}", note: "A setter can refuse a bad value. A public field cannot.", wrap: "methods" },
      { name: "toString", code: "class Coin {\n  public String toString() {\n    return \"a coin\";\n  }\n}", note: "What println shows for the object. Without it you get the class name and a hash.", wrap: "methods" },
      { name: "static", code: "class Counter {\n  private static int made = 0;\n\n  public static int getMade() {\n    return made;\n  }\n}", note: "static belongs to the CLASS, not to any object. Called as Counter.getMade().", wrap: "methods" },
    ],
  },
  {
    id: "objects",
    title: "Objects vs Primitives",
    entries: [
      { name: "Primitives compare by value", code: "int a = 5;\nint b = 5;\nSystem.out.println(a == b);", note: "Two ints holding 5 are equal. == is right here." },
      { name: "Objects compare by identity", code: "String a = new String(\"hi\");\nString b = new String(\"hi\");\nSystem.out.println(a == b);", note: "false. == asks whether they are the SAME object, not whether they match." },
      { name: "Use equals for objects", code: "String a = new String(\"hi\");\nString b = new String(\"hi\");\nSystem.out.println(a.equals(b));", note: "true. equals asks whether the contents match." },
      { name: "null", code: "String s = null;\nSystem.out.println(s);", note: "The variable exists and holds no object. Calling a method on it throws." },
    ],
  },
  {
    id: "inherit",
    title: "Inheritance and Interfaces",
    entries: [
      { name: "extends", code: "class Monster {\n  public void roar() {\n    System.out.println(\"rawr\");\n  }\n}\n\nclass Boss extends Monster {\n}", note: "Boss IS A Monster. It gets roar() without writing it.", wrap: "methods" },
      { name: "super", code: "class Monster {\n  private String name;\n\n  public Monster(String name) {\n    this.name = name;\n  }\n}\n\nclass Boss extends Monster {\n  public Boss(String name) {\n    super(name);\n  }\n}", note: "Calls the parent constructor. It must be the first line.", wrap: "methods" },
      { name: "Override", code: "class Monster {\n  public void roar() {\n    System.out.println(\"rawr\");\n  }\n}\n\nclass Slime extends Monster {\n  public void roar() {\n    System.out.println(\"blorp\");\n  }\n}", note: "Same name, same parameters. The object decides which version runs.", wrap: "methods" },
      { name: "abstract", code: "abstract class Item {\n  public abstract void use();\n}\n\nclass Sword extends Item {\n  public void use() {\n    System.out.println(\"swing\");\n  }\n}", note: "An abstract class cannot be built with new. Subclasses must supply the body.", wrap: "methods" },
      { name: "interface", code: "interface Openable {\n  void open();\n}\n\nclass Chest implements Openable {\n  public void open() {\n    System.out.println(\"creak\");\n  }\n}", note: "A promise that a method exists. Unrelated classes can implement the same one.", wrap: "methods" },
      { name: "IS A against HAS A", code: "// class Boss extends Monster  -> IS A\n// class Player { Weapon w; }  -> HAS A", note: "extends is IS A. Holding one as a field is HAS A." },
    ],
  },
  {
    id: "wrappers",
    title: "Wrapper Classes",
    entries: [
      { name: "The object versions", code: "Integer a = 5;\nDouble b = 2.5;\nSystem.out.println(a + 1);", note: "Integer wraps int, Double wraps double. Java converts both ways for you." },
      { name: "Text to number", code: "System.out.println(Integer.parseInt(\"42\") + 1);", note: "Also Double.parseDouble. Throws if the text is not a number." },
      { name: "Limits", code: "System.out.println(Integer.MAX_VALUE);", note: "The largest int. Going past it wraps around to a negative." },
      { name: "Why they exist", code: "// ArrayList<int> does not compile\n// ArrayList<Integer> does", note: "Collections hold objects only, so a list of whole numbers needs Integer." },
    ],
  },
  {
    id: "scope",
    title: "Scope",
    entries: [
      { name: "Local", code: "int total = 0;\nSystem.out.println(total);", note: "Exists from its declaration to the closing brace of its block." },
      { name: "Loop variable", code: "for (int i = 0; i < 3; i++) {\n  System.out.println(i);\n}", note: "i does not exist after the loop's closing brace." },
      { name: "Keep it past the loop", code: "int total = 0;\nfor (int i = 1; i <= 4; i++) {\n  total = total + i;\n}\nSystem.out.println(total);", note: "Declare it BEFORE the loop if you need it after." },
      { name: "this", code: "// this.name is the field\n// name is the parameter", note: "When a parameter shares a field's name, this reaches the field." },
    ],
  },
  {
    id: "arrays",
    title: "Arrays",
    entries: [
      { name: "Make one with values", code: "int[] hp = {12, 30, 8};\nSystem.out.println(hp[0]);", note: "int[] means an array of int. Every element has the same type." },
      { name: "Make empty slots", code: "int[] hp = new int[5];\nSystem.out.println(hp.length);", note: "Five slots, every int slot starting at 0. A String array starts at null." },
      { name: "Read and change", code: "int[] hp = {12, 30, 8};\nhp[0] = 99;\nSystem.out.println(hp[0]);", note: "Indexes start at 0. The last index is length - 1." },
      { name: "How many", code: "int[] hp = {12, 30, 8};\nSystem.out.println(hp.length);", note: "A field, so no brackets. A String uses .length() with brackets." },
      { name: "Visit every element", code: "int[] hp = {12, 30, 8};\nfor (int i = 0; i < hp.length; i++) {\n  System.out.println(hp[i]);\n}", note: "Use <, never <=. hp[hp.length] does not exist." },
      { name: "Enhanced for", code: "int[] hp = {12, 30, 8};\nfor (int h : hp) {\n  System.out.println(h);\n}", note: "Read as: for each int h in hp. No index, and it cannot change the array." },
      { name: "Two names, one array", code: "int[] a = {1, 2, 3};\nint[] b = a;\nb[0] = 99;\nSystem.out.println(a[0]);", note: "b = a does not copy. A change through b shows through a." },
    ],
  },
  {
    id: "lists",
    title: "ArrayList and List",
    entries: [
      { name: "Make one", code: "ArrayList<String> loot = new ArrayList<String>();\nloot.add(\"gem\");\nSystem.out.println(loot.size());", note: "Starts empty and grows. Angle brackets say what it holds." },
      { name: "Read one", code: "ArrayList<String> loot = new ArrayList<String>();\nloot.add(\"gem\");\nSystem.out.println(loot.get(0));", note: "get(0) is the first. Square brackets do not work on a list." },
      { name: "Replace one", code: "ArrayList<String> l = new ArrayList<String>();\nl.add(\"a\");\nl.set(0, \"b\");\nSystem.out.println(l);", note: "set replaces in place. The size does not change." },
      { name: "Remove one", code: "ArrayList<String> l = new ArrayList<String>();\nl.add(\"a\");\nl.add(\"b\");\nl.remove(0);\nSystem.out.println(l);", note: "Everything after it shifts down one index. That is why removing while looping forwards skips items." },
      { name: "Remove safely", code: "ArrayList<Integer> l = new ArrayList<Integer>();\nl.add(0);\nl.add(0);\nfor (int i = l.size() - 1; i >= 0; i--) {\n  if (l.get(i) == 0) {\n    l.remove(i);\n  }\n}\nSystem.out.println(l);", note: "Count DOWN when removing, so a shift never moves an unchecked item." },
      { name: "Whole numbers", code: "ArrayList<Integer> n = new ArrayList<Integer>();\nn.add(4);\nSystem.out.println(n.get(0));", note: "ArrayList<Integer>, never ArrayList<int>. A list holds objects." },
      { name: "List on the left", code: "List<String> l = new ArrayList<String>();\nl.add(\"a\");\nSystem.out.println(l.size());", note: "List is the interface, ArrayList the class. Declare the interface, build the class." },
      { name: "Array against list", code: "// array:     a.length   a[0]      fixed size\n// ArrayList: a.size()   a.get(0)  grows", note: "The two mistakes to expect: .length on a list, and [0] on a list." },
    ],
  },
  {
    id: "grids",
    title: "2D Arrays",
    entries: [
      { name: "Make one", code: "int[][] grid = {{1, 2}, {3, 4}};\nSystem.out.println(grid[1][0]);", note: "Row first, then column. Both count from 0." },
      { name: "Make empty", code: "int[][] g = new int[2][3];\nSystem.out.println(g.length);", note: "Two rows of three columns, in that order." },
      { name: "Rows and columns", code: "int[][] g = {{1, 2, 3}, {4, 5, 6}};\nSystem.out.println(g.length + \" \" + g[0].length);", note: "g.length is rows. g[0].length is columns. There is no g.width." },
      { name: "Visit every square", code: "int[][] g = {{1, 2}, {3, 4}};\nfor (int r = 0; r < g.length; r++) {\n  for (int c = 0; c < g[r].length; c++) {\n    System.out.print(g[r][c]);\n  }\n}", note: "The inner loop finishes a whole row before the outer one moves on." },
      { name: "Nested enhanced for", code: "int[][] g = {{1, 2}, {3, 4}};\nfor (int[] row : g) {\n  for (int n : row) {\n    System.out.print(n);\n  }\n}", note: "The outer variable is an int[], because every element of a grid is a row." },
    ],
  },
  {
    id: "maps",
    title: "HashMap",
    entries: [
      { name: "Make one", code: "HashMap<String, Integer> s = new HashMap<String, Integer>();\ns.put(\"Ada\", 40);\nSystem.out.println(s.get(\"Ada\"));", note: "Key type first, value type second. put stores, get looks up." },
      { name: "Missing key", code: "HashMap<String, Integer> s = new HashMap<String, Integer>();\nSystem.out.println(s.get(\"Zed\"));", note: "null, not 0. Assigning that to an int throws a NullPointerException." },
      { name: "A safe default", code: "HashMap<String, Integer> s = new HashMap<String, Integer>();\nSystem.out.println(s.getOrDefault(\"Zed\", 0));", note: "Returns your fallback when the key is absent. containsKey asks the same question." },
      { name: "One key, one value", code: "HashMap<String, Integer> s = new HashMap<String, Integer>();\ns.put(\"a\", 1);\ns.put(\"a\", 2);\nSystem.out.println(s.size());", note: "Putting the same key again replaces the value. It does not add a second pair." },
      { name: "Every key", code: "HashMap<String, Integer> s = new HashMap<String, Integer>();\ns.put(\"a\", 1);\nfor (String k : s.keySet()) {\n  System.out.println(k + \" \" + s.get(k));\n}", note: "A HashMap has NO order you can rely on. Never write code that depends on it." },
    ],
  },
  {
    id: "binary",
    title: "Number Systems",
    entries: [
      { name: "Place values", code: "// 128  64  32  16  8  4  2  1", note: "Each place is twice the one on its right." },
      { name: "Read a binary number", code: "System.out.println(8 + 4 + 1);", note: "Binary 1101 is 8 + 4 + 0 + 1, which is 13. Add the places holding a 1." },
      { name: "Convert in code", code: "int[] bits = {1, 1, 0, 1};\nint value = 0;\nfor (int b : bits) {\n  value = value * 2 + b;\n}\nSystem.out.println(value);", note: "Double what you have, then add the next digit. Works for any length." },
      { name: "Other bases", code: "// hex 2F = 2*16 + 15 = 47\n// octal 17 = 1*8 + 7 = 15", note: "Same method every time: digit times its place value, all added up. In hex A is 10 up to F is 15." },
    ],
  },
];

// Which sections a lesson actually needs, most relevant first. Later lessons
// keep earlier ones because students forget them, not because they're new.
const BY_LESSON: Record<string, string[]> = {
  // ── Unit 3, Basic Java ────────────────────────────────────────────────────
  "2.1": ["print"],
  "2.2": ["vars", "print"],
  "2.3": ["input", "vars", "print"],
  "2.4": ["maths", "vars"],
  "2.5": ["vars", "maths"],
  // No "if" before 2.11 — CodeHS does not teach it until then.
  "2.6": ["logic", "input", "vars"],
  "2.7": ["logic"],
  "2.8": ["logic", "vars"],
  "2.9": ["loops", "print", "vars"],
  "2.10": ["loops", "logic", "vars"],
  "2.11": ["if", "logic", "vars"],
  "2.12": ["loops", "if", "logic", "input"],
  "2.13": ["logic", "if"],
  "2.14": ["logic"],
  "2.15": ["print", "vars"],

  // ── Unit 4, Methods ───────────────────────────────────────────────────────
  "3.1": ["methods", "print"],
  "3.2": ["methods", "vars"],
  "3.3": ["methods", "maths"],
  "3.4": ["methods"],
  "3.5": ["strings", "methods"],
  "3.6": ["chars", "strings"],
  "3.7": ["errors", "vars"],
  "3.8": ["strings", "chars", "loops"],
  "3.9": ["methods", "strings", "chars"],

  // ── Unit 5, Classes and OOP ───────────────────────────────────────────────
  "4.1": ["classes"],
  "4.2": ["classes"],
  "4.3": ["classes", "methods"],
  "4.4": ["classes"],
  "4.5": ["classes", "methods"],
  "4.6": ["classes"],
  "4.7": ["classes"],
  "4.8": ["wrappers", "vars"],
  "4.9": ["methods", "classes"],
  "4.10": ["scope", "loops"],
  "4.11": ["classes", "scope"],
  "4.12": ["objects", "strings"],
  "4.13": ["inherit", "classes"],
  "4.14": ["inherit", "classes"],
  "4.15": ["inherit"],
  "4.16": ["inherit", "objects", "classes"],
  "4.17": ["inherit"],
  "4.18": ["classes", "inherit", "objects"],

  // ── Unit 6, Data Structures ───────────────────────────────────────────────
  "5.1": ["arrays", "lists"],
  "5.2": ["arrays"],
  "5.3": ["arrays", "loops"],
  "5.4": ["arrays", "loops"],
  "5.5": ["lists"],
  "5.6": ["arrays", "lists"],
  "5.7": ["lists", "loops"],
  "5.8": ["lists", "inherit"],
  "5.9": ["grids", "arrays"],
  "5.10": ["grids", "loops"],
  "5.11": ["maps", "lists"],
  "5.12": ["binary", "arrays"],
  // 5.13 is the ethics lesson — no syntax, so no reference panel.
  "5.14": ["arrays", "lists", "grids", "maps"],
};

/** The sections to show inline on a lesson, in priority order. */
export function sectionsForLesson(lessonCode: string): Section[] {
  const ids = BY_LESSON[lessonCode];
  if (!ids) return [];
  return ids.map((id) => REFERENCE.find((s) => s.id === id)).filter(Boolean) as Section[];
}

/** Every section, for the browsable documentation page. */
export function allSections(): Section[] {
  return REFERENCE;
}

/**
 * Which lessons a section is shown on, as student-facing codes. Used by the
 * documentation page so an entry can say where it is taught, rather than
 * presenting the whole language as one flat undifferentiated list.
 */
export function lessonsUsingSection(id: string): string[] {
  return Object.entries(BY_LESSON)
    .filter(([, ids]) => ids.includes(id))
    .map(([code]) => code);
}
