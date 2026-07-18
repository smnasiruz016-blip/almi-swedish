// Engine selftests — run with `npm run selftest:engine` (tsx).
// Proves the per-skill readiness bands and objective grading are correct.

import {
  gradeObjective,
  readinessFromPct,
  skillReadout,
  aggregateReadout,
  achievedReadout,
} from "./grading";

let pass = 0;
let fail = 0;
function eq(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) { pass++; } else { fail++; console.error(`✗ ${label}: got ${a}, want ${e}`); }
}

// ---- objective grading ----
eq(gradeObjective({ type: "MCQ_SINGLE", correctIndex: 2 }, { index: 2 }), { points: 1, maxPoints: 1 }, "mcq correct");
eq(gradeObjective({ type: "MCQ_SINGLE", correctIndex: 2 }, { index: 0 }), { points: 0, maxPoints: 1 }, "mcq wrong");
eq(gradeObjective({ type: "TRUE_FALSE", correctIndex: 1 }, { index: 1 }), { points: 1, maxPoints: 1 }, "tf correct");
eq(
  gradeObjective({ type: "MATCHING", pairs: [[0, 1], [1, 2], [2, 0]] }, { pairs: [[0, 1], [1, 2], [2, 2]] }),
  { points: 2, maxPoints: 3 },
  "matching partial",
);
eq(
  gradeObjective({ type: "CLOZE", correct: [{ id: 1, index: 0 }, { id: 2, index: 3 }] }, { gaps: [{ id: 1, index: 0 }, { id: 2, index: 1 }] }),
  { points: 1, maxPoints: 2 },
  "cloze partial",
);
eq(gradeObjective({ type: "ORDERING", order: [2, 0, 1] }, { order: [2, 0, 1] }), { points: 1, maxPoints: 1 }, "ordering correct");
eq(gradeObjective({ type: "ORDERING", order: [2, 0, 1] }, { order: [0, 1, 2] }), { points: 0, maxPoints: 1 }, "ordering wrong");

// ---- readiness bands (BORDERLINE 55 / CLEAR 70) ----
eq(readinessFromPct(85), "CLEAR", "band 85");
eq(readinessFromPct(70), "CLEAR", "band 70 floor");
eq(readinessFromPct(69), "BORDERLINE", "band 69");
eq(readinessFromPct(55), "BORDERLINE", "band 55 floor");
eq(readinessFromPct(54), "BELOW", "band 54");
eq(readinessFromPct(0), "BELOW", "band 0");

// productive skills flagged as estimate
eq(skillReadout("WRITING", 0, 0).isEstimate, true, "writing is estimate");
eq(skillReadout("READING", 8, 10).isEstimate, false, "reading not estimate");
eq(skillReadout("READING", 8, 10).readiness, "CLEAR", "reading 80% clear");

// aggregate: weakest skill + mean + all-clear
{
  const agg = aggregateReadout([
    skillReadout("READING", 9, 10), // 90
    skillReadout("LISTENING", 5, 10), // 50 (weakest)
  ]);
  eq(agg.meanPct, 70, "agg mean");
  eq(agg.weakest, "LISTENING", "agg weakest");
  eq(agg.overall, "CLEAR", "agg overall 70");
  eq(agg.allClear, false, "agg not all clear (listening below)");
}
{
  const agg = aggregateReadout([
    skillReadout("READING", 9, 10),
    skillReadout("LISTENING", 8, 10),
  ]);
  eq(agg.allClear, true, "agg all clear");
}

// ---- No pass mark anywhere: report the level REACHED, never a readiness verdict ----
{
  // Cleared B1, missed B2 → working at B1, reaching for B2. Clearing the lower level
  // must never imply the higher one.
  const r = achievedReadout([
    { cefr: "B1", points: 4, maxPoints: 4 },
    { cefr: "B1", points: 3, maxPoints: 4 },
    { cefr: "B1", points: 3, maxPoints: 4 },
    { cefr: "B2", points: 1, maxPoints: 4 },
    { cefr: "B2", points: 1, maxPoints: 4 },
    { cefr: "B2", points: 0, maxPoints: 4 },
  ]);
  eq(r.workingAt, "B1", "achieved: cleared B1 reported");
  eq(r.reachingFor, "B2", "achieved: missed B2 is what they reach for");
}
{
  // Clearing BOTH reports the higher one — the point of a level ladder.
  const r = achievedReadout([
    { cefr: "B1", points: 4, maxPoints: 4 },
    { cefr: "B1", points: 4, maxPoints: 4 },
    { cefr: "B1", points: 3, maxPoints: 4 },
    { cefr: "B2", points: 4, maxPoints: 4 },
    { cefr: "B2", points: 3, maxPoints: 4 },
    { cefr: "B2", points: 3, maxPoints: 4 },
  ]);
  eq(r.workingAt, "B2", "achieved: cleared both → higher level reported");
  eq(r.reachingFor, null, "achieved: nothing above to reach for");
}
{
  // One aced B2 task is not evidence of B2 — below the evidence floor.
  const r = achievedReadout([
    { cefr: "B1", points: 4, maxPoints: 4 },
    { cefr: "B1", points: 4, maxPoints: 4 },
    { cefr: "B1", points: 3, maxPoints: 4 },
    { cefr: "B2", points: 4, maxPoints: 4 },
  ]);
  eq(r.workingAt, "B1", "achieved: a single aced B2 cannot crown B2");
  eq(r.byLevel.find((l) => l.cefr === "B2")?.sufficient, false, "achieved: thin B2 flagged");
}
{
  // Nothing cleared → claim nothing, rather than crowning the level they touched.
  const r = achievedReadout([
    { cefr: "B1", points: 1, maxPoints: 4 },
    { cefr: "B1", points: 1, maxPoints: 4 },
    { cefr: "B1", points: 0, maxPoints: 4 },
  ]);
  eq(r.workingAt, null, "achieved: nothing cleared → no level claimed");
  eq(r.reachingFor, "B1", "achieved: B1 is what they are reaching for");
}
{
  // Untagged tasks claim no level at all.
  const r = achievedReadout([
    { points: 4, maxPoints: 4 },
    { points: 4, maxPoints: 4 },
    { points: 4, maxPoints: 4 },
  ]);
  eq(r.workingAt, null, "achieved: undeclared tasks claim no level");
  eq(r.undeclaredCount, 3, "achieved: undeclared counted");
  eq(r.byLevel.length, 0, "achieved: no level buckets from undeclared");
}

console.log(`\nAlmiSwedish engine selftest: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
