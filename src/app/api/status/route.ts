// Lightweight ops/health endpoint: reports the shipped task counts per exam/skill
// (no PII, counts only). DB-optional — never 500s, so a deploy can be verified before
// Neon is wired (dbError is surfaced honestly instead).
//
// ⚠️ ITEM COUNTS COME FROM THE JSON BUNDLES, NOT THE DATABASE — because that is where
// this product's items actually live. The runner serves tasks via pickPractice() /
// getItems(), which read src/data/items/*.json off disk. NOTHING in this repo ever
// WRITES prisma.swedishItem.
//
// This endpoint used to count prisma.swedishItem, inherited from an ancestor that seeded
// its bank into the database. Here it queried a table nobody fills, so it reported
// itemsActive: 0 while the bundles shipped and served fine. Nothing threw — the number
// was simply false. And this is the endpoint AlmiMonitor attributes health from, so
// "this product has no content" was the answer it believed.
//
// The fix is NOT to seed the DB to match. That creates a SECOND source of truth: edit a
// bundle, forget the seeder, and this endpoint lies again — only now with a number that
// looks maintained. One source, read at the source.
//
// Keys stay `EXAM.SKILL`. In almi-swiss the same fix had to re-key to the registry slug,
// because there one exam (FIDE) spans three tracks and `exam` did not identify a
// surface — it silently merged three modules into one number. Here every registry entry
// has a unique `exam`, so the key is unambiguous and the endpoint's existing contract is
// preserved. If a track is ever added that reuses an exam, switch to the slug.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALL_EXAMS } from "@/lib/sv/registry";
import { getItems } from "@/lib/sv/items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const items: Record<string, number> = {};
  let itemsActive = 0;
  for (const exam of ALL_EXAMS) {
    for (const skill of exam.skills) {
      const n = getItems({ exam: exam.exam, skill }).length;
      if (n > 0) items[`${exam.exam}.${skill}`] = n;
      itemsActive += n;
    }
  }

  // The DB still answers for what the DB actually owns.
  let approvedReviews: number | null = null;
  let dbError: string | null = null;
  try {
    approvedReviews = await prisma.review.count({ where: { approved: true } });
  } catch (e) {
    dbError = e instanceof Error ? e.message : "db error";
  }

  return NextResponse.json(
    { ok: true, product: "almi-swedish", itemsActive, items, approvedReviews, dbError },
    { headers: { "Cache-Control": "no-store" } },
  );
}
