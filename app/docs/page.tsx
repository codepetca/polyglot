import DocsBrowser from "@/components/DocsBrowser";
import { allSections, lessonsUsingSection } from "@/lib/curriculum/reference";
import { studentCode } from "@/lib/curriculum/codehs";

export const metadata = { title: "Java reference — classOS" };

// The whole reference, browsable.
//
// NO SIGN-IN. Reference material is the last thing that should sit behind a
// login: a student who is stuck at home, or a teacher deciding whether this
// course is worth using, both need to be able to just look. It is also the
// first page that works in the account-free standalone mode — see
// PIKA-INTEGRATION.md.
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

  return (
    <main className="wrap docspage">
      <header className="noteshead">
        <h1>Java reference</h1>
        <p className="meta">
          Every piece of syntax this course uses. Each sample is compiled against real Java before it ships, so
          anything here can be pasted into the scratchpad and run.
        </p>
      </header>
      <DocsBrowser sections={sections} where={where} />
    </main>
  );
}
