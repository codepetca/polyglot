import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import BadgeAdmin from "@/components/admin/BadgeAdmin";

export const dynamic = "force-dynamic";

export default async function BadgesPage() {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (me.role !== "ADMIN") redirect("/");

  // PIKA STUDENTS ONLY. A badge is meant to land in Pal, so it can only be
  // given to somebody Pal knows about — which means somebody who arrived
  // through Pika and has a pikaSubject. Handing one to a local test account
  // would create an award with nowhere to go.
  const people = await prisma.user.findMany({
    where: { id: { not: me.id }, pikaSubject: { not: null }, role: "STUDENT" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });

  return <BadgeAdmin people={people} />;
}
