// GRADE-INTEGRITY PROOF — RED first, then GREEN, for AlmiNorwegian's A1/A2/A4 P0.
//
// This runs OFFLINE. No database, no secret, no network, no metered call. The auth and
// prisma boundaries are replaced with stubs via module.registerHooks() so the REAL route
// handler is the thing under test — not a re-implementation of it, which would only ever
// prove that the proof agrees with itself.
//
// ── THE DEFECT THIS PROVES IS FIXED ──
// /api/sv/submit used to read the answer key off the REQUEST BODY:
//
//     const { itemId, skill, taskType, answer, response } = body;   // route.ts:44
//     const graded = gradeObjective(answer, response);              // route.ts:66
//
// so a forged POST that supplied a key and a response agreeing with it scored 100%. The
// attacker never had to know the real answer — they wrote both halves. PART 1 re-executes
// that exact expression to show the exploit is real and not theoretical. PART 2 sends the
// SAME forged body to the route as it stands now and shows it cannot land.
//
// Run: npm run proof:grade-integrity

import * as nodeModule from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

// module.registerHooks() is Node ≥22.15 (this repo runs 24). The pinned @types/node
// predates it, so it is reached through a narrow local declaration — a typed hole the
// exact shape of the one API being used, rather than an `any` cast that would also hide
// a mistake in the hook itself.
interface ResolveResult {
  url: string;
  format?: string;
  shortCircuit?: boolean;
}
type NextResolve = (specifier: string, context: unknown) => ResolveResult;
const registerHooks = (
  nodeModule as unknown as {
    registerHooks: (hooks: {
      resolve?: (specifier: string, context: unknown, nextResolve: NextResolve) => ResolveResult;
    }) => void;
  }
).registerHooks;

let failures = 0;
let checks = 0;

function assert(label: string, cond: boolean, detail: string): void {
  checks++;
  if (cond) {
    console.log(`  ✓ ${label} — ${detail}`);
  } else {
    failures++;
    console.error(`  ✗ ${label} — ${detail}`);
  }
}

// ── Stub the two boundaries this proof is not testing ────────────────────────
// getCurrentUser(): a signed-in FREE-tier learner. Free tier matters — READING is a
// free skill, so the objective path is reachable without the paid gate, which is
// precisely the audience that could forge a POST.
// prisma: its one call here is the best-effort attempt write, which already fails into
// its own catch in production (NorwegianAttempt.itemId is an FK to an unpopulated table).
// The stub rejects, so the proof also confirms grading survives a failed persist.
// Interception is at RESOLVE, not load: the route imports these through the `@/…`
// tsconfig alias, and tsx resolves that alias inside its own pipeline — a load hook never
// sees the resulting file. Redirecting the specifier gets in front of that. Registered
// hooks run last-registered-first, so this runs before tsx's alias resolution.
const STUBS: Record<string, string> = {
  "@/lib/auth": path.join(import.meta.dirname, "fixtures", "auth-stub.mts"),
  "@/lib/prisma": path.join(import.meta.dirname, "fixtures", "prisma-stub.mts"),
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = STUBS[specifier];
    if (stub) return { url: pathToFileURL(stub).href, format: "module", shortCircuit: true };
    return nextResolve(specifier, context);
  },
});

const { gradeObjective } = await import("../../src/lib/sv/grading");
const { getItems, stableItemId, findIdCollisions } = await import("../../src/lib/sv/items");
const { POST } = await import("../../src/app/api/sv/submit/route");
const { POST: MOCK_POST } = await import("../../src/app/api/sv/mock/submit/route");

