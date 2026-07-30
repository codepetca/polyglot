// Content verification for the 2.9 "For Loops" flow. Every RUNNABLE snippet is
// compiled and executed against the real Java runner before authoring.
//
// Note: `spot` steps are never executed (verifyFlow treats them as structural
// only), which is what makes it safe to SHOW an infinite loop in one — the whole
// point of that step is to recognise it without running it.
//   node scripts/verify-flow-29.mjs

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
  ["f29_1 run (count to 5)", 'for (int i = 1; i <= 5; i++) {\n  System.out.println(i);\n}', "1\n2\n3\n4\n5"],
  ["f29_2 tweak baseline", 'for (int i = 1; i <= 5; i++) {\n  System.out.println(i);\n}', "1\n2\n3\n4\n5"],
  ["f29_3 predict (< vs <=)", 'for (int i = 1; i < 5; i++) {\n  System.out.print(i);\n}', "1234"],
  ["f29_4 predict (start at 0)", 'for (int i = 0; i < 3; i++) {\n  System.out.print("x");\n}', "xxx"],
  ["f29_6 fill (correct chips)", 'for (int i = 2; i <= 10; i = i + 2) {\n  System.out.print(i + " ");\n}', "2 4 6 8 10"],
  ["f29_7 fix BROKEN (off-by-one, must NOT match target)", 'for (int i = 1; i < 3; i++) {\n  System.out.println("hi");\n}', "hi\nhi"],
  ["f29_7 fix solution", 'for (int i = 1; i <= 3; i++) {\n  System.out.println("hi");\n}', "hi\nhi\nhi"],
  ["f29_8 write solution (times table)", 'for (int i = 1; i <= 4; i++) {\n  System.out.println(i + " x 3 = " + (i * 3));\n}', "1 x 3 = 3\n2 x 3 = 6\n3 x 3 = 9\n4 x 3 = 12"],
];

let fail = 0;
for (const [name, code, expected] of CHECKS) {
  const r = await run(code);
  if (!r.compiled) { console.log(`✗ ${name}: DID NOT COMPILE: ${r.err.slice(0, 140)}`); fail++; continue; }
  if (norm(r.stdout) === norm(expected)) console.log(`✓ ${name}: ${JSON.stringify(norm(r.stdout))}`);
  else { console.log(`✗ ${name}: expected ${JSON.stringify(norm(expected))} got ${JSON.stringify(norm(r.stdout))}`); fail++; }
}
console.log(fail ? `\n${fail} FAILURE(S)` : "\nall checks passed");
process.exit(fail ? 1 : 0);
