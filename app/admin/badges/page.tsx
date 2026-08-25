import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import BadgeAdmin from "@/components/admin/BadgeAdmin";

export const dynamic = "force-dynamic";

export default async function BadgesPage() {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (me.role !== "ADMIN") redirect("/");

  const people = await prisma.user.findMany({
    where: { id: { not: me.id } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, role: true },
  });

  return <BadgeAdmin people={people} />;
}
