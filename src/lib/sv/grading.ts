// AlmiSwedish scoring engine.
//
// What each exam's real result actually is differs, and this file must not flatten
// them (the per-exam sentence lives in ExamMeta.resultBasis):
//   • Tisus — a real pass/fail examination judged by Stockholms universitet. The
//     only verdict in this product. SU publishes no CEFR level, so ≈C1 is ours.
//   • SFI A–B / C–D — courses assessed by a school, on a Skolverket scale that is
//     NOT CEFR. Not a single exam with a mark.
//   • Swedish B1–B2 — our own ladder. No body awards a result for it at all.
//   • Medborgarskapsprovet — UHR has published NO pass mark.
//   • The citizenship LANGUAGE component — does not exist; we ship no practice.
//
// So there is no single target to band every skill against, and this engine no
// longer pretends otherwise: it reports the level REACHED (achievedReadout) rather
// than readiness against an imagined threshold. Productive skills (Writing/Speaking)
// are labelled as estimates. Nothing here is ever an official result.

import { READY_PCT, BORDERLINE_PCT } from "./registry";
import type { ObjectiveAnswer, SwedishTaskType, SwedishSkill } from "./types";
import { isObjectiveTask } from "./types";
import { CEFR_ORDER } from "@smnasiruz016-blip/almi-data";
import type { CefrLevel, LevelScored } from "@smnasiruz016-blip/almi-data";

export type Readiness = "CLEAR" | "BORDERLINE" | "BELOW";

export interface ObjectiveResult {
  points: number;
  maxPoints: number;
}

/** Deterministically grade one objective item's response against its key. */
export function gradeObjective(
  answer: ObjectiveAnswer,
  response: unknown,
): ObjectiveResult {
  switch (answer.type) {
    case "MCQ_SINGLE":
    case "TRUE_FALSE": {
      const picked = (response as { index?: number } | null)?.index;
      return { points: picked === answer.correctIndex ? 1 : 0, maxPoints: 1 };
    }
    case "MATCHING": {
      const picks = (response as { pairs?: [number, number][] } | null)?.pairs ?? [];
      const key = new Map(answer.pairs.map(([l, r]) => [l, r]));
      let pts = 0;
      for (const [l, r] of picks) if (key.get(l) === r) pts++;
      return { points: pts, maxPoints: answer.pairs.length };
    }
    case "CLOZE": {
      const picks = (response as { gaps?: { id: number; index: number }[] } | null)?.gaps ?? [];
      const key = new Map(answer.correct.map((c) => [c.id, c.index]));
      let pts = 0;
      for (const g of picks) if (key.get(g.id) === g.index) pts++;
      return { points: pts, maxPoints: answer.correct.length };
    }
    case "ORDERING": {
      const order = (response as { order?: number[] } | null)?.order ?? [];
      const correct =
        order.length === answer.order.length &&
        order.every((v, i) => v === answer.order[i]);
      return { points: correct ? 1 : 0, maxPoints: 1 };
    }
  }
}

/** Percentage → honest readiness band vs the level's real criteria. */
export function readinessFromPct(pct: number): Readiness {
  if (pct >= READY_PCT) return "CLEAR";
  if (pct >= BORDERLINE_PCT) return "BORDERLINE";
  return "BELOW";
}

export interface SkillReadout {
  skill: SwedishSkill;
  points: number;
  maxPoints: number;
  pct: number;
  readiness: Readiness; // objective skills only; productive → estimate label
  isEstimate: boolean; // productive (Writing/Speaking) = AI estimate
}

export function skillReadout(
  skill: SwedishSkill,
  points: number,
  maxPoints: number,
): SkillReadout {
  const pct = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
  const isEstimate = skill === "WRITING" || skill === "SPEAKING";
  return { skill, points, maxPoints, pct, readiness: readinessFromPct(pct), isEstimate };
}

/** Overall readiness LABEL for a percentage (honest, non-official framing). */
export function classificationLabel(pct: number): string {
  if (pct >= 85) return "Strong (practice estimate)";
  if (pct >= READY_PCT) return "On track (practice estimate)";
  if (pct >= BORDERLINE_PCT) return "Borderline (practice estimate)";
  return "Below level (practice estimate)";
}

/**
 * Aggregate a full mock's per-skill readouts into an overall readiness estimate.
 * Honest model: the official result is pass/fail per part against criteria, so we
 * take the mean objective percentage as an ORIENTATION estimate and flag the
 * weakest skill — never claim an official classification. We also surface whether
 * every graded skill reads CLEAR (the "ready across all four skills" shape).
 */
export function aggregateReadout(readouts: SkillReadout[]): {
  meanPct: number;
  overall: Readiness;
  label: string;
  weakest: SwedishSkill | null;
  allClear: boolean;
} {
  const graded = readouts.filter((r) => r.maxPoints > 0);
  const meanPct = graded.length
    ? Math.round(graded.reduce((s, r) => s + r.pct, 0) / graded.length)
    : 0;
  let weakest: SwedishSkill | null = null;
  let low = Infinity;
  for (const r of graded) if (r.pct < low) { low = r.pct; weakest = r.skill; }
  return {
    meanPct,
    overall: readinessFromPct(meanPct),
    label: classificationLabel(meanPct),
    weakest,
    allClear: graded.length > 0 && graded.every((r) => r.readiness === "CLEAR"),
  };
}

