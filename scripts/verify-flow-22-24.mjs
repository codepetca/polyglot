// Content verification for the 2.2 and 2.4 flows: every checkable snippet
// compiled and RUN through the real Java runner (Compiler Explorer, same as
// /api/run). Mirrors verify-flow-21.mjs.
//   node scripts/verify-flow-22-24.mjs

const GODBOLT = "https://godbolt.org/api/compiler/java2102/compile";
const HEADER = `import java.util.Scanner;
class Main {
    static Scanner __sc = new Scanner(System.in);
    static String input(String p){ System.out.print(p); return __sc.nextLine(); }
    public static void main(String[] args) {
`;
const FOOTER = `
    }
}`;

async function run(code) {
  const res = await fetch(GODBOLT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "classOS-edu/1.0" },
    body: JSON.stringify({
      source: HEADER + code + FOOTER,
      lang: "java",
      allowStoreCodeDebug: false,
      options: { userArguments: "", executeParameters: { args: [], stdin: "" }, compilerOptions: { executorRequest: true }, filters: { execute: true } },
    }),
  });
  const data = await res.json();
  const lines = (arr) => (arr || []).map((l) => l.text).join("\n");
  if (data.buildResult && data.buildResult.code !== 0) return { compiled: false, stdout: "", err: lines(data.buildResult.stderr) };
  return { compiled: true, stdout: lines(data.stdout), err: lines(data.stderr) };
}

const norm = (s) => (s || "").replace(/\r\n/g, "\n").trimEnd();

const CHECKS = [
  // ── 2.2 Variables and Types ──
  ["2.2 run1", 'int age = 16;\nSystem.out.println(age);', "16"],
  ["2.2 predict reassign", 'int x = 5;\nx = 8;\nSystem.out.println(x);', "8"],
  ["2.2 fix BROKEN must fail", 'int price = 9.99;\nSystem.out.println(price);', { mustFail: true }],
  ["2.2 fix solution", 'double price = 9.99;\nSystem.out.println(price);', "9.99"],
  ["2.2 predict coercion", 'int a = 7;\ndouble b = a;\nSystem.out.println(b);', "7.0"],
  ["2.2 write finale", 'String name = "Ada";\nint age = 16;\ndouble height = 5.4;\nSystem.out.println(name + " is " + age + ", " + height + " ft tall");', "Ada is 16, 5.4 ft tall"],

  // ── 2.4 Arithmetic Expressions ──
  ["2.4 run1", "System.out.println(2 + 3 * 4);", "14"],
  ["2.4 predict parens", "System.out.println((2 + 3) * 4);", "20"],
  ["2.4 predict int div", "System.out.println(7 / 2);", "3"],
  ["2.4 spot gotcha", "double avg = 9 / 2;\nSystem.out.println(avg);", "4.0"],
  ["2.4 fix BROKEN must fail", 'int n = 4;\nif (n % 2 = 0) {\n  System.out.println("even");\n}', { mustFail: true }],
  ["2.4 fix solution", 'int n = 4;\nif (n % 2 == 0) {\n  System.out.println("even");\n}', "even"],
  ["2.4 write finale", 'if (15 % 3 == 0 && 15 % 5 == 0) {\n  System.out.println("FizzBuzz");\n}', "FizzBuzz"],
];

let fail = 0;
for (const [name, code, expected] of CHECKS) {
  const r = await run(code);
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
