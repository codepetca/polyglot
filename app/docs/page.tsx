import DocsBrowser from "@/components/DocsBrowser";
import { allSections, lessonsUsingSection } from "@/lib/curriculum/reference";
import { studentCode } from "@/lib/curriculum/codehs";

export const metadata = { title: "Java reference — polyglot" };

// The whole reference, browsable.
//
// NO SIGN-IN. Reference material is the last thing that should sit behind a
// login: a student who is stuck at home, or a teacher deciding whether this
// course is worth using, both need to be able to just look. It is also the
// first page that works in the account-free standalone mode — see
// PIKA-INTEGRATION.md.
const UNIT_TITLES: Record<number, string> = {
  3: "Unit 3 — Basic Java",
  4: "Unit 4 — Methods",
  5: "Unit 5 — Classes and OOP",
  6: "Unit 6 — Data Structures",
};

export default function DocsPage() {
  const sections = allSections();

  // Where each topic is taught, in the numbering the student sees.
  const where: Record<string, string[]> = {};
  for (const s of sections) {
    where[s.id] = lessonsUsingSection(s.id)
      .map(studentCode)
      .sort((a, b) => {
        const [au, al] = a.split(".").map(Number);
        const [bu, bl] = b.split(".").map(Number);
        return au - bu || al - bl;
      });
  }

  // GROUPED BY UNIT, filed under where a topic is FIRST taught. Several topics
  // are used again later — loops turn up all through Units 5 and 6 — so listing
  // a topic under every unit that touches it would put "Repeating" in four
  // places and make the page harder to search, not easier.
  const groups = Object.keys(UNIT_TITLES)
    .map(Number)
    .map((unit) => ({
      unit,
      title: UNIT_TITLES[unit],
      sections: sections.filter((sec) => {
        const units = (where[sec.id] || []).map((c) => Number(c.split(".")[0]));
        return units.length > 0 && Math.min(...units) === unit;
      }),
    }))
    .filter((g) => g.sections.length > 0);

  return (
    <main className="wrap docspage">
      <header className="noteshead">
        <h1>Java reference</h1>
        <p className="meta">
          Every piece of syntax this course uses. Each sample is compiled against real Java before it ships, so
          anything here can be pasted into the scratchpad and run.
        </p>
      </header>
      <DocsBrowser groups={groups} where={where} />
    </main>
  );
}
