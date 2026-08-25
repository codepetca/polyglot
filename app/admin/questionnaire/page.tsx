import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import Forbidden from "@/components/Forbidden";
import { getQuestionnaire, tally } from "@/lib/questionnaire";
import QuestionnaireAdmin from "@/components/admin/QuestionnaireAdmin";

export default async function QuestionnairePage() {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (me.role !== "ADMIN") return <Forbidden need="Admin" />;
  const cfg = await getQuestionnaire();
  const t = await tally(cfg);
  return (
    <div className="main" style={{ maxWidth: 780 }}>
      <div className="crumb">ADMIN · QUESTIONNAIRE</div>
      <h1 className="title" style={{ marginBottom: 6 }}>Ask the class</h1>
      <p style={{ color: "var(--muted)", marginBottom: 10, maxWidth: "62ch" }}>
        A few fixed-answer questions in the top bar. One-way and unmonitored by design — nobody replies, so it stays
        inside what the board allows, unlike the messaging thread.
      </p>
      <QuestionnaireAdmin initial={cfg} tally={t} />
    </div>
  );
}
