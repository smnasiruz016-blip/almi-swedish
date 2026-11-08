/**
 * RR-399 A5 · the honest badge on the Writing and Speaking cards (exam page). It used to say "Pro" for everyone, which stopped
 * being true when every new account got the free 48 hours with 1 AI-scored Writing and 1 AI-scored Speaking.
 *
 *   paid (subscriber, comp, owner)          no badge
 *   inside the free 48 hours, not used yet  "1 free AI check in your 48 hours"
 *   inside the free 48 hours, used          "Used · Unlock for $12/month"
 *   after the 48 hours (or none to give)    "Unlock for $12/month"
 *
 * Pure: the page passes hasPaidAccess(), isTasteActive() and the used count (the same ledger count the AI route uses).
 */
import { TASTE_AI_LIMITS, type TasteAiKind } from "./taste";
import { UNLOCK_LABEL } from "./offer";

export type AiBadgeState = { paid: boolean; tasteActive: boolean; kind: TasteAiKind; used: number };
export type AiBadge = { label: string; tone: "free" | "used" | "locked" } | null;

export function aiBadge(s: AiBadgeState): AiBadge {
  if (s.paid) return null;
  if (s.tasteActive) {
    if (s.used >= TASTE_AI_LIMITS[s.kind]) return { label: `Used · ${UNLOCK_LABEL}`, tone: "used" };
    return { label: `${TASTE_AI_LIMITS[s.kind]} free AI check in your 48 hours`, tone: "free" };
  }
  return { label: UNLOCK_LABEL, tone: "locked" };
}
