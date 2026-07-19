// Rule #7 gate — every exam×skill module must carry at least 15 practice items.
//
// The rule was policy from the start and was never enforced by a machine, so the bank
// drifted: all 20 modules sat under it, the worst at 3 items, and it survived a grader
// rebuild and a status-endpoint fix without anyone noticing. A rule that lives only in
// memory is not a rule, it is a hope. This runs in `build`, so it blocks.
//
// Two differences from the AlmiSwiss original this is modelled on:
//
//   1. It is WIRED. The Swiss check exists but sits behind an npm script nothing calls —
//      not in build, not in CI — so it fires only when a human remembers, which is the
//      same failure mode as the memory-only rule it was meant to replace.
//
//   2. An EMPTY module fails here. Swiss skips modules at 0 on the reasoning that
//      "empty is honest; half-full is not". That holds while a bank is being built out.
//      For a launched product every module is populated, so a count of 0 cannot mean
//      "not written yet" — it means the bundle is not being loaded. That is exactly the
//      orphan-bundle bug Swiss's own comments describe, where Rule #7 read 0 for a module
//      with 15 finished tasks and the only tell was a counter that did not move.

import { getItems } from "../../src/lib/sv/items";
import { ALL_EXAMS } from "../../src/lib/sv/registry";
import type { SwedishSkill } from "../../src/lib/sv/types";

const MIN_TASKS_PER_MODULE = 15;

const shortfalls: string[] = [];
const empties: string[] = [];
let modules = 0;
let total = 0;

console.log(`Rule #7 — >=${MIN_TASKS_PER_MODULE} items per exam-skill module\n`);

for (const exam of ALL_EXAMS) {
  const counts = exam.skills.map((skill) => {
    const n = getItems({ exam: exam.exam, skill: skill as SwedishSkill }).length;
    modules++;
    total += n;
    if (n === 0) empties.push(`${exam.exam}/${skill}`);
    else if (n < MIN_TASKS_PER_MODULE) shortfalls.push(`${exam.exam}/${skill}: ${n}/${MIN_TASKS_PER_MODULE}`);
    return `${String(skill).slice(0, 5).toLowerCase()} ${String(n).padStart(2)}`;
  });
  console.log(`  ${exam.exam.padEnd(18)} ${counts.join("  ")}`);
}

console.log(`\n  ${modules} modules, ${total} items`);

if (empties.length) {
  console.error(`\nRULE #7 GATE FAILED — ${empties.length} EMPTY module(s):`);
  for (const e of empties) console.error(`  ✗ ${e}: 0 items`);
  console.error(
    "\nA launched module reporting 0 is a loading problem, not an unwritten one:\n" +
      "check the bundle is listed in BUNDLE_FILES and that its exam/skill values match the registry.\n",
  );
}

if (shortfalls.length) {
  console.error(`\nRULE #7 GATE FAILED — ${shortfalls.length} module(s) under the bar:`);
  for (const s of shortfalls) console.error(`  ✗ ${s}`);
  console.error(
    "\nA module that is started but under the bar is the dangerous state: it looks\n" +
      "shippable in the tree. Add real tasks at the right level — never pad, and never\n" +
      "relabel existing tasks to make a count.\n",
  );
}

if (empties.length || shortfalls.length) process.exit(1);
console.log(`\nRule #7 gate: all ${modules} modules at ${MIN_TASKS_PER_MODULE}+`);
