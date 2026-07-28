// Authors the interactive flows for 2.2 "Variables and Types" and 2.4
// "Arithmetic Expressions" — same design discipline as 2.1: near-zero text,
// do-first, verified against the real compiler (scripts/verify-flow-22-24.mjs,
// all 13 checks passed before this was written). Every snippet here matches
// what that script confirmed.
//
//   node --env-file=.env scripts/author-flow-22-24.mjs

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const FLOWS = {
  "2.2": {
    steps: [
      { id: "f22_1", kind: "run", instruction: "This is Java code. Run it.", code: "int age = 16;\nSystem.out.println(age);", after: "A variable is a labeled box — print it any time." },
      { id: "f22_2", kind: "tweak", instruction: "Change the number. Make it your age.", code: "int age = 16;\nSystem.out.println(age);", target: "16", hint: "Just change the number.", after: "Same box, your value." },
      { id: "f22_3", kind: "predict", instruction: "What does x end up as?", code: "int x = 5;\nx = 8;\nSystem.out.println(x);", opts: ["8", "5", "13", "(an error)"], correct: 0, why: "Reassigning REPLACES the value — the 5 is gone the instant x = 8 runs." },
      { id: "f22_4", kind: "trace", instruction: "Follow x.", code: "int x = 5;\nx = x + 2;\nx = x * 2;", questions: [
        { prompt: "after line 2, x = ?", opts: ["7", "5", "2"], correct: 0, why: "5 + 2." },
        { prompt: "after line 3, x = ?", opts: ["14", "9", "7"], correct: 0, why: "7 * 2." },
      ] },
      { id: "f22_5", kind: "bucket", instruction: "Which type holds it?", buckets: ["int", "double", "String", "boolean"], items: [
        { text: "42", bucket: 0 }, { text: "3.14", bucket: 1 }, { text: '"hello"', bucket: 2 },
        { text: "true", bucket: 3 }, { text: "-7", bucket: 0 }, { text: "2.0", bucket: 1 },
      ], why: "Whole numbers → int, decimals → double, quoted text → String, true/false → boolean." },
      { id: "f22_6", kind: "fix", instruction: "Make it compile and match the target.", code: "int price = 9.99;\nSystem.out.println(price);", target: "9.99", solution: 'double price = 9.99;\nSystem.out.println(price);', hint: "9.99 isn't whole — which type actually holds decimals?", after: "int only holds whole numbers. double holds decimals." },
      { id: "f22_7", kind: "predict", instruction: "b is declared as a double. What prints?", code: "int a = 7;\ndouble b = a;\nSystem.out.println(b);", opts: ["7.0", "7", "7.00", "(an error)"], correct: 0, why: "Once it's stored as a double, Java shows the decimal — even a whole number becomes 7.0." },
      { id: "f22_8", kind: "write", instruction: "Print this exactly — pick the right type for each.", code: "// your code here\n", target: "Ada is 16, 5.4 ft tall", solution: 'String name = "Ada";\nint age = 16;\ndouble height = 5.4;\nSystem.out.println(name + " is " + age + ", " + height + " ft tall");', hint: "One String, one int, one double." },
    ],
    tags: {
      "declare and initialize variables with the correct type": ["f22_1", "f22_2", "f22_8"],
      "trace how a variable's value changes through assignments": ["f22_3", "f22_4"],
      "choose between int, double, boolean and string for a given value": ["f22_5", "f22_6", "f22_7"],
    },
  },

  "2.4": {
    steps: [
      { id: "f24_1", kind: "run", instruction: "Run it — watch the order.", code: "System.out.println(2 + 3 * 4);", after: "Multiplication happens before addition — same as math class." },
      { id: "f24_2", kind: "predict", instruction: "Parentheses added. Now what?", code: "System.out.println((2 + 3) * 4);", opts: ["20", "14", "24", "11"], correct: 0, why: "Parentheses always go first." },
      { id: "f24_3", kind: "predict", instruction: "The big one. What prints?", code: "System.out.println(7 / 2);", opts: ["3", "3.5", "4", "(an error)"], correct: 0, why: "int / int truncates — it does NOT round. 7/2 = 3.5, truncated down to 3." },
      { id: "f24_4", kind: "spot", instruction: "Tap the line that doesn't do what you'd expect.", code: "double avg = 9 / 2;\nSystem.out.println(avg);", correct: 0, why: "9 / 2 is decided as INT MATH first (= 4) — storing the result in a double afterward doesn't undo that. It prints 4.0, not 4.5." },
      { id: "f24_5", kind: "trace", instruction: "Follow x.", code: "int x = 17;\nx = x % 5;\nx = x + 1;", questions: [
        { prompt: "after line 2, x = ?", opts: ["2", "3", "5"], correct: 0, why: "% is the remainder: 17 = 3×5 + 2." },
        { prompt: "after line 3, x = ?", opts: ["3", "2", "4"], correct: 0, why: "2 + 1." },
      ] },
      { id: "f24_6", kind: "fix", instruction: "One character is wrong. Find it, fix it.", code: 'int n = 4;\nif (n % 2 = 0) {\n  System.out.println("even");\n}', target: "even", solution: 'int n = 4;\nif (n % 2 == 0) {\n  System.out.println("even");\n}', hint: "= assigns a value. == compares two. Which do you need in a condition?", after: "One extra = sign, and it means something completely different." },
      { id: "f24_7", kind: "write", instruction: "15 is divisible by both. Print Fizz for one, Buzz for the other.", code: "// your code here\n", target: "Fizz\nBuzz", solution: 'if (15 % 3 == 0) {\n  System.out.println("Fizz");\n}\nif (15 % 5 == 0) {\n  System.out.println("Buzz");\n}', hint: "Two separate if-checks — one for 3, one for 5. Same pattern as the last step, twice." },
    ],
    tags: {
      "evaluate arithmetic expressions using order of operations": ["f24_1", "f24_2"],
      "predict the result of integer division": ["f24_3", "f24_4"],
      "use the modulo operator to find remainders": ["f24_5", "f24_6", "f24_7"],
    },
  },
};

async function main() {
  for (const [code, plan] of Object.entries(FLOWS)) {
    const lesson = await prisma.lesson.findUnique({ where: { code } });
    if (!lesson) { console.error(`✗ lesson ${code} not found`); continue; }

    await prisma.lesson.update({ where: { id: lesson.id }, data: { flow: { v: 1, steps: plan.steps } } });
    console.log(`✓ ${code} flow written (${plan.steps.length} steps)`);

    const skills = await prisma.skill.findMany({ where: { lessonId: lesson.id } });
    for (const [stmt, stepIds] of Object.entries(plan.tags)) {
      const skill = skills.find((s) => s.statement.toLowerCase() === stmt);
      if (!skill) { console.warn(`  ! skill not found on ${code}: "${stmt}"`); continue; }
      for (const questionId of stepIds) {
        await prisma.questionSkill.upsert({
          where: { questionId_skillId: { questionId, skillId: skill.id } },
          create: { questionId, skillId: skill.id, origin: "teacher" },
          update: {},
        });
      }
      console.log(`  ✓ tagged ${stepIds.length} steps → "${skill.statement}"`);
    }
  }
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
