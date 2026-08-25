import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoleApi } from "@/lib/auth";
import { resolveActor } from "@/lib/actor";

// The admin's own badges.
//
// SAME SHAPE AS PAL'S COLLECTION — a name, a picture, a line of description —
// so these can be mirrored there as unlocks later rather than becoming a second
// rival reward system. Pal owns XP and levels; this is for the things XP cannot
// see, like spotting a bug in 6.7 or telling me the reference was unreadable.

/** GET — everything I have been given, plus the catalogue for an admin. */
export async function GET(req: Request) {
  const me = await resolveActor(req);
  if (!me) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const mine = await prisma.badgeAward.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    include: { badge: true },
  });

  const out: Record<string, unknown> = {
    mine: mine.map((a) => ({
      id: a.id,
      note: a.note,
      at: a.createdAt,
      name: a.badge.name,
      image: a.badge.image,
      description: a.badge.description,
    })),
  };

  if (me.role === "ADMIN") {
    out.catalogue = await prisma.badge.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { awards: true } } },
    });
  }
  return NextResponse.json(out);
}

/** POST — create a badge, or award one. Admin only. */
export async function POST(req: Request) {
  const me = await requireRoleApi("ADMIN");
  if (me instanceof NextResponse) return me;
  const body = await req.json();

  if (body.action === "create") {
    const name = String(body.name || "").trim().slice(0, 60);
    const image = String(body.image || "").trim().slice(0, 400_000);
    if (!name || !image) return NextResponse.json({ error: "A badge needs a name and a picture." }, { status: 400 });
    const badge = await prisma.badge.create({
      data: { name, image, description: String(body.description || "").trim().slice(0, 200) },
    });
    return NextResponse.json({ ok: true, badge });
  }

  if (body.action === "award") {
    const badgeId = String(body.badgeId || "");
    const userId = String(body.userId || "");
    if (!badgeId || !userId) return NextResponse.json({ error: "Pick a badge and a person." }, { status: 400 });
    // Unique on (badge, user): giving the same badge twice is a mistake, not a
    // feature, so it updates the note rather than stacking duplicates.
    const award = await prisma.badgeAward.upsert({
      where: { badgeId_userId: { badgeId, userId } },
      create: { badgeId, userId, note: String(body.note || "").trim().slice(0, 200) },
      update: { note: String(body.note || "").trim().slice(0, 200) },
    });
    const badge = await prisma.badge.findUnique({ where: { id: badgeId } });

    // Tell them. A badge nobody mentions is a row in a table — and it arrives
    // in the thread they already use to talk to me, so there is no new place
    // to check.
    if (badge) {
      await prisma.message.create({
        data: {
          kind: "badge",
          fromId: me.id,
          toId: userId,
          body: `🏅 You earned **${badge.name}**${award.note ? ` — ${award.note}` : ""}`,
        },
      });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

/** DELETE — remove a badge from the catalogue. */
export async function DELETE(req: Request) {
  const me = await requireRoleApi("ADMIN");
  if (me instanceof NextResponse) return me;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.badge.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
