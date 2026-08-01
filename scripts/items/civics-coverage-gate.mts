// PER-AREA CIVICS COVERAGE GATE.
//
// Medborgarskapsprovet is drawn from the thirteen areas of Swedish society in UHR's own
// study material, Sverige i fokus. Nothing checked that the bank actually covered them,
// and the answer was no: eleven of the thirteen held one or two items, six of them exactly
// one, while the bank as a whole looked adequately stocked at 23. This gate refuses the
// build unless every area holds at least MIN_PER_AREA items.
//
// ── WHY PER AREA, AND NOT A TOTAL ──
// A total is precisely the measurement that hid it. 23 items across a thirteen-area
// syllabus reads as thin only once each item is keyed and counted where it sits. An
// aggregate cannot see a hole it is averaging over, so this counts at the finest axis
// there is and names every area that falls short rather than reporting one verdict.
//
// MIN_PER_AREA is 3 for the reason MIN_TASKS_PER_LEVEL is 3 in the grading engine: one item
// is an anecdote and two cannot disagree. It is a floor on COVERAGE, not a claim that three
// items teach an area — the real test asks around sixty questions.
//
// SEEN RED: proven against the bank as it stood before this pass, when six areas held one
// item each. Verified again by holding an area back and watching the build stop.
//
// Run: npm run gate:civics-coverage

import { getItems } from "../../src/lib/sv/items";
import { CIVICS_AREAS } from "../../src/lib/sv/types";

const MIN_PER_AREA = 3;
const BANK = { exam: "MEDBORGARSKAPSPROV", label: "Medborgarskapsprovet" } as const;

const civics = getItems({}).filter((it) => it.skill === "KNOWLEDGE");

// An item with no area is a hole the per-area counts cannot show, because it sits in none
// of the buckets being counted. Fail on it by name rather than letting it vanish.
const unkeyed = civics.filter((it) => !it.area);
const foreign = civics.filter((it) => it.area && !(CIVICS_AREAS as readonly string[]).includes(it.area));

const short: string[] = [];
const rows: string[] = [];
for (const area of CIVICS_AREAS) {
  const n = civics.filter((it) => it.exam === BANK.exam && it.area === area).length;
  if (n < MIN_PER_AREA) short.push(`${BANK.label} · "${area}" holds ${n}, floor is ${MIN_PER_AREA}`);
  rows.push(`  ${n < MIN_PER_AREA ? "✗" : "✓"} ${String(n).padStart(2)}  ${area}`);
}
console.log(rows.join("\n"));
console.log(`  ${BANK.label}: ${civics.filter((it) => it.exam === BANK.exam).length} items`);

if (unkeyed.length || foreign.length || short.length) {
  console.error("\n✗ CIVICS COVERAGE GATE FAILED");
  for (const it of unkeyed) console.error(`  no area: "${it.title}"`);
  for (const it of foreign) console.error(`  area outside the official thirteen: "${it.title}" → ${it.area}`);
  for (const s of short) console.error(`  ${s}`);
  console.error(
    `\n  Every area of Sverige i fokus must hold at least ${MIN_PER_AREA} items.` +
      `\n  Add items to the named area — do NOT re-key an existing item into it, which would` +
      `\n  move a question away from the area it actually belongs to in order to please a gate.\n`,
  );
  process.exit(1);
}

console.log(`\n✓ CIVICS COVERAGE GATE: ${civics.length} items · every one of the ${CIVICS_AREAS.length} Sverige i fokus areas holds ≥${MIN_PER_AREA}.`);
