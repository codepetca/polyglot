// Content verification for the 2.3 "User Input" flow — the first lesson using
// simulated stdin. Every snippet compiled and RUN through the real Java
// runner WITH real stdin, exactly as FlowPlayer now sends it.
//   node scripts/verify-flow-23.mjs

const GODBOLT = "https://godbolt.org/api/compiler/java2102/compile";
const HEADER = `import java.util.Scanner;
class Main {
    static Scanner __sc = new Scanner(System.in);
    public static void main(String[] args) {
`;
const FOOTER = `
    }
}`;

async function run(code, stdin = "") {
  const res = await fetch(GODBOLT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "classOS-edu/1.0" },
    body: JSON.stringify({
      source: HEADER + code + FOOTER,
      lang: "java",
      allowStoreCodeDebug: false,
      options: { userArguments: "", executeParameters: { args: [], stdin }, compilerOptions: { executorRequest: true }, filters: { execute: true } },
    }),
  });
  const data = await res.json();
  const lines = (arr) => (arr || []).map((l) => l.text).join("\n");
  if (data.buildResult && data.buildResult.code !== 0) return { compiled: false, stdout: "", err: lines(data.buildResult.stderr) };
  return { compiled: true, stdout: lines(data.stdout), err: lines(data.stderr) };
}

const norm = (s) => (s || "").replace(/\r\n/g, "\n").trimEnd();

const CHECKS = [
  ["f23_1 run", 'Scanner input = new Scanner(System.in);\nSystem.out.print("What is your name? ");\nString name = input.nextLine();\nSystem.out.println("Hi, " + name + "!");', "Ada", "What is your name? Hi, Ada!"],
  ["f23_2 tweak baseline", 'Scanner input = new Scanner(System.in);\nSystem.out.print("What is your name? ");\nString name = input.nextLine();\nSystem.out.println("Hi, " + name + "!");', "Ada", "What is your name? Hi, Ada!"],
  ["f23_3 predict nextInt", 'Scanner input = new Scanner(System.in);\nSystem.out.print("Age? ");\nint age = input.nextInt();\nSystem.out.println("Next year: " + (age + 1));', "16", "Age? Next year: 17"],
  ["f23_5 fix BROKEN must fail", 'Scanner input = new Scanner(System.in);\nSystem.out.print("What is your name? ");\nString name = input.nextInt();\nSystem.out.println("Hi, " + name + "!");', "Ada", { mustFail: true }],
  ["f23_5 fix solution", 'Scanner input = new Scanner(System.in);\nSystem.out.print("What is your name? ");\nString name = input.nextLine();\nSystem.out.println("Hi, " + name + "!");', "Ada", "What is your name? Hi, Ada!"],
  ["f23_6 write solution", 'Scanner input = new Scanner(System.in);\nSystem.out.print("Age? ");\nint age = input.nextInt();\nSystem.out.println("In 10 years: " + (age + 10));', "16", "Age? In 10 years: 26"],
];

let fail = 0;
for (const [name, code, stdin, expected] of CHECKS) {
  const r = await run(code, stdin);
  if (expected && expected.mustFail) {
    if (!r.compiled) console.log(`✓ ${name}: fails to compile (as designed)`);
    else { console.log(`✗ ${name}: SHOULD FAIL but compiled, printed: ${JSON.stringify(r.stdout)}`); fail++; }
    continue;
  }
  if (!r.compiled) { console.log(`✗ ${name}: DID NOT COMPILE: ${r.err.slice(0, 150)}`); fail++; continue; }
  if (norm(r.stdout) === norm(expected)) console.log(`✓ ${name}: ${JSON.stringify(norm(r.stdout))}`);
  else { console.log(`✗ ${name}: expected ${JSON.stringify(norm(expected))} got ${JSON.stringify(norm(r.stdout))}`); fail++; }
}
console.log(fail ? `\n${fail} FAILURE(S)` : "\nall checks passed");
process.exit(fail ? 1 : 0);
