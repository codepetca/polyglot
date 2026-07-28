// Authors the interactive flow for 2.3 "User Input" — the first lesson using
// simulated stdin (the platform's real gap, closed today: FlowStep.stdin now
// threads through the client and the runner). Same discipline as 2.1/2.2/2.4:
// every checkable snippet compiled and RUN through the real Java compiler
// WITH real stdin before being written (verify-flow-23.mjs, 6/6 passed).
//
//   node --env-file=.env scripts/author-flow-23.mjs

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const STEPS = [
  { id: "f23_1", kind: "run", instruction: "This one waits for you. Run it.", code: 'Scanner input = new Scanner(System.in);\nSystem.out.print("What is your name? ");\nString name = input.nextLine();\nSystem.out.println("Hi, " + name + "!");', stdin: "Ada", after: "The program paused, took what you typed, then kept going." },
  { id: "f23_2", kind: "tweak", instruction: "Change the question it asks. Run it.", code: 'Scanner input = new Scanner(System.in);\nSystem.out.print("What is your name? ");\nString name = input.nextLine();\nSystem.out.println("Hi, " + name + "!");', stdin: "Ada", target: "What is your name? Hi, Ada!", hint: "Change the text inside the first print — that's the prompt.", after: "You control exactly what it asks before it listens." },
  { id: "f23_3", kind: "predict", instruction: "Typed 16. What prints?", code: 'Scanner input = new Scanner(System.in);\nSystem.out.print("Age? ");\nint age = input.nextInt();\nSystem.out.println("Next year: " + (age + 1));', stdin: "16", opts: ["Age? Next year: 17", "Age? Next year: 16", "Age?\nNext year: 17", "(an error)"], correct: 0, why: "print doesn't break the line — the prompt and the reply share one line, same as always." },
  { id: "f23_4", kind: "match", instruction: "Match each method to what it reads.", pairs: [["nextInt()", "a whole number"], ["nextDouble()", "a decimal number"], ["nextLine()", "a full line of text"]], why: "The method name tells Scanner exactly what shape of answer to expect." },
  { id: "f23_5", kind: "fix", instruction: "One line reads the wrong type. Fix it.", code: 'Scanner input = new Scanner(System.in);\nSystem.out.print("What is your name? ");\nString name = input.nextInt();\nSystem.out.println("Hi, " + name + "!");', stdin: "Ada", target: "What is your name? Hi, Ada!", solution: 'Scanner input = new Scanner(System.in);\nSystem.out.print("What is your name? ");\nString name = input.nextLine();\nSystem.out.println("Hi, " + name + "!");', hint: "You're reading a NAME — text, not a number. Which method reads a whole line of text?", after: "nextInt() expects a number; a name isn't one. nextLine() takes anything." },
  { id: "f23_6", kind: "write", instruction: "Ask for their age. Print their age in 10 years.", code: "// your code here\n", stdin: "16", target: "Age? In 10 years: 26", solution: 'Scanner input = new Scanner(System.in);\nSystem.out.print("Age? ");\nint age = input.nextInt();\nSystem.out.println("In 10 years: " + (age + 10));', hint: "Same shape as the predict step — prompt, then nextInt(), then use it." },
];

const TAGS = {
  "read user input using the scanner class": ["f23_1", "f23_2"],
  "choose the right scanner method for each input type": ["f23_3", "f23_4", "f23_5"],
  "prompt the user before reading input": ["f23_6"],
};

async function main() {
  const lesson = await prisma.lesson.findUnique({ where: { code: "2.3" } });
  if (!lesson) throw new Error("lesson 2.3 not found");

  await prisma.lesson.update({ where: { id: lesson.id }, data: { flow: { v: 1, steps: STEPS } } });
  console.log(`✓ 2.3 flow written (${STEPS.length} steps)`);

  const skills = await prisma.skill.findMany({ where: { lessonId: lesson.id } });
  for (const [stmt, stepIds] of Object.entries(TAGS)) {
    const skill = skills.find((s) => s.statement.toLowerCase() === stmt);
    if (!skill) { console.warn(`! skill not found: ${stmt}`); continue; }
    for (const questionId of stepIds) {
      await prisma.questionSkill.upsert({
        where: { questionId_skillId: { questionId, skillId: skill.id } },
        create: { questionId, skillId: skill.id, origin: "teacher" },
        update: {},
      });
    }
    console.log(`✓ tagged ${stepIds.length} steps → "${skill.statement}"`);
  }
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
