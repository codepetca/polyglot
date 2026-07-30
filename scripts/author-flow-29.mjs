// Authors lesson 2.9 "For Loops" — the classic wall, and the first lesson to use
// the `fill` step kind. Also seeds 2.9's objectives + skills (it had none), so
// the mastery engine and AI overseer can see it like 2.1–2.4.
//
// Every runnable snippet was compiled and executed against the real Java runner
// first (scripts/verify-flow-29.mjs, 8/8 passed). The `spot` step deliberately
// shows an INFINITE loop — safe because spot steps are never executed, and
// recognising one without running it is exactly the skill.
//
//   node --env-file=.env scripts/author-flow-29.mjs

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const OBJECTIVES = [
  "trace a for-loop's counter through each iteration",
  "predict how many times a loop body runs",
  "write a for-loop that counts to a target",
];

const STEPS = [
  {
    id: "f29_1", kind: "run",
    instruction: "This repeats itself. Run it.",
    code: 'for (int i = 1; i <= 5; i++) {\n  System.out.println(i);\n}',
    after: "One line of code, five lines of output. That's a loop.",
    skills: [OBJECTIVES[2]],
  },
  {
    id: "f29_2", kind: "tweak",
    instruction: "Make it count to 10 instead.",
    code: 'for (int i = 1; i <= 5; i++) {\n  System.out.println(i);\n}',
    target: "1\n2\n3\n4\n5",
    hint: "Only one number decides where it stops.",
    after: "The middle part is the stop condition — it decides when to quit.",
    skills: [OBJECTIVES[2]],
  },
  {
    id: "f29_3", kind: "predict",
    instruction: "Note the < instead of <=. What prints?",
    code: 'for (int i = 1; i < 5; i++) {\n  System.out.print(i);\n}',
    opts: ["1234", "12345", "2345", "(nothing)"],
    correct: 0,
    why: "i < 5 stops BEFORE 5, so it runs on 1,2,3,4 — four times, not five. This one character is the most common loop bug there is.",
    skills: [OBJECTIVES[1]],
  },
  {
    id: "f29_4", kind: "predict",
    instruction: "How many x's?",
    code: 'for (int i = 0; i < 3; i++) {\n  System.out.print("x");\n}',
    opts: ["xxx", "xx", "xxxx", "(nothing)"],
    correct: 0,
    why: "Starting at 0 and stopping before 3 gives 0,1,2 — three runs. Starting at 0 with < is the standard way to repeat something N times.",
    skills: [OBJECTIVES[1]],
  },
  {
    id: "f29_5", kind: "trace",
    instruction: "Follow i.",
    code: 'for (int i = 1; i <= 3; i++) {\n  System.out.println(i * 10);\n}',
    questions: [
      { prompt: "first time through, what prints?", opts: ["10", "1", "30"], correct: 0, why: "i starts at 1, so i * 10 is 10." },
      { prompt: "and the last thing it prints?", opts: ["30", "40", "3"], correct: 0, why: "i reaches 3 (since i <= 3), so 3 * 10 = 30." },
      { prompt: "so how many lines total?", opts: ["3", "4", "2"], correct: 0, why: "i takes the values 1, 2, 3 — three passes, three lines." },
    ],
    skills: [OBJECTIVES[0]],
  },
  {
    id: "f29_6", kind: "spot",
    instruction: "Tap the line that makes this run forever.",
    code: 'for (int i = 1; i <= 3; i++) {\n  System.out.println("row " + i);\n  i = 1;\n}',
    correct: 2,
    why: "That line drags i back to 1 on every pass, so i++ can never get it past 3. The body can change the counter — and that's how loops get stuck.",
    skills: [OBJECTIVES[0]],
  },
  {
    id: "f29_7", kind: "fill",
    instruction: "Fill the blanks to print the even numbers up to 10.",
    code: 'for (int i = ⟦1⟧; i <= 10; i = i + ⟦2⟧) {\n  System.out.print(i + " ");\n}',
    blanks: [
      { chips: ["2", "1", "0"], answer: 0 },
      { chips: ["2", "1", "10"], answer: 0 },
    ],
    target: "2 4 6 8 10",
    hint: "Start on the first even number, and step by how far apart evens are.",
    after: "The third part doesn't have to be i++ — you can step by any amount.",
    skills: [OBJECTIVES[2]],
  },
  {
    id: "f29_8", kind: "fix",
    instruction: "It should print hi three times. Fix it.",
    code: 'for (int i = 1; i < 3; i++) {\n  System.out.println("hi");\n}',
    target: "hi\nhi\nhi",
    solution: 'for (int i = 1; i <= 3; i++) {\n  System.out.println("hi");\n}',
    hint: "Count it out: with i < 3 starting at 1, which values does i actually take?",
    after: "Off by one. Always count the actual values — 1, 2 is two passes, not three.",
    skills: [OBJECTIVES[1]],
  },
  {
    id: "f29_9", kind: "write",
    instruction: "Print the 3 times table up to 4 — match it exactly.",
    code: "// your code here\n",
    target: "1 x 3 = 3\n2 x 3 = 6\n3 x 3 = 9\n4 x 3 = 12",
    solution: 'for (int i = 1; i <= 4; i++) {\n  System.out.println(i + " x 3 = " + (i * 3));\n}',
    hint: "Loop i from 1 to 4, and build the line with + like you did in 2.1.",
    after: "You just generated four lines of formatted output from three lines of code. That's what loops are for.",
    skills: [OBJECTIVES[2]],
  },
];

async function main() {
  const lesson = await prisma.lesson.findUnique({ where: { code: "2.9" } });
  if (!lesson) throw new Error("lesson 2.9 not found");

  // 2.9 had no objectives — seed them (only if still empty, never clobber).
  const hasObj = ((lesson.objectives ?? []) || []).length > 0;
  await prisma.lesson.update({
    where: { id: lesson.id },
    data: { flow: { v: 1, steps: STEPS }, ...(hasObj ? {} : { objectives: OBJECTIVES }) },
  });
  console.log(`✓ 2.9 flow written (${STEPS.length} steps), objectives ${hasObj ? "kept" : "set"}`);

  // Skills: find-or-create per objective, then tag every step that claims it.
  const existing = await prisma.skill.findMany({ where: { lessonId: lesson.id } });
  const difficulty = { [OBJECTIVES[0]]: 3, [OBJECTIVES[1]]: 2, [OBJECTIVES[2]]: 3 };
  for (const stmt of OBJECTIVES) {
    let skill = existing.find((s) => s.statement.toLowerCase() === stmt.toLowerCase());
    if (!skill) {
      skill = await prisma.skill.create({
        data: { lessonId: lesson.id, statement: stmt, difficulty: difficulty[stmt], origin: "teacher", confidence: 1 },
      });
      existing.push(skill);
    }
    const stepIds = STEPS.filter((s) => (s.skills || []).includes(stmt)).map((s) => s.id);
    for (const questionId of stepIds) {
      await prisma.questionSkill.upsert({
        where: { questionId_skillId: { questionId, skillId: skill.id } },
        create: { questionId, skillId: skill.id, origin: "teacher" },
        update: {},
      });
    }
    console.log(`✓ tagged ${stepIds.length} steps → "${stmt}"`);
  }
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