/** True when this task type is auto-gradable (objective). */
export function isObjectiveTaskType(t: SwedishTaskType): boolean {
  return isObjectiveTask(t);
}

/** A level needs at least this many scored tasks before the session may say anything
 *  about it. One lucky task is not evidence of a level, and one unlucky one is not
 *  evidence against it. */
export const MIN_TASKS_PER_LEVEL = 3;

export interface LevelBreakdown {
  cefr: CefrLevel;
  count: number;
  points: number;
  maxPoints: number;
  pct: number;
  /** False when `count < MIN_TASKS_PER_LEVEL` — still rendered, but never allowed to
   *  decide `workingAt`. Showing it keeps thin evidence visible instead of hidden. */
  sufficient: boolean;
}

export interface AchievedReadout {
  /** The highest level the learner both attempted ENOUGH of and actually cleared.
   *  null = no level has enough evidence yet, or none was cleared. Say that plainly
   *  rather than crowning a level they merely touched. */
  workingAt: CefrLevel | null;
  /** The lowest sufficiently-evidenced level above `workingAt` that was NOT cleared —
   *  what they are reaching for. null when there is no such level. */
  reachingFor: CefrLevel | null;
  byLevel: LevelBreakdown[];
  undeclaredCount: number;
  /** False when NOT ONE task in the set carried a level.
   *
   *  This is a different fact from "no level was reached", and the interface must
   *  not say the second when the first is true. Only svenska-b1b2 is level-tagged;
   *  SFI A–B, SFI C–D and Tisus are not. Collapsing the two would tell a learner
   *  who answered everything correctly that they reached no level, when the truth
   *  is that these tasks were never graded to a level in the first place. */
  levelGraded: boolean;
}

/** What to say when the tasks carry no level at all. Not a failure — an absence.
 *  Shared so the practice runner and the mock runner cannot drift apart on it. */
export const UNDECLARED_LEVEL_TEXT = "These tasks aren't level-graded.";

/** What to say when levels WERE graded but none was cleared on enough evidence. */
export const NO_LEVEL_REACHED_TEXT = "No level reached in this set yet.";

/**
 * The readout for a skill with NO pass mark — which in Sweden is every skill.
 *
 * This is not a stopgap until a standard arrives; it is the honest answer to the only
 * question there is. Sweden has no language pass mark in force (LANGUAGE_TEST_HEDGE),
 * so "are you ready?" has no referent: ready for what? Asking it anyway, and printing
 * a percentage against an imagined target, would manufacture exactly the standard the
 * product elsewhere refuses to invent. So we answer what CAN be answered — what level
 * are you working at? — and we answer it conservatively:
 *
 *  - a level counts only with at least MIN_TASKS_PER_LEVEL tasks behind it;
 *  - `workingAt` is the HIGHEST such level actually cleared (READY_PCT), so clearing
 *    B1 while missing B2 reports B1 — a lower-level win never implies a higher one;
 *  - every level attempted is reported with its own numbers, thin ones included.
 *
 * A practice estimate from the tasks served. Never a UHR, Skolverket or Tisus result.
 *
 * NOTE: byte-for-byte the same rule as almi-norwegian's achievedReadout, which is the
 * other product with no pass mark. Deliberately duplicated for now, to be lifted into
 * @smnasiruz016-blip/almi-data once both have landed — extracted against two real
 * consumers rather than guessed from one. Do not let a third copy appear first.
 */
export function achievedReadout(scored: readonly LevelScored[]): AchievedReadout {
  const buckets = new Map<CefrLevel, { count: number; points: number; maxPoints: number }>();
  let undeclaredCount = 0;

  for (const s of scored) {
    if (!s.cefr) {
      undeclaredCount++;
      continue;
    }
    const b = buckets.get(s.cefr) ?? { count: 0, points: 0, maxPoints: 0 };
    b.count++;
    b.points += s.points;
    b.maxPoints += s.maxPoints;
    buckets.set(s.cefr, b);
  }

  const byLevel: LevelBreakdown[] = CEFR_ORDER.filter((l) => buckets.has(l)).map((cefr) => {
    const b = buckets.get(cefr)!;
    return {
      cefr,
      count: b.count,
      points: b.points,
      maxPoints: b.maxPoints,
      pct: b.maxPoints > 0 ? Math.round((b.points / b.maxPoints) * 100) : 0,
      sufficient: b.count >= MIN_TASKS_PER_LEVEL,
    };
  });

  const cleared = byLevel.filter((l) => l.sufficient && l.pct >= READY_PCT);
  const workingAt = cleared.length > 0 ? cleared[cleared.length - 1].cefr : null;

  const above = byLevel.filter(
    (l) =>
      l.sufficient &&
      l.pct < READY_PCT &&
      (workingAt === null || CEFR_ORDER.indexOf(l.cefr) > CEFR_ORDER.indexOf(workingAt)),
  );
  const reachingFor = above.length > 0 ? above[0].cefr : null;

  return { workingAt, reachingFor, byLevel, undeclaredCount, levelGraded: byLevel.length > 0 };
}
