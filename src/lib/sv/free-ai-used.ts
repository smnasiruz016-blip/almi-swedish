// RR-397/RR-399 · how many AI scorings of a kind this account already RECEIVED: a successful ledger row is written only after the
// model answered. ONE count, read by the AI route (/api/sv/grade, for the 1-free rule) and by the exam page (for the honest badge),
// so the two can never disagree. The race between two requests is closed by the atomic FreeAiUse claim, not by this count.
import { prisma } from "@/lib/prisma";
import type { TasteAiKind } from "@/lib/billing/taste";

export function aiFeatureFor(kind: TasteAiKind): string {
  return kind === "SPEAKING" ? "sv.grade.productive.speaking" : "sv.grade.productive.writing";
}

export function countAiScored(userId: string, kind: TasteAiKind): Promise<number> {
  return prisma.aICostLedger.count({ where: { userId, success: true, feature: { in: [aiFeatureFor(kind), "sv.grade.productive"] } } });
}
