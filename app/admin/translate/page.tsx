import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import TranslateConsole from "@/components/admin/TranslateConsole";

export const dynamic = "force-dynamic";

// The page that was missing. /api/curriculum/translate has existed for a while
// and nothing ever called it, so translating a lesson was possible only by
// hand-crafting an authenticated POST — which is to say, not possible.
export default async function TranslatePage() {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (me.role !== "ADMIN") redirect("/");
  return <TranslateConsole />;
}
