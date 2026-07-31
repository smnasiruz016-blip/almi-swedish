// ITEM-ID COLLISION GATE.
//
// Grading is server-authoritative: /api/sv/submit re-loads an item by its stable id
// (content hash of exam|skill|taskType|title|prompt|payload) and grades against the
// SERVER-held answer key. If two bundle items hashed to the same id, getItemById()
// would return the wrong one and a learner's answer would be graded against a DIFFERENT
// item's key — silently, and only for the colliding pair. This gate refuses the build.
//
// The narrower tuples pass on today's bank; that is not a reason to key on one. See the
// identity note in src/lib/sv/items.ts — almi-norwegian, the same fork with the same
// -productive/-productive-2 pairing, collides 3× on exam|skill|title.
//
// SEEN RED: proven by scripts/items/grade-integrity-proof.mts, which feeds
// findIdCollisions() a synthetic duplicate and asserts it reports the pair — so the gate
// is shown red without ever editing an authored bundle.
//
// Run: npm run gate:item-id

import { assertNoIdCollisions, getItems, stableItemId } from "../../src/lib/sv/items";

try {
  assertNoIdCollisions();
  const served = getItems({});
  const ids = new Set(served.map((it) => stableItemId(it)));
  console.log(`✓ ITEM-ID GATE: ${ids.size}/${served.length} served items carry a unique stableItemId.`);
} catch (e) {
  console.error(`\n✗ ITEM-ID COLLISION GATE FAILED\n  ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
}
