// Lightweight ops/health endpoint: reports active NorwegianItem counts per
// exam/skill (no PII, counts only). DB-optional — never 500s, so a deploy can be
// verified before Neon is wired (dbError is surfaced honestly instead).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  let itemsActive: number | null = null;
  let items: Record<string, number> = {};
  let approvedReviews: number | null = null;
  let dbError: string | null = null;

  try {
    const [byExamSkill, total, reviews] = await Promise.all([
      prisma.norwegianItem.groupBy({
        by: ["exam", "skill"],
        where: { active: true },
        _count: true,
      }),
      prisma.norwegianItem.count({ where: { active: true } }),
      prisma.review.count({ where: { approved: true } }),
    ]);
    for (const r of byExamSkill) items[`${r.exam}.${r.skill}`] = r._count;
    itemsActive = total;
    approvedReviews = reviews;
  } catch (e) {
    dbError = e instanceof Error ? e.message : "db error";
  }

  return NextResponse.json(
    { ok: true, product: "almi-norwegian", itemsActive, items, approvedReviews, dbError },
    { headers: { "Cache-Control": "no-store" } },
  );
}
