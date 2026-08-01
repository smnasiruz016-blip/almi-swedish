// ANSWER-DISTRIBUTION GATE — is the correct answer gameable from where it sits?
//
// A learner who always picks the same option index should not out-score one who reads the
// Norwegian. Before this gate every objective section in the product was measured and
// SEVEN of twenty-two failed: NORSKPROVE_A2B1::LISTENING::MCQ_SINGLE put 86% of its keys
// on index 1, BERGENSTEST::READING::MCQ_SINGLE 83%, and index 3 of a four-option question
// was never used ANYWHERE in the bank. The civics banks were at 81% and 63%. None of it
// was visible from the build — it was found by an external audit, which is not a gate,
// because an audit runs when someone remembers to run it.
//
// Type-aware, mirroring the sibling almi-swiss gate and the shared audit rule it must
// agree with, so a section that is green here is green in the ledger too:
//   MULTI  (MCQ_SINGLE, CLOZE)  — POSITION CLUSTERING. No option index may hold more than
//                                 CLUSTER of a section's answers. Needs MIN_N.
//   BINARY (TRUE_FALSE)         — BALANCE. Neither side past BINARY_SKEW. Needs MIN_N.
//   EXTREME (either)            — one position at or above EXTREME fires from just
//                                 EXTREME_MIN_N answers, which is what catches the small
//                                 all-one-way sections MIN_N would otherwise wave through.
// MATCHING and ORDERING are excluded from POSITION rules and correctly so — no single
// index gives them away; their giveaway is the shape of the whole key, a separate rule
// this product does not yet have.
//
// ── A NOTE ON BINARY, BECAUSE IT IS WHERE THIS GATE COULD BE CHEATED ──
// Every TRUE_FALSE item in this bank renders ["Sant", "Usant"] in that order, so for those
// sections POSITION IS VALUE — index 1 always means "Usant". A section where all three
// answers are "Usant" can be made to read clean by shuffling the two options apart, and
// the exploit ("answer Usant every time") survives it completely. So a binary section is
// NOT repairable by re-ordering, only by writing an item whose answer is the other value.
// The gate says so in its failure message rather than leaving the next person to discover
// that the obvious fix is the wrong one.
//
// Scope = `${exam}::${skill}::${taskType}`, the axis a learner actually practises. Counted
// per SLOT, so a CLOZE item contributes one answer per gap.
//
// SEEN RED: this gate failed on real data on its first run, and again after the MCQ and
// CLOZE sections were repaired — BERGENSTEST::READING::TRUE_FALSE, 3 of 3 on one value.
//
// Run: npm run gate:answer-distribution

import { getItems } from "../../src/lib/sv/items";

const TH = {
  CLUSTER: 0.6,       // MULTI: one index past this share of the section
  BINARY_SKEW: 0.75,  // BINARY: one side past this share
  MIN_N: 6,           // the spread rules need this many answers to beat chance
  EXTREME: 0.8,       // one position at/above this share…
  EXTREME_MIN_N: 3,   // …in a section of at least this many answers
};

const KIND: Record<string, "MULTI" | "BINARY" | "EXCLUDED"> = {
  MCQ_SINGLE: "MULTI",
  CLOZE: "MULTI",
  TRUE_FALSE: "BINARY",
  MATCHING: "EXCLUDED",
  ORDERING: "EXCLUDED",
};

type Slot = { pos: number; label: string };
const groups = new Map<string, { kind: "MULTI" | "BINARY"; slots: Slot[] }>();

for (const it of getItems({})) {
  const kind = KIND[it.taskType] ?? "EXCLUDED";
  if (kind === "EXCLUDED") continue;
  const a = it.answer as Record<string, unknown> | null;
  const p = (it.payload ?? {}) as Record<string, unknown>;
  const slots: Slot[] = [];
  if (a?.type === "MCQ_SINGLE" || a?.type === "TRUE_FALSE") {
    const opts = p.options as string[] | undefined;
    if (opts) slots.push({ pos: a.correctIndex as number, label: opts[a.correctIndex as number] ?? `idx${a.correctIndex}` });
  } else if (a?.type === "CLOZE") {
    const gaps = (p.gaps ?? []) as { id: number; options: string[] }[];
    for (const c of (a.correct ?? []) as { id: number; index: number }[]) {
      const g = gaps.find((x) => x.id === c.id);
      if (g) slots.push({ pos: c.index, label: g.options[c.index] ?? `idx${c.index}` });
    }
  }
  if (!slots.length) continue;
  const key = `${it.exam}::${it.skill}::${it.taskType}`;
  const g = groups.get(key) ?? { kind, slots: [] };
  g.slots.push(...slots);
  groups.set(key, g);
}

const failures: string[] = [];
const rows: string[] = [];

for (const [key, g] of [...groups.entries()].sort()) {
  const n = g.slots.length;
  if (n < TH.EXTREME_MIN_N) continue; // below this even the extreme rule means nothing
  const c = new Map<number, number>();
  for (const s of g.slots) c.set(s.pos, (c.get(s.pos) ?? 0) + 1);
  let topPos = -1, topN = 0;
  for (const [k, v] of c) if (v > topN) { topPos = k; topN = v; }
  const share = topN / n;
  const binary = g.kind === "BINARY";
  const spread = n >= TH.MIN_N && share > (binary ? TH.BINARY_SKEW : TH.CLUSTER);
  const extreme = share >= TH.EXTREME;
  const dist = [...c.entries()].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}:${v}`).join(" ");
  rows.push(`  ${spread || extreme ? "✗" : "✓"} ${String(Math.round(share * 100)).padStart(3)}%  ${key.padEnd(44)} n=${String(n).padStart(2)} ${g.kind.padEnd(6)} [${dist}]`);
  if (!spread && !extreme) continue;

  const label = g.slots.find((s) => s.pos === topPos)!.label;
  failures.push(
    `${key}\n      ${topN} of ${n} answers sit at index ${topPos}${binary ? ` ("${label}")` : ""} — ${Math.round(share * 100)}%, ` +
      `over the ${binary ? `${TH.BINARY_SKEW * 100}% balance` : `${TH.CLUSTER * 100}% clustering`} limit` +
      (extreme && !spread ? ` (the ${TH.EXTREME * 100}% extreme rule, which applies from n=${TH.EXTREME_MIN_N})` : "") +
      (binary
        ? `\n      BINARY: re-ordering will NOT fix this. Every item renders ["Sant", "Usant"] in that\n      order, so the index IS the value — shuffling only hides it. Author an item whose\n      answer is the other value.`
        : `\n      Re-order the options so the key moves to a less-used index. The option TEXTS must\n      not change and the key must follow the same option to its new seat.`),
  );
}

console.log(rows.join("\n"));

if (failures.length) {
  console.error(`\n✗ ANSWER-DISTRIBUTION GATE FAILED — ${failures.length} of ${rows.length} section(s) gameable from position\n`);
  for (const f of failures) console.error(`  ${f}\n`);
  process.exit(1);
}

console.log(`\n✓ ANSWER-DISTRIBUTION GATE: ${rows.length} objective sections, none gameable from position.`);