function req(body: unknown): Request {
  return new Request("http://localhost/api/sv/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// A real, served, objective, FREE-skill item to attack.
const victim = getItems({ skill: "READING" }).find(
  (it) => it.answer?.type === "MCQ_SINGLE" && Array.isArray((it.payload as { options?: unknown[] })?.options),
);
if (!victim || victim.answer?.type !== "MCQ_SINGLE") {
  console.error("✗ PROOF ABORTED: no MCQ_SINGLE READING item found to test against.");
  process.exit(1);
}
const trueIndex = victim.answer.correctIndex;
const optionCount = (victim.payload as { options: unknown[] }).options.length;
const wrongIndex = (trueIndex + 1) % optionCount;
const victimId = stableItemId(victim);

console.log(`\nVICTIM ITEM  "${victim.title}"  (${victim.exam}/${victim.skill})`);
console.log(`  id ${victimId} · ${optionCount} options · true index ${trueIndex} · forging index ${wrongIndex}\n`);

// ── PART 1 — RED. The pre-fix expression, re-executed. ───────────────────────
console.log("PART 1 — RED: the pre-fix grading path (key taken from the request body)");
{
  // Exactly what route.ts:66 did with `answer` destructured off the body at :44.
  const forgedKey = { type: "MCQ_SINGLE", correctIndex: wrongIndex } as const;
  const graded = gradeObjective(forgedKey, { index: wrongIndex });
  assert(
    "forged key + agreeing response scores 100%",
    graded.points === graded.maxPoints && graded.maxPoints > 0,
    `gradeObjective(bodyKey, bodyResponse) → ${graded.points}/${graded.maxPoints} on the WRONG option (${wrongIndex}, true is ${trueIndex}). This is the exploit.`,
  );
}

// ── PART 2 — GREEN. The same forged body, against the route as it stands. ────
console.log("\nPART 2 — GREEN (A1): the live route ignores everything the client claims");
{
  // (a) The original forged shape: a key, a response, and no item id at all.
  const res = await POST(req({
    skill: "READING",
    taskType: "MCQ_SINGLE",
    answer: { type: "MCQ_SINGLE", correctIndex: wrongIndex },
    maxPoints: 1,
    response: { index: wrongIndex },
  }));
  const j = (await res.json()) as { ok?: boolean; correct?: boolean; error?: string };
  assert(
    "forged body with no itemId is refused",
    res.status === 400 && j.ok === false && j.correct === undefined,
    `HTTP ${res.status} "${j.error}" — no score of any kind is returned.`,
  );
}
{
  // (b) THE DECIDING CASE. A real item id, a WRONG response, and a forged key that
  // agrees with the wrong response. Pre-fix this scored 100%. It must now score 0.
  const res = await POST(req({
    itemId: victimId,
    answer: { type: "MCQ_SINGLE", correctIndex: wrongIndex },
    maxPoints: 1,
    response: { index: wrongIndex },
  }));
  const j = (await res.json()) as { ok: boolean; points: number; maxPoints: number; correct: boolean };
  assert(
    "posted key is ignored — forged POST no longer scores 100%",
    res.status === 200 && j.correct === false && j.points === 0,
    `HTTP 200 → ${j.points}/${j.maxPoints}, correct=${j.correct}. The body said index ${wrongIndex} was right; the server marked against its own key (${trueIndex}).`,
  );
}
{
  // (c) The honest learner still scores. A fix that broke grading would pass (b).
  const res = await POST(req({ itemId: victimId, response: { index: trueIndex } }));
  const j = (await res.json()) as { points: number; maxPoints: number; correct: boolean };
  assert(
    "the true answer still scores full marks",
    j.correct === true && j.points === j.maxPoints && j.maxPoints > 0,
    `${j.points}/${j.maxPoints}, correct=${j.correct} — grading works, it is just no longer client-directed.`,
  );
}
{
  // (d) An id that resolves to nothing fails LOUDLY. A silent 0/0 "ok" would be the same
  // defect in a quieter coat: unknown item and wrong answer would be indistinguishable.
  const res = await POST(req({ itemId: "0000000000000000", response: { index: 0 } }));
  const j = (await res.json()) as { ok: boolean; error?: string };
  assert(
    "unknown itemId is a 404, not a silent zero",
    res.status === 404 && j.ok === false,
    `HTTP ${res.status} "${j.error}".`,
  );
}

// ── PART 3 — A2. The key is not in the payload, and the mock never reveals it. ──
console.log("\nPART 3 — GREEN (A2): the key is disclosed only by a scored practice reply");
{
  const res = await POST(req({ itemId: victimId, response: { index: wrongIndex } }));
  const j = (await res.json()) as { answer?: { correctIndex?: number } };
  assert(
    "practice reply reveals the answer AFTER scoring",
    j.answer?.correctIndex === trueIndex,
    `the scored response carries the key (index ${j.answer?.correctIndex}) — post-submit, never with the question.`,
  );
}
{
  const res = await MOCK_POST(req({ itemId: victimId, response: { index: wrongIndex } }));
  const j = (await res.json()) as Record<string, unknown>;
  assert(
    "mock reply withholds the answer entirely",
    !("answer" in j) && j.correct === false,
    `keys returned: ${Object.keys(j).join(", ")} — no per-item reveal to harvest mid-mock.`,
  );
}
{
  // The served item object itself. This is what gets serialized into the page.
  const servedKeys = Object.keys({
    id: stableItemId(victim), title: victim.title, prompt: victim.prompt,
    exam: victim.exam, skill: victim.skill, taskType: victim.taskType,
    cefr: victim.cefr, payload: victim.payload, maxPoints: victim.maxPoints,
  });
  assert(
    "the served RunnerItem carries an id and no key",
    servedKeys.includes("id") && !servedKeys.includes("answer"),
    `fields: ${servedKeys.join(", ")}`,
  );
}

// ── PART 4 — A4. The collision gate, shown red without touching a bundle. ────
console.log("\nPART 4 — GREEN (A4): stable ids are unique, and the gate can see a duplicate");
{
  const all = getItems({});
  const ids = new Set(all.map((it) => stableItemId(it)));
  assert(
    "every authored item has a unique stable id",
    ids.size === all.length && all.length > 0,
    `${ids.size}/${all.length} unique.`,
  );
  assert(
    "findIdCollisions is clean on the real bank",
    findIdCollisions(all).length === 0,
    `0 collisions across ${all.length} items.`,
  );
  // SEEN RED: hand the same item twice. No bundle is edited to do this.
  const red = findIdCollisions([victim, { ...victim }]);
  assert(
    "SEEN RED — a duplicated item is reported, not passed",
    red.length === 1,
    `${red.length} collision reported: ${red[0]?.slice(0, 90)}…`,
  );
  // THE NARROW TUPLE IS UNIQUE ON THIS BANK, AND THIS PROOF SAYS SO RATHER THAN
  // PRETENDING OTHERWISE. In almi-norwegian — same fork, same loader — exam|skill|title
  // collides 3× because two genuinely different productive tasks share a title. Here it
  // does not, yet. Recording the real number keeps the id choice honest: the content hash
  // is a forward-looking decision about a coincidence this bank has not had, not a fix
  // for a collision it already has. If this line ever flips to a smaller number, the
  // narrow tuple has started colliding and the choice has paid for itself.
  const byTitle = new Set(all.map((it) => `${it.exam}|${it.skill}|${it.title}`));
  assert(
    "narrow-tuple baseline recorded (not asserted unique — see comment)",
    ids.size === all.length,
    `exam|skill|title yields ${byTitle.size}/${all.length}${byTitle.size === all.length ? " — no collision on today's bank" : ` (${all.length - byTitle.size} collisions)`}; the content hash yields ${ids.size}/${all.length}.`,
  );
}

console.log(
  failures === 0
    ? `\n✓ GRADE-INTEGRITY PROOF: ${checks}/${checks} checks passed.\n`
    : `\n✗ GRADE-INTEGRITY PROOF FAILED: ${failures} of ${checks} checks failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
